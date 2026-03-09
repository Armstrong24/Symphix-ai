// ============================================
// Root Layout — The stage for our AI symphony
// Wraps everything with theme provider + toasts
// ============================================

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/shared/theme-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Symphix — One Prompt. Your AI Agents in Perfect Harmony.",
  description:
    "Turn one prompt into a team of specialized AI agents that automate your entire workflow. Emails, research, scheduling, social posting — orchestrated in perfect harmony.",
  keywords: ["AI agents", "workflow automation", "AI orchestra", "productivity"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-background font-sans antialiased`}
      >
        <ThemeProvider>
          <TooltipProvider>
            {children}
          </TooltipProvider>
          <Toaster
            position="bottom-right"
            toastOptions={{
              className: "glass-strong",
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
