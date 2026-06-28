"use client";

import { motion } from "framer-motion";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col items-center justify-center py-20 px-4 text-center"
    >
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[rgba(226,179,64,0.08)]">
        <FileText className="h-8 w-8 text-[var(--text-faint)]" />
      </div>
      <h3 className="text-h4 text-[var(--text-primary)] mb-2">{title}</h3>
      <p className="text-sm text-[var(--text-muted)] max-w-sm leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button
          onClick={onAction}
          className="mt-6 bg-[var(--accent-gold)] text-[#050505] hover:bg-[var(--accent-gold-hover)] rounded-lg"
        >
          {actionLabel}
        </Button>
      )}
    </motion.div>
  );
}
