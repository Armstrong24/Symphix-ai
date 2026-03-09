// ============================================
// Symphix Core Types
// The type system that keeps our orchestra in tune
// ============================================

export type AgentType = "email" | "research" | "scheduler" | "social" | "writer" | "analyst" | "custom";

export type AgentStatus = "idle" | "thinking" | "running" | "completed" | "error";

export type WorkflowStatus = "draft" | "running" | "completed" | "failed" | "cancelled";

export interface Agent {
  id: string;
  name: string;
  type: AgentType;
  description: string;
  status: AgentStatus;
  icon: string; // lucide icon name
  color: string; // tailwind color class
  logs: LogEntry[];
  result?: string;
  error?: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  agentId: string;
  agentName: string;
  message: string;
  type: "info" | "success" | "error" | "thinking" | "tool_call";
}

export interface Workflow {
  id: string;
  user_id: string;
  title: string;
  description: string;
  status: WorkflowStatus;
  agents: Agent[];
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface WorkflowRun {
  id: string;
  workflow_id: string;
  user_id: string;
  status: WorkflowStatus;
  logs: LogEntry[];
  result?: string;
  feedback?: "up" | "down" | null;
  started_at: string;
  completed_at?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
}

// Agent config mapping — what each agent type does
export const AGENT_CONFIG: Record<AgentType, { name: string; icon: string; color: string; description: string }> = {
  email: {
    name: "Email Agent",
    icon: "Mail",
    color: "#00f0ff",
    description: "Handles email drafting, replies, and inbox management",
  },
  research: {
    name: "Research Agent",
    icon: "Search",
    color: "#a855f7",
    description: "Searches the web and synthesizes information",
  },
  scheduler: {
    name: "Scheduler Agent",
    icon: "Calendar",
    color: "#22c55e",
    description: "Manages calendar events and scheduling",
  },
  social: {
    name: "Social Agent",
    icon: "Share2",
    color: "#f97316",
    description: "Creates and manages social media posts",
  },
  writer: {
    name: "Writer Agent",
    icon: "PenTool",
    color: "#ec4899",
    description: "Writes content, articles, and copy",
  },
  analyst: {
    name: "Analyst Agent",
    icon: "BarChart3",
    color: "#eab308",
    description: "Analyzes data and generates insights",
  },
  custom: {
    name: "Custom Agent",
    icon: "Cpu",
    color: "#6366f1",
    description: "A specialized agent for unique tasks",
  },
};
