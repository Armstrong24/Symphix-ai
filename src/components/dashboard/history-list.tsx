"use client";

// ============================================
// History List — Polished list of past workflows
// Cards with status, duration, agent count, feedback
// ============================================

import { motion } from "framer-motion";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  History,
  ThumbsUp,
  ThumbsDown,
  ArrowRight,
  Zap,
  Users,
} from "lucide-react";

interface HistoryListProps {
  workflows: any[];
  runs: any[];
}

const statusConfig: Record<string, { icon: any; color: string; label: string }> = {
  draft: { icon: Clock, color: "text-muted-foreground", label: "Draft" },
  running: { icon: Loader2, color: "text-primary", label: "Running" },
  completed: { icon: CheckCircle2, color: "text-neon-green", label: "Completed" },
  failed: { icon: XCircle, color: "text-red-400", label: "Failed" },
  cancelled: { icon: XCircle, color: "text-muted-foreground", label: "Cancelled" },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

function formatDuration(start: string, end?: string): string {
  if (!end) return "In progress";
  const ms = new Date(end).getTime() - new Date(start).getTime();
  if (ms < 1000) return "<1s";
  if (ms < 60000) return `${Math.round(ms / 1000)}s`;
  return `${Math.round(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`;
}

export function HistoryList({ workflows, runs }: HistoryListProps) {
  // Build a map of run counts and feedback per workflow
  const runMap: Record<string, { count: number; feedback: string[]; duration?: string }> = {};
  runs.forEach((run: any) => {
    if (!runMap[run.workflow_id]) runMap[run.workflow_id] = { count: 0, feedback: [] };
    runMap[run.workflow_id].count++;
    if (run.feedback) runMap[run.workflow_id].feedback.push(run.feedback);
    if (run.started_at) {
      runMap[run.workflow_id].duration = formatDuration(run.started_at, run.completed_at);
    }
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto"
    >
      <div className="flex items-center gap-3 mb-8">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <History className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Workflow History</h1>
          <p className="text-sm text-muted-foreground">{workflows.length} workflow{workflows.length !== 1 ? "s" : ""} total</p>
        </div>
      </div>

      {workflows.length === 0 ? (
        <div className="glass rounded-xl p-12 text-center">
          <History className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-2">No workflows yet</p>
          <Link href="/dashboard" className="text-primary text-sm hover:underline">
            Go create your first workflow
          </Link>
        </div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-3"
        >
          {workflows.map((workflow: any) => {
            const status = statusConfig[workflow.status] || statusConfig.draft;
            const StatusIcon = status.icon;
            const runInfo = runMap[workflow.id];
            const agentCount = workflow.agents && Array.isArray(workflow.agents) ? workflow.agents.length : 0;

            return (
              <motion.div key={workflow.id} variants={itemVariants}>
                <Link href={`/dashboard/workflow/${workflow.id}`}>
                  <motion.div
                    whileHover={{ scale: 1.005, x: 4 }}
                    className="glass rounded-xl p-5 cursor-pointer group transition-shadow hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-medium truncate">{workflow.title}</h3>
                          <Badge variant="outline" className={`text-xs ${status.color} shrink-0`}>
                            <StatusIcon className={`mr-1 h-3 w-3 ${workflow.status === "running" ? "animate-spin" : ""}`} />
                            {status.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{workflow.description}</p>

                        {/* Meta info row */}
                        <div className="flex items-center gap-4 mt-3 flex-wrap">
                          {agentCount > 0 && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {agentCount} agent{agentCount !== 1 ? "s" : ""}
                            </span>
                          )}
                          {runInfo && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Zap className="h-3 w-3" />
                              {runInfo.count} run{runInfo.count !== 1 ? "s" : ""}
                            </span>
                          )}
                          {runInfo?.duration && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {runInfo.duration}
                            </span>
                          )}
                          {runInfo?.feedback.includes("up") && (
                            <ThumbsUp className="h-3 w-3 text-neon-green" />
                          )}
                          {runInfo?.feedback.includes("down") && (
                            <ThumbsDown className="h-3 w-3 text-red-400" />
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0 flex flex-col items-end gap-2">
                        <span className="text-xs text-muted-foreground">
                          {new Date(workflow.created_at).toLocaleDateString()}
                        </span>
                        <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  </motion.div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </motion.div>
  );
}
