// ============================================
// Writer Tool — Content Creation & Formatting
// Structured output for various content types
// No external API needed — LLM-powered
// ============================================

import { tool } from "@langchain/core/tools";
import { z } from "zod";

/**
 * Generate a structured content piece
 */
export const writeContentTool = tool(
  async ({
    type,
    title,
    outline,
    targetLength,
    tone,
    audience,
  }: {
    type: string;
    title: string;
    outline?: string;
    targetLength?: string;
    tone?: string;
    audience?: string;
  }) => {
    // Return structured metadata — the actual content is written by the LLM
    // in the agent's response using this tool output as guidance
    return JSON.stringify({
      success: true,
      brief: {
        type,
        title,
        outline: outline || "Auto-generate based on title",
        targetLength: targetLength || "medium (500-800 words)",
        tone: tone || "professional",
        audience: audience || "general",
      },
      formatGuidelines: getFormatGuidelines(type),
    });
  },
  {
    name: "write_content",
    description:
      "Structure and plan a content piece (blog post, article, report, email newsletter, landing page copy, etc.). Returns a content brief with formatting guidelines. The actual writing should follow this structure.",
    schema: z.object({
      type: z
        .string()
        .describe(
          "Content type: blog_post, article, report, newsletter, landing_page, press_release, case_study, whitepaper"
        ),
      title: z.string().describe("Title or headline for the content"),
      outline: z
        .string()
        .optional()
        .describe("Optional outline or key points to cover"),
      targetLength: z
        .string()
        .optional()
        .describe("Target length: short (200-400 words), medium (500-800), long (1000+)"),
      tone: z
        .string()
        .optional()
        .describe("Writing tone: professional, casual, technical, persuasive, educational"),
      audience: z
        .string()
        .optional()
        .describe("Target audience description"),
    }),
  }
);

/**
 * Summarize or rewrite content
 */
export const rewriteContentTool = tool(
  async ({
    originalContent,
    instruction,
    targetTone,
    targetLength,
  }: {
    originalContent: string;
    instruction: string;
    targetTone?: string;
    targetLength?: string;
  }) => {
    return JSON.stringify({
      success: true,
      original: {
        length: originalContent.length,
        wordCount: originalContent.split(/\s+/).length,
      },
      rewriteInstructions: {
        instruction,
        targetTone: targetTone || "same as original",
        targetLength: targetLength || "similar to original",
      },
    });
  },
  {
    name: "rewrite_content",
    description:
      "Rewrite, summarize, expand, or transform existing content. Provide the original text and instructions for how to change it.",
    schema: z.object({
      originalContent: z.string().describe("The original content to rewrite"),
      instruction: z
        .string()
        .describe(
          "What to do: summarize, expand, simplify, make more formal, translate tone, etc."
        ),
      targetTone: z.string().optional().describe("Desired tone for the rewrite"),
      targetLength: z.string().optional().describe("Target length for the rewrite"),
    }),
  }
);

function getFormatGuidelines(type: string): string {
  const guidelines: Record<string, string> = {
    blog_post:
      "Use H2/H3 headers, short paragraphs, bullet points. Start with a hook. End with a CTA. Include 1-2 relevant examples.",
    article:
      "Formal structure: intro, body sections with subheadings, conclusion. Cite sources where possible. Balanced and informative.",
    report:
      "Executive summary first. Use data points, charts descriptions, and clear section headers. End with recommendations.",
    newsletter:
      "Friendly opening, 2-3 main content blocks, links to resources, sign-off. Keep sections scannable.",
    landing_page:
      "Hero headline + subheading, 3 benefit blocks, social proof section, FAQ, strong CTA. Concise and persuasive.",
    press_release:
      "Inverted pyramid: most important info first. Include quotes, boilerplate, contact info. Formal and factual.",
    case_study:
      "Challenge → Solution → Results structure. Include metrics and quotes. Tell a story.",
    whitepaper:
      "Abstract, introduction, methodology, findings, conclusion. Academic but accessible. Data-driven.",
  };
  return guidelines[type] || guidelines.blog_post;
}

export const writerTools = [writeContentTool, rewriteContentTool];
