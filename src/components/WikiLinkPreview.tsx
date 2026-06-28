"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Clock, Tag, X, ArrowRight } from "lucide-react";

interface WikiLinkPreviewData {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  category: string;
  tags: string[];
  readingTime: string;
  content: string;
}

interface WikiLinkPreviewProps {
  containerRef: React.RefObject<HTMLElement | null>;
  onNavigate: (slug: string) => void;
}

export function WikiLinkPreview({ containerRef, onNavigate }: WikiLinkPreviewProps) {
  const [preview, setPreview] = useState<WikiLinkPreviewData | null>(null);
  const [position, setPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [loading, setLoading] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentSlugRef = useRef<string | null>(null);
  const previewBoxRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const hidePreview = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setPreview(null);
    setLoading(false);
    currentSlugRef.current = null;
  }, []);

  const showPreview = useCallback(
    async (slug: string, anchorEl: HTMLElement) => {
      // If same slug, just reposition
      if (currentSlugRef.current === slug && preview) {
        updatePosition(anchorEl);
        return;
      }

      // Abort previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      currentSlugRef.current = slug;
      setLoading(true);
      updatePosition(anchorEl);

      try {
        const res = await fetch(`/api/posts?slug=${encodeURIComponent(slug)}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("Not found");
        const json = await res.json();
        if (controller.signal.aborted) return;

        setPreview(json.post as WikiLinkPreviewData);
        setLoading(false);

        // Reposition after content loads
        requestAnimationFrame(() => updatePosition(anchorEl));
      } catch {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    },
    [preview]
  );

  const updatePosition = useCallback(
    (anchorEl: HTMLElement) => {
      const box = previewBoxRef.current;
      if (!box) return;

      const rect = anchorEl.getBoundingClientRect();
      const boxWidth = 420;
      const boxMaxHeight = 480;
      const gap = 10;

      // Horizontal: prefer right side of the link
      let left = rect.right + gap;
      let top = rect.top;

      // If overflows right, try left side
      if (left + boxWidth > window.innerWidth - 16) {
        left = rect.left - boxWidth - gap;
      }
      // If still overflows, center under the link
      if (left < 16) {
        left = Math.max(16, rect.left + rect.width / 2 - boxWidth / 2);
      }

      // Vertical: try below, then above
      if (top + boxMaxHeight > window.innerHeight - 16) {
        top = Math.max(16, window.innerHeight - boxMaxHeight - 16);
      }
      if (top < 16) top = 16;

      setPosition({ top, left });
    },
    []
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseEnter = (e: Event) => {
      const target = (e.target as HTMLElement).closest(".wiki-link") as HTMLElement | null;
      if (!target || target.classList.contains("wiki-link-broken")) return;

      const slug = target.getAttribute("data-wiki-link");
      if (!slug) return;

      // Clear any existing hide timeout
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
        hoverTimeoutRef.current = null;
      }

      // Small delay before showing preview
      hoverTimeoutRef.current = setTimeout(() => {
        showPreview(slug, target);
      }, 350);
    };

    const handleMouseLeave = (e: Event) => {
      const target = (e.target as HTMLElement).closest(".wiki-link") as HTMLElement | null;
      if (!target) return;

      // Only hide if we're not moving to the preview box
      hoverTimeoutRef.current = setTimeout(() => {
        hidePreview();
      }, 200);
    };

    // Handle clicks on wiki-links (navigate to the post)
    const handleClick = (e: Event) => {
      const target = (e.target as HTMLElement).closest(".wiki-link") as HTMLElement | null;
      if (!target || target.classList.contains("wiki-link-broken")) return;

      e.preventDefault();
      e.stopPropagation();

      const slug = target.getAttribute("data-wiki-link");
      if (slug) {
        hidePreview();
        onNavigate(slug);
      }
    };

    container.addEventListener("mouseenter", handleMouseEnter, true);
    container.addEventListener("mouseleave", handleMouseLeave, true);
    container.addEventListener("click", handleClick, true);

    return () => {
      container.removeEventListener("mouseenter", handleMouseEnter, true);
      container.removeEventListener("mouseleave", handleMouseLeave, true);
      container.removeEventListener("click", handleClick, true);
    };
  }, [containerRef, showPreview, hidePreview, onNavigate]);

  // Handle preview box mouse events (keep alive when hovering over preview)
  const handlePreviewMouseEnter = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
  }, []);

  const handlePreviewMouseLeave = useCallback(() => {
    hoverTimeoutRef.current = setTimeout(() => {
      hidePreview();
    }, 150);
  }, [hidePreview]);

  const handlePreviewScroll = useCallback(() => {
    setIsScrolling(true);
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => setIsScrolling(false), 150);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, []);

  return (
    <AnimatePresence>
      {(preview || loading) && (
        <motion.div
          ref={previewBoxRef}
          initial={{ opacity: 0, y: 8, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 4, scale: 0.98 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          style={{
            position: "fixed",
            top: position.top,
            left: position.left,
            width: 420,
            zIndex: 9999,
          }}
          className="pointer-events-auto"
          onMouseEnter={handlePreviewMouseEnter}
          onMouseLeave={handlePreviewMouseLeave}
        >
          <div
            className={`rounded-xl border bg-[var(--popover)] border-[var(--border-subtle)] shadow-[0_20px_60px_rgba(0,0,0,0.5),0_0_1px_rgba(226,179,64,0.1)] overflow-hidden flex flex-col ${
              isScrolling ? "" : "scrollbar-none"
            }`}
            style={{ maxHeight: 480 }}
          >
            {/* Header */}
            <div className="p-4 pb-3 border-b border-[var(--border-subtle)] bg-[var(--bg-surface-2)] shrink-0">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  {loading ? (
                    <div className="space-y-2">
                      <div className="h-5 w-3/4 bg-[var(--bg-surface-4)] rounded animate-pulse" />
                      <div className="h-3 w-1/2 bg-[var(--bg-surface-4)] rounded animate-pulse" />
                    </div>
                  ) : preview ? (
                    <>
                      <h3 className="text-sm font-semibold text-[var(--text-primary)] leading-tight line-clamp-2">
                        {preview.title}
                      </h3>
                      <div className="flex items-center gap-3 mt-1.5 text-[11px] text-[var(--text-muted)]">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {preview.date}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {preview.readingTime}
                        </span>
                      </div>
                    </>
                  ) : null}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    hidePreview();
                  }}
                  className="shrink-0 p-1 rounded-md text-[var(--text-faint)] hover:text-[var(--text-muted)] hover:bg-[var(--bg-surface-4)] transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Tags */}
              {!loading && preview && preview.tags.length > 0 && (
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded bg-[var(--accent-gold-muted)] text-[var(--accent-gold)]">
                    {preview.category}
                  </span>
                  {preview.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-surface-4)] text-[var(--text-muted)]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Content (scrollable) */}
            <div
              className="overflow-y-auto flex-1 min-h-0"
              style={{ maxHeight: 340 }}
              onScroll={handlePreviewScroll}
            >
              {loading ? (
                <div className="p-4 space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="h-3 bg-[var(--bg-surface-4)] rounded animate-pulse"
                      style={{ width: `${75 + Math.random() * 25}%` }}
                    />
                  ))}
                </div>
              ) : preview ? (
                <div className="p-4">
                  {/* Excerpt */}
                  {preview.excerpt && (
                    <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed mb-3 italic border-l-2 border-[var(--accent-gold)] pl-3">
                      {preview.excerpt}
                    </p>
                  )}

                  {/* Content preview */}
                  <div
                    className="prose prose-sm prose-invert max-w-none text-[var(--text-secondary)] [&_h2]:text-xs [&_h2]:font-semibold [&_h2]:text-[var(--text-primary)] [&_h2]:mt-4 [&_h2]:mb-2 [&_h3]:text-xs [&_h3]:font-medium [&_h3]:text-[var(--text-primary)] [&_h3]:mt-3 [&_h3]:mb-1 [&_p]:text-[13px] [&_p]:leading-relaxed [&_p]:my-1.5 [&_ul]:my-2 [&_ol]:my-2 [&_li]:text-[13px] [&_li]:my-0.5 [&_code]:text-[11px] [&_pre]:text-[11px] [&_blockquote]:text-[12px] [&_blockquote]:border-l-[var(--accent-gold)] [&_strong]:text-[var(--text-primary)] [&_a]:text-[var(--accent-gold)] [&_img]:rounded-lg [&_img]:my-2"
                    dangerouslySetInnerHTML={{ __html: preview.content }}
                  />
                </div>
              ) : null}
            </div>

            {/* Footer with "Open" link */}
            {!loading && preview && (
              <div className="p-3 border-t border-[var(--border-subtle)] bg-[var(--bg-surface-2)] shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    hidePreview();
                    onNavigate(preview!.slug);
                  }}
                  className="flex items-center gap-2 w-full text-xs font-medium text-[var(--accent-gold)] hover:text-[var(--accent-gold-hover)] transition-colors group"
                >
                  <span>Open full article</span>
                  <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                </button>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}