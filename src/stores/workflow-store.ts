"use client";

// ============================================
// Zustand Store — Global workflow state
// The conductor's memory
// ============================================

import { create } from "zustand";
import type { Agent, LogEntry, Workflow, WorkflowRun, WorkflowStatus } from "@/types";

interface WorkflowState {
  // Current workflow being viewed/executed
  currentWorkflow: Workflow | null;
  currentRun: WorkflowRun | null;

  // Live state during execution
  agents: Agent[];
  logs: LogEntry[];
  isExecuting: boolean;

  // Actions
  setCurrentWorkflow: (workflow: Workflow | null) => void;
  setCurrentRun: (run: WorkflowRun | null) => void;
  setAgents: (agents: Agent[]) => void;
  updateAgent: (agentId: string, updates: Partial<Agent>) => void;
  addLog: (log: LogEntry) => void;
  clearLogs: () => void;
  setIsExecuting: (executing: boolean) => void;
  reset: () => void;
}

export const useWorkflowStore = create<WorkflowState>((set) => ({
  currentWorkflow: null,
  currentRun: null,
  agents: [],
  logs: [],
  isExecuting: false,

  setCurrentWorkflow: (workflow) => set({ currentWorkflow: workflow }),
  setCurrentRun: (run) => set({ currentRun: run }),
  setAgents: (agents) => set({ agents }),

  updateAgent: (agentId, updates) =>
    set((state) => ({
      agents: state.agents.map((a) =>
        a.id === agentId ? { ...a, ...updates } : a
      ),
    })),

  addLog: (log) =>
    set((state) => ({
      logs: [...state.logs, log],
    })),

  clearLogs: () => set({ logs: [] }),
  setIsExecuting: (executing) => set({ isExecuting: executing }),

  reset: () =>
    set({
      currentWorkflow: null,
      currentRun: null,
      agents: [],
      logs: [],
      isExecuting: false,
    }),
}));
