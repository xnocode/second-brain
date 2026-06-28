"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ChevronDown, BookOpen, FolderOpen, Tag, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface HeroProps {
  postCount: number;
  categoryCount: number;
  tagCount: number;
  readingStreak: number;
  totalRead: number;
  onNavigate: (page: string) => void;
}

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.12, delayChildren: 0.2 },
  },
};

const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } },
};

export function Hero({ postCount, categoryCount, tagCount, readingStreak, totalRead, onNavigate }: HeroProps) {
  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4">
      {/* Animated gradient orbs */}
      <div className="pointer-events-none absolute inset-0">
        {/* Orb 1 — gold */}
        <div
          className={cn(
            "absolute top-1/4 left-1/4 h-[500px] w-[500px] rounded-full opacity-[0.07]",
            "bg-[radial-gradient(circle,rgba(226,179,64,0.6)_0%,transparent_70%)]",
            "animate-gradient-orb",
            "blur-3xl"
          )}
          style={{ animationDuration: "25s" }}
        />
        {/* Orb 2 — blue accent */}
        <div
          className={cn(
            "absolute bottom-1/3 right-1/4 h-[400px] w-[400px] rounded-full opacity-[0.04]",
            "bg-[radial-gradient(circle,rgba(96,165,250,0.5)_0%,transparent_70%)]",
            "animate-gradient-orb",
            "blur-3xl"
          )}
          style={{ animationDuration: "30s", animationDelay: "-10s" }}
        />
        {/* Orb 3 — subtle warm */}
        <div
          className={cn(
            "absolute top-1/2 left-1/2 h-[350px] w-[350px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.05]",
            "bg-[radial-gradient(circle,rgba(226,179,64,0.4)_0%,transparent_70%)]",
            "animate-gradient-orb",
            "blur-3xl"
          )}
          style={{ animationDuration: "20s", animationDelay: "-5s" }}
        />
      </div>

      {/* Grid overlay for texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />

      {/* Content */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="relative z-10 flex flex-col items-center text-center"
      >
        {/* Overline */}
        <motion.div variants={item} className="mb-6">
          <span className="text-overline">Knowledge Repository</span>
        </motion.div>

        {/* Title */}
        <motion.h1 variants={item} className="text-hero gradient-text-gold max-w-4xl">
          Second Brain
        </motion.h1>

        {/* Subtitle with cursor blink */}
        <motion.p
          variants={item}
          className="mt-6 max-w-xl text-lg text-[var(--text-secondary)] sm:text-xl leading-relaxed hero-subtitle-shadow"
        >
          Where ideas crystallize into knowledge
          <span className="inline-block w-0.5 h-[1.1em] bg-[var(--accent-gold)] ml-1 align-middle animate-hero-cursor-blink" />
        </motion.p>

        {/* CTA */}
        <motion.div variants={item} className="mt-10">
          <div className="relative group">
            {/* Animated glow ring on hover */}
            <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-[var(--accent-gold)] via-[rgba(226,179,64,0.4)] to-[var(--accent-gold)] opacity-0 group-hover:opacity-100 blur-md transition-opacity duration-500 -z-10" />
            <Button
              onClick={() => onNavigate("blog")}
              size="lg"
              className="relative h-12 px-8 bg-[var(--accent-gold)] text-[#050505] font-semibold rounded-lg hover:bg-[var(--accent-gold-hover)] shadow-lg shadow-[rgba(226,179,64,0.15)] hover:shadow-[rgba(226,179,64,0.3)] transition-all duration-300 hover:scale-[1.02]"
            >
              <BookOpen className="h-4 w-4 mr-2" />
              Start Reading
            </Button>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          variants={item}
          className="mt-16 flex flex-wrap items-center justify-center gap-8 sm:gap-12"
        >
          <Stat icon={<BookOpen className="h-4 w-4" />} value={postCount} label="Articles" />
          <div className="hidden sm:block h-6 w-px bg-[var(--border-subtle)]" />
          <Stat icon={<FolderOpen className="h-4 w-4" />} value={categoryCount} label="Categories" />
          <div className="hidden sm:block h-6 w-px bg-[var(--border-subtle)]" />
          <Stat icon={<Tag className="h-4 w-4" />} value={tagCount} label="Tags" />
          {readingStreak > 0 && (
            <>
              <div className="hidden sm:block h-6 w-px bg-[var(--border-subtle)]" />
              <Stat icon={<Flame className="h-4 w-4" />} value={readingStreak} label="Day Streak" isReadingStat />
            </>
          )}
          {totalRead > 0 && (
            <>
              <div className="hidden sm:block h-6 w-px bg-[var(--border-subtle)]" />
              <Stat icon={<BookOpen className="h-4 w-4" />} value={totalRead} label="Articles Read" isReadingStat />
            </>
          )}
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.8 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <span className="text-xs text-[var(--text-muted)] tracking-wider uppercase">
          Scroll
        </span>
        <ChevronDown className="h-5 w-5 text-[var(--text-muted)] animate-bounce-down" />
      </motion.div>
    </section>
  );
}

function Stat({
  icon,
  value,
  label,
  isReadingStat,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  isReadingStat?: boolean;
}) {
  const animatedRef = useRef(false);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (animatedRef.current) return;
    animatedRef.current = true;

    const duration = 1500; // 1.5 seconds
    const start = performance.now();
    const target = value;

    function easeOutExpo(t: number): number {
      return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
    }

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutExpo(progress);
      const current = Math.round(easedProgress * target);

      // Update DOM directly for performance
      const el = document.getElementById(`stat-value-${label}`);
      if (el) {
        el.textContent = String(current);
      }

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    }

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value, label]);

  return (
    <div className={cn("flex items-center gap-2.5", isReadingStat && "hero-reading-stat")}>
      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[var(--accent-gold-muted)] text-[var(--accent-gold)]">
        {icon}
      </div>
      <div className="flex flex-col items-start">
        <span
          id={`stat-value-${label}`}
          className="text-lg font-bold text-[var(--text-primary)] leading-none"
        >
          0
        </span>
        <span className="text-xs text-[var(--text-muted)] mt-0.5">{label}</span>
      </div>
    </div>
  );
}