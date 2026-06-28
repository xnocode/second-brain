"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface TagCloudProps {
  tags: { tag: string; count: number }[];
  activeTag?: string | null;
  onTagClick?: (tag: string) => void;
}

export function TagCloud({ tags, activeTag, onTagClick }: TagCloudProps) {
  if (tags.length === 0) return null;

  const maxCount = Math.max(...tags.map((t) => t.count), 1);
  const minCount = Math.min(...tags.map((t) => t.count), 1);

  const getFontWeight = (count: number): string => {
    if (maxCount === minCount) return "font-medium";
    const ratio = (count - minCount) / (maxCount - minCount);
    return ratio > 0.6 ? "font-semibold" : ratio > 0.3 ? "font-medium" : "font-normal";
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {tags.map((item, index) => (
        <motion.button
          key={item.tag}
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            delay: index * 0.04,
            duration: 0.35,
            ease: [0.22, 1, 0.36, 1],
          }}
          onClick={() => onTagClick?.(item.tag)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border min-h-[32px] px-3 py-1",
            "border-[var(--border-subtle)] bg-[var(--bg-surface-3)]",
            "text-xs text-[var(--text-primary)] opacity-80 cursor-pointer select-none",
            "hover:border-[rgba(226,179,64,0.3)] hover:text-[var(--accent-gold)]",
            "hover:bg-[var(--accent-gold-muted)]",
            "hover:shadow-[0_0_12px_rgba(226,179,64,0.1)]",
            "active:scale-95",
            "transition-all duration-200",
            getFontWeight(item.count),
            activeTag === item.tag && "border-[rgba(226,179,64,0.4)] text-[var(--accent-gold)] bg-[var(--accent-gold-muted)] shadow-[0_0_12px_rgba(226,179,64,0.15)] opacity-100"
          )}
        >
          <span className="font-medium">{item.tag}</span>
          <span className="text-[0.7em] text-[var(--accent-gold)]/80">{item.count}</span>
        </motion.button>
      ))}
    </div>
  );
}