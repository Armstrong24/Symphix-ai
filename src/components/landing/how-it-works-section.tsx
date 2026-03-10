"use client";

import { motion } from "framer-motion";
import { MessageSquare, GitBranch, Play } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: MessageSquare,
    title: "Describe Your Workflow",
    description:
      "Type a plain-English prompt. \"Send a follow-up email, research competitors, and schedule a team sync\" — that's all it takes.",
  },
  {
    number: "02",
    icon: GitBranch,
    title: "AI Plans the Agents",
    description:
      "Our conductor AI analyzes your prompt and assigns the right specialized agents — Email, Research, Scheduler, and more — each with a focused objective.",
  },
  {
    number: "03",
    icon: Play,
    title: "Agents Execute with Real Tools",
    description:
      "Each agent works with real tool access: web search, email APIs, calendar integration. Results flow back as structured, actionable output.",
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="relative py-28 px-4">
      <div className="mx-auto max-w-7xl">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-20"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
            Three Steps to
            <br />
            <span className="text-gradient">Full Automation</span>
          </h2>
        </motion.div>

        {/* Steps */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.6,
                delay: i * 0.15,
                ease: "easeOut" as const,
              }}
              className="relative"
            >
              {/* Connecting line (desktop) */}
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 left-full w-8 h-px">
                  <motion.div
                    className="h-px bg-border w-full"
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.4 + i * 0.15 }}
                    style={{ transformOrigin: "left" }}
                  />
                </div>
              )}

              <div className="landing-card p-8 h-full">
                {/* Step number */}
                <span className="text-xs font-mono text-muted-foreground/60 tracking-wider">
                  {step.number}
                </span>

                {/* Icon */}
                <div className="mt-4 mb-5 inline-flex items-center justify-center w-10 h-10 rounded-lg bg-foreground/5 border border-border">
                  <step.icon className="h-5 w-5 text-foreground/70" />
                </div>

                <h3 className="text-lg font-semibold mb-3">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Animated flow visualization */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-16 flex justify-center"
        >
          <div className="landing-card p-6 sm:p-8 max-w-3xl w-full">
            <div className="flex items-center gap-4 mb-4">
              <div className="h-2 w-2 rounded-full bg-neon-green animate-pulse" />
              <span className="text-xs font-mono text-muted-foreground">Live orchestration preview</span>
            </div>
            <div className="font-mono text-xs sm:text-sm text-muted-foreground space-y-2">
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.7 }}
              >
                <span className="text-foreground/80">$</span>{" "}
                <span className="text-primary/80">&quot;Send a follow-up to Sarah, research Q3 market trends, and block Friday 2pm for review&quot;</span>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 1.0 }}
                className="text-muted-foreground/60"
              >
                Conductor assigned 3 agents: Email, Research, Scheduler
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 1.3 }}
                className="flex items-center gap-2"
              >
                <span className="text-neon-green">&#10003;</span> Email agent: Follow-up sent to sarah@company.com
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 1.6 }}
                className="flex items-center gap-2"
              >
                <span className="text-neon-green">&#10003;</span> Research agent: Q3 market analysis generated (4 sources)
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 1.9 }}
                className="flex items-center gap-2"
              >
                <span className="text-neon-green">&#10003;</span> Scheduler agent: Friday 2-3pm blocked — &quot;Q3 Review&quot;
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
