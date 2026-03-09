// ============================================
// History Page — Past workflows and runs
// ============================================

import { createClient } from "@/lib/supabase/server";
import { HistoryList } from "@/components/dashboard/history-list";

export default async function HistoryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: workflows } = await supabase
    .from("workflows")
    .select("*")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  const { data: runs } = await supabase
    .from("workflow_runs")
    .select("*")
    .eq("user_id", user!.id)
    .order("started_at", { ascending: false });

  return <HistoryList workflows={workflows || []} runs={runs || []} />;
}
