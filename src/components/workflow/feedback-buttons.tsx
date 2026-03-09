"use client";

// ============================================
// Feedback Buttons — Thumbs up/down on workflow runs
// Stores to Supabase to improve future runs
// ============================================

import { useState } from "react";
import { motion } from "framer-motion";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function FeedbackButtons({ runId }: { runId: string }) {
  const [submitted, setSubmitted] = useState<"up" | "down" | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFeedback = async (feedback: "up" | "down") => {
    setLoading(true);
    try {
      const res = await fetch("/api/workflow", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runId, feedback }),
      });
      if (!res.ok) throw new Error("Failed to submit");
      setSubmitted(feedback);
      toast.success(feedback === "up" ? "Glad it helped!" : "Thanks for the feedback — we'll improve!");
    } catch {
      toast.error("Failed to submit feedback");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-xl p-6 text-center"
    >
      <p className="text-sm text-muted-foreground mb-4">How was this workflow run?</p>
      <div className="flex items-center justify-center gap-3">
        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
          <Button
            variant="outline"
            size="lg"
            disabled={loading || submitted !== null}
            onClick={() => handleFeedback("up")}
            className={`border-white/10 ${submitted === "up" ? "bg-green-500/20 text-green-400 border-green-500/30" : ""}`}
          >
            <ThumbsUp className="mr-2 h-5 w-5" />
            Helpful
          </Button>
        </motion.div>
        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
          <Button
            variant="outline"
            size="lg"
            disabled={loading || submitted !== null}
            onClick={() => handleFeedback("down")}
            className={`border-white/10 ${submitted === "down" ? "bg-red-500/20 text-red-400 border-red-500/30" : ""}`}
          >
            <ThumbsDown className="mr-2 h-5 w-5" />
            Needs Work
          </Button>
        </motion.div>
      </div>
      {submitted && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-3 text-xs text-muted-foreground"
        >
          Feedback recorded. Thank you!
        </motion.p>
      )}
    </motion.div>
  );
}
