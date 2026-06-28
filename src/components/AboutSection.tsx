"use client";

import { motion } from "framer-motion";
import {
  Brain,
  FileText,
  Network,
  Sparkles,
  Layers,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const features = [
  {
    icon: FileText,
    title: "Markdown Native",
    description:
      "Every note is written in clean, portable Markdown — the language of developers.",
  },
  {
    icon: Network,
    title: "Knowledge Graph",
    description:
      "Ideas are interconnected. Discover relationships between concepts you never noticed.",
  },
  {
    icon: Brain,
    title: "Obsidian Compatible",
    description:
      "Built on the same principles as Obsidian — your second brain, available anywhere.",
  },
  {
    icon: Layers,
    title: "Structured Categories",
    description:
      "Organized into clear categories and tags so nothing gets lost in the noise.",
  },
  {
    icon: Sparkles,
    title: "Premium Reading",
    description:
      "A beautiful, distraction-free reading experience optimized for deep understanding.",
  },
  {
    icon: Zap,
    title: "Instant Search",
    description:
      "Find any article in milliseconds with full-text search across your entire repository.",
  },
];

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08 },
  },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

export function AboutSection() {
  return (
    <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="text-center mb-16"
      >
        <span className="text-overline">About</span>
        <h2 className="text-h1 text-[var(--text-primary)] mt-3">
          About Second Brain
        </h2>
        <p className="mt-4 text-[var(--text-secondary)] text-lg max-w-2xl mx-auto leading-relaxed">
          Second Brain is a personal knowledge repository designed for developers,
          thinkers, and lifelong learners. It transforms scattered notes into a
          structured, searchable knowledge base.
        </p>
      </motion.div>

      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-50px" }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {features.map((feature) => (
          <motion.div
            key={feature.title}
            variants={item}
            className={cn(
              "group relative rounded-xl p-6 border transition-all duration-300",
              "bg-[var(--bg-surface-3)] border-[var(--border-subtle)]",
              "hover:border-[rgba(226,179,64,0.2)] hover:bg-[var(--bg-surface-4)] hover:-translate-y-1",
              "hover:shadow-[0_8px_24px_rgba(0,0,0,0.3)]"
            )}
          >
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent-gold-muted)] text-[var(--accent-gold)] group-hover:bg-[rgba(226,179,64,0.25)] transition-colors duration-300">
              <feature.icon className="h-5 w-5" />
            </div>
            <h3 className="text-base font-semibold text-[var(--text-primary)] mb-2">
              {feature.title}
            </h3>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              {feature.description}
            </p>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}