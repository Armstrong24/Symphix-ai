"use client";

// ============================================
// Workflow Detail Page — The execution command center
// Shows agents, runs them, displays live logs
// ============================================

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { AgentCard } from "@/components/workflow/agent-card";
import { LiveLogs } from "@/components/workflow/live-logs";
import { FeedbackButtons } from "@/components/workflow/feedback-buttons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Play,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import type { Agent, LogEntry, Workflow } from "@/types";

export default function WorkflowDetailPage() {
  const params = useParams();
  const workflowId = params.id as string;

  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [runId, setRunId] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  // Fetch workflow
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
        }
      }
      setLoading(false);
    }
    fetchWorkflow();
  }, [workflowId]);

  // Execute workflow
  const handleRun = useCallback(async () => {
    if (!workflow) return;
    setIsRunning(true);
    setLogs([]);
    setResults({});

    try {
      const response = await fetch("/api/workflow/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workflowId: workflow.id,
          description: workflow.description,
        }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Execution failed");

      setRunId(data.runId);
      setAgents(data.agents || []);
      setLogs(data.logs || []);
      setResults(data.results || {});
      setWorkflow((prev) => prev ? { ...prev, status: "completed" } : prev);
      toast.success("Workflow completed!");
    } catch (err: any) {
      toast.error(err.message || "Execution failed");
      setWorkflow((prev) => prev ? { ...prev, status: "failed" } : prev);
    } finally {
      setIsRunning(false);
    }
  }, [workflow]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <Skeleton className="h-8 w-64 bg-white/5" />
        <Skeleton className="h-4 w-96 bg-white/5" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 bg-white/5 rounded-xl" />
          ))}
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
    running: { icon: Loader2, color: "text-neon-cyan", label: "Running" },
    completed: { icon: CheckCircle2, color: "text-green-400", label: "Completed" },
    failed: { icon: XCircle, color: "text-red-400", label: "Failed" },
  };
  const status = statusConfig[workflow.status] || statusConfig.draft;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-5xl mx-auto"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon-sm">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">{workflow.title}</h1>
            <Badge variant="outline" className={`${status.color} border-current/20`}>
              <status.icon className={`mr-1 h-3 w-3 ${workflow.status === "running" ? "animate-spin" : ""}`} />
              {status.label}
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm ml-11">{workflow.description}</p>
        </div>

        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
          <Button
            onClick={handleRun}
            disabled={isRunning}
            className="bg-neon-cyan text-black font-semibold hover:bg-neon-cyan/80 glow-cyan"
          >
            {isRunning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Running...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" /> Run Workflow
              </>
            )}
          </Button>
        </motion.div>
      </div>

      {/* Agent cards */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">
          {agents.length > 0 ? "Agent Team" : "Agents will appear after running"}
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
      </div>

      {/* Live logs */}
      {logs.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Execution Log</h2>
          <LiveLogs logs={logs} />
        </div>
      )}

      {/* Feedback */}
      {workflow.status === "completed" && runId && (
        <FeedbackButtons runId={runId} />
      )}
    </motion.div>
  );
}
