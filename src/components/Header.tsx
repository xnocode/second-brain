"use client";

import { useState, useEffect, useCallback, useSyncExternalStore } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Search, Menu, X, Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

const navLinks = [
  { label: "Home", page: "home" },
  { label: "Blog", page: "blog" },
  { label: "Bookmarks", page: "bookmarks" },
  { label: "Categories", page: "categories" },
  { label: "About", page: "about" },
];

export function Header({ currentPage, onNavigate }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Read theme from localStorage using useSyncExternalStore (no hydration mismatch)
  const getThemeSnapshot = useCallback((): "dark" | "light" => {
    const saved = localStorage.getItem("theme");
    if (saved === "light" || saved === "dark") return saved;
    if (typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: light)").matches) return "light";
    return "dark";
  }, []);

  const getServerSnapshot = useCallback((): "dark" => "dark", []);

  const subscribeToTheme = useCallback((callback: () => void) => {
    const handler = (e: StorageEvent) => { if (e.key === "theme") callback(); };
    window.addEventListener("storage", handler);
    // Also listen for our custom event from toggleTheme
    const customHandler = () => callback();
    window.addEventListener("theme-changed", customHandler);
    return () => {
      window.removeEventListener("storage", handler);
      window.removeEventListener("theme-changed", customHandler);
    };
  }, []);

  const theme = useSyncExternalStore(subscribeToTheme, getThemeSnapshot, getServerSnapshot);

  // Sync DOM class on mount and theme changes
  useEffect(() => {
    if (theme === "light") {
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
    }
  }, [theme]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const toggleTheme = useCallback(() => {
    const current = localStorage.getItem("theme") || "dark";
    const next = current === "dark" ? "light" : "dark";
    localStorage.setItem("theme", next);
    window.dispatchEvent(new CustomEvent("theme-changed"));
  }, []);

  const handleNav = useCallback(
    (page: string) => {
      onNavigate(page);
      setMobileOpen(false);
    },
    [onNavigate]
  );

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
          scrolled
            ? theme === "light"
              ? "bg-[rgba(250,250,249,0.85)] backdrop-blur-xl shadow-lg shadow-black/5"
              : "bg-[rgba(5,5,5,0.85)] backdrop-blur-xl shadow-lg shadow-black/20"
            : theme === "light"
            ? "bg-[rgba(250,250,249,0.8)] backdrop-blur-xl"
            : "bg-[rgba(5,5,5,0.8)] backdrop-blur-xl"
        )}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <button
              onClick={() => handleNav("home")}
              className="flex items-center gap-2.5 group transition-smooth"
            >
              <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent-gold-muted)] group-hover:bg-[rgba(226,179,64,0.25)] transition-smooth">
                <Brain className="h-4.5 w-4.5 text-[var(--accent-gold)]" />
                <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity animate-glow-pulse" />
              </div>
              <span className="text-lg font-bold tracking-tight text-[var(--text-primary)]">
                Second Brain
              </span>
            </button>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const isActive = currentPage === link.page;
                return (
                  <button
                    key={link.page}
                    onClick={() => handleNav(link.page)}
                    className={cn(
                      "relative px-4 py-2 text-sm font-medium rounded-md transition-smooth",
                      isActive
                        ? "text-[var(--accent-gold)]"
                        : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[rgba(255,255,255,0.04)]"
                    )}
                  >
                    {link.label}
                    {isActive && (
                      <motion.div
                        layoutId="nav-active"
                        className="absolute inset-x-1 -bottom-px h-0.5 rounded-full bg-[var(--accent-gold)]"
                        transition={{
                          type: "spring",
                          stiffness: 380,
                          damping: 30,
                        }}
                      />
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[rgba(255,255,255,0.06)]"
                onClick={() => {
                  // Trigger search — parent will handle via event or prop
                  const event = new CustomEvent("open-search");
                  window.dispatchEvent(event);
                }}
              >
                <Search className="h-4 w-4" />
                <span className="sr-only">Search</span>
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="hidden sm:flex h-9 w-9 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[rgba(255,255,255,0.06)]"
                onClick={toggleTheme}
              >
                {theme === "dark" ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
                <span className="sr-only">Toggle theme</span>
              </Button>

              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden h-9 w-9 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                onClick={() => setMobileOpen(!mobileOpen)}
              >
                {mobileOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
                <span className="sr-only">Menu</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Gradient bottom border */}
        <div className="gradient-header-border" />
      </header>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 md:hidden"
          >
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className={cn(
                "mobile-menu-panel absolute right-0 top-0 bottom-0 w-72 border-l border-[var(--border-subtle)] p-6 pt-20 bg-[var(--bg-surface-1)]"
              )}
            >
              <nav className="flex flex-col gap-2">
                {navLinks.map((link, i) => {
                  const isActive = currentPage === link.page;
                  return (
                    <motion.button
                      key={link.page}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 + 0.1 }}
                      onClick={() => handleNav(link.page)}
                      className={cn(
                        "text-left px-4 py-3 rounded-lg text-base font-medium transition-smooth",
                        isActive
                          ? "text-[var(--accent-gold)] bg-[var(--accent-gold-muted)]"
                          : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[rgba(255,255,255,0.04)]"
                      )}
                    >
                      {link.label}
                    </motion.button>
                  );
                })}
              </nav>

              <div className="mt-6 pt-6 border-t border-[var(--border-subtle)]">
                <button
                  onClick={toggleTheme}
                  className="flex items-center gap-3 px-4 py-3 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-lg hover:bg-[rgba(255,255,255,0.04)] transition-smooth w-full"
                >
                  {theme === "dark" ? (
                    <Sun className="h-4 w-4" />
                  ) : (
                    <Moon className="h-4 w-4" />
                  )}
                  {theme === "dark" ? "Light Mode" : "Dark Mode"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}