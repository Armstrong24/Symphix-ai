"use client";

// ============================================
// Dashboard Shell — Premium sidebar + top bar
// Persistent navigation, mobile sheet, theme toggle
// ============================================

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  Zap,
  LayoutDashboard,
  Plus,
  History,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/workflow/new", label: "New Workflow", icon: Plus },
  { href: "/dashboard/history", label: "History", icon: History },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

const sidebarVariants = {
  hidden: { x: -20, opacity: 0 },
  visible: { x: 0, opacity: 1, transition: { duration: 0.4, ease: "easeOut" as const } },
};

const contentVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, delay: 0.1 } },
};

export function DashboardShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: User;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const userInitial = user.email?.charAt(0).toUpperCase() || "U";
  const userName = user.user_metadata?.full_name || user.email?.split("@")[0] || "User";

  // Shared nav link renderer
  const NavLink = ({ item, onClick }: { item: typeof navItems[0]; onClick?: () => void }) => {
    const isActive = pathname === item.href;
    return (
      <Link href={item.href} onClick={onClick}>
        <motion.div
          whileHover={{ x: 4 }}
          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200 ${
            isActive
              ? "bg-primary/10 text-primary font-medium"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          <item.icon className="h-4 w-4" />
          {item.label}
          {isActive && (
            <motion.div
              layoutId="activeNav"
              className="ml-auto h-1.5 w-1.5 rounded-full bg-primary"
            />
          )}
        </motion.div>
      </Link>
    );
  };

  return (
    <div className="flex min-h-screen">
      {/* Desktop Sidebar */}
      <motion.aside
        variants={sidebarVariants}
        initial="hidden"
        animate="visible"
        className="hidden md:flex w-64 flex-col glass-strong border-r border-border fixed inset-y-0 left-0 z-30"
      >
        {/* Logo */}
        <div className="flex items-center gap-2 p-6 border-b border-border">
          <Link href="/dashboard" className="flex items-center gap-2 group">
            <motion.div
              whileHover={{ rotate: 15, scale: 1.1 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Zap className="h-6 w-6 text-primary" />
            </motion.div>
            <span className="text-lg font-bold text-gradient">Symphix</span>
          </Link>
        </div>

        {/* Nav links */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </nav>

        {/* User section at bottom */}
        <div className="p-4 border-t border-border space-y-3">
          {/* Theme toggle row */}
          <div className="flex items-center justify-between px-1">
            <span className="text-xs text-muted-foreground">Theme</span>
            <ThemeToggle />
          </div>

          {/* User info */}
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0">
              {userInitial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{userName}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>

          {/* Sign out */}
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-muted-foreground hover:text-destructive"
            onClick={handleSignOut}
            disabled={signingOut}
          >
            <LogOut className="mr-2 h-4 w-4" />
            {signingOut ? "Signing out..." : "Sign Out"}
          </Button>
        </div>
      </motion.aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 glass-strong border-b border-border px-4 h-14 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          <span className="font-bold text-gradient">Symphix</span>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="h-9 w-9 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile nav overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            />
            {/* Slide-in panel */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="md:hidden fixed inset-y-0 left-0 z-50 w-72 glass-strong border-r border-border p-6 space-y-6"
            >
              <div className="flex items-center justify-between">
                <Link href="/dashboard" className="flex items-center gap-2" onClick={() => setMobileOpen(false)}>
                  <Zap className="h-6 w-6 text-primary" />
                  <span className="text-lg font-bold text-gradient">Symphix</span>
                </Link>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav className="space-y-1">
                {navItems.map((item) => (
                  <NavLink key={item.href} item={item} onClick={() => setMobileOpen(false)} />
                ))}
              </nav>

              <div className="border-t border-border pt-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                    {userInitial}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{userName}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-muted-foreground hover:text-destructive"
                  onClick={handleSignOut}
                  disabled={signingOut}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  {signingOut ? "Signing out..." : "Sign Out"}
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main content area */}
      <main className="flex-1 md:ml-64 mt-14 md:mt-0">
        <motion.div
          variants={contentVariants}
          initial="hidden"
          animate="visible"
          className="p-4 sm:p-6 lg:p-8"
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
