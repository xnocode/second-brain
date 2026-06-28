"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { isBookmarked, toggleBookmark } from "@/lib/bookmarks";

interface BookmarkButtonProps {
  slug: string;
  size?: "sm" | "md";
}

export function BookmarkButton({ slug, size = "md" }: BookmarkButtonProps) {
  const [bookmarked, setBookmarked] = useState(false);

  const bookmarkedRef = useRef(false);

  useEffect(() => {
    const val = isBookmarked(slug);
    if (bookmarkedRef.current !== val) {
      bookmarkedRef.current = val;
      requestAnimationFrame(() => setBookmarked(val));
    }
    const handler = () => {
      const v = isBookmarked(slug);
      if (bookmarkedRef.current !== v) {
        bookmarkedRef.current = v;
        requestAnimationFrame(() => setBookmarked(v));
      }
    };
    window.addEventListener("bookmarks-changed", handler);
    return () => window.removeEventListener("bookmarks-changed", handler);
  }, [slug]);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      toggleBookmark(slug);
    },
    [slug]
  );

  const iconSize = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  const buttonSize = size === "sm" ? "h-7 w-7" : "h-9 w-9";

  return (
    <button
      onClick={handleClick}
      aria-label={bookmarked ? "Remove bookmark" : "Add bookmark"}
      className={cn(
        buttonSize,
        "inline-flex items-center justify-center rounded-lg transition-all duration-200",
        "backdrop-blur-md border shrink-0",
        bookmarked
          ? "bg-[rgba(226,179,64,0.15)] border-[rgba(226,179,64,0.3)] text-[var(--accent-gold)]"
          : "bg-[rgba(5,5,5,0.5)] border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[rgba(255,255,255,0.06)]"
      )}
    >
      {bookmarked ? (
        <BookmarkCheck className={cn(iconSize, "text-[var(--accent-gold)]")} />
      ) : (
        <Bookmark className={iconSize} />
      )}
    </button>
  );
}