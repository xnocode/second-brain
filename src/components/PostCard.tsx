"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Clock, Calendar, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { BookmarkButton } from "@/components/BookmarkButton";
import { isRead } from "@/lib/reading-history";

export interface BlogPost {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  tags: string[];
  category: string;
  readingTime: string;
  cover?: string;
}

interface PostCardProps {
  post: BlogPost;
  onClick: (slug: string) => void;
}

export function PostCard({ post, onClick }: PostCardProps) {
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
      whileHover={{ y: -4, scale: 1.015 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      onClick={() => onClick(post.slug)}
      className={cn(
        "card-glow group relative flex flex-col cursor-pointer rounded-xl overflow-hidden",
        "bg-[var(--bg-surface-3)] border border-[var(--border-subtle)] hover:border-[rgba(226,179,64,0.3)]",
        "transition-colors duration-300",
        "hover:shadow-[var(--shadow-card-hover)]"
      )}
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        e.currentTarget.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
        e.currentTarget.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);
      }}
    >
      {/* Cover image / gradient placeholder */}
      <div className="relative h-52 overflow-hidden">
        {post.cover ? (
          <img
            src={post.cover}
            alt={post.title}
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="post-card-placeholder h-full w-full bg-gradient-to-br from-[var(--bg-surface-4)] via-[var(--bg-surface-5)] to-[var(--bg-surface-3)]">
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-surface-3)] via-transparent to-transparent" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-16 w-16 rounded-2xl bg-[rgba(226,179,64,0.08)] flex items-center justify-center">
                <div className="h-8 w-8 rounded-lg bg-[rgba(226,179,64,0.12)]" />
              </div>
            </div>
          </div>
        )}
        {/* Bottom gradient fade for smooth edge */}
        {post.cover && (
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[var(--bg-surface-3)] to-transparent pointer-events-none" />
        )}

        {/* Category badge overlay */}
        <div className="absolute top-3 left-3">
          <Badge
            className="category-badge-overlay bg-[rgba(5,5,5,0.7)] backdrop-blur-md text-[var(--accent-gold)] border-[rgba(226,179,64,0.2)] text-[0.7rem] font-medium px-2.5 py-0.5 hover:bg-[rgba(5,5,5,0.8)]"
          >
            {post.category}
          </Badge>
        </div>

        {/* Bookmark button — top-right corner */}
        <div className="absolute top-3 right-3">
          <BookmarkButton slug={post.slug} size="sm" />
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-5">
        {/* Title */}
        <h3
          className={cn(
            "text-[1.0625rem] font-semibold leading-snug text-[var(--text-primary)]",
            "group-hover:text-[var(--accent-gold)] transition-colors duration-300",
            "line-clamp-2"
          )}
        >
          {post.title}
        </h3>

        {/* Excerpt */}
        <p className="mt-2.5 text-sm text-[var(--text-secondary)] line-clamp-3 leading-relaxed flex-1">
          {post.excerpt}
        </p>

        {/* Meta row */}
        <div className="mt-4 flex items-center gap-4 text-xs text-[var(--text-secondary)]">
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            {post.date}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            {post.readingTime}
          </span>
          {read && (
            <span className="inline-flex items-center gap-1 text-[var(--accent-gold)]/70">
              <CheckCircle2 className="h-3 w-3" />
              Read
            </span>
          )}
        </div>
      </div>
    </motion.article>
  );
}