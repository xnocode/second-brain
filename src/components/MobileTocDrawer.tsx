"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { List, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileTocDrawerProps {
  headings: { id: string; text: string; level: number }[];
  activeHeading: string;
  onHeadingClick?: (id: string) => void;
}

export function MobileTocDrawer({ headings, activeHeading, onHeadingClick }: MobileTocDrawerProps) {
  const [open, setOpen] = useState(false);
  const [showPulse, setShowPulse] = useState(false);
  const pulseTriggered = useRef(false);

  // Show pulse when user scrolls past the first heading
  useEffect(() => {
    if (headings.length === 0) return;

    const firstId = headings[0].id;
    const firstEl = document.getElementById(firstId);
    if (!firstEl) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting && !pulseTriggered.current) {
            pulseTriggered.current = true;
            requestAnimationFrame(() => setShowPulse(true));
            // Auto-hide pulse after 4 seconds
            const timer = setTimeout(() => {
              requestAnimationFrame(() => setShowPulse(false));
            }, 4000);
            return () => clearTimeout(timer);
          }
        });
      },
      { threshold: 0 }
    );

    observer.observe(firstEl);
    return () => observer.disconnect();
  }, [headings]);

  const handleHeadingClick = useCallback(
    (id: string) => {
      setOpen(false);
      // Immediately highlight the clicked item via parent callback
      if (onHeadingClick) {
        onHeadingClick(id);
      }
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    },
    [onHeadingClick]
  );

  if (headings.length === 0) return null;

  return (
    <>
      {/* Floating button — mobile/tablet only */}
      <motion.button
        onClick={() => setOpen(true)}
        className={cn(
          "fixed bottom-6 left-4 z-30 xl:hidden",
          "flex h-11 w-11 items-center justify-center rounded-full",
          "bg-[var(--bg-surface-3)]/80 backdrop-blur-md border border-[var(--border-subtle)]",
          "text-[var(--text-secondary)] hover:text-[var(--accent-gold)]",
          "shadow-lg shadow-black/20",
          "transition-colors duration-200"
        )}
        whileTap={{ scale: 0.92 }}
        aria-label="Table of contents"
      >
        <List className="h-5 w-5" />
        {showPulse && (
          <motion.span
            className="absolute inset-0 rounded-full border-2 border-[var(--accent-gold)]"
            initial={{ opacity: 0.8, scale: 1 }}
            animate={{ opacity: 0, scale: 1.6 }}
            transition={{ duration: 1.5, repeat: 2, ease: "easeOut" }}
          />
        )}
      </motion.button>

      {/* Drawer overlay + panel */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm xl:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />

            {/* Drawer panel — slides up from bottom */}
            <motion.div
              className={cn(
                "fixed bottom-0 left-0 right-0 z-50 xl:hidden",
                "bg-[var(--bg-surface-1)]/70 backdrop-blur-xl border-t border-[var(--border-subtle)]",
                "rounded-t-2xl shadow-2xl shadow-black/40"
              )}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
            >
              {/* Handle bar */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="h-1 w-10 rounded-full bg-[var(--border-default)]" />
              </div>

              {/* Drawer header */}
              <div className="flex items-center justify-between px-5 pb-3">
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                  Table of Contents
                </h3>
                <button
                  onClick={() => setOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-3)] transition-colors duration-200"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Scrollable heading list */}
              <nav className="max-h-[60vh] overflow-y-auto px-5 pb-6 scrollbar-none">
                <ul className="flex flex-col gap-0.5">
                  {headings.map((h) => (
                    <li key={h.id}>
                      <button
                        onClick={() => handleHeadingClick(h.id)}
                        className={cn(
                          "w-full text-left py-2 px-3 rounded-lg transition-colors duration-200",
                          h.level === 2
                            ? "text-sm font-medium"
                            : "text-sm pl-6 text-[var(--text-secondary)]",
                          activeHeading === h.id
                            ? "text-[var(--accent-gold)] bg-[rgba(226,179,64,0.08)] font-semibold"
                            : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-3)]"
                        )}
                      >
                        {h.text}
                      </button>
                    </li>
                  ))}
                </ul>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
