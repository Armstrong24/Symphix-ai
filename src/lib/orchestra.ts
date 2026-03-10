// ============================================
// Symphix Orchestra — LangGraph.js Agent Orchestration
// The conductor that turns one prompt into a team of agents
// Real tool-calling with streaming support via Google Gemini 2.5 Flash
// ============================================

import { HumanMessage, SystemMessage, ToolMessage } from "@langchain/core/messages";
import type { BaseMessage } from "@langchain/core/messages";
import type { AgentType, Agent, LogEntry } from "@/types";
import { AGENT_CONFIG } from "@/types";
import { getToolsForAgent } from "@/lib/tools";
import { getLLM } from "@/lib/models";

// ============================================
// Generate a simple UUID using crypto
// ============================================

function generateId(): string {
  return crypto.randomUUID();
}

// ============================================
// Retry helper — handles rate limit errors
// ============================================

async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 2,
  baseDelay: number = 2000
): Promise<T> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const isRateLimit =
        error?.status === 429 ||
        error?.message?.includes("429") ||
        error?.message?.includes("rate limit") ||
        error?.message?.includes("Rate limit") ||
        error?.message?.includes("RESOURCE_EXHAUSTED");

      if (isRateLimit && attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

// ============================================
// Timeout helper — prevents any single operation from hanging
// ============================================

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`${label} timed out after ${ms / 1000}s`));
    }, ms);
    promise
      .then((result) => {
        clearTimeout(timer);
        resolve(result);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

// ============================================
// Step 1: Conductor — Analyzes the prompt and decides which agents to deploy
// ============================================

interface ConductorResult {
  agents: {
    type: AgentType;
    task: string;
  }[];
  execution_order: "parallel" | "sequential" | "mixed";
  title: string;
}

export async function conductorAnalyze(description: string): Promise<ConductorResult> {
  const llm = getLLM({ maxOutputTokens: 512, temperature: 0.2 });

  const systemPrompt = `You are the Symphix Conductor. Break down user requests into specialized AI agents.

Available agents: email, research, scheduler, social, writer, analyst

Output ONLY valid JSON (no markdown, no code fences, no explanation):
{"agents":[{"type":"agent_type","task":"brief_task"}],"execution_order":"parallel","title":"3-6 word title"}

Rules:
- Use 1-3 agents max (fewer = faster)
- Always use "parallel" for execution_order
- Keep task descriptions under 15 words
- ONLY output valid JSON, nothing else`;

  try {
    const response = await withRetry(() =>
      withTimeout(
        llm.invoke([
          new SystemMessage(systemPrompt),
          new HumanMessage(description),
        ]),
        15000, // 15s timeout for conductor
        "Conductor"
      )
    );

    const content = typeof response.content === "string" ? response.content : "";
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found");
    const result = JSON.parse(jsonMatch[0]);

    // Cap agents at 3
    if (result.agents && result.agents.length > 3) {
      result.agents = result.agents.slice(0, 3);
    }

    // Validate agent types
    const validTypes = ["email", "research", "scheduler", "social", "writer", "analyst"];
    result.agents = (result.agents || []).filter(
      (a: any) => a.type && validTypes.includes(a.type) && a.task
    );

    if (result.agents.length === 0) {
      throw new Error("No valid agents parsed");
    }

    return result;
  } catch {
    return {
      agents: [
        { type: "research", task: "Research the topic thoroughly" },
        { type: "writer", task: "Write a comprehensive response" },
      ],
      execution_order: "parallel",
      title: "Custom Workflow",
    };
  }
}

// ============================================
// Step 2: Build Agent objects from conductor result
// ============================================

export function buildAgents(conductorResult: ConductorResult): Agent[] {
  return conductorResult.agents.map((agentSpec) => {
    const config = AGENT_CONFIG[agentSpec.type] || AGENT_CONFIG.custom;
    return {
      id: generateId(),
      name: config.name,
      type: agentSpec.type,
      description: agentSpec.task,
      status: "idle",
      icon: config.icon,
      color: config.color,
      logs: [],
    };
  });
}

// ============================================
// Agent System Prompts
// ============================================

const agentSystemPrompts: Record<string, string> = {
  email: `You are the Symphix Email Agent. Draft professional emails.
Use draft_email tool to create structured email drafts.
Use send_email tool only if explicitly asked to send.
After tool use, provide a clean summary.`,

  research: `You are the Symphix Research Agent. Find real-time information from the web.
ALWAYS use the web_search tool first — do NOT rely on training data alone.
Cite sources with URLs. Structure output with headings and key findings.`,

  scheduler: `You are the Symphix Scheduler Agent. Manage calendar events.
Use create_calendar_event to create events with all details.
Use suggest_meeting_times for optimal scheduling.`,

  social: `You are the Symphix Social Media Agent. Create platform-optimized content.
Use create_social_post for individual posts (handles character limits).
Use create_content_plan for multi-day calendars.`,

  writer: `You are the Symphix Writer Agent. Create polished content.
Use write_content tool first to get format guidelines, then write the full content.
Produce ready-to-publish content with proper markdown formatting.`,

  analyst: `You are the Symphix Analyst Agent. Analyze data and deliver insights.
Use calculate for math, analyze_data for frameworks, compare for comparisons.
Present findings with executive summary, key metrics, and recommendations.`,

  custom: `You are a Symphix AI Agent. Complete the task using available tools.
Be specific and actionable. Use tools when helpful.`,
};

// ============================================
// Step 3: Execute individual agent WITH tool-calling (non-streaming)
// Max 2 tool iterations to stay fast. 45s hard timeout.
// ============================================

export async function executeAgent(
  agent: Agent,
  workflowDescription: string,
  previousResults: string[],
  onLog: (log: LogEntry) => void
): Promise<string> {
  const llm = getLLM();
  const tools = getToolsForAgent(agent.type);

  const makeLog = (message: string, type: LogEntry["type"] = "info"): LogEntry => ({
    id: generateId(),
    timestamp: new Date().toISOString(),
    agentId: agent.id,
    agentName: agent.name,
    message,
    type,
  });

  onLog(makeLog(`Starting: ${agent.description}`, "info"));

  const systemPrompt = agentSystemPrompts[agent.type] || agentSystemPrompts.custom;

  const contextMessage =
    previousResults.length > 0
      ? `\n\nContext from other agents:\n${previousResults.map((r) => r.slice(0, 300)).join("\n---\n")}`
      : "";

  try {
    const llmWithTools = tools.length > 0 ? llm.bindTools(tools) : llm;

    const messages: BaseMessage[] = [
      new SystemMessage(systemPrompt),
      new HumanMessage(
        `Task: ${agent.description}\nContext: ${workflowDescription}${contextMessage}\n\nComplete this task now. Be concise but thorough.`
      ),
    ];

    // Agentic loop — max 2 iterations to stay within timeout
    let iterations = 0;
    const maxIterations = 2;
    let finalResponse = "";

    while (iterations < maxIterations) {
      iterations++;

      onLog(makeLog(iterations === 1 ? "Thinking..." : "Processing tool results...", "thinking"));

      const response = await withRetry(() =>
        withTimeout(
          llmWithTools.invoke(messages),
          30000, // 30s per LLM call
          `${agent.name} LLM call`
        )
      );
      messages.push(response);

      const toolCalls = response.tool_calls;

      if (!toolCalls || toolCalls.length === 0) {
        finalResponse = typeof response.content === "string" ? response.content : "";
        break;
      }

      // Execute tool calls (limit to first 2 tools per iteration)
      const callsToProcess = toolCalls.slice(0, 2);
      for (const toolCall of callsToProcess) {
        const toolName = toolCall.name;
        const toolArgs = toolCall.args;

        onLog(makeLog(`Using tool: ${toolName}`, "tool_call"));

        const matchedTool = tools.find((t) => t.name === toolName);
        if (!matchedTool) {
          messages.push(
            new ToolMessage({
              content: JSON.stringify({ error: `Tool ${toolName} not found` }),
              tool_call_id: toolCall.id!,
            })
          );
          onLog(makeLog(`Tool not found: ${toolName}`, "error"));
          continue;
        }

        try {
          const toolResult = await withTimeout(
            (matchedTool as any).invoke(toolArgs),
            15000, // 15s timeout per tool
            `Tool ${toolName}`
          );
          const resultStr = typeof toolResult === "string" ? toolResult : JSON.stringify(toolResult);
          messages.push(new ToolMessage({ content: resultStr, tool_call_id: toolCall.id! }));
          onLog(makeLog(`Tool ${toolName} completed`, "success"));
        } catch (toolError: any) {
          const errorMsg = toolError.message || "Tool failed";
          messages.push(
            new ToolMessage({
              content: JSON.stringify({ error: errorMsg }),
              tool_call_id: toolCall.id!,
            })
          );
          onLog(makeLog(`Tool error: ${errorMsg}`, "error"));
        }
      }

      // If there were tool calls we didn't process, add error messages for them
      for (const skippedCall of toolCalls.slice(2)) {
        messages.push(
          new ToolMessage({
            content: JSON.stringify({ error: "Skipped — tool call limit reached" }),
            tool_call_id: skippedCall.id!,
          })
        );
      }
    }

    // If loop ended without a final text response, ask for summary
    if (!finalResponse) {
      const summaryResponse = await withRetry(() =>
        withTimeout(
          llm.invoke([...messages, new HumanMessage("Summarize your work concisely.")]),
          15000,
          `${agent.name} summary`
        )
      );
      finalResponse =
        typeof summaryResponse.content === "string"
          ? summaryResponse.content
          : "Task completed.";
    }

    onLog(makeLog("Completed!", "success"));
    return finalResponse;
  } catch (error: any) {
    const errorMsg = error.message || "Unknown error";
    onLog(makeLog(`Error: ${errorMsg}`, "error"));
    return `Agent encountered an error: ${errorMsg}. The task "${agent.description}" could not be fully completed.`;
  }
}

// ============================================
// Step 3b: Execute agent with STREAMING output
// Yields SSE events: { type: "log" | "token" | "done" | "error", data: ... }
// The final response text is streamed token-by-token.
// Tool-calling iterations still use non-streaming invoke.
// ============================================

export async function* executeAgentStream(
  agent: Agent,
  workflowDescription: string,
  previousResults: string[]
): AsyncGenerator<{ type: "log" | "token" | "done" | "error"; data: string }> {
  const llm = getLLM();
  const tools = getToolsForAgent(agent.type);

  const makeLog = (message: string, logType: LogEntry["type"] = "info"): LogEntry => ({
    id: generateId(),
    timestamp: new Date().toISOString(),
    agentId: agent.id,
    agentName: agent.name,
    message,
    type: logType,
  });

  yield { type: "log", data: JSON.stringify(makeLog(`Starting: ${agent.description}`, "info")) };

  const systemPrompt = agentSystemPrompts[agent.type] || agentSystemPrompts.custom;

  const contextMessage =
    previousResults.length > 0
      ? `\n\nContext from other agents:\n${previousResults.map((r) => r.slice(0, 300)).join("\n---\n")}`
      : "";

  try {
    const llmWithTools = tools.length > 0 ? llm.bindTools(tools) : llm;

    const messages: BaseMessage[] = [
      new SystemMessage(systemPrompt),
      new HumanMessage(
        `Task: ${agent.description}\nContext: ${workflowDescription}${contextMessage}\n\nComplete this task now. Be concise but thorough.`
      ),
    ];

    let iterations = 0;
    const maxIterations = 2;
    let needsFinalStream = true;

    while (iterations < maxIterations) {
      iterations++;

      yield {
        type: "log",
        data: JSON.stringify(
          makeLog(iterations === 1 ? "Thinking..." : "Processing tool results...", "thinking")
        ),
      };

      // First pass: use non-streaming invoke to check for tool calls
      const response = await withRetry(() =>
        withTimeout(
          llmWithTools.invoke(messages),
          30000,
          `${agent.name} LLM call`
        )
      );
      messages.push(response);

      const toolCalls = response.tool_calls;

      if (!toolCalls || toolCalls.length === 0) {
        // No tool calls — this iteration produced the final text.
        // We already have the full text from invoke. Stream it token-by-token
        // by splitting into words for a nice streaming effect.
        const fullText = typeof response.content === "string" ? response.content : "";
        const words = fullText.split(/(\s+)/);
        for (const word of words) {
          if (word) {
            yield { type: "token", data: word };
          }
        }
        needsFinalStream = false;
        break;
      }

      // Execute tool calls
      const callsToProcess = toolCalls.slice(0, 2);
      for (const toolCall of callsToProcess) {
        const toolName = toolCall.name;
        const toolArgs = toolCall.args;

        yield { type: "log", data: JSON.stringify(makeLog(`Using tool: ${toolName}`, "tool_call")) };

        const matchedTool = tools.find((t) => t.name === toolName);
        if (!matchedTool) {
          messages.push(
            new ToolMessage({
              content: JSON.stringify({ error: `Tool ${toolName} not found` }),
              tool_call_id: toolCall.id!,
            })
          );
          yield { type: "log", data: JSON.stringify(makeLog(`Tool not found: ${toolName}`, "error")) };
          continue;
        }

        try {
          const toolResult = await withTimeout(
            (matchedTool as any).invoke(toolArgs),
            15000,
            `Tool ${toolName}`
          );
          const resultStr = typeof toolResult === "string" ? toolResult : JSON.stringify(toolResult);
          messages.push(new ToolMessage({ content: resultStr, tool_call_id: toolCall.id! }));
          yield { type: "log", data: JSON.stringify(makeLog(`Tool ${toolName} completed`, "success")) };
        } catch (toolError: any) {
          const errorMsg = toolError.message || "Tool failed";
          messages.push(
            new ToolMessage({
              content: JSON.stringify({ error: errorMsg }),
              tool_call_id: toolCall.id!,
            })
          );
          yield { type: "log", data: JSON.stringify(makeLog(`Tool error: ${errorMsg}`, "error")) };
        }
      }

      for (const skippedCall of toolCalls.slice(2)) {
        messages.push(
          new ToolMessage({
            content: JSON.stringify({ error: "Skipped — tool call limit reached" }),
            tool_call_id: skippedCall.id!,
          })
        );
      }
    }

    // If we used all iterations on tool calls, stream the final summary
    if (needsFinalStream) {
      yield { type: "log", data: JSON.stringify(makeLog("Generating final summary...", "thinking")) };

      // Use real streaming for the final response
      const stream = await llm.stream([
        ...messages,
        new HumanMessage("Summarize your work concisely."),
      ]);

      for await (const chunk of stream) {
        const text = typeof chunk.content === "string" ? chunk.content : "";
        if (text) {
          yield { type: "token", data: text };
        }
      }
    }

    yield { type: "log", data: JSON.stringify(makeLog("Completed!", "success")) };
    yield { type: "done", data: "" };
  } catch (error: any) {
    const errorMsg = error.message || "Unknown error";
    yield { type: "log", data: JSON.stringify(makeLog(`Error: ${errorMsg}`, "error")) };
    yield {
      type: "error",
      data: `Agent encountered an error: ${errorMsg}. The task "${agent.description}" could not be fully completed.`,
    };
  }
}

// ============================================
// Step 4: Full orchestration (kept for reference / fallback)
// ============================================

export async function orchestrate(
  description: string,
  onLog: (log: LogEntry) => void,
  onAgentUpdate: (agentId: string, updates: Partial<Agent>) => void
): Promise<{ agents: Agent[]; results: Record<string, string>; title: string }> {
  onLog({
    id: generateId(),
    timestamp: new Date().toISOString(),
    agentId: "conductor",
    agentName: "Conductor",
    message: "Analyzing your workflow...",
    type: "thinking",
  });

  const conductorResult = await conductorAnalyze(description);
  const agents = buildAgents(conductorResult);

  onLog({
    id: generateId(),
    timestamp: new Date().toISOString(),
    agentId: "conductor",
    agentName: "Conductor",
    message: `Assembled ${agents.length} agents`,
    type: "success",
  });

  const results: Record<string, string> = {};

  const promises = agents.map(async (agent) => {
    onAgentUpdate(agent.id, { status: "running" });
    try {
      const result = await executeAgent(agent, description, [], onLog);
      results[agent.id] = result;
      onAgentUpdate(agent.id, { status: "completed", result });
    } catch {
      results[agent.id] = "Agent encountered an error.";
      onAgentUpdate(agent.id, { status: "error", error: "Agent failed" });
    }
  });
  await Promise.all(promises);

  return { agents, results, title: conductorResult.title };
}
