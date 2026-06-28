"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Clock, Calendar, CheckCircle2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { BookmarkButton } from "@/components/BookmarkButton";
import { isRead } from "@/lib/reading-history";
import type { BlogPost } from "@/components/PostCard";

interface PostListItemProps {
  post: BlogPost;
  onClick: (slug: string) => void;
  index: number;
}

export function PostListItem({ post, onClick, index }: PostListItemProps) {
  const [read, setRead] = useState(false);
  const isReadRef = useRef(false);

  useEffect(() => {
    const val = isRead(post.slug);
    if (isReadRef.current !== val) {
      isReadRef.current = val;
      requestAnimationFrame(() => setRead(val));
    }
    const handler = () => {
      const v = isRead(post.slug);
      if (isReadRef.current !== v) {
        isReadRef.current = v;
        requestAnimationFrame(() => setRead(v));
      }
    };
    window.addEventListener("reading-history-changed", handler);
    return () => window.removeEventListener("reading-history-changed", handler);
  }, [post.slug]);

  return (
    <motion.article
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1], delay: index * 0.04 }}
      onClick={() => onClick(post.slug)}
      className={cn(
        "group relative flex items-center gap-4 sm:gap-6 cursor-pointer rounded-xl p-3 sm:p-4 -mx-3 sm:-mx-4",
        "transition-all duration-300",
        "hover:bg-[var(--bg-surface-3)]"
      )}
    >
      {/* Left: Index number */}
      <div className="shrink-0 hidden sm:flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--bg-surface-4)] text-[var(--text-muted)] text-xs font-mono font-medium">
        {String(index + 1).padStart(2, "0")}
      </div>

      {/* Thumbnail - small square */}
      <div className="shrink-0 h-12 w-12 sm:h-14 sm:w-14 rounded-lg overflow-hidden bg-[var(--bg-surface-4)]">
        {post.cover ? (
          <img
            src={post.cover}
            alt={post.title}
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
            loading="lazy"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-[var(--bg-surface-4)] to-[var(--bg-surface-5)] flex items-center justify-center">
            <div className="h-4 w-4 rounded bg-[rgba(226,179,64,0.1)]" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h3
          className={cn(
            "text-sm sm:text-[0.9375rem] font-medium leading-snug text-[var(--text-primary)] truncate",
            "group-hover:text-[var(--accent-gold)] transition-colors duration-300"
          )}
        >
          {post.title}
        </h3>
        <div className="mt-1 flex items-center gap-3 text-xs text-[var(--text-muted)]">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {post.date}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {post.readingTime}
          </span>
          {read && (
            <span className="flex items-center gap-1 text-[var(--accent-gold)]/70">
              <CheckCircle2 className="h-3 w-3" />
              Read
            </span>
          )}
        </div>
      </div>

      {/* Category badge - visible on sm+ */}
      <div className="shrink-0 hidden md:block">
        <span className="text-[0.6875rem] px-2.5 py-1 rounded-md bg-[var(--bg-surface-4)] text-[var(--text-muted)] border border-[var(--border-subtle)]">
          {post.category}
        </span>
      </div>

      {/* Bookmark */}
      <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
        <BookmarkButton slug={post.slug} size="sm" />
      </div>

      {/* Arrow */}
      <div className="shrink-0 text-[var(--text-faint)] group-hover:text-[var(--accent-gold)] transition-all duration-300 group-hover:translate-x-0.5">
        <ArrowRight className="h-4 w-4" />
      </div>

      {/* Bottom separator */}
      <div className="absolute bottom-0 left-4 right-4 h-px bg-[var(--border-subtle)] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </motion.article>
  );
}