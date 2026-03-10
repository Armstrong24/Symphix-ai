// ============================================
// Single Agent Execution API — POST /api/workflow/agent
// SSE streaming — sends tokens as they arrive so the UI updates live.
// Events: log, token, done, error
// Falls back to JSON response if streaming fails.
// ============================================

import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { executeAgentStream } from "@/lib/orchestra";
import type { Agent, LogEntry } from "@/types";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  let body: { workflowId?: string; runId?: string; agent?: Agent; description?: string };
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid request body" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const { workflowId, runId, agent, description } = body;

  if (!workflowId || !runId || !agent || !description) {
    return new Response(
      JSON.stringify({ error: "workflowId, runId, agent, and description are required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Auth check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  // Create the SSE stream
  const encoder = new TextEncoder();
  const allLogs: LogEntry[] = [];
  let fullResult = "";

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const gen = executeAgentStream(agent as Agent, description, []);

        for await (const event of gen) {
          // Track logs and tokens for DB persistence
          if (event.type === "log") {
            try {
              allLogs.push(JSON.parse(event.data));
            } catch {}
          }
          if (event.type === "token") {
            fullResult += event.data;
          }
          if (event.type === "error") {
            fullResult = event.data;
          }

          // Send SSE event
          const sseData = JSON.stringify({ type: event.type, data: event.data });
          controller.enqueue(encoder.encode(`data: ${sseData}\n\n`));
        }

        // Persist to database after stream completes
        try {
          // Update workflow agents
          const { data: workflow } = await supabase
            .from("workflows")
            .select("agents")
            .eq("id", workflowId)
            .single();

          if (workflow?.agents && Array.isArray(workflow.agents)) {
            const updatedAgents = (workflow.agents as Agent[]).map((a) =>
              a.id === agent.id
                ? { ...a, status: "completed" as const, result: fullResult }
                : a
            );
            await supabase
              .from("workflows")
              .update({ agents: updatedAgents, updated_at: new Date().toISOString() })
              .eq("id", workflowId);
          }
        } catch {
          // Non-critical
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
            .update({ logs: [...existingLogs, ...allLogs] })
            .eq("id", runId);
        } catch {
          // Non-critical
        }

        controller.close();
      } catch (error: any) {
        const errEvent = JSON.stringify({
          type: "error",
          data: error.message || "Agent execution failed",
        });
        controller.enqueue(encoder.encode(`data: ${errEvent}\n\n`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
