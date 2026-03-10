"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

// Animated wireframe/mesh SVG — abstract neural network visualization
function HeroArt() {
  const nodes = [
    { cx: 200, cy: 120, r: 4 },
    { cx: 320, cy: 80, r: 3 },
    { cx: 380, cy: 180, r: 5 },
    { cx: 260, cy: 220, r: 3.5 },
    { cx: 150, cy: 250, r: 4 },
    { cx: 340, cy: 300, r: 3 },
    { cx: 420, cy: 120, r: 3.5 },
    { cx: 180, cy: 180, r: 3 },
    { cx: 300, cy: 160, r: 6 },
    { cx: 240, cy: 320, r: 4 },
    { cx: 400, cy: 260, r: 3.5 },
    { cx: 120, cy: 340, r: 3 },
    { cx: 460, cy: 200, r: 4 },
    { cx: 280, cy: 60, r: 3 },
    { cx: 360, cy: 350, r: 3.5 },
  ];

  const edges: [number, number][] = [
    [0, 1], [0, 7], [0, 8], [1, 8], [1, 6], [1, 13],
    [2, 6], [2, 8], [2, 10], [2, 12], [3, 4], [3, 8],
    [3, 9], [4, 7], [4, 11], [5, 9], [5, 10], [5, 14],
    [6, 12], [6, 13], [7, 0], [8, 3], [9, 11], [10, 14],
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1.2, ease: "easeOut" as const, delay: 0.3 }}
      className="relative w-full h-full flex items-center justify-center"
    >
      <div className="absolute inset-0 hero-blob" />

      <svg
        viewBox="0 0 560 420"
        className="w-full h-auto max-w-[560px]"
        fill="none"
      >
        {/* Edges */}
        {edges.map(([from, to], i) => (
          <motion.line
            key={`edge-${i}`}
            x1={nodes[from].cx}
            y1={nodes[from].cy}
            x2={nodes[to].cx}
            y2={nodes[to].cy}
            stroke="currentColor"
            className="text-foreground/10"
            strokeWidth={0.8}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{
              duration: 1.5,
              delay: 0.6 + i * 0.05,
              ease: "easeOut" as const,
            }}
          />
        ))}

        {/* Nodes */}
        {nodes.map((node, i) => (
          <motion.circle
            key={`node-${i}`}
            cx={node.cx}
            cy={node.cy}
            r={node.r}
            className="fill-primary/60"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              duration: 0.5,
              delay: 0.8 + i * 0.06,
              ease: "easeOut" as const,
            }}
          />
        ))}

        {/* Central glowing node */}
        <motion.circle
          cx={300}
          cy={160}
          r={12}
          className="fill-primary/20"
          initial={{ scale: 0 }}
          animate={{ scale: [1, 1.4, 1] }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut" as const,
            delay: 1.5,
          }}
        />
        <motion.circle
          cx={300}
          cy={160}
          r={8}
          className="fill-primary/40"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.2 }}
        />

        {/* Data pulses traveling along edges */}
        {[0, 4, 8, 12, 18].map((edgeIdx, i) => {
          const [from, to] = edges[edgeIdx];
          return (
            <motion.circle
              key={`pulse-${i}`}
              r={2}
              className="fill-primary"
              initial={{ opacity: 0 }}
              animate={{
                cx: [nodes[from].cx, nodes[to].cx],
                cy: [nodes[from].cy, nodes[to].cy],
                opacity: [0, 1, 1, 0],
              }}
              transition={{
                duration: 2.5,
                delay: 2 + i * 0.8,
                repeat: Infinity,
                repeatDelay: 3,
                ease: "easeInOut" as const,
              }}
            />
          );
        })}
      </svg>
    </motion.div>
  );
}

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-16">
      {/* Subtle gradient bg */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[60%] h-[80%] hero-blob opacity-60" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-20 lg:py-0">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          {/* Left copy */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: "easeOut" as const }}
            >
              <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight leading-[1.08]">
                Where Prompts
                <br />
                <span className="text-gradient">Become Teams</span>
              </h1>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15, ease: "easeOut" as const }}
              className="mt-6 text-base sm:text-lg text-muted-foreground max-w-lg leading-relaxed"
            >
              A unified platform for orchestrating AI agents that handle your
              emails, research, scheduling, and content — all from a single prompt.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3, ease: "easeOut" as const }}
              className="mt-8 flex flex-col sm:flex-row gap-3"
            >
              <Link href="/auth/signup">
                <Button
                  size="lg"
                  className="bg-foreground text-background hover:bg-foreground/90 font-medium px-6 h-11 text-sm rounded-lg"
                >
                  Get Started
                </Button>
              </Link>
              <a href="#how-it-works">
                <Button
                  variant="outline"
                  size="lg"
                  className="h-11 text-sm rounded-lg px-6 font-medium"
                >
                  See How It Works
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </a>
            </motion.div>
          </div>

          {/* Right abstract art */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="hidden lg:block h-[480px]"
          >
            <HeroArt />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
