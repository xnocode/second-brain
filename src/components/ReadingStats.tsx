"use client";

import { useState, useEffect, useRef } from "react";
import { Flame, BookOpen } from "lucide-react";
import {
  getReadingStreak,
  getTotalRead,
} from "@/lib/reading-history";

interface ReadingStatsProps {
  validSlugs?: string[];
}

export function ReadingStats({ validSlugs }: ReadingStatsProps) {
  const [streak, setStreak] = useState(0);
  const [total, setTotal] = useState(0);
  const initialized = useRef(false);

  useEffect(() => {
    const compute = () => {
      const s = getReadingStreak();
      const t = getTotalRead(validSlugs);
      return { s, t };
    };
    if (!initialized.current) {
      initialized.current = true;
      const { s, t } = compute();
      requestAnimationFrame(() => {
        setStreak(s);
        setTotal(t);
      });
    }
    const handler = () => {
      const { s, t } = compute();
      requestAnimationFrame(() => {
        setStreak(s);
        setTotal(t);
      });
    };
    window.addEventListener("reading-history-changed", handler);
    return () => window.removeEventListener("reading-history-changed", handler);
  }, [validSlugs]);

  if (streak === 0 && total === 0) return null;

  return (
    <div className="inline-flex items-center gap-3 rounded-lg bg-[rgba(226,179,64,0.06)] border border-[rgba(226,179,64,0.12)] backdrop-blur-md px-4 py-2">
      {streak > 0 && (
        <span className="inline-flex items-center gap-1.5 text-sm text-[var(--accent-gold)]">
          <Flame className="h-3.5 w-3.5" />
          <span className="font-semibold">{streak}</span>
          <span className="text-[var(--text-muted)] text-xs">day streak</span>
        </span>
      )}
      {streak > 0 && total > 0 && (
        <span className="text-[var(--border-subtle)]">·</span>
      )}
      {total > 0 && (
        <span className="inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)]">
          <BookOpen className="h-3.5 w-3.5 text-[var(--accent-gold)]" />
          <span className="font-semibold text-[var(--text-primary)]">{total}</span>
          <span className="text-[var(--text-muted)] text-xs">articles read</span>
        </span>
      )}
    </div>
  );
}