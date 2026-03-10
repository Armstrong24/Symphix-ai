"use client";

import { motion } from "framer-motion";
import {
  Mail,
  Search,
  Calendar,
  Share2,
  PenTool,
  BarChart3,
} from "lucide-react";

const agents = [
  {
    icon: Mail,
    title: "Email Agent",
    description:
      "Drafts, sends, and manages email communication with context-aware precision.",
    visual: (
      <svg viewBox="0 0 120 80" className="w-full h-auto" fill="none">
        <motion.rect x="10" y="10" width="100" height="60" rx="8" stroke="currentColor" strokeWidth="1" className="text-foreground/20"
          initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} transition={{ duration: 1 }} viewport={{ once: true }} />
        <motion.path d="M10 25 L60 50 L110 25" stroke="currentColor" strokeWidth="1" className="text-primary/50"
          initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} transition={{ duration: 0.8, delay: 0.3 }} viewport={{ once: true }} />
      </svg>
    ),
  },
  {
    icon: Search,
    title: "Research Agent",
    description:
      "Searches the web, extracts key data, and synthesizes findings into reports.",
    visual: (
      <svg viewBox="0 0 120 80" className="w-full h-auto" fill="none">
        <motion.circle cx="50" cy="35" r="22" stroke="currentColor" strokeWidth="1" className="text-foreground/20"
          initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} transition={{ duration: 0.8 }} viewport={{ once: true }} />
        <motion.line x1="66" y1="51" x2="95" y2="72" stroke="currentColor" strokeWidth="1.5" className="text-primary/50"
          initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} transition={{ duration: 0.5, delay: 0.5 }} viewport={{ once: true }} />
        <motion.circle cx="50" cy="35" r="8" className="fill-primary/15"
          initial={{ scale: 0 }} whileInView={{ scale: [0, 1.3, 1] }} transition={{ duration: 0.6, delay: 0.8 }} viewport={{ once: true }} />
      </svg>
    ),
  },
  {
    icon: Calendar,
    title: "Scheduler Agent",
    description:
      "Creates calendar events, suggests meeting times, and manages your schedule.",
    visual: (
      <svg viewBox="0 0 120 80" className="w-full h-auto" fill="none">
        <motion.rect x="15" y="15" width="90" height="55" rx="6" stroke="currentColor" strokeWidth="1" className="text-foreground/20"
          initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} transition={{ duration: 0.8 }} viewport={{ once: true }} />
        <motion.line x1="15" y1="30" x2="105" y2="30" stroke="currentColor" strokeWidth="0.8" className="text-foreground/15"
          initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} transition={{ duration: 0.5, delay: 0.3 }} viewport={{ once: true }} />
        {[35, 55, 75].map((x, i) => (
          <motion.rect key={i} x={x} y={38} width={12} height={8} rx={2} className="fill-primary/20"
            initial={{ scale: 0 }} whileInView={{ scale: 1 }} transition={{ duration: 0.3, delay: 0.5 + i * 0.15 }} viewport={{ once: true }} />
        ))}
      </svg>
    ),
  },
  {
    icon: Share2,
    title: "Social Agent",
    description:
      "Creates social media posts, content plans, and manages multi-platform publishing.",
    visual: (
      <svg viewBox="0 0 120 80" className="w-full h-auto" fill="none">
        {[[35, 25], [85, 25], [60, 60]].map(([cx, cy], i) => (
          <motion.circle key={i} cx={cx} cy={cy} r={8} stroke="currentColor" strokeWidth="1" className="text-foreground/20"
            initial={{ scale: 0 }} whileInView={{ scale: 1 }} transition={{ duration: 0.4, delay: 0.2 + i * 0.15 }} viewport={{ once: true }} />
        ))}
        {[[35, 25, 85, 25], [85, 25, 60, 60], [60, 60, 35, 25]].map(([x1, y1, x2, y2], i) => (
          <motion.line key={`l-${i}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="currentColor" strokeWidth="0.8" className="text-primary/30"
            initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} transition={{ duration: 0.6, delay: 0.5 + i * 0.2 }} viewport={{ once: true }} />
        ))}
      </svg>
    ),
  },
  {
    icon: PenTool,
    title: "Writer Agent",
    description:
      "Produces blog posts, articles, and marketing copy with adaptive tone and style.",
    visual: (
      <svg viewBox="0 0 120 80" className="w-full h-auto" fill="none">
        {[22, 34, 46, 58].map((y, i) => (
          <motion.line key={i} x1="20" y1={y} x2={80 - i * 10} y2={y} stroke="currentColor" strokeWidth="1" className="text-foreground/15"
            initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} transition={{ duration: 0.4, delay: 0.2 + i * 0.12 }} viewport={{ once: true }} />
        ))}
        <motion.path d="M90 15 L95 65 L85 65 Z" stroke="currentColor" strokeWidth="1" className="text-primary/40"
          initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} transition={{ duration: 0.6, delay: 0.7 }} viewport={{ once: true }} />
      </svg>
    ),
  },
  {
    icon: BarChart3,
    title: "Analyst Agent",
    description:
      "Performs calculations, data comparisons, and delivers structured insights.",
    visual: (
      <svg viewBox="0 0 120 80" className="w-full h-auto" fill="none">
        {[
          { x: 20, h: 30 },
          { x: 38, h: 45 },
          { x: 56, h: 25 },
          { x: 74, h: 55 },
          { x: 92, h: 38 },
        ].map((bar, i) => (
          <motion.rect key={i} x={bar.x} y={70 - bar.h} width={12} height={bar.h} rx={2} className="fill-primary/20"
            initial={{ scaleY: 0 }} whileInView={{ scaleY: 1 }} style={{ originY: "100%" } as React.CSSProperties}
            transition={{ duration: 0.5, delay: 0.2 + i * 0.1, ease: "easeOut" as const }} viewport={{ once: true }} />
        ))}
      </svg>
    ),
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

export function AgentsSection() {
  return (
    <section id="agents" className="relative py-28 px-4">
      <div className="mx-auto max-w-7xl">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
            Build Workflows That
            <br />
            <span className="text-gradient">Think, Not Just React</span>
          </h2>
          <p className="mt-4 text-muted-foreground max-w-xl text-base sm:text-lg">
            Six specialized agents, each with real tool access. They don&apos;t just
            generate text — they take action.
          </p>
        </motion.div>

        {/* Agent cards grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {agents.map((agent) => (
            <motion.div
              key={agent.title}
              variants={cardVariants}
              className="landing-card p-6 sm:p-8 flex flex-col transition-all duration-300 group"
            >
              {/* Visual */}
              <div className="mb-6 h-20 flex items-center">
                {agent.visual}
              </div>

              {/* Icon + Title */}
              <div className="flex items-center gap-3 mb-3">
                <agent.icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                <h3 className="font-semibold text-base">{agent.title}</h3>
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed">
                {agent.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
