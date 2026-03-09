"use client";

// ============================================
// Hero Section — The grand opening of Symphix
// Animated gradient text, floating agents, particles
// ============================================

import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Zap,
  Mail,
  Search,
  Calendar,
  Share2,
  PenTool,
  BarChart3,
  ArrowRight,
} from "lucide-react";

const floatingAgents = [
  { icon: Mail, label: "Email", color: "#00f0ff", x: -200, y: -80, delay: 0 },
  { icon: Search, label: "Research", color: "#a855f7", x: 220, y: -60, delay: 0.2 },
  { icon: Calendar, label: "Schedule", color: "#22c55e", x: -260, y: 80, delay: 0.4 },
  { icon: Share2, label: "Social", color: "#f97316", x: 260, y: 100, delay: 0.6 },
  { icon: PenTool, label: "Writer", color: "#ec4899", x: -120, y: 160, delay: 0.8 },
  { icon: BarChart3, label: "Analyst", color: "#eab308", x: 130, y: 170, delay: 1.0 },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.3 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } },
};

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-grid">
      {/* Radial glow background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-neon-cyan/5 blur-[120px]" />
        <div className="absolute top-1/3 left-1/3 w-[600px] h-[600px] rounded-full bg-neon-purple/5 blur-[100px]" />
      </div>

      {/* Floating agent avatars — orbit around the center */}
      <div className="absolute inset-0 pointer-events-none">
        {floatingAgents.map((agent, i) => (
          <motion.div
            key={agent.label}
            className="absolute top-1/2 left-1/2 hidden md:flex items-center gap-2"
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0, 0.7, 0.5],
              scale: 1,
              x: agent.x,
              y: agent.y,
            }}
            transition={{
              duration: 1.2,
              delay: agent.delay + 0.5,
              ease: "easeOut",
            }}
          >
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{
                duration: 3 + i * 0.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="glass rounded-xl px-3 py-2 flex items-center gap-2"
              style={{ borderColor: `${agent.color}30` }}
            >
              <agent.icon className="h-4 w-4" style={{ color: agent.color }} />
              <span className="text-xs text-muted-foreground">{agent.label}</span>
            </motion.div>
          </motion.div>
        ))}
      </div>

      {/* Main hero content */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 mx-auto max-w-4xl px-4 text-center"
      >
        {/* Badge */}
        <motion.div variants={itemVariants} className="mb-6 inline-flex">
          <span className="glass rounded-full px-4 py-1.5 text-xs font-medium text-neon-cyan border border-neon-cyan/20">
            <Zap className="inline h-3 w-3 mr-1" />
            AI Agent Orchestration Platform
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          variants={itemVariants}
          className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-tight"
        >
          One Prompt.{" "}
          <span className="text-gradient">Your AI Agents</span>
          <br />
          in Perfect Harmony.
        </motion.h1>

        {/* Subheading */}
        <motion.p
          variants={itemVariants}
          className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto"
        >
          Turn a single sentence into a team of specialized AI agents that handle your
          emails, research, scheduling, and social media — all orchestrated automatically.
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          variants={itemVariants}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link href="/auth/signup">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                size="lg"
                className="bg-neon-cyan text-black font-semibold hover:bg-neon-cyan/80 glow-cyan px-8 h-12 text-base"
              >
                Start Orchestrating
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </motion.div>
          </Link>
          <Link href="/auth/login">
            <Button
              variant="outline"
              size="lg"
              className="border-border h-12 text-base"
            >
              Sign In
            </Button>
          </Link>
        </motion.div>

        {/* Feature pills */}
        <motion.div
          variants={itemVariants}
          className="mt-16 flex flex-wrap justify-center gap-3"
        >
          {["Email Automation", "Web Research", "Smart Scheduling", "Social Posting", "Content Writing", "Data Analysis"].map(
            (feature) => (
              <span
                key={feature}
                className="glass rounded-full px-4 py-1.5 text-xs text-muted-foreground"
              >
                {feature}
              </span>
            )
          )}
        </motion.div>
      </motion.div>
    </section>
  );
}
