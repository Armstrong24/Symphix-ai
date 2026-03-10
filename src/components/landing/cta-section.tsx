"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function CtaSection() {
  return (
    <section className="relative py-28 px-4">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: "easeOut" as const }}
          className="landing-card p-10 sm:p-16 text-center relative overflow-hidden"
        >
          {/* Background gradient accent */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] rounded-full bg-primary/5 blur-[80px]" />
          </div>

          <div className="relative z-10">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
              Stop Managing Tasks.
              <br />
              <span className="text-gradient">Start Orchestrating Them.</span>
            </h2>
            <p className="mt-5 text-muted-foreground max-w-xl mx-auto text-base sm:text-lg leading-relaxed">
              One prompt. Six agents. Real tool execution.
              Join the next generation of workflow automation.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/auth/signup">
                <Button
                  size="lg"
                  className="bg-foreground text-background hover:bg-foreground/90 font-medium px-8 h-12 text-sm rounded-lg"
                >
                  Get Started — Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/auth/login">
                <Button
                  variant="outline"
                  size="lg"
                  className="h-12 text-sm rounded-lg px-6 font-medium"
                >
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
