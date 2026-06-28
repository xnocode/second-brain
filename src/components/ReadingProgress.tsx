"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion, useSpring } from "framer-motion";

export function ReadingProgress() {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState(false);
  const visibleRef = useRef(false);
  const progressRef = useRef(0);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scaleX = useSpring(0, {
    stiffness: 200,
    damping: 50,
    restDelta: 0.001,
  });

  const handleScroll = useCallback(() => {
    const scrollY = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;

    const shouldBeVisible = scrollY > 100;
    if (visibleRef.current !== shouldBeVisible) {
      visibleRef.current = shouldBeVisible;
      requestAnimationFrame(() => setVisible(shouldBeVisible));
    }

    if (docHeight > 0) {
      const pct = Math.min(scrollY / docHeight, 1);
      if (Math.abs(progressRef.current - pct) > 0.005) {
        progressRef.current = pct;
        setProgress(pct);
        scaleX.set(pct);
      }
    }
  }, [scaleX]);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    // Use rAF to avoid synchronous setState in effect
    const rafId = requestAnimationFrame(handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      cancelAnimationFrame(rafId);
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, [handleScroll]);

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setHovered(true);
  };

  const handleMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => setHovered(false), 1500);
  };

  const pctDisplay = Math.round(progress * 100);

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 z-[60]"
      style={{ opacity: visible ? 1 : 0 }}
      transition={{ duration: 0.3 }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Progress bar */}
      <motion.div
        className="h-[3px] w-full origin-left pointer-events-none"
        style={{
          scaleX,
          transformOrigin: "0%",
          background:
            "linear-gradient(90deg, var(--accent-gold), var(--accent-gold-hover), #f59e0b)",
          boxShadow: "0 0 8px rgba(226, 179, 64, 0.5)",
        }}
      />
      {/* Percentage tooltip */}
      <motion.div
        className="pointer-events-none absolute top-1.5 -translate-y-1/2"
        style={{
          left: `${Math.max(Math.min(pctDisplay, 95), 5)}%`,
          opacity: hovered ? 1 : 0,
        }}
        initial={false}
        animate={{ opacity: hovered ? 1 : 0, y: hovered ? 0 : -4 }}
        transition={{ duration: 0.15 }}
      >
        <div className="relative">
          <div className="bg-[var(--bg-surface-3)] border border-[var(--border-subtle)] text-[var(--text-secondary)] text-[0.625rem] font-mono px-1.5 py-0.5 rounded-md shadow-lg whitespace-nowrap">
            {pctDisplay}%
          </div>
          {/* Tooltip arrow */}
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-[var(--bg-surface-3)] border-r border-b border-[var(--border-subtle)] rotate-45" />
        </div>
      </motion.div>
    </motion.div>
  );
}