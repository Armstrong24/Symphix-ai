// ============================================
// Analyst Tool — Data Analysis & Insights
// Calculations, trend analysis, structured reports
// No external API needed — LLM + math utilities
// ============================================

import { tool } from "@langchain/core/tools";
import { z } from "zod";

/**
 * Perform calculations on numerical data
 */
export const calculateTool = tool(
  async ({
    expression,
    description,
  }: {
    expression: string;
    description?: string;
  }) => {
    try {
      // Safe math evaluation — only allows numbers and operators
      const sanitized = expression.replace(/[^0-9+\-*/().,%\s]/g, "");
      if (sanitized !== expression.replace(/\s/g, "").replace(/[^0-9+\-*/().,%]/g, "")) {
        return JSON.stringify({
          success: false,
          error: "Expression contains unsafe characters. Only numbers and basic operators (+, -, *, /, %, parentheses) are allowed.",
        });
      }

      // Use Function constructor for safe-ish math (server-side only, no user input from browser)
      const result = new Function(`"use strict"; return (${sanitized})`)();

      return JSON.stringify({
        success: true,
        expression: sanitized,
        result: Number(result),
        description: description || "Calculation result",
      });
    } catch (error: any) {
      return JSON.stringify({
        success: false,
        expression,
        error: error.message || "Calculation failed",
      });
    }
  },
  {
    name: "calculate",
    description:
      "Perform mathematical calculations. Supports basic arithmetic (+, -, *, /), percentages, and parentheses. Use this for any numerical computations in your analysis.",
    schema: z.object({
      expression: z
        .string()
        .describe("Math expression to evaluate (e.g., '(150000 * 0.15) + 2500')"),
      description: z
        .string()
        .optional()
        .describe("What this calculation represents"),
    }),
  }
);

/**
 * Generate a structured data analysis report
 */
export const analyzeDataTool = tool(
  async ({
    dataDescription,
    metrics,
    timeframe,
    analysisType,
  }: {
    dataDescription: string;
    metrics: string[];
    timeframe?: string;
    analysisType?: string;
  }) => {
    return JSON.stringify({
      success: true,
      analysisFramework: {
        dataDescription,
        metrics,
        timeframe: timeframe || "not specified",
        analysisType: analysisType || "general",
        suggestedStructure: [
          "Executive Summary — Key findings in 2-3 sentences",
          "Metrics Overview — Current values and trends for each metric",
          "Analysis — Patterns, correlations, anomalies",
          "Comparisons — Benchmarks, period-over-period changes",
          "Recommendations — Data-driven action items",
          "Risk Factors — Potential concerns and caveats",
        ],
      },
    });
  },
  {
    name: "analyze_data",
    description:
      "Structure a data analysis report. Provide the data context, key metrics, and desired analysis type. Returns a framework for comprehensive analysis with sections and recommendations.",
    schema: z.object({
      dataDescription: z
        .string()
        .describe("Description of the data being analyzed"),
      metrics: z
        .array(z.string())
        .describe("Key metrics to analyze (e.g., ['revenue', 'churn rate', 'MRR'])"),
      timeframe: z
        .string()
        .optional()
        .describe("Time period for analysis (e.g., 'Q1 2026', 'Last 6 months')"),
      analysisType: z
        .string()
        .optional()
        .describe(
          "Type of analysis: trend, comparison, cohort, funnel, forecast, competitive"
        ),
    }),
  }
);

/**
 * Create a comparison/benchmark table
 */
export const compareTool = tool(
  async ({
    items,
    criteria,
    context,
  }: {
    items: string[];
    criteria: string[];
    context?: string;
  }) => {
    return JSON.stringify({
      success: true,
      comparison: {
        items,
        criteria,
        context: context || "General comparison",
        outputFormat:
          "Create a markdown table with items as rows and criteria as columns. Rate or describe each cell. Include a summary with winner/recommendation.",
      },
    });
  },
  {
    name: "compare",
    description:
      "Create a structured comparison between items based on specific criteria. Useful for product comparisons, competitive analysis, option evaluation, and decision matrices.",
    schema: z.object({
      items: z.array(z.string()).describe("Items to compare (e.g., ['Product A', 'Product B'])"),
      criteria: z
        .array(z.string())
        .describe("Criteria to compare on (e.g., ['price', 'features', 'ease of use'])"),
      context: z.string().optional().describe("Additional context for the comparison"),
    }),
  }
);

export const analystTools = [calculateTool, analyzeDataTool, compareTool];
