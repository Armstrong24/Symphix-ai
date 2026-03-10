"use client";

import { motion } from "framer-motion";
import { Briefcase, GraduationCap, TrendingUp, Users } from "lucide-react";

const useCases = [
  {
    icon: Briefcase,
    title: "Sales Teams",
    prompt: "\"Research the prospect, draft a personalized outreach email, and schedule a follow-up for next week.\"",
    agents: ["Research", "Email", "Scheduler"],
    description:
      "Automate the entire prospecting workflow. Your agents research the company, craft a tailored email, and set calendar reminders — in seconds.",
  },
  {
    icon: TrendingUp,
    title: "Marketing",
    prompt: "\"Analyze last month's campaign data, write a LinkedIn post about the wins, and draft a report for the team.\"",
    agents: ["Analyst", "Social", "Writer"],
    description:
      "Turn raw metrics into content and reports. Analyst crunches the numbers, Writer drafts the narrative, Social handles distribution.",
  },
  {
    icon: Users,
    title: "Founders & Operators",
    prompt: "\"Send investor updates, research competitors in our space, and block time for quarterly planning.\"",
    agents: ["Email", "Research", "Scheduler"],
    description:
      "Keep stakeholders informed, stay ahead of competition, and protect deep-work time — all from one prompt.",
  },
  {
    icon: GraduationCap,
    title: "Researchers",
    prompt: "\"Find recent papers on LLM fine-tuning, summarize the top 3, and draft a comparison table.\"",
    agents: ["Research", "Writer", "Analyst"],
    description:
      "Accelerate literature reviews. Research agent pulls real-time sources, Writer summarizes, Analyst structures the comparison.",
  },
];

export function UseCasesSection() {
  return (
    <section id="use-cases" className="relative py-28 px-4">
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
            Built for How
            <br />
            <span className="text-gradient">You Actually Work</span>
          </h2>
          <p className="mt-4 text-muted-foreground max-w-xl text-base sm:text-lg">
            Real workflows, real tool execution. Here&apos;s how teams are using Symphix.
          </p>
        </motion.div>

        {/* Use case cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {useCases.map((uc, i) => (
            <motion.div
              key={uc.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.5,
                delay: i * 0.1,
                ease: "easeOut" as const,
              }}
              className="landing-card p-6 sm:p-8 flex flex-col transition-all duration-300"
            >
              {/* Header row */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-lg bg-foreground/5 border border-border flex items-center justify-center">
                  <uc.icon className="h-4 w-4 text-foreground/70" />
                </div>
                <h3 className="font-semibold text-base">{uc.title}</h3>
              </div>

              {/* Example prompt */}
              <div className="mb-4 p-3 rounded-lg bg-foreground/[0.03] border border-border/50">
                <p className="text-sm font-mono text-muted-foreground leading-relaxed">
                  {uc.prompt}
                </p>
              </div>

              {/* Agent badges */}
              <div className="flex flex-wrap gap-2 mb-4">
                {uc.agents.map((agent) => (
                  <span
                    key={agent}
                    className="text-xs px-2.5 py-1 rounded-md bg-primary/10 text-primary font-medium"
                  >
                    {agent}
                  </span>
                ))}
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed">
                {uc.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
