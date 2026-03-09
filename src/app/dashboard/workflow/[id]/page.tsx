"use client";

// ============================================
// Workflow Detail Page — The execution command center
// Agent cards with pulse, live logs, progress, markdown output
// ============================================

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { AgentCard } from "@/components/workflow/agent-card";
import { LiveLogs } from "@/components/workflow/live-logs";
import { FeedbackButtons } from "@/components/workflow/feedback-buttons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import ReactMarkdown from "react-markdown";
import {
  Play,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowLeft,
  Copy,
  Download,
  RefreshCw,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import type { Agent, LogEntry, Workflow } from "@/types";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

export default function WorkflowDetailPage() {
  const params = useParams();
  const router = useRouter();
  const workflowId = params.id as string;

  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [runId, setRunId] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch workflow on mount
  useEffect(() => {
    async function fetchWorkflow() {
      const supabase = createClient();
      const { data } = await supabase
        .from("workflows")
        .select("*")
        .eq("id", workflowId)
        .single();

      if (data) {
        setWorkflow(data as Workflow);
        if (data.agents && Array.isArray(data.agents) && data.agents.length > 0) {
          setAgents(data.agents as Agent[]);
          // If completed, build results from stored agents
          if (data.status === "completed") {
            const storedResults: Record<string, string> = {};
            (data.agents as Agent[]).forEach((a) => {
              if (a.result) storedResults[a.id] = a.result;
            });
            setResults(storedResults);
          }
        }

        // Also fetch the latest run for logs
        const { data: runData } = await supabase
          .from("workflow_runs")
          .select("*")
          .eq("workflow_id", workflowId)
          .order("started_at", { ascending: false })
          .limit(1)
          .single();

        if (runData) {
          setRunId(runData.id);
          if (runData.logs && Array.isArray(runData.logs)) {
            setLogs(runData.logs as LogEntry[]);
          }
          // If we have stored results
          if (runData.result) {
            try {
              const parsed = JSON.parse(runData.result);
              setResults((prev) => ({ ...prev, ...parsed }));
            } catch {}
          }
        }
      }
      setLoading(false);
    }
    fetchWorkflow();
  }, [workflowId]);

  // Progress is now driven by real agent completion — no fake simulation needed

  // Helper to safely parse JSON from a fetch response (handles timeout/502 HTML responses)
  const safeJsonParse = async (response: Response) => {
    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch {
      if (text.includes("<!") || text.includes("<html")) {
        throw new Error("Server timed out. Try a simpler prompt.");
      }
      throw new Error(`Server error: ${text.slice(0, 200)}`);
    }
  };

  // Execute workflow — split architecture to avoid Vercel 60s timeout
  // Phase 1: /execute gets the agent plan (~3s)
  // Phase 2: /agent for each agent, staggered by 1.5s to avoid Groq rate limits
  const handleRun = useCallback(async () => {
    if (!workflow) return;
    setIsRunning(true);
    setLogs([]);
    setResults({});
    setProgress(0);
    setAgents([]);

    try {
      // ── Phase 1: Conductor ──────────────────────────────────
      setProgress(5);
      const executeRes = await fetch("/api/workflow/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workflowId: workflow.id,
          description: workflow.description,
        }),
      });

      const executeData = await safeJsonParse(executeRes);
      if (!executeRes.ok) throw new Error(executeData.error || "Failed to plan workflow");

      const { runId: newRunId, agents: plannedAgents, title } = executeData;
      setRunId(newRunId);

      // Show agents immediately as "running"
      const runningAgents = (plannedAgents || []).map((a: Agent) => ({ ...a, status: "running" }));
      setAgents(runningAgents);
      setWorkflow((prev) => prev ? { ...prev, title: title || prev.title, status: "running" } : prev);
      setProgress(15);

      setLogs([{
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        agentId: "conductor",
        agentName: "Conductor",
        message: `Assembled ${runningAgents.length} agent${runningAgents.length > 1 ? "s" : ""}. Starting execution...`,
        type: "success",
      }]);

      // ── Phase 2: Execute agents with staggered starts ──────
      // Stagger by 1.5s between each to avoid Groq rate limits
      const totalAgents = runningAgents.length;
      let completedCount = 0;
      const newResults: Record<string, string> = {};

      const executeOneAgent = async (agent: Agent) => {
        try {
          const agentRes = await fetch("/api/workflow/agent", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              workflowId: workflow.id,
              runId: newRunId,
              agent,
              description: workflow.description,
            }),
          });

          const agentData = await safeJsonParse(agentRes);

          if (!agentRes.ok) {
            throw new Error(agentData.error || "Agent failed");
          }

          newResults[agent.id] = agentData.result;
          completedCount++;

          setAgents((prev) =>
            prev.map((a) =>
              a.id === agent.id ? { ...a, status: "completed", result: agentData.result } : a
            )
          );
          setResults((prev) => ({ ...prev, [agent.id]: agentData.result }));
          setLogs((prev) => [...prev, ...(agentData.logs || [])]);
          setProgress(15 + (completedCount / totalAgents) * 85);
        } catch (agentErr: any) {
          completedCount++;
          // Still show partial result even on error
          const errMsg = agentErr.message || "Agent failed";
          newResults[agent.id] = `Error: ${errMsg}`;

          setAgents((prev) =>
            prev.map((a) =>
              a.id === agent.id ? { ...a, status: "error", error: errMsg } : a
            )
          );
          setLogs((prev) => [
            ...prev,
            {
              id: crypto.randomUUID(),
              timestamp: new Date().toISOString(),
              agentId: agent.id,
              agentName: agent.name,
              message: `Error: ${errMsg}`,
              type: "error" as const,
            },
          ]);
          setProgress(15 + (completedCount / totalAgents) * 85);
        }
      };

      // Launch agents with staggered starts (1.5s apart) to avoid rate limits
      // All still run concurrently — they just START at different times
      const agentPromises = runningAgents.map((agent: Agent, index: number) =>
        new Promise<void>((resolve) => {
          setTimeout(async () => {
            await executeOneAgent(agent);
            resolve();
          }, index * 1500); // 0s, 1.5s, 3s stagger
        })
      );

      await Promise.all(agentPromises);

      // ── Phase 3: Finalize ──────────────────────────────────
      const supabase = createClient();

      // Determine final status: if any agent actually succeeded, it's completed
      const hasAnySuccess = Object.values(newResults).some((r) => !r.startsWith("Error:"));
      const finalStatus = hasAnySuccess ? "completed" : "failed";

      await supabase
        .from("workflows")
        .update({
          status: finalStatus,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", workflow.id);

      await supabase
        .from("workflow_runs")
        .update({
          status: finalStatus,
          result: JSON.stringify(newResults),
          completed_at: new Date().toISOString(),
        })
        .eq("id", newRunId);

      setWorkflow((prev) => prev ? { ...prev, status: finalStatus } : prev);
      setProgress(100);

      if (finalStatus === "completed") {
        toast.success("Workflow completed!");
      } else {
        toast.error("Workflow finished with errors. Check agent results.");
      }
    } catch (err: any) {
      console.error("Workflow error:", err);
      toast.error(err.message || "Execution failed");
      setWorkflow((prev) => prev ? { ...prev, status: "failed" } : prev);
      setProgress(0);
    } finally {
      setIsRunning(false);
    }
  }, [workflow]);

  // Copy all results to clipboard
  const handleCopyAll = () => {
    const allText = Object.values(results).join("\n\n---\n\n");
    navigator.clipboard.writeText(allText);
    toast.success("Copied to clipboard!");
  };

  // Export as markdown
  const handleExportMarkdown = () => {
    const allText = Object.entries(results)
      .map(([id, result]) => {
        const agent = agents.find((a) => a.id === id);
        return `## ${agent?.name || "Agent"}\n\n${result}`;
      })
      .join("\n\n---\n\n");

    const blob = new Blob([allText], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${workflow?.title || "workflow"}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported as Markdown!");
  };

  // Delete workflow handler
  const handleDelete = async () => {
    if (!workflow) return;
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/workflow?id=${workflow.id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to delete");

      toast.success("Workflow deleted");
      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete workflow");
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  // Auto-detect stuck workflows (running > 5 min)
  const isStuck = workflow?.status === "running" && workflow?.created_at &&
    (Date.now() - new Date(workflow.created_at).getTime() > 5 * 60 * 1000);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header skeleton */}
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-lg bg-muted" />
          <Skeleton className="h-8 w-64 bg-muted rounded-lg" />
          <Skeleton className="h-6 w-20 bg-muted rounded-full" />
        </div>
        <Skeleton className="h-4 w-96 bg-muted rounded-lg ml-11" />

        {/* Action buttons skeleton */}
        <div className="flex justify-end gap-2">
          <Skeleton className="h-9 w-20 bg-muted rounded-lg" />
          <Skeleton className="h-9 w-28 bg-muted rounded-lg" />
        </div>

        {/* Agent cards skeleton */}
        <div>
          <Skeleton className="h-6 w-40 bg-muted rounded-lg mb-4" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass rounded-xl p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-xl bg-muted" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-24 bg-muted rounded" />
                    <Skeleton className="h-3 w-16 bg-muted rounded" />
                  </div>
                </div>
                <Skeleton className="h-3 w-full bg-muted rounded" />
                <Skeleton className="h-3 w-3/4 bg-muted rounded" />
                <Skeleton className="h-3 w-1/2 bg-muted rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!workflow) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Workflow not found</p>
        <Link href="/dashboard">
          <Button variant="ghost" className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  const statusConfig: Record<string, { icon: any; color: string; label: string }> = {
    draft: { icon: Clock, color: "text-muted-foreground", label: "Draft" },
    running: { icon: Loader2, color: "text-primary", label: "Running" },
    completed: { icon: CheckCircle2, color: "text-neon-green", label: "Completed" },
    failed: { icon: XCircle, color: "text-red-400", label: "Failed" },
  };
  const status = statusConfig[workflow.status] || statusConfig.draft;
  const hasResults = Object.keys(results).length > 0;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-5xl mx-auto"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link href="/dashboard">
              <motion.div whileHover={{ x: -3 }} className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-muted/50 transition-colors">
                <ArrowLeft className="h-4 w-4 text-muted-foreground" />
              </motion.div>
            </Link>
            <h1 className="text-2xl font-bold">{workflow.title}</h1>
            <Badge variant="outline" className={`${status.color}`}>
              <status.icon className={`mr-1 h-3 w-3 ${workflow.status === "running" ? "animate-spin" : ""}`} />
              {status.label}
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm ml-11">{workflow.description}</p>
        </div>

        <div className="flex items-center gap-2">
          {hasResults && (
            <>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button variant="outline" size="sm" onClick={handleCopyAll} className="gap-2">
                  <Copy className="h-3.5 w-3.5" />
                  Copy
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button variant="outline" size="sm" onClick={handleExportMarkdown} className="gap-2">
                  <Download className="h-3.5 w-3.5" />
                  Export
                </Button>
              </motion.div>
            </>
          )}
          {/* Delete button */}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteDialogOpen(true)}
              className="gap-2 text-muted-foreground hover:text-red-400 hover:border-red-400/50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Button
              onClick={handleRun}
              disabled={isRunning}
              className="bg-primary text-primary-foreground font-semibold hover:bg-primary/80 glow-cyan gap-2"
            >
              {isRunning ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Running...
                </>
              ) : hasResults ? (
                <>
                  <RefreshCw className="h-4 w-4" /> Re-run
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" /> Run Workflow
                </>
              )}
            </Button>
          </motion.div>
        </div>
      </motion.div>

      {/* Stuck workflow warning */}
      <AnimatePresence>
        {isStuck && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6"
          >
            <div className="glass rounded-xl p-4 border border-yellow-500/30 bg-yellow-500/5">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-500 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-yellow-500">This workflow appears to be stuck</p>
                  <p className="text-xs text-muted-foreground mt-1">It has been running for over 5 minutes. You can delete it and try again.</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeleteDialogOpen(true)}
                  className="shrink-0 text-yellow-500 border-yellow-500/30 hover:bg-yellow-500/10"
                >
                  Delete & Retry
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress bar during execution */}
      <AnimatePresence>
        {isRunning && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Orchestrating agents...</span>
              <span className="text-sm font-medium">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Agent cards */}
      <motion.div variants={itemVariants} className="mb-8">
        <h2 className="text-lg font-semibold mb-4">
          {agents.length > 0 ? `Agent Team (${agents.length})` : "Agents will appear after running"}
        </h2>
        <AnimatePresence mode="popLayout">
          <motion.div
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {agents.map((agent, i) => (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: i * 0.1 }}
              >
                <AgentCard
                  agent={agent}
                  result={results[agent.id]}
                  isExpanded={workflow.status === "completed"}
                />
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* Rendered blog/content output */}
      {hasResults && workflow.status === "completed" && (
        <motion.div variants={itemVariants} className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Output</h2>
          <div className="glass rounded-2xl p-6 sm:p-8">
            <div className="prose-symphix">
              {Object.entries(results).map(([agentId, result]) => {
                const agent = agents.find((a) => a.id === agentId);
                return (
                  <div key={agentId} className="mb-6 last:mb-0">
                    {agents.length > 1 && (
                      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border">
                        <div
                          className="h-6 w-6 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${agent?.color || "#00f0ff"}15` }}
                        >
                          <CheckCircle2 className="h-3 w-3" style={{ color: agent?.color || "#00f0ff" }} />
                        </div>
                        <span className="text-sm font-medium">{agent?.name || "Agent"}</span>
                      </div>
                    )}
                    <ReactMarkdown>{result}</ReactMarkdown>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}

      {/* Live logs */}
      {logs.length > 0 && (
        <motion.div variants={itemVariants} className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Execution Log</h2>
          <LiveLogs logs={logs} />
        </motion.div>
      )}

      {/* Feedback */}
      {workflow.status === "completed" && runId && (
        <motion.div variants={itemVariants}>
          <FeedbackButtons runId={runId} />
        </motion.div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Workflow</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{workflow?.title}&quot;? This will also delete all associated runs and results. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
