"use client";

// ============================================
// History List — Animated list of past workflows
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
} from "lucide-react";

interface HistoryListProps {
  workflows: any[];
  runs: any[];
}

const statusConfig: Record<string, { icon: any; color: string; label: string }> = {
  draft: { icon: Clock, color: "text-muted-foreground", label: "Draft" },
  running: { icon: Loader2, color: "text-neon-cyan", label: "Running" },
  completed: { icon: CheckCircle2, color: "text-green-400", label: "Completed" },
  failed: { icon: XCircle, color: "text-red-400", label: "Failed" },
  cancelled: { icon: XCircle, color: "text-muted-foreground", label: "Cancelled" },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

export function HistoryList({ workflows, runs }: HistoryListProps) {
  // Build a map of run counts and feedback per workflow
  const runMap: Record<string, { count: number; feedback: string[] }> = {};
  runs.forEach((run: any) => {
    if (!runMap[run.workflow_id]) runMap[run.workflow_id] = { count: 0, feedback: [] };
    runMap[run.workflow_id].count++;
    if (run.feedback) runMap[run.workflow_id].feedback.push(run.feedback);
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl"
    >
      <div className="flex items-center gap-3 mb-8">
        <History className="h-6 w-6 text-neon-cyan" />
        <h1 className="text-2xl font-bold">Workflow History</h1>
      </div>

      {workflows.length === 0 ? (
        <div className="glass rounded-xl p-12 text-center">
          <History className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No workflows yet. Go create your first one!</p>
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

            return (
              <motion.div key={workflow.id} variants={itemVariants}>
                <Link href={`/dashboard/workflow/${workflow.id}`}>
                  <motion.div
                    whileHover={{ scale: 1.005, x: 4 }}
                    className="glass rounded-xl p-5 cursor-pointer hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-medium truncate">{workflow.title}</h3>
                          <Badge variant="outline" className={`text-xs ${status.color} border-current/20 shrink-0`}>
                            <StatusIcon className={`mr-1 h-3 w-3 ${workflow.status === "running" ? "animate-spin" : ""}`} />
                            {status.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{workflow.description}</p>

                        {/* Run info */}
                        <div className="flex items-center gap-4 mt-2">
                          {runInfo && (
                            <span className="text-xs text-muted-foreground">
                              {runInfo.count} run{runInfo.count !== 1 ? "s" : ""}
                            </span>
                          )}
                          {workflow.agents && Array.isArray(workflow.agents) && workflow.agents.length > 0 && (
                            <span className="text-xs text-muted-foreground">
                              {workflow.agents.length} agents
                            </span>
                          )}
                          {runInfo?.feedback.includes("up") && (
                            <ThumbsUp className="h-3 w-3 text-green-400" />
                          )}
                          {runInfo?.feedback.includes("down") && (
                            <ThumbsDown className="h-3 w-3 text-red-400" />
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs text-muted-foreground">
                          {new Date(workflow.created_at).toLocaleDateString()}
                        </span>
                        {workflow.completed_at && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Completed {new Date(workflow.completed_at).toLocaleTimeString()}
                          </p>
                        )}
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
