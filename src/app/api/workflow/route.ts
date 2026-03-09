// ============================================
// Workflow CRUD API — GET/PATCH /api/workflow
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET — Fetch a workflow by ID
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workflowId = request.nextUrl.searchParams.get("id");
  if (!workflowId) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("workflows")
    .select("*")
    .eq("id", workflowId)
    .eq("user_id", user.id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json(data);
}

// PATCH — Update feedback on a workflow run
export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { runId, feedback } = await request.json();

  if (!runId || !["up", "down"].includes(feedback)) {
    return NextResponse.json({ error: "Invalid params" }, { status: 400 });
  }

  const { error } = await supabase
    .from("workflow_runs")
    .update({ feedback })
    .eq("id", runId)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
