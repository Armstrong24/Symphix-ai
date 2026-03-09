// ============================================
// Workflow Execute API — POST /api/workflow/execute
// Phase 1: Conductor analyzes the prompt and returns the agent plan
// This is FAST (~2-3s) — just the conductor LLM call
// The client then calls /api/workflow/agent for each agent separately
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { conductorAnalyze, buildAgents } from "@/lib/orchestra";
import { getToolsForAgent } from "@/lib/tools";

export const maxDuration = 60;

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

    // Step 1: Conductor analyzes the prompt (~2-3s with 8B model)
    const conductorResult = await conductorAnalyze(description);
    const agents = buildAgents(conductorResult);

    // Enrich agents with tool names for the UI
    const agentsWithTools = agents.map((a) => {
      const tools = getToolsForAgent(a.type);
      return { ...a, toolNames: tools.map((t) => t.name) };
    });

    // Step 2: Create a workflow run record
    const { data: run, error: runError } = await supabase
      .from("workflow_runs")
      .insert({
        workflow_id: workflowId,
        user_id: user.id,
        status: "running",
        logs: [
          {
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            agentId: "conductor",
            agentName: "Conductor",
            message: `Assembled ${agents.length} agents: ${agentsWithTools.map((a) => `${a.name} [${a.toolNames.join(", ") || "none"}]`).join(", ")}`,
            type: "success",
          },
        ],
      })
      .select()
      .single();

    if (runError) throw runError;

    // Step 3: Update workflow with agent plan and status
    await supabase
      .from("workflows")
      .update({
        title: conductorResult.title || description.slice(0, 60),
        status: "running",
        agents: agentsWithTools.map((a) => ({ ...a, status: "idle" })),
        updated_at: new Date().toISOString(),
      })
      .eq("id", workflowId);

    // Return immediately — client will call /api/workflow/agent for each agent
    return NextResponse.json({
      success: true,
      runId: run.id,
      agents: agentsWithTools,
      title: conductorResult.title,
    });
  } catch (error: any) {
    console.error("Workflow execution error:", error);
    return NextResponse.json(
      { error: error.message || "Execution failed" },
      { status: 500 }
    );
  }
}
