// ============================================
// Workflow Execution API — POST /api/workflow/execute
// Runs the orchestration engine and streams results
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { orchestrate } from "@/lib/orchestra";
import type { LogEntry, Agent } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workflowId, description } = await request.json();

    if (!workflowId || !description) {
      return NextResponse.json(
        { error: "workflowId and description are required" },
        { status: 400 }
      );
    }

    // Create a workflow run record
    const { data: run, error: runError } = await supabase
      .from("workflow_runs")
      .insert({
        workflow_id: workflowId,
        user_id: user.id,
        status: "running",
        logs: [],
      })
      .select()
      .single();

    if (runError) throw runError;

    // Update workflow status to running
    await supabase
      .from("workflows")
      .update({ status: "running" })
      .eq("id", workflowId);

    // Collect logs and agent updates
    const allLogs: LogEntry[] = [];
    const agentUpdates: Record<string, Partial<Agent>> = {};

    const onLog = (log: LogEntry) => {
      allLogs.push(log);
    };

    const onAgentUpdate = (agentId: string, updates: Partial<Agent>) => {
      agentUpdates[agentId] = { ...agentUpdates[agentId], ...updates };
    };

    // Run the orchestration
    const { agents, results, title } = await orchestrate(description, onLog, onAgentUpdate);

    // Merge agent updates with agent objects
    const finalAgents = agents.map((a) => ({
      ...a,
      ...agentUpdates[a.id],
    }));

    // Update workflow with agents and results
    await supabase
      .from("workflows")
      .update({
        title: title || description.slice(0, 60),
        status: "completed",
        agents: finalAgents,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", workflowId);

    // Update run record
    await supabase
      .from("workflow_runs")
      .update({
        status: "completed",
        logs: allLogs,
        result: JSON.stringify(results),
        completed_at: new Date().toISOString(),
      })
      .eq("id", run.id);

    return NextResponse.json({
      success: true,
      runId: run.id,
      agents: finalAgents,
      logs: allLogs,
      results,
    });
  } catch (error: any) {
    console.error("Workflow execution error:", error);
    return NextResponse.json(
      { error: error.message || "Execution failed" },
      { status: 500 }
    );
  }
}
