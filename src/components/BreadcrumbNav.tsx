"use client";

import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbNavProps {
  category: string;
  title?: string;
  onNavigate: (page: string) => void;
  onBack: () => void;
}

export function BreadcrumbNav({ category, title, onNavigate, onBack }: BreadcrumbNavProps) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[13px]">
      <button
        onClick={() => onNavigate("home")}
        className="flex items-center gap-1 text-[var(--text-muted)] hover:text-[var(--accent-gold)] transition-colors duration-200"
      >
        <Home className="h-3 w-3" />
        <span>Home</span>
      </button>
      <ChevronRight className="h-3 w-3 text-[var(--text-faint)]" />
      <button
        onClick={onBack}
        className="text-[var(--text-muted)] hover:text-[var(--accent-gold)] transition-colors duration-200"
      >
        Blog
      </button>
      <ChevronRight className="h-3 w-3 text-[var(--text-faint)]" />
      <button
        onClick={onBack}
        className="text-[var(--text-muted)] hover:text-[var(--accent-gold)] transition-colors duration-200"
      >
        {category}
      </button>
      {title && (
        <>
          <ChevronRight className="h-3 w-3 text-[var(--text-faint)]" />
          <span className="text-[var(--text-secondary)] font-medium truncate max-w-[200px] sm:max-w-[300px]">
            {title}
          </span>
        </>
      )}
    </nav>
  );
}