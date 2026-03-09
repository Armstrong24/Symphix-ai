"use client";

// ============================================
// Live Logs — Terminal-style streaming logs
// Slide-in animation, timestamped, agent badges
// ============================================

import { motion } from "framer-motion";
import { Info, CheckCircle2, XCircle, Brain, Wrench } from "lucide-react";
import type { LogEntry } from "@/types";
import { useRef, useEffect } from "react";

const typeConfig: Record<string, { icon: any; color: string }> = {
  info: { icon: Info, color: "text-blue-400" },
  success: { icon: CheckCircle2, color: "text-neon-green" },
  error: { icon: XCircle, color: "text-red-400" },
  thinking: { icon: Brain, color: "text-neon-purple" },
  tool_call: { icon: Wrench, color: "text-neon-orange" },
};

export function LiveLogs({ logs }: { logs: LogEntry[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new logs
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div
      ref={scrollRef}
      className="glass rounded-xl p-4 max-h-[400px] overflow-y-auto font-mono text-xs space-y-1"
    >
      {logs.map((log, i) => {
        const config = typeConfig[log.type] || typeConfig.info;
        const Icon = config.icon;
        const time = new Date(log.timestamp).toLocaleTimeString();

        return (
          <motion.div
            key={log.id || i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
            className="flex items-start gap-2 py-1"
          >
            <span className="text-muted-foreground shrink-0 w-[70px]">{time}</span>
            <Icon className={`h-3 w-3 mt-0.5 shrink-0 ${config.color}`} />
            <span className="text-muted-foreground shrink-0">[{log.agentName}]</span>
            <span className={config.color}>{log.message}</span>
          </motion.div>
        );
      })}

      {/* Blinking cursor at end */}
      <div className="flex items-center gap-1 text-primary pt-1">
        <motion.span
          animate={{ opacity: [1, 0, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
          className="inline-block w-2 h-3.5 bg-primary"
        />
      </div>
    </div>
  );
}
