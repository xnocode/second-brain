"use client";

import { useState, useCallback } from "react";
import { Link2, Check } from "lucide-react";

interface ShareButtonsProps {
  title: string;
  slug: string;
}

export function ShareButtons({ title, slug }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const url =
    typeof window !== "undefined" ? window.location.href : `https://secondbrain.dev/blog/${slug}`;

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const ta = document.createElement("textarea");
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [url]);



  return (
    <button
      onClick={handleCopy}
      className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-[rgba(255,255,255,0.04)] border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--accent-gold)] hover:border-[rgba(226,179,64,0.3)] hover:bg-[rgba(226,179,64,0.06)] transition-all duration-200"
      title="Copy link"
    >
      {copied ? (
        <Check className="h-3.5 w-3.5" />
      ) : (
        <Link2 className="h-3.5 w-3.5" />
      )}
    </button>
  );
}