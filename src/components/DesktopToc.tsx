"use client";

import { useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface DesktopTocProps {
  headings: { id: string; text: string; level: number }[];
  activeHeading: string;
  onHeadingClick: (id: string) => void;
}

export function DesktopToc({ headings, activeHeading, onHeadingClick }: DesktopTocProps) {
  const navRef = useRef<HTMLElement>(null);
  const itemRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const isScrollingToItem = useRef(false);

  // Auto-scroll the active item into view within the ToC container
  useEffect(() => {
    if (!activeHeading || !navRef.current) return;

    const activeEl = itemRefs.current.get(activeHeading);
    if (!activeEl) return;

    const container = navRef.current;
    const containerRect = container.getBoundingClientRect();
    const itemRect = activeEl.getBoundingClientRect();

    // Check if the active item is outside the visible area of the container
    const isAbove = itemRect.top < containerRect.top;
    const isBelow = itemRect.bottom > containerRect.bottom;

    if (isAbove || isBelow) {
      isScrollingToItem.current = true;
      // Calculate the scroll position to center the active item
      const scrollOffset =
        itemRect.top - containerRect.top - containerRect.height / 2 + itemRect.height / 2;
      container.scrollBy({
        top: scrollOffset,
        behavior: "smooth",
      });
      // Reset flag after scroll animation completes
      const timer = setTimeout(() => {
        isScrollingToItem.current = false;
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [activeHeading]);

  const setItemRef = useCallback((id: string) => (el: HTMLButtonElement | null) => {
    if (el) {
      itemRefs.current.set(id, el);
    } else {
      itemRefs.current.delete(id);
    }
  }, []);

  return (
    <nav
      ref={navRef}
      className="flex flex-col gap-1 max-h-[calc(100vh-10rem)] overflow-y-auto scrollbar-none pr-1"
    >
      {headings.map((h) => {
        const isActive = activeHeading === h.id;
        return (
          <button
            key={h.id}
            ref={setItemRef(h.id)}
            type="button"
            onClick={() => onHeadingClick(h.id)}
            className={cn(
              "text-left text-sm py-1.5 transition-colors duration-200 border-l-2 pl-3 rounded-r-md w-full relative",
              h.level === 2
                ? "font-medium text-[var(--text-secondary)]"
                : "pl-6 text-[var(--text-secondary)] text-xs",
              isActive
                ? "font-semibold text-[var(--accent-gold)] border-[var(--accent-gold)] prose-toc-active"
                : "border-transparent hover:text-[var(--text-primary)] hover:border-[var(--border-default)]"
            )}
          >
            {/* Animated background highlight */}
            {isActive && (
              <motion.span
                layoutId="toc-active-bg"
                className="absolute inset-0 rounded-r-md bg-[rgba(226,179,64,0.08)] -z-10"
                transition={{
                  type: "spring",
                  stiffness: 350,
                  damping: 30,
                }}
              />
            )}
            {h.text}
          </button>
        );
      })}
    </nav>
  );
}