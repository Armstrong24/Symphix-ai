// ============================================
// Single Agent Execution API — POST /api/workflow/agent
// Executes ONE agent with tool-calling. Each call is ~10-20s.
// The client calls this in parallel for all agents after /execute returns.
// This keeps each request well within Vercel's 60s timeout.
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { executeAgent } from "@/lib/orchestra";
import type { Agent, LogEntry } from "@/types";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workflowId, runId, agent, description } = await request.json();

    if (!workflowId || !runId || !agent || !description) {
      return NextResponse.json(
        { error: "workflowId, runId, agent, and description are required" },
        { status: 400 }
      );
    }

    // Collect logs during execution
    const agentLogs: LogEntry[] = [];
    const onLog = (log: LogEntry) => {
      agentLogs.push(log);
    };

    // Execute the single agent
    const result = await executeAgent(
      agent as Agent,
      description,
      [], // no previous results in parallel mode
      onLog
    );

    // Update the workflow — mark this agent as completed in the agents array
    const { data: workflow } = await supabase
      .from("workflows")
      .select("agents")
      .eq("id", workflowId)
      .single();

    if (workflow?.agents && Array.isArray(workflow.agents)) {
      const updatedAgents = (workflow.agents as Agent[]).map((a) =>
        a.id === agent.id
          ? { ...a, status: "completed" as const, result }
          : a
      );
      await supabase
        .from("workflows")
        .update({ agents: updatedAgents, updated_at: new Date().toISOString() })
        .eq("id", workflowId);
    }

    // Append logs to the run record
    const { data: runData } = await supabase
      .from("workflow_runs")
      .select("logs")
      .eq("id", runId)
      .single();

    const existingLogs = (runData?.logs as LogEntry[]) || [];
    await supabase
      .from("workflow_runs")
      .update({ logs: [...existingLogs, ...agentLogs] })
      .eq("id", runId);

    return NextResponse.json({
      success: true,
      agentId: agent.id,
      result,
      logs: agentLogs,
    });
  } catch (error: any) {
    console.error("Agent execution error:", error);
    return NextResponse.json(
      { error: error.message || "Agent execution failed" },
      { status: 500 }
    );
  }
}
