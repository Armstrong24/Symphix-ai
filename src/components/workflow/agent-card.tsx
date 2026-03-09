"use client";

// ============================================
// Agent Card — Individual agent display
// Pulse while thinking, status badges, expandable results
// ============================================

import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  Search,
  Calendar,
  Share2,
  PenTool,
  BarChart3,
  Cpu,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Agent } from "@/types";
import { useState } from "react";

const iconMap: Record<string, any> = {
  Mail,
  Search,
  Calendar,
  Share2,
  PenTool,
  BarChart3,
  Cpu,
};

interface AgentCardProps {
  agent: Agent;
  result?: string;
  isExpanded?: boolean;
}

export function AgentCard({ agent, result, isExpanded = false }: AgentCardProps) {
  const [expanded, setExpanded] = useState(isExpanded);
  const Icon = iconMap[agent.icon] || Cpu;

  const statusStyles: Record<string, string> = {
    idle: "border-border",
    thinking: "border-neon-purple/30 glow-purple",
    running: "border-primary/30 glow-cyan",
    completed: "border-neon-green/30",
    error: "border-red-500/30",
  };

  return (
    <motion.div
      layout
      whileHover={{ scale: 1.02, y: -2 }}
      className={`glass rounded-xl p-4 cursor-pointer transition-all border ${statusStyles[agent.status] || statusStyles.idle}`}
      onClick={() => setExpanded(!expanded)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <motion.div
            animate={
              agent.status === "running" || agent.status === "thinking"
                ? { scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7] }
                : {}
            }
            transition={{ duration: 1.5, repeat: Infinity }}
            className="h-10 w-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${agent.color}15` }}
          >
            <Icon className="h-5 w-5" style={{ color: agent.color }} />
          </motion.div>
          <div>
            <h3 className="font-medium text-sm">{agent.name}</h3>
            <p className="text-xs text-muted-foreground">{agent.type}</p>
          </div>
        </div>

        {/* Status badge */}
        <div>
          {agent.status === "running" && (
            <Badge variant="outline" className="text-primary border-primary/20 text-xs">
              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              Running
            </Badge>
          )}
          {agent.status === "thinking" && (
            <Badge variant="outline" className="text-neon-purple border-neon-purple/20 text-xs">
              <ThinkingDots />
            </Badge>
          )}
          {agent.status === "completed" && (
            <Badge variant="outline" className="text-neon-green border-neon-green/20 text-xs">
              <CheckCircle2 className="mr-1 h-3 w-3" />
              Done
            </Badge>
          )}
          {agent.status === "error" && (
            <Badge variant="outline" className="text-red-400 border-red-400/20 text-xs">
              <XCircle className="mr-1 h-3 w-3" />
              Error
            </Badge>
          )}
        </div>
      </div>

      {/* Task description */}
      <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{agent.description}</p>

      {/* Result (expandable) */}
      <AnimatePresence>
        {expanded && result && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 pt-3 border-t border-border"
          >
            <p className="text-xs font-medium text-muted-foreground mb-1">Result:</p>
            <div className="text-xs text-foreground/80 whitespace-pre-wrap max-h-48 overflow-y-auto font-mono leading-relaxed">
              {result.slice(0, 500)}{result.length > 500 ? "..." : ""}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Thinking dots animation
function ThinkingDots() {
  return (
    <span className="flex items-center gap-0.5">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
          className="inline-block h-1 w-1 rounded-full bg-neon-purple"
        />
      ))}
    </span>
  );
}
