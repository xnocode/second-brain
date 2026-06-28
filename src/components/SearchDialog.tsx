"use client";

import { useEffect, useState, useRef, useCallback, Fragment } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, FileText, ArrowRight, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface SearchResult {
  slug: string;
  title: string;
  excerpt: string;
  highlight?: string;
  category: string;
  date: string;
}

interface SearchDialogProps {
  open: boolean;
  onClose: () => void;
  onPostClick: (slug: string) => void;
}

/** Highlight matching text in a string */
function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;

  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escaped})`, "gi");
  const parts = text.split(regex);

  if (parts.length <= 1) return text;

  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark key={i} className="bg-[rgba(226,179,64,0.25)] text-[var(--accent-gold)] rounded-sm px-0.5">{part}</mark>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    )
  );
}

export function SearchDialog({ open, onClose, onPostClick }: SearchDialogProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const prevOpenRef = useRef(false);
  const isFirstRender = useRef(true);

  // Reset & focus when dialog opens
  useEffect(() => {
    if (open && !prevOpenRef.current) {
      // Use a microtask to avoid the synchronous setState lint
      const id = requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
      return () => cancelAnimationFrame(id);
    }
    prevOpenRef.current = open;
  }, [open]);

  // Handle open state changes via an event handler pattern
  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      if (!isOpen) {
        setQuery("");
        setResults([]);
        setActiveIndex(0);
        onClose();
      }
    },
    [onClose]
  );

  // Clear results when query becomes empty (derived pattern)
  const displayResults = query.trim() === "" ? [] : results;

  // Fetch results with debounce
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (!query.trim()) return;

    const timer = setTimeout(() => {
      abortRef.current?.abort();
      abortRef.current = new AbortController();

      setLoading(true);
      fetch(`/api/posts?search=${encodeURIComponent(query.trim())}`, {
        signal: abortRef.current.signal,
      })
        .then((res) => res.json())
        .then((data) => {
          setResults(Array.isArray(data) ? data : data.posts || []);
          setActiveIndex(0);
        })
        .catch((err) => {
          if (err.name !== "AbortError") {
            console.error("Search failed:", err);
            setResults([]);
          }
        })
        .finally(() => setLoading(false));
    }, 200);

    return () => {
      clearTimeout(timer);
      abortRef.current?.abort();
    };
  }, [query]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const currentResults = query.trim() === "" ? [] : results;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => (i < currentResults.length - 1 ? i + 1 : 0));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => (i > 0 ? i - 1 : currentResults.length - 1));
      } else if (e.key === "Enter" && currentResults[activeIndex]) {
        e.preventDefault();
        onPostClick(currentResults[activeIndex].slug);
        handleOpenChange(false);
      } else if (e.key === "Escape") {
        handleOpenChange(false);
      }
    },
    [results, activeIndex, onPostClick, handleOpenChange, query]
  );

  const handleSelect = useCallback(
    (slug: string) => {
      onPostClick(slug);
      handleOpenChange(false);
    },
    [onPostClick, handleOpenChange]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setQuery(e.target.value);
      if (e.target.value.trim() === "") {
        setResults([]);
        setActiveIndex(0);
      }
    },
    []
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="p-0 gap-0 max-w-2xl bg-[var(--bg-surface-2)] border-[var(--border-subtle)] overflow-hidden rounded-xl shadow-2xl shadow-black/50"
        onKeyDown={handleKeyDown}
      >
        <div className="h-0.5 bg-gradient-to-r from-transparent via-[var(--accent-gold)] to-transparent" />
        {/* Search input area */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--border-subtle)]">
          <Search className="h-5 w-5 text-[var(--text-muted)] shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={handleInputChange}
            placeholder="Search articles... (⌘K /)"
            className="flex-1 bg-transparent text-base text-[var(--text-primary)] placeholder:text-[var(--text-faint)] outline-none"
          />
          {loading && (
            <Loader2 className="h-4 w-4 text-[var(--accent-gold)] animate-spin" />
          )}
          {query && !loading && (
            <button
              onClick={() => {
                setQuery("");
                setResults([]);
                setActiveIndex(0);
                inputRef.current?.focus();
              }}
              className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border border-[var(--border-default)] bg-[var(--bg-surface-3)] px-1.5 text-[0.625rem] text-[var(--text-muted)] font-mono">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[400px] overflow-y-auto scrollbar-thin">
          <AnimatePresence mode="wait">
            {query.trim() && !loading && displayResults.length === 0 && (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-16 px-4"
              >
                <FileText className="h-10 w-10 text-[var(--text-faint)] mb-3" />
                <p className="text-sm text-[var(--text-muted)]">
                  No results for &ldquo;{query}&rdquo;
                </p>
              </motion.div>
            )}

            {displayResults.length > 0 && (
              <motion.div
                key="results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {displayResults.map((result, i) => (
                  <button
                    key={result.slug}
                    onClick={() => handleSelect(result.slug)}
                    onMouseEnter={() => setActiveIndex(i)}
                    className={cn(
                      "w-full flex items-start gap-4 px-5 py-3.5 text-left transition-colors duration-150",
                      i === activeIndex
                        ? "bg-[rgba(226,179,64,0.06)]"
                        : "hover:bg-[rgba(255,255,255,0.02)]",
                      i !== displayResults.length - 1 &&
                        "border-b border-[rgba(255,255,255,0.03)]"
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[0.625rem] font-medium uppercase tracking-wider text-[var(--accent-gold)]">
                          {result.category}
                        </span>
                        <span className="text-[0.625rem] text-[var(--text-faint)]">
                          {result.date}
                        </span>
                      </div>
                      <p
                        className={cn(
                          "text-sm font-medium truncate",
                          i === activeIndex
                            ? "text-[var(--text-primary)]"
                            : "text-[var(--text-secondary)]"
                        )}
                      >
                        {highlightMatch(result.title, query)}
                      </p>
                      <p className="text-xs text-[var(--text-muted)] line-clamp-1 mt-0.5">
                        {highlightMatch(result.highlight || result.excerpt, query)}
                      </p>
                    </div>
                    {i === activeIndex && (
                      <ArrowRight className="h-4 w-4 text-[var(--accent-gold)] mt-1 shrink-0" />
                    )}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {!query.trim() && (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <Search className="h-10 w-10 text-[var(--text-faint)] mb-3" />
              <p className="text-sm text-[var(--text-muted)]">
                Type to search articles
              </p>
              <p className="text-xs text-[var(--text-faint)] mt-1">
                Use ↑↓ to navigate, Enter to select
              </p>
            </div>
          )}
        </div>
      </DialogContent>
      <DialogTitle className="sr-only">Search articles</DialogTitle>
    </Dialog>
  );
}