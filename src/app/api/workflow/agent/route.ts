// ============================================
// Single Agent Execution API — POST /api/workflow/agent
// Executes ONE agent with tool-calling. Each call ~10-30s.
// The client calls this for each agent after /execute returns.
// 50s hard timeout to stay under Vercel's 60s limit.
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { executeAgent } from "@/lib/orchestra";
import type { Agent, LogEntry } from "@/types";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  // Parse body first so we have agent info for error responses
  let body: { workflowId?: string; runId?: string; agent?: Agent; description?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { workflowId, runId, agent, description } = body;

  if (!workflowId || !runId || !agent || !description) {
    return NextResponse.json(
      { error: "workflowId, runId, agent, and description are required" },
      { status: 400 }
    );
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Collect logs during execution
    const agentLogs: LogEntry[] = [];
    const onLog = (log: LogEntry) => {
      agentLogs.push(log);
    };

    // Execute with a 50s hard timeout (Vercel kills at 60s)
    const agentPromise = executeAgent(agent as Agent, description, [], onLog);

    const timeoutPromise = new Promise<string>((_, reject) => {
      setTimeout(() => {
        reject(new Error("Agent execution timed out (50s limit). Try a simpler prompt."));
      }, 50000);
    });

    const result = await Promise.race([agentPromise, timeoutPromise]);

    // Update the workflow agents array in DB
    try {
      const { data: workflow } = await supabase
        .from("workflows")
        .select("agents")
        .eq("id", workflowId)
        .single();

      if (workflow?.agents && Array.isArray(workflow.agents)) {
        const updatedAgents = (workflow.agents as Agent[]).map((a) =>
          a.id === agent.id ? { ...a, status: "completed" as const, result } : a
        );
        await supabase
          .from("workflows")
          .update({ agents: updatedAgents, updated_at: new Date().toISOString() })
          .eq("id", workflowId);
      }
    } catch {
      // Non-critical — the client has the result anyway
    }

    // Append logs to run record
    try {
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
    } catch {
      // Non-critical
    }

    return NextResponse.json({
      success: true,
      agentId: agent.id,
      result,
      logs: agentLogs,
    });
  } catch (error: any) {
    console.error(`Agent ${agent?.name || "unknown"} error:`, error?.message || error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Agent execution failed",
        agentId: agent?.id,
        logs: [],
      },
      { status: 500 }
    );
  }
}
