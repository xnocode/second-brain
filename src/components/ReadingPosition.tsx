"use client";

import { useState, useEffect, useRef } from "react";
import { Clock } from "lucide-react";

interface ReadingPositionProps {
  totalHeadings: number;
  activeHeadingIndex: number;
}

export function ReadingPosition({ totalHeadings, activeHeadingIndex }: ReadingPositionProps) {
  const [scrollPercent, setScrollPercent] = useState(0);
  const scrollRef = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const el = document.getElementById("post-content");
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const totalHeight = el.scrollHeight - rect.height;
      if (totalHeight <= 0) return;
      const scrolled = -rect.top;
      const percent = Math.min(Math.max(scrolled / totalHeight, 0), 1);
      if (Math.abs(percent - scrollRef.current) > 0.02) {
        scrollRef.current = percent;
        requestAnimationFrame(() => setScrollPercent(percent));
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Estimate minutes remaining (based on scroll percent)
  const minutesTotal = 5; // Approximate, could be passed as prop
  const minutesLeft = Math.max(1, Math.ceil((1 - scrollPercent) * minutesTotal));
  const sectionNum = activeHeadingIndex + 1;

  if (totalHeadings === 0) return null;

  return (
    <div className="inline-flex items-center gap-3 rounded-lg bg-[var(--bg-surface-3)]/60 backdrop-blur-sm border border-[var(--border-subtle)] px-3 py-1.5 text-xs text-[var(--text-muted)]">
      {scrollPercent > 0.05 && (
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {minutesLeft} min left
        </span>
      )}
      {scrollPercent > 0.05 && <span className="text-[var(--border-subtle)]">·</span>}
      <span>
        Section {sectionNum} of {totalHeadings}
      </span>
      <span className="text-[var(--border-subtle)]">·</span>
      <span>{Math.round(scrollPercent * 100)}%</span>
    </div>
  );
}