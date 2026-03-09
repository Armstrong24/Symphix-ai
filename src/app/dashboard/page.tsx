// ============================================
// Dashboard Home — The command center
// Shows recent workflows + create new button
// ============================================

import { createClient } from "@/lib/supabase/server";
import { DashboardHome } from "@/components/dashboard/dashboard-home";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch recent workflows
  const { data: workflows } = await supabase
    .from("workflows")
    .select("*")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false })
    .limit(10);

  // Fetch recent runs
  const { data: runs } = await supabase
    .from("workflow_runs")
    .select("*")
    .eq("user_id", user!.id)
    .order("started_at", { ascending: false })
    .limit(5);

  return (
    <DashboardHome
      workflows={workflows || []}
      runs={runs || []}
      userName={user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User"}
    />
  );
}
