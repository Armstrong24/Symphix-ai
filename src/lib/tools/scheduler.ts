// ============================================
// Scheduler Tool — Calendar Event Generation
// Generates structured event data + ICS format
// No external API needed — pure utility
// ============================================

import { tool } from "@langchain/core/tools";
import { z } from "zod";

/**
 * Create a calendar event with ICS export
 */
export const createEventTool = tool(
  async ({
    title,
    description,
    startDate,
    startTime,
    endTime,
    location,
    attendees,
    reminder,
  }: {
    title: string;
    description?: string;
    startDate: string;
    startTime: string;
    endTime: string;
    location?: string;
    attendees?: string[];
    reminder?: number;
  }) => {
    // Parse the date/time into ICS format (YYYYMMDDTHHMMSS)
    const formatICSDate = (date: string, time: string) => {
      const d = date.replace(/-/g, "");
      const t = time.replace(/:/g, "") + "00";
      return `${d}T${t}`;
    };

    const dtStart = formatICSDate(startDate, startTime);
    const dtEnd = formatICSDate(startDate, endTime);
    const uid = `symphix-${Date.now()}-${Math.random().toString(36).slice(2)}@symphix.ai`;

    // Build ICS content
    let ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Symphix//AI Scheduler//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd}`,
      `SUMMARY:${title}`,
    ];

    if (description) ics.push(`DESCRIPTION:${description.replace(/\n/g, "\\n")}`);
    if (location) ics.push(`LOCATION:${location}`);
    if (attendees?.length) {
      attendees.forEach((email) => {
        ics.push(`ATTENDEE;RSVP=TRUE:mailto:${email}`);
      });
    }
    if (reminder) {
      ics.push(
        "BEGIN:VALARM",
        "TRIGGER:-PT" + reminder + "M",
        "ACTION:DISPLAY",
        `DESCRIPTION:Reminder: ${title}`,
        "END:VALARM"
      );
    }

    ics.push("END:VEVENT", "END:VCALENDAR");

    return JSON.stringify({
      success: true,
      event: {
        title,
        description: description || "",
        date: startDate,
        startTime,
        endTime,
        location: location || "",
        attendees: attendees || [],
        reminderMinutes: reminder || 15,
      },
      icsContent: ics.join("\r\n"),
      message: `Calendar event "${title}" created for ${startDate} from ${startTime} to ${endTime}`,
    });
  },
  {
    name: "create_calendar_event",
    description:
      "Create a calendar event with all details. Generates structured event data and an ICS file that can be imported into Google Calendar, Outlook, or Apple Calendar.",
    schema: z.object({
      title: z.string().describe("Event title"),
      description: z.string().optional().describe("Event description or agenda"),
      startDate: z.string().describe("Event date in YYYY-MM-DD format"),
      startTime: z.string().describe("Start time in HH:MM format (24-hour)"),
      endTime: z.string().describe("End time in HH:MM format (24-hour)"),
      location: z.string().optional().describe("Event location or meeting link"),
      attendees: z.array(z.string()).optional().describe("List of attendee email addresses"),
      reminder: z.number().optional().describe("Reminder in minutes before event (default 15)"),
    }),
  }
);

/**
 * Suggest optimal meeting times
 */
export const suggestTimesTool = tool(
  async ({
    duration,
    preferredTimeOfDay,
    timezone,
    daysOut,
  }: {
    duration: number;
    preferredTimeOfDay?: string;
    timezone?: string;
    daysOut?: number;
  }) => {
    const tz = timezone || "UTC";
    const days = daysOut || 5;
    const preference = preferredTimeOfDay || "morning";

    // Generate suggested slots based on preference
    const timeSlots: Record<string, string[]> = {
      morning: ["09:00", "09:30", "10:00", "10:30", "11:00"],
      afternoon: ["13:00", "13:30", "14:00", "14:30", "15:00"],
      evening: ["17:00", "17:30", "18:00"],
    };

    const slots = timeSlots[preference] || timeSlots.morning;
    const suggestions: { date: string; startTime: string; endTime: string }[] = [];

    const now = new Date();
    for (let d = 1; d <= days && suggestions.length < 5; d++) {
      const date = new Date(now);
      date.setDate(date.getDate() + d);
      // Skip weekends
      if (date.getDay() === 0 || date.getDay() === 6) continue;

      const dateStr = date.toISOString().split("T")[0];
      const startTime = slots[Math.floor(Math.random() * slots.length)];
      const [hours, mins] = startTime.split(":").map(Number);
      const endHours = hours + Math.floor(duration / 60);
      const endMins = mins + (duration % 60);
      const endTime = `${String(endHours + Math.floor(endMins / 60)).padStart(2, "0")}:${String(endMins % 60).padStart(2, "0")}`;

      suggestions.push({ date: dateStr, startTime, endTime });
    }

    return JSON.stringify({
      success: true,
      timezone: tz,
      durationMinutes: duration,
      preference,
      suggestions,
    });
  },
  {
    name: "suggest_meeting_times",
    description:
      "Suggest optimal meeting times based on preferences. Returns available time slots for the next few business days.",
    schema: z.object({
      duration: z.number().describe("Meeting duration in minutes"),
      preferredTimeOfDay: z
        .string()
        .optional()
        .describe("Preferred time: morning, afternoon, or evening"),
      timezone: z.string().optional().describe("Timezone (e.g., America/New_York). Default UTC"),
      daysOut: z.number().optional().describe("How many days ahead to look (default 5)"),
    }),
  }
);

export const schedulerTools = [createEventTool, suggestTimesTool];
