"use client";

// ============================================
// Workflow Creation Page — Voice + text input
// Where the magic prompt becomes an agent team
// ============================================

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Mic,
  MicOff,
  Zap,
  Loader2,
  Sparkles,
  Mail,
  Search,
  Calendar,
  Share2,
  PenTool,
  BarChart3,
} from "lucide-react";
import { toast } from "sonner";

const suggestions = [
  "Handle my freelance emails, research leads, schedule calls, and post updates to LinkedIn",
  "Research trending topics in AI, write a blog post summary, and schedule it for publishing",
  "Draft outreach emails to potential clients, research their companies, and schedule follow-ups",
  "Analyze my weekly meeting notes, create action items, and send task emails to the team",
];

const agentIcons: Record<string, any> = {
  email: Mail,
  research: Search,
  scheduler: Calendar,
  social: Share2,
  writer: PenTool,
  analyst: BarChart3,
};

export default function NewWorkflowPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
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
          setDescription((prev) => {
            // If the previous text ends with a space or is empty, just append
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
      setDescription(""); // Clear for fresh dictation
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleCreate = async () => {
    if (!description.trim()) {
      toast.error("Describe your workflow first!");
      return;
    }
    setIsCreating(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Auto-generate title if empty
      const autoTitle = title.trim() || description.slice(0, 60) + (description.length > 60 ? "..." : "");

      // Create the workflow in Supabase
      const { data: workflow, error } = await supabase
        .from("workflows")
        .insert({
          user_id: user.id,
          title: autoTitle,
          description: description.trim(),
          status: "draft",
          agents: [],
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Workflow created! Assembling your agents...");
      router.push(`/dashboard/workflow/${workflow.id}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to create workflow");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto"
    >
      <div className="mb-8">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-neon-cyan" />
          Create New Workflow
        </h1>
        <p className="mt-2 text-muted-foreground">
          Describe what you need in plain English — or use your voice. Our conductor will assemble the perfect agent team.
        </p>
      </div>

      <div className="glass rounded-2xl p-6 space-y-6">
        {/* Title (optional) */}
        <div>
          <label className="text-sm font-medium mb-2 block">
            Workflow Name <span className="text-muted-foreground">(optional)</span>
          </label>
          <Input
            placeholder="e.g., Weekly Lead Outreach Pipeline"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="bg-white/5 border-white/10"
          />
        </div>

        {/* Description with voice input */}
        <div>
          <label className="text-sm font-medium mb-2 block">
            What should your agents do?
          </label>
          <div className="relative">
            <Textarea
              placeholder="Describe your workflow... e.g., 'Handle my freelance emails, research new leads, schedule discovery calls, and post updates to LinkedIn'"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[160px] bg-white/5 border-white/10 pr-14 text-base resize-none"
            />
            {/* Voice button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleListening}
              className={`absolute bottom-3 right-3 h-10 w-10 rounded-xl flex items-center justify-center transition-colors ${
                isListening
                  ? "bg-red-500/20 text-red-400 animate-pulse"
                  : "bg-white/5 text-muted-foreground hover:text-neon-cyan hover:bg-neon-cyan/10"
              }`}
            >
              {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </motion.button>
          </div>
          {isListening && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-2 text-xs text-red-400 flex items-center gap-1"
            >
              <span className="inline-block h-2 w-2 rounded-full bg-red-400 animate-pulse" />
              Listening... speak your workflow description
            </motion.p>
          )}
        </div>

        {/* Suggestion chips */}
        <div>
          <p className="text-xs text-muted-foreground mb-3">Try one of these:</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s, i) => (
              <motion.button
                key={i}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setDescription(s)}
                className="glass rounded-lg px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors text-left"
              >
                {s.length > 60 ? s.slice(0, 60) + "..." : s}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Create button */}
        <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
          <Button
            onClick={handleCreate}
            disabled={isCreating || !description.trim()}
            className="w-full h-12 bg-neon-cyan text-black font-semibold hover:bg-neon-cyan/80 glow-cyan text-base"
          >
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Assembling Agents...
              </>
            ) : (
              <>
                <Zap className="mr-2 h-5 w-5" />
                Create & Run Workflow
              </>
            )}
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
}
