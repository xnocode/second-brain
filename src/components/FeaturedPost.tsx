"use client";

import { motion } from "framer-motion";
import { Calendar, Clock, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { BlogPost } from "@/components/PostCard";

interface FeaturedPostProps {
  post: BlogPost;
  onClick: (slug: string) => void;
}

export function FeaturedPost({ post, onClick }: FeaturedPostProps) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="group relative w-full cursor-pointer rounded-2xl overflow-hidden border border-[var(--border-subtle)] hover:border-[rgba(226,179,64,0.25)] transition-all duration-500 hover:shadow-[0_20px_50px_rgba(0,0,0,0.5),0_0_30px_rgba(226,179,64,0.1)] featured-card-shimmer"
      onClick={() => onClick(post.slug)}
    >
      <div className="relative flex flex-col lg:flex-row">
        {/* Image area */}
        <div className="relative h-72 lg:h-auto lg:w-1/2 shrink-0 overflow-hidden">
          {post.cover ? (
            <img
              src={post.cover}
              alt={post.title}
              className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="h-full w-full min-h-[280px] bg-gradient-to-br from-[var(--bg-surface-4)] via-[var(--bg-surface-5)] to-[var(--bg-surface-3)]">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[var(--bg-surface-3)] hidden lg:block" />
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-surface-3)] via-transparent to-transparent lg:hidden" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-20 w-20 rounded-3xl bg-[rgba(226,179,64,0.08)] flex items-center justify-center">
                  <div className="h-10 w-10 rounded-xl bg-[rgba(226,179,64,0.12)]" />
                </div>
              </div>
            </div>
          )}

          {/* Overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-surface-3)] via-[rgba(0,0,0,0.2)] to-transparent lg:hidden" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[var(--bg-surface-3)] hidden lg:block" />
        </div>

        {/* Content */}
        <div className="relative flex-1 flex flex-col justify-center p-6 sm:p-8 lg:p-10 bg-[var(--bg-surface-3)]">
          <Badge className="mb-4 w-fit bg-[var(--accent-gold-muted)] text-[var(--accent-gold)] border-[rgba(226,179,64,0.2)] text-xs font-medium">
            Featured
          </Badge>

          <h2
            className={cn(
              "text-h2 text-[var(--text-primary)] mb-3 max-w-lg",
              "group-hover:text-[var(--accent-gold)] transition-colors duration-300"
            )}
          >
            {post.title}
          </h2>

          <p className="text-[var(--text-secondary)] text-base leading-relaxed line-clamp-3 mb-6 max-w-lg">
            {post.excerpt}
          </p>

          {/* Meta */}
          <div className="flex items-center gap-4 text-sm text-[var(--text-muted)] mb-6">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              {post.date}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {post.readingTime}
            </span>
          </div>

          {/* Tags + CTA */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="tag-chip text-xs text-[var(--text-muted)] bg-[rgba(255,255,255,0.04)] px-2.5 py-1 rounded-md border border-[rgba(255,255,255,0.04)]"
                >
                  {tag}
                </span>
              ))}
            </div>

            <Button
              className="gap-2 bg-[var(--accent-gold)] text-[var(--primary-foreground)] hover:bg-[var(--accent-gold-hover)] rounded-lg font-medium shrink-0"
              size="sm"
            >
              Read More
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </motion.article>
  );
}