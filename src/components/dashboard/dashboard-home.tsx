"use client";

// ============================================
// Dashboard Home — The premium command center
// Stats, quick actions, recent workflows
// ============================================

import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import {
  Plus,
  Zap,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowRight,
  Mic,
  MicOff,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";

interface DashboardHomeProps {
  workflows: any[];
  runs: any[];
  userName: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

const statusConfig: Record<string, { color: string; icon: any; label: string }> = {
  draft: { color: "text-muted-foreground", icon: Clock, label: "Draft" },
  running: { color: "text-primary", icon: Loader2, label: "Running" },
  completed: { color: "text-neon-green", icon: CheckCircle2, label: "Completed" },
  failed: { color: "text-red-500", icon: XCircle, label: "Failed" },
  cancelled: { color: "text-muted-foreground", icon: XCircle, label: "Cancelled" },
};

export function DashboardHome({ workflows, runs, userName }: DashboardHomeProps) {
  const [prompt, setPrompt] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const router = useRouter();

  // Setup Speech Recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        recognition.onresult = (event: any) => {
          let transcript = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
          }
          setPrompt((prev) => {
            if (prev.endsWith(" ") || prev === "") return prev + transcript;
            return prev + " " + transcript;
          });
        };

        recognition.onerror = () => {
          setIsListening(false);
          toast.error("Voice recognition error. Try again.");
        };

        recognition.onend = () => setIsListening(false);
        recognitionRef.current = recognition;
      }
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      toast.error("Speech recognition not supported in your browser");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setPrompt("");
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleOrchestrate = async () => {
    if (!prompt.trim()) {
      toast.error("Describe your workflow first!");
      return;
    }
    setIsCreating(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const autoTitle = prompt.slice(0, 60) + (prompt.length > 60 ? "..." : "");

      const { data: workflow, error } = await supabase
        .from("workflows")
        .insert({
          user_id: user.id,
          title: autoTitle,
          description: prompt.trim(),
          status: "draft",
          agents: [],
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Assembling your agent team...");
      router.push(`/dashboard/workflow/${workflow.id}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to create workflow");
    } finally {
      setIsCreating(false);
    }
  };

  const completedCount = workflows.filter((w) => w.status === "completed").length;
  const runningCount = workflows.filter((w) => w.status === "running").length;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-5xl mx-auto"
    >
      {/* Welcome header */}
      <motion.div variants={itemVariants} className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
          Welcome back, <span className="text-gradient">{userName}</span>
        </h1>
        <p className="mt-2 text-muted-foreground text-lg">
          Your AI orchestra is ready. What should we automate today?
        </p>
      </motion.div>

      {/* Main orchestration card */}
      <motion.div variants={itemVariants} className="mb-8">
        <div className="glass rounded-2xl p-6 sm:p-8 glow-cyan border border-primary/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Orchestrate a Workflow</h2>
              <p className="text-sm text-muted-foreground">Describe what you need in plain English — or use your voice</p>
            </div>
          </div>

          <div className="relative mb-4">
            <Textarea
              placeholder="e.g., Research trending AI topics, write a blog post, and schedule it for publishing..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[120px] bg-background/50 border-border pr-14 text-base resize-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  handleOrchestrate();
                }
              }}
            />
            {/* Voice button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleListening}
              className={`absolute bottom-3 right-3 h-10 w-10 rounded-xl flex items-center justify-center transition-colors ${
                isListening
                  ? "bg-red-500/20 text-red-400 animate-pulse"
                  : "bg-muted/50 text-muted-foreground hover:text-primary hover:bg-primary/10"
              }`}
            >
              {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </motion.button>
          </div>

          {isListening && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-4 text-xs text-red-400 flex items-center gap-1"
            >
              <span className="inline-block h-2 w-2 rounded-full bg-red-400 animate-pulse" />
              Listening... speak your workflow description
            </motion.p>
          )}

          <div className="flex items-center gap-3">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1">
              <Button
                onClick={handleOrchestrate}
                disabled={isCreating || !prompt.trim()}
                className="w-full h-12 bg-primary text-primary-foreground font-semibold hover:bg-primary/80 glow-cyan text-base"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Assembling Agents...
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-5 w-5" />
                    Orchestrate
                  </>
                )}
              </Button>
            </motion.div>
          </div>

          <p className="mt-3 text-xs text-muted-foreground text-center">
            Press Ctrl+Enter to orchestrate
          </p>
        </div>
      </motion.div>

      {/* Stats row */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Workflows", value: workflows.length, icon: Zap, color: "text-primary" },
          { label: "Running", value: runningCount, icon: Loader2, color: "text-neon-orange" },
          { label: "Completed", value: completedCount, icon: CheckCircle2, color: "text-neon-green" },
          { label: "Total Runs", value: runs.length, icon: TrendingUp, color: "text-neon-purple" },
        ].map((stat) => (
          <motion.div
            key={stat.label}
            whileHover={{ scale: 1.03, y: -2 }}
            className="glass rounded-xl p-4 transition-shadow hover:shadow-md"
          >
            <div className="flex items-center gap-2 mb-2">
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
              <span className="text-xs text-muted-foreground">{stat.label}</span>
            </div>
            <p className="text-2xl font-bold">{stat.value}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Recent workflows */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Recent Workflows</h2>
          <Link href="/dashboard/history">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              View All <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </Link>
        </div>

        {workflows.length === 0 ? (
          <div className="glass rounded-xl p-12 text-center">
            <Zap className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No workflows yet. Create your first one above!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {workflows.slice(0, 5).map((workflow, i) => {
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
                    <motion.div
                      whileHover={{ scale: 1.005, x: 4 }}
                      className="glass rounded-xl p-4 cursor-pointer group transition-shadow hover:shadow-md"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3">
                            <h3 className="font-medium truncate">{workflow.title}</h3>
                            <Badge variant="outline" className={`text-xs ${status.color} shrink-0`}>
                              <StatusIcon className={`mr-1 h-3 w-3 ${workflow.status === "running" ? "animate-spin" : ""}`} />
                              {status.label}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground truncate mt-1">
                            {workflow.description}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 ml-4 shrink-0">
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
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
