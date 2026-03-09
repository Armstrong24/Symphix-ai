"use client";

// ============================================
// Features Section — What Symphix can do
// Staggered animated cards with glassmorphism
// ============================================

import { motion } from "framer-motion";
import { Mail, Search, Calendar, Share2, PenTool, BarChart3, Zap, Shield } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "One Prompt Orchestration",
    description: "Describe your workflow in plain English. Our conductor AI breaks it into specialized agents instantly.",
    color: "#00f0ff",
  },
  {
    icon: Mail,
    title: "Email Automation",
    description: "Draft replies, manage inbox, and send follow-ups — all handled by your personal email agent.",
    color: "#3b82f6",
  },
  {
    icon: Search,
    title: "Deep Research",
    description: "Web search, data synthesis, and report generation powered by real-time information.",
    color: "#a855f7",
  },
  {
    icon: Calendar,
    title: "Smart Scheduling",
    description: "Manage your calendar, find optimal meeting times, and send invites automatically.",
    color: "#22c55e",
  },
  {
    icon: Share2,
    title: "Social Media",
    description: "Create, schedule, and post content across platforms — LinkedIn, Twitter, and more.",
    color: "#f97316",
  },
  {
    icon: PenTool,
    title: "Content Writing",
    description: "Blog posts, emails, reports — your writer agent crafts compelling content on demand.",
    color: "#ec4899",
  },
  {
    icon: BarChart3,
    title: "Data Analysis",
    description: "Your analyst agent crunches numbers, finds trends, and delivers actionable insights.",
    color: "#eab308",
  },
  {
    icon: Shield,
    title: "Privacy First",
    description: "All data stays in your Supabase tables. No third-party access, full control, always.",
    color: "#6366f1",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export function FeaturesSection() {
  return (
    <section className="relative py-24 px-4">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold">
            Your <span className="text-gradient">AI Orchestra</span> Awaits
          </h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
            Each agent is a specialist. Together, they handle everything.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={cardVariants}
              whileHover={{ scale: 1.03, y: -4 }}
              className="glass rounded-2xl p-6 group cursor-default transition-shadow hover:shadow-lg"
              style={{
                boxShadow: `0 0 0 0 ${feature.color}00`,
              }}
            >
              <div
                className="inline-flex items-center justify-center rounded-xl p-2.5 mb-4"
                style={{ backgroundColor: `${feature.color}15` }}
              >
                <feature.icon className="h-5 w-5" style={{ color: feature.color }} />
              </div>
              <h3 className="font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
