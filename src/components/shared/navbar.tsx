"use client";

// ============================================
// Navbar — Symphix top navigation
// Glassmorphism + animated logo
// ============================================

import Link from "next/link";
import { motion } from "framer-motion";
import { Zap, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export function Navbar({ isLoggedIn = false }: { isLoggedIn?: boolean }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 glass-strong"
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <motion.div
            whileHover={{ rotate: 15, scale: 1.1 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Zap className="h-7 w-7 text-neon-cyan" />
          </motion.div>
          <span className="text-xl font-bold text-gradient">Symphix</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6">
          {isLoggedIn ? (
            <>
              <Link
                href="/dashboard"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/dashboard/history"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                History
              </Link>
              <form action="/auth/signout" method="post">
                <Button variant="ghost" size="sm">
                  Sign Out
                </Button>
              </form>
            </>
          ) : (
            <>
              <Link href="/auth/login">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link href="/auth/signup">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    size="sm"
                    className="bg-neon-cyan text-black font-semibold hover:bg-neon-cyan/80 glow-cyan"
                  >
                    Get Started
                  </Button>
                </motion.div>
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-foreground"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="md:hidden glass-strong border-t border-white/5 px-4 py-4 space-y-3"
        >
          {isLoggedIn ? (
            <>
              <Link href="/dashboard" className="block text-sm text-muted-foreground hover:text-foreground">
                Dashboard
              </Link>
              <Link href="/dashboard/history" className="block text-sm text-muted-foreground hover:text-foreground">
                History
              </Link>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="block text-sm text-muted-foreground hover:text-foreground">
                Sign In
              </Link>
              <Link href="/auth/signup" className="block text-sm font-semibold text-neon-cyan">
                Get Started
              </Link>
            </>
          )}
        </motion.div>
      )}
    </motion.nav>
  );
}
