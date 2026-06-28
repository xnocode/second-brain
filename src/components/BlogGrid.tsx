"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutGrid, List, ChevronLeft, ChevronRight } from "lucide-react";
import { PostCard, type BlogPost } from "@/components/PostCard";
import { PostListItem } from "@/components/PostListItem";
import { cn } from "@/lib/utils";

export type ViewMode = "card" | "list";

interface BlogGridProps {
  posts: BlogPost[];
  onPostClick: (slug: string) => void;
  title?: string;
  showViewToggle?: boolean;
  pageSize?: number;
}

const POSTS_PER_PAGE = 9;

const grid = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08 },
  },
};

const gridItem = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

export function BlogGrid({
  posts,
  onPostClick,
  title,
  showViewToggle = false,
  pageSize,
}: BlogGridProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("card");
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = pageSize ?? POSTS_PER_PAGE;

  const totalPages = Math.ceil(posts.length / perPage);
  const paginatedPosts = posts.slice((currentPage - 1) * perPage, currentPage * perPage);

  // Reset to page 1 when posts change
  const [prevPostCount, setPrevPostCount] = useState(posts.length);
  if (posts.length !== prevPostCount) {
    setPrevPostCount(posts.length);
    setCurrentPage(1);
  }

  if (posts.length === 0) return null;

  return (
    <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {title && (
        <div className="mb-8 flex items-end justify-between">
          <h2 className="text-h2 text-[var(--text-primary)]">{title}</h2>
        </div>
      )}

      {/* View toggle + page info bar */}
      {showViewToggle && posts.length > 0 && (
        <div className="flex items-center justify-between mb-6">
          <span className="text-sm text-[var(--text-muted)]">
            Showing {(currentPage - 1) * perPage + 1}–{Math.min(currentPage * perPage, posts.length)} of {posts.length} articles
          </span>
          <div className="flex items-center gap-1 rounded-lg bg-[var(--bg-surface-3)] border border-[var(--border-subtle)] p-1">
            <button
              onClick={() => setViewMode("card")}
              className={cn(
                "flex items-center justify-center h-8 w-8 rounded-md transition-all duration-200",
                viewMode === "card"
                  ? "bg-[var(--accent-gold)] text-[#050505] shadow-sm"
                  : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
              )}
              aria-label="Card view"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "flex items-center justify-center h-8 w-8 rounded-md transition-all duration-200",
                viewMode === "list"
                  ? "bg-[var(--accent-gold)] text-[#050505] shadow-sm"
                  : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
              )}
              aria-label="List view"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={viewMode + "-" + currentPage}
          variants={viewMode === "card" ? grid : undefined}
          initial={viewMode === "card" ? "hidden" : { opacity: 0 }}
          animate={viewMode === "card" ? "show" : { opacity: 1 }}
          exit={{ opacity: 0, y: -8, transition: { duration: 0.15 } }}
          transition={{ duration: 0.3 }}
          className={
            viewMode === "card"
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
              : "space-y-1 max-w-4xl"
          }
        >
          {paginatedPosts.map((post, index) =>
            viewMode === "card" ? (
              <motion.div key={post.slug} variants={gridItem} data-post-card>
                <PostCard post={post} onClick={onPostClick} />
              </motion.div>
            ) : (
              <PostListItem
                key={post.slug}
                post={post}
                onClick={onPostClick}
                index={(currentPage - 1) * perPage + index}
              />
            )
          )}
        </motion.div>
      </AnimatePresence>

      {/* Pagination */}
      {showViewToggle && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-10">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className={cn(
              "flex items-center gap-1.5 h-10 px-4 rounded-lg text-sm font-medium transition-all duration-200 border",
              currentPage === 1
                ? "text-[var(--text-faint)] border-[var(--border-subtle)] cursor-not-allowed opacity-50"
                : "text-[var(--text-secondary)] border-[var(--border-subtle)] hover:border-[var(--border-default)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-3)]"
            )}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Previous</span>
          </button>

          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
              const isActive = page === currentPage;
              const isNearActive = Math.abs(page - currentPage) <= 1;
              const isEdge = page === 1 || page === totalPages;

              if (!isNearActive && !isEdge) {
                // Show ellipsis
                if (page === currentPage - 2 || page === currentPage + 2) {
                  return (
                    <span key={`ellipsis-${page}`} className="h-10 flex items-center px-1 text-[var(--text-faint)]">
                      …
                    </span>
                  );
                }
                return null;
              }

              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={cn(
                    "flex items-center justify-center h-10 min-w-[2.5rem] rounded-lg text-sm font-medium transition-all duration-200 border",
                    isActive
                      ? "bg-[var(--accent-gold)] text-[#050505] border-[var(--accent-gold)] shadow-sm"
                      : "text-[var(--text-secondary)] border-[var(--border-subtle)] hover:border-[var(--border-default)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-3)]"
                  )}
                >
                  {page}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className={cn(
              "flex items-center gap-1.5 h-10 px-4 rounded-lg text-sm font-medium transition-all duration-200 border",
              currentPage === totalPages
                ? "text-[var(--text-faint)] border-[var(--border-subtle)] cursor-not-allowed opacity-50"
                : "text-[var(--text-secondary)] border-[var(--border-subtle)] hover:border-[var(--border-default)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-3)]"
            )}
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </section>
  );
}