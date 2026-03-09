// ============================================
// Symphix Orchestra — LangGraph.js Agent Orchestration
// The conductor that turns one prompt into a team of agents
// ============================================

import { ChatGroq } from "@langchain/groq";
import { HumanMessage, SystemMessage, AIMessage } from "@langchain/core/messages";
import type { AgentType, Agent, LogEntry } from "@/types";
import { AGENT_CONFIG } from "@/types";
// We use crypto.randomUUID() — no external uuid package needed

// Initialize Groq LLM
function getLLM() {
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
  const llm = getLLM();

  const systemPrompt = `You are the Symphix Conductor — an AI orchestrator that breaks down user workflow descriptions into specialized sub-agents.

Available agent types:
- email: Email drafting, replies, inbox management
- research: Web search, data gathering, information synthesis
- scheduler: Calendar management, meeting scheduling, reminders
- social: Social media content creation and posting
- writer: Content writing, blog posts, reports, copywriting
- analyst: Data analysis, trends, insights, number crunching

Analyze the user's workflow description and output a JSON object with:
1. "agents": array of { "type": agent_type, "task": specific_task_description }
2. "execution_order": "parallel" if agents can work independently, "sequential" if they depend on each other, "mixed" if some parallel some sequential
3. "title": a short 3-6 word title for this workflow

ONLY output valid JSON. No markdown, no explanation.`;

  const response = await llm.invoke([
    new SystemMessage(systemPrompt),
    new HumanMessage(description),
  ]);

  try {
    const content = typeof response.content === "string" ? response.content : "";
    // Extract JSON from response (handle potential markdown wrapping)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in conductor response");
    return JSON.parse(jsonMatch[0]);
  } catch (err) {
    // Fallback: create a sensible default
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
// Step 3: Execute individual agent
// Each agent gets its own system prompt and runs its task
// ============================================

export async function executeAgent(
  agent: Agent,
  workflowDescription: string,
  previousResults: string[],
  onLog: (log: LogEntry) => void
): Promise<string> {
  const llm = getLLM();

  const makeLog = (message: string, type: LogEntry["type"] = "info"): LogEntry => ({
    id: generateId(),
    timestamp: new Date().toISOString(),
    agentId: agent.id,
    agentName: agent.name,
    message,
    type,
  });

  // Log: Agent starting
  onLog(makeLog(`Starting task: ${agent.description}`, "info"));

  const agentPrompts: Record<string, string> = {
    email: `You are an expert Email Agent. Draft professional, concise emails based on the context. Include subject lines and proper formatting. Output the email content ready to send.`,
    research: `You are an expert Research Agent. Search for and synthesize information on the given topic. Provide key findings, sources/references, and actionable insights. Be thorough but concise.`,
    scheduler: `You are an expert Scheduling Agent. Create calendar events, suggest optimal meeting times, and draft scheduling emails. Output structured schedule data.`,
    social: `You are an expert Social Media Agent. Create engaging posts optimized for the target platform (LinkedIn, Twitter, etc.). Include hashtags, formatting, and posting recommendations.`,
    writer: `You are an expert Content Writer Agent. Write compelling, well-structured content based on the brief. Match the appropriate tone and format for the medium.`,
    analyst: `You are an expert Data Analyst Agent. Analyze the given information, identify patterns and trends, and provide actionable insights with clear recommendations.`,
    custom: `You are a specialized AI Agent. Complete the assigned task thoroughly and provide clear, actionable output.`,
  };

  const systemPrompt = agentPrompts[agent.type] || agentPrompts.custom;

  const contextMessage = previousResults.length > 0
    ? `\n\nPrevious agent results for context:\n${previousResults.join("\n---\n")}`
    : "";

  onLog(makeLog("Analyzing task requirements...", "thinking"));

  try {
    const response = await llm.invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage(
        `Overall workflow: ${workflowDescription}\n\nYour specific task: ${agent.description}${contextMessage}\n\nComplete this task now. Be specific and actionable.`
      ),
    ]);

    const result = typeof response.content === "string" ? response.content : "Task completed.";

    onLog(makeLog("Task completed successfully!", "success"));

    return result;
  } catch (error: any) {
    const errorMsg = error.message || "Unknown error occurred";
    onLog(makeLog(`Error: ${errorMsg}`, "error"));
    throw error;
  }
}

// ============================================
// Step 4: Full orchestration — runs all agents
// ============================================

export async function orchestrate(
  description: string,
  onLog: (log: LogEntry) => void,
  onAgentUpdate: (agentId: string, updates: Partial<Agent>) => void
): Promise<{ agents: Agent[]; results: Record<string, string>; title: string }> {
  // Step 1: Conductor analyzes
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

  onLog({
    id: generateId(),
    timestamp: new Date().toISOString(),
    agentId: "conductor",
    agentName: "Conductor",
    message: `Assembled ${agents.length} agents: ${agents.map((a) => a.name).join(", ")}`,
    type: "success",
  });

  // Step 2: Execute agents
  const results: Record<string, string> = {};
  const previousResults: string[] = [];

  if (conductorResult.execution_order === "parallel") {
    // Run all agents in parallel
    const promises = agents.map(async (agent) => {
      onAgentUpdate(agent.id, { status: "running" });
      try {
        const result = await executeAgent(agent, description, [], onLog);
        results[agent.id] = result;
        onAgentUpdate(agent.id, { status: "completed", result });
      } catch {
        onAgentUpdate(agent.id, { status: "error", error: "Agent failed" });
      }
    });
    await Promise.all(promises);
  } else {
    // Run agents sequentially (or mixed — sequential for simplicity)
    for (const agent of agents) {
      onAgentUpdate(agent.id, { status: "running" });
      try {
        const result = await executeAgent(agent, description, previousResults, onLog);
        results[agent.id] = result;
        previousResults.push(`[${agent.name}]: ${result}`);
        onAgentUpdate(agent.id, { status: "completed", result });
      } catch {
        onAgentUpdate(agent.id, { status: "error", error: "Agent failed" });
      }
    }
  }

  return { agents, results, title: conductorResult.title };
}
