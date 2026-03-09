"use client";

// ============================================
// Dashboard Home Component — The animated command center
// ============================================

import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Zap,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowRight,
} from "lucide-react";

interface DashboardHomeProps {
  workflows: any[];
  runs: any[];
  userName: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const statusConfig: Record<string, { color: string; icon: any; label: string }> = {
  draft: { color: "text-muted-foreground", icon: Clock, label: "Draft" },
  running: { color: "text-neon-cyan", icon: Loader2, label: "Running" },
  completed: { color: "text-neon-green", icon: CheckCircle2, label: "Completed" },
  failed: { color: "text-red-500", icon: XCircle, label: "Failed" },
  cancelled: { color: "text-muted-foreground", icon: XCircle, label: "Cancelled" },
};

export function DashboardHome({ workflows, runs, userName }: DashboardHomeProps) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-5xl"
    >
      {/* Welcome header */}
      <motion.div variants={itemVariants} className="mb-8">
        <h1 className="text-3xl font-bold">
          Welcome back, <span className="text-gradient">{userName}</span>
        </h1>
        <p className="mt-2 text-muted-foreground">
          Your AI orchestra is ready. What should we automate today?
        </p>
      </motion.div>

      {/* Quick action — Create new workflow */}
      <motion.div variants={itemVariants}>
        <Link href="/dashboard/workflow/new">
          <motion.div
            whileHover={{ scale: 1.01, y: -2 }}
            whileTap={{ scale: 0.99 }}
            className="glass rounded-2xl p-6 mb-8 cursor-pointer group glow-cyan border border-neon-cyan/20 hover:border-neon-cyan/40 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-neon-cyan/10 flex items-center justify-center">
                  <Plus className="h-6 w-6 text-neon-cyan" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Create New Workflow</h2>
                  <p className="text-sm text-muted-foreground">
                    Describe what you need — our conductor will assemble the perfect team
                  </p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-neon-cyan transition-colors" />
            </div>
          </motion.div>
        </Link>
      </motion.div>

      {/* Stats row */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Workflows", value: workflows.length, icon: Zap },
          { label: "Running", value: workflows.filter((w) => w.status === "running").length, icon: Loader2 },
          { label: "Completed", value: workflows.filter((w) => w.status === "completed").length, icon: CheckCircle2 },
          { label: "Recent Runs", value: runs.length, icon: Clock },
        ].map((stat) => (
          <div key={stat.label} className="glass rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <stat.icon className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{stat.label}</span>
            </div>
            <p className="text-2xl font-bold">{stat.value}</p>
          </div>
        ))}
      </motion.div>

      {/* Recent workflows */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Recent Workflows</h2>
          <Link href="/dashboard/history">
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              View All <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </Link>
        </div>

        {workflows.length === 0 ? (
          <div className="glass rounded-xl p-12 text-center">
            <Zap className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No workflows yet. Create your first one!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {workflows.map((workflow, i) => {
              const status = statusConfig[workflow.status] || statusConfig.draft;
              const StatusIcon = status.icon;
              return (
                <motion.div
                  key={workflow.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link href={`/dashboard/workflow/${workflow.id}`}>
                    <div className="glass rounded-xl p-4 hover:bg-white/5 transition-colors cursor-pointer group">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3">
                            <h3 className="font-medium truncate">{workflow.title}</h3>
                            <Badge variant="outline" className={`text-xs ${status.color} border-current/20`}>
                              <StatusIcon className={`mr-1 h-3 w-3 ${workflow.status === "running" ? "animate-spin" : ""}`} />
                              {status.label}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground truncate mt-1">
                            {workflow.description}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground ml-4 shrink-0">
                          {new Date(workflow.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
