// ============================================
// Symphix Model Factory — Google Gemini 2.5 Flash
// Centralized LLM creation for all agents and the conductor
// ============================================

import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

/**
 * Create a Gemini 2.5 Flash instance.
 * Used by both the conductor (fast planning) and agents (tool-calling).
 *
 * Gemini 2.5 Flash is fast, cheap, supports tool-calling & streaming,
 * and has generous rate limits compared to Groq free tier.
 */
export function getLLM(options?: { maxOutputTokens?: number; temperature?: number }) {
  return new ChatGoogleGenerativeAI({
    apiKey: process.env.GOOGLE_GEMINI_API_KEY,
    model: "gemini-2.5-flash",
    temperature: options?.temperature ?? 0.3,
    maxOutputTokens: options?.maxOutputTokens ?? 2048,
  });
}
