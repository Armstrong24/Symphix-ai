// ============================================
// Root Layout — The stage for our AI symphony
// ============================================

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
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
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-background font-sans antialiased`}
      >
        <TooltipProvider>
          {children}
        </TooltipProvider>
        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{
            style: {
              background: "rgba(15, 23, 42, 0.9)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              color: "#f1f5f9",
              backdropFilter: "blur(16px)",
            },
          }}
        />
      </body>
    </html>
  );
}
