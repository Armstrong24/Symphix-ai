// ============================================
// Social Media Tool — Post Generation & Formatting
// Platform-optimized content creation
// No external API needed — LLM-powered formatting
// ============================================

import { tool } from "@langchain/core/tools";
import { z } from "zod";

const platformLimits: Record<string, { maxChars: number; hashtagMax: number; format: string }> = {
  twitter: { maxChars: 280, hashtagMax: 3, format: "Short, punchy, conversational. Use line breaks for readability." },
  linkedin: { maxChars: 3000, hashtagMax: 5, format: "Professional, insightful. Use paragraphs. First line is the hook." },
  instagram: { maxChars: 2200, hashtagMax: 30, format: "Visual storytelling. Emoji-friendly. Hashtags at the end." },
  facebook: { maxChars: 63206, hashtagMax: 3, format: "Conversational, shareable. Questions engage audiences." },
  threads: { maxChars: 500, hashtagMax: 3, format: "Casual, conversational. Similar to Twitter but slightly longer." },
};

/**
 * Create an optimized social media post
 */
export const createPostTool = tool(
  async ({
    platform,
    content,
    hashtags,
    callToAction,
    tone,
  }: {
    platform: string;
    content: string;
    hashtags?: string[];
    callToAction?: string;
    tone?: string;
  }) => {
    const platformKey = platform.toLowerCase();
    const config = platformLimits[platformKey] || platformLimits.twitter;

    // Format hashtags
    const formattedHashtags = (hashtags || [])
      .slice(0, config.hashtagMax)
      .map((h) => (h.startsWith("#") ? h : `#${h}`))
      .join(" ");

    // Build the post
    let post = content;
    if (callToAction) {
      post += `\n\n${callToAction}`;
    }
    if (formattedHashtags) {
      post += `\n\n${formattedHashtags}`;
    }

    // Truncate if needed
    const truncated = post.length > config.maxChars;
    if (truncated) {
      post = post.slice(0, config.maxChars - 3) + "...";
    }

    return JSON.stringify({
      success: true,
      platform: platformKey,
      post,
      metadata: {
        characterCount: post.length,
        maxCharacters: config.maxChars,
        hashtagCount: (hashtags || []).length,
        truncated,
        tone: tone || "professional",
        platformGuidelines: config.format,
      },
    });
  },
  {
    name: "create_social_post",
    description:
      "Create an optimized social media post for a specific platform (Twitter, LinkedIn, Instagram, Facebook, Threads). Handles character limits, hashtag formatting, and platform-specific best practices.",
    schema: z.object({
      platform: z
        .string()
        .describe("Target platform: twitter, linkedin, instagram, facebook, or threads"),
      content: z.string().describe("The main post content"),
      hashtags: z
        .array(z.string())
        .optional()
        .describe("Relevant hashtags (without # prefix — it will be added)"),
      callToAction: z
        .string()
        .optional()
        .describe("Optional call-to-action text (e.g., 'Link in bio', 'What do you think?')"),
      tone: z
        .string()
        .optional()
        .describe("Tone: professional, casual, inspirational, humorous, educational"),
    }),
  }
);

/**
 * Create a content calendar / multi-post plan
 */
export const contentPlanTool = tool(
  async ({
    topic,
    platforms,
    postsPerWeek,
    weeks,
  }: {
    topic: string;
    platforms: string[];
    postsPerWeek: number;
    weeks: number;
  }) => {
    const totalPosts = postsPerWeek * weeks;
    const plan: {
      week: number;
      day: string;
      platform: string;
      contentType: string;
      topic: string;
    }[] = [];

    const contentTypes = [
      "Thought leadership",
      "How-to / Tutorial",
      "Industry news commentary",
      "Behind-the-scenes",
      "User story / Case study",
      "Poll / Question",
      "Tip / Quick win",
      "Carousel / Thread",
    ];

    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

    for (let week = 1; week <= weeks; week++) {
      for (let post = 0; post < postsPerWeek; post++) {
        plan.push({
          week,
          day: days[post % days.length],
          platform: platforms[post % platforms.length],
          contentType: contentTypes[(week * postsPerWeek + post) % contentTypes.length],
          topic: `${topic} — ${contentTypes[(week * postsPerWeek + post) % contentTypes.length]}`,
        });
      }
    }

    return JSON.stringify({
      success: true,
      plan,
      summary: {
        totalPosts,
        weeks,
        postsPerWeek,
        platforms,
        topic,
      },
    });
  },
  {
    name: "create_content_plan",
    description:
      "Create a social media content calendar / publishing plan. Generates a week-by-week schedule of posts across platforms with content types and themes.",
    schema: z.object({
      topic: z.string().describe("The main topic or theme for the content plan"),
      platforms: z
        .array(z.string())
        .describe("Target platforms (e.g., ['twitter', 'linkedin'])"),
      postsPerWeek: z.number().describe("Number of posts per week"),
      weeks: z.number().describe("Number of weeks to plan"),
    }),
  }
);

export const socialTools = [createPostTool, contentPlanTool];
