// ============================================
// Email Tool — Resend API Integration
// Real email sending with drafting capability
// Free tier: 100 emails/day, 3000/month
// ============================================

import { Resend } from "resend";
import { tool } from "@langchain/core/tools";
import { z } from "zod";

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || apiKey === "re_placeholder") {
    return null;
  }
  return new Resend(apiKey);
}

/**
 * Send an email via Resend
 */
export const sendEmailTool = tool(
  async ({
    to,
    subject,
    body,
    replyTo,
  }: {
    to: string;
    subject: string;
    body: string;
    replyTo?: string;
  }) => {
    const resend = getResendClient();

    if (!resend) {
      // Return a draft instead of failing — useful even without API key
      return JSON.stringify({
        success: false,
        mode: "draft",
        message: "Resend API key not configured. Here is your email draft:",
        draft: {
          to,
          subject,
          body,
          replyTo: replyTo || null,
        },
      });
    }

    try {
      // Resend free tier uses onboarding@resend.dev as sender
      // Users can verify their own domain for custom from address
      const fromAddress = process.env.RESEND_FROM_EMAIL || "Symphix <onboarding@resend.dev>";

      const { data, error } = await resend.emails.send({
        from: fromAddress,
        to: [to],
        subject,
        html: body.replace(/\n/g, "<br>"),
        ...(replyTo ? { replyTo } : {}),
      });

      if (error) {
        return JSON.stringify({
          success: false,
          mode: "error",
          error: error.message,
          draft: { to, subject, body },
        });
      }

      return JSON.stringify({
        success: true,
        mode: "sent",
        messageId: data?.id,
        to,
        subject,
      });
    } catch (error: any) {
      return JSON.stringify({
        success: false,
        mode: "error",
        error: error.message || "Failed to send email",
        draft: { to, subject, body },
      });
    }
  },
  {
    name: "send_email",
    description:
      "Send an email to a recipient. Composes and sends a professional email. If the email service is not configured, returns a polished draft ready to copy-paste.",
    schema: z.object({
      to: z.string().email().describe("Recipient email address"),
      subject: z.string().describe("Email subject line"),
      body: z.string().describe("Email body content (plain text, newlines preserved)"),
      replyTo: z.string().email().optional().describe("Reply-to email address (optional)"),
    }),
  }
);

/**
 * Draft an email (no sending — just structured output)
 */
export const draftEmailTool = tool(
  async ({
    to,
    subject,
    body,
    tone,
  }: {
    to: string;
    subject: string;
    body: string;
    tone?: string;
  }) => {
    return JSON.stringify({
      success: true,
      mode: "draft",
      draft: {
        to,
        subject,
        body,
        tone: tone || "professional",
      },
    });
  },
  {
    name: "draft_email",
    description:
      "Create an email draft without sending it. Use this when the user wants to review the email before sending, or when composing a reply or follow-up.",
    schema: z.object({
      to: z.string().describe("Recipient email address or name"),
      subject: z.string().describe("Email subject line"),
      body: z.string().describe("Full email body content"),
      tone: z
        .string()
        .optional()
        .describe("Tone of the email: professional, friendly, formal, casual"),
    }),
  }
);

export const emailTools = [sendEmailTool, draftEmailTool];
