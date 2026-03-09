// ============================================
// Symphix Orchestra — LangGraph.js Agent Orchestration
// The conductor that turns one prompt into a team of agents
// Now with REAL tool-calling: web search, email, scheduling, etc.
// Optimized for Vercel 60s timeout: fast models, reduced tokens, parallel execution
// ============================================

import { ChatGroq } from "@langchain/groq";
import { HumanMessage, SystemMessage, AIMessage, ToolMessage } from "@langchain/core/messages";
import type { BaseMessage } from "@langchain/core/messages";
import type { AgentType, Agent, LogEntry } from "@/types";
import { AGENT_CONFIG } from "@/types";
import { getToolsForAgent } from "@/lib/tools";

// Initialize Groq LLM — use fast 8B model for conductor, 70B for agents
function getConductorLLM() {
  return new ChatGroq({
    apiKey: process.env.GROQ_API_KEY,
    model: "llama-3.1-8b-instant",
    temperature: 0.1,
    maxTokens: 1024,
  });
}

function getAgentLLM() {
  return new ChatGroq({
    apiKey: process.env.GROQ_API_KEY,
    model: "llama-3.3-70b-versatile",
    temperature: 0.3,
    maxTokens: 2048,
  });
}

// Generate a simple UUID using crypto
function generateId(): string {
  return crypto.randomUUID();
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
  const llm = getConductorLLM();

  const systemPrompt = `You are the Symphix Conductor. Break down user requests into specialized AI agents.

Available agents: email, research, scheduler, social, writer, analyst

Output JSON:
{"agents":[{"type":"agent_type","task":"brief_task"}],"execution_order":"parallel"|"sequential","title":"3-6 word title"}

Rules:
- Use 1-3 agents max (fewer = faster)
- Prefer "parallel" unless agents truly depend on each other
- Keep task descriptions under 20 words
- ONLY output valid JSON, nothing else`;

  const response = await llm.invoke([
    new SystemMessage(systemPrompt),
    new HumanMessage(description),
  ]);

  try {
    const content = typeof response.content === "string" ? response.content : "";
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in conductor response");
    const result = JSON.parse(jsonMatch[0]);

    // Cap agents at 3 to stay within timeout
    if (result.agents && result.agents.length > 3) {
      result.agents = result.agents.slice(0, 3);
    }

    return result;
  } catch (err) {
    return {
      agents: [
        { type: "research", task: "Research and gather relevant information" },
        { type: "writer", task: "Draft the content based on research" },
      ],
      execution_order: "sequential",
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
// Step 3: Execute individual agent WITH tool-calling
// Each agent binds its specific tools and runs an agentic loop
// Optimized: max 3 tool iterations, concise prompts
// ============================================

const agentSystemPrompts: Record<string, string> = {
  email: `You are an expert Email Agent in the Symphix orchestra. You draft professional, concise emails and can send them using the send_email tool.

Your capabilities:
- Draft emails with proper formatting, subject lines, and professional tone
- Send emails directly using the send_email tool (if configured)
- Create draft emails for review using the draft_email tool

Always use the appropriate tool. If asked to send an email, use send_email. If asked to draft/compose, use draft_email.
After using a tool, summarize the result clearly for the user.`,

  research: `You are an expert Research Agent in the Symphix orchestra. You search the internet for real-time information and synthesize findings.

Your capabilities:
- Search the web using the web_search tool for current information
- Extract content from specific URLs using the web_extract tool
- Synthesize findings into clear, cited reports

IMPORTANT: Always use the web_search tool to find information. Do NOT rely on your training data alone.
When presenting results, always cite your sources with URLs.
Structure your output with clear headings, key findings, and actionable insights.`,

  scheduler: `You are an expert Scheduling Agent in the Symphix orchestra. You manage calendar events and find optimal meeting times.

Your capabilities:
- Create calendar events with the create_calendar_event tool (generates ICS files)
- Suggest optimal meeting times using the suggest_meeting_times tool
- Handle timezone conversions and scheduling logistics

Always use the tools to create structured event data. Include all relevant details like location, attendees, and reminders.`,

  social: `You are an expert Social Media Agent in the Symphix orchestra. You create platform-optimized content for social media.

Your capabilities:
- Create optimized posts using the create_social_post tool (handles character limits, hashtags)
- Build content calendars using the create_content_plan tool
- Tailor content for specific platforms (Twitter, LinkedIn, Instagram, etc.)

Always use the tools to ensure proper formatting and platform compliance.
Create engaging, on-brand content that drives engagement.`,

  writer: `You are an expert Content Writer Agent in the Symphix orchestra. You create compelling content for any format.

Your capabilities:
- Structure content using the write_content tool (gets format guidelines)
- Rewrite or transform existing content using the rewrite_content tool
- Write blog posts, articles, reports, newsletters, landing page copy, and more

Use the write_content tool first to get the proper structure, then write the full content following those guidelines.
Produce polished, ready-to-publish content with proper formatting.`,

  analyst: `You are an expert Data Analyst Agent in the Symphix orchestra. You analyze data, identify patterns, and deliver insights.

Your capabilities:
- Perform calculations using the calculate tool
- Structure analysis reports using the analyze_data tool
- Create comparisons using the compare tool

Use the tools to support your analysis with concrete numbers and frameworks.
Present findings with clear structure: executive summary, key metrics, analysis, and recommendations.
Use markdown tables and bullet points for clarity.`,

  custom: `You are a specialized AI Agent in the Symphix orchestra. Complete the assigned task thoroughly using all available tools.

Use web_search if you need to find information. Use write_content if you need to produce written output.
Be specific and actionable in your output.`,
};

export async function executeAgent(
  agent: Agent,
  workflowDescription: string,
  previousResults: string[],
  onLog: (log: LogEntry) => void
): Promise<string> {
  const llm = getAgentLLM();
  const tools = getToolsForAgent(agent.type);

  const makeLog = (message: string, type: LogEntry["type"] = "info"): LogEntry => ({
    id: generateId(),
    timestamp: new Date().toISOString(),
    agentId: agent.id,
    agentName: agent.name,
    message,
    type,
  });

  onLog(makeLog(`Starting task: ${agent.description}`, "info"));

  const systemPrompt = agentSystemPrompts[agent.type] || agentSystemPrompts.custom;

  // Only pass a brief summary of previous results (not full text) to save tokens
  const contextMessage =
    previousResults.length > 0
      ? `\n\nContext from previous agents (summary):\n${previousResults.map((r) => r.slice(0, 500)).join("\n---\n")}`
      : "";

  onLog(makeLog("Analyzing task requirements...", "thinking"));

  try {
    const llmWithTools = tools.length > 0 ? llm.bindTools(tools) : llm;

    const messages: BaseMessage[] = [
      new SystemMessage(systemPrompt),
      new HumanMessage(
        `Workflow: ${workflowDescription}\n\nYour task: ${agent.description}${contextMessage}\n\nComplete this task now. Use tools when needed. Be concise but thorough.`
      ),
    ];

    // Agentic loop — max 3 iterations (down from 8) to stay within timeout
    let iterations = 0;
    const maxIterations = 3;
    let finalResponse = "";

    while (iterations < maxIterations) {
      iterations++;

      const response = await llmWithTools.invoke(messages);
      messages.push(response);

      const toolCalls = response.tool_calls;

      if (!toolCalls || toolCalls.length === 0) {
        finalResponse = typeof response.content === "string" ? response.content : "";
        break;
      }

      // Execute each tool call
      for (const toolCall of toolCalls) {
        const toolName = toolCall.name;
        const toolArgs = toolCall.args;

        onLog(makeLog(`Using tool: ${toolName}`, "tool_call"));

        // Find the matching tool and invoke it
        const matchedTool = tools.find((t) => t.name === toolName);
        if (!matchedTool) {
          const errorResult = JSON.stringify({ error: `Tool ${toolName} not found` });
          messages.push(new ToolMessage({ content: errorResult, tool_call_id: toolCall.id! }));
          onLog(makeLog(`Tool not found: ${toolName}`, "error"));
          continue;
        }

        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const toolResult = await (matchedTool as any).invoke(toolArgs);
          const resultStr = typeof toolResult === "string" ? toolResult : JSON.stringify(toolResult);
          messages.push(new ToolMessage({ content: resultStr, tool_call_id: toolCall.id! }));

          // Parse for user-friendly log
          try {
            const parsed = JSON.parse(resultStr);
            if (parsed.success) {
              onLog(makeLog(`Tool ${toolName} completed successfully`, "success"));
            } else {
              onLog(makeLog(`Tool ${toolName}: ${parsed.error || parsed.message || "completed with warnings"}`, "info"));
            }
          } catch {
            onLog(makeLog(`Tool ${toolName} returned results`, "info"));
          }
        } catch (toolError: any) {
          const errorMsg = toolError.message || "Tool execution failed";
          const errorResult = JSON.stringify({ error: errorMsg });
          messages.push(new ToolMessage({ content: errorResult, tool_call_id: toolCall.id! }));
          onLog(makeLog(`Tool error: ${errorMsg}`, "error"));
        }
      }
    }

    if (!finalResponse) {
      messages.push(
        new HumanMessage("Provide your final summary now. Be concise.")
      );
      const summaryResponse = await llm.invoke(messages);
      finalResponse = typeof summaryResponse.content === "string" ? summaryResponse.content : "Task completed.";
    }

    onLog(makeLog("Task completed successfully!", "success"));
    return finalResponse;
  } catch (error: any) {
    const errorMsg = error.message || "Unknown error occurred";
    onLog(makeLog(`Error: ${errorMsg}`, "error"));
    throw error;
  }
}

// ============================================
// Step 4: Full orchestration — ALWAYS run agents in parallel for speed
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
    message: "Analyzing your workflow and assembling the agent team...",
    type: "thinking",
  });

  const conductorResult = await conductorAnalyze(description);
  const agents = buildAgents(conductorResult);

  const agentSummary = agents
    .map((a) => {
      const tools = getToolsForAgent(a.type);
      const toolNames = tools.map((t) => t.name).join(", ");
      return `${a.name} [tools: ${toolNames || "none"}]`;
    })
    .join(", ");

  onLog({
    id: generateId(),
    timestamp: new Date().toISOString(),
    agentId: "conductor",
    agentName: "Conductor",
    message: `Assembled ${agents.length} agents: ${agentSummary}`,
    type: "success",
  });

  const results: Record<string, string> = {};

  // ALWAYS run agents in parallel for speed (pass description as shared context)
  // Even "sequential" workflows benefit from parallel execution with shared context
  const promises = agents.map(async (agent) => {
    onAgentUpdate(agent.id, { status: "running" });
    try {
      const result = await executeAgent(agent, description, [], onLog);
      results[agent.id] = result;
      onAgentUpdate(agent.id, { status: "completed", result });
    } catch {
      results[agent.id] = "Agent encountered an error but the workflow continues.";
      onAgentUpdate(agent.id, { status: "error", error: "Agent failed" });
    }
  });
  await Promise.all(promises);

  return { agents, results, title: conductorResult.title };
}
