// ============================================
// Tools Index — Export all agent tools
// ============================================

export { researchTools, webSearchTool, webExtractTool } from "./research";
export { emailTools, sendEmailTool, draftEmailTool } from "./email";
export { schedulerTools, createEventTool, suggestTimesTool } from "./scheduler";
export { socialTools, createPostTool, contentPlanTool } from "./social";
export { writerTools, writeContentTool, rewriteContentTool } from "./writer";
export { analystTools, calculateTool, analyzeDataTool, compareTool } from "./analyst";

import { researchTools } from "./research";
import { emailTools } from "./email";
import { schedulerTools } from "./scheduler";
import { socialTools } from "./social";
import { writerTools } from "./writer";
import { analystTools } from "./analyst";

import type { AgentType } from "@/types";

/**
 * Get the tools for a specific agent type
 */
export function getToolsForAgent(agentType: AgentType) {
  switch (agentType) {
    case "research":
      return researchTools;
    case "email":
      return emailTools;
    case "scheduler":
      return schedulerTools;
    case "social":
      return socialTools;
    case "writer":
      return writerTools;
    case "analyst":
      return analystTools;
    case "custom":
      // Custom agents get research + writer tools as a reasonable default
      return [...researchTools, ...writerTools];
    default:
      return [];
  }
}
