"use client";

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

const shortcuts = [
  { keys: ["⌘", "K"], description: "Open search" },
  { keys: ["/"], description: "Open search" },
  { keys: ["?"], description: "Show keyboard shortcuts" },
  { keys: ["Esc"], description: "Close dialog / Go back" },
  { keys: ["j"], description: "Next article (blog view)" },
  { keys: ["k"], description: "Previous article (blog view)" },
  { keys: ["b"], description: "Bookmark current post" },
];

interface KeyboardShortcutsDialogProps {
  open: boolean;
  onClose: () => void;
}

export function KeyboardShortcutsDialog({ open, onClose }: KeyboardShortcutsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="p-0 gap-0 max-w-md bg-[var(--bg-surface-2)] border-[var(--border-subtle)] overflow-hidden rounded-xl shadow-2xl shadow-black/50"
      >
        {/* Gold accent line */}
        <div className="h-0.5 bg-gradient-to-r from-transparent via-[var(--accent-gold)] to-transparent" />
        {/* Header */}
        <div className="px-6 py-5 border-b border-[var(--border-subtle)]">
          <DialogTitle className="text-base font-semibold text-[var(--text-primary)]">
            Keyboard Shortcuts
          </DialogTitle>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Navigate faster with keyboard shortcuts
          </p>
        </div>
        {/* Shortcuts list */}
        <div className="p-2 max-h-[340px] overflow-y-auto scrollbar-thin">
          {shortcuts.map((s, i) => (
            <div
              key={i}
              className="flex items-center justify-between px-4 py-2.5 rounded-lg hover:bg-[rgba(255,255,255,0.03)] transition-colors"
            >
              <span className="text-sm text-[var(--text-secondary)]">{s.description}</span>
              <div className="flex items-center gap-1">
                {s.keys.map((key) => (
                  <kbd
                    key={key}
                    className="inline-flex h-6 min-w-[24px] items-center justify-center rounded-md border border-[var(--border-default)] bg-[var(--bg-surface-4)] px-1.5 text-xs font-mono text-[var(--text-secondary)]"
                  >
                    {key}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
        {/* Footer */}
        <div className="px-6 py-3 border-t border-[var(--border-subtle)]">
          <p className="text-xs text-[var(--text-faint)] text-center">
            Press <kbd className="inline-flex h-5 items-center rounded border border-[var(--border-default)] bg-[var(--bg-surface-4)] px-1.5 text-[0.625rem] font-mono text-[var(--text-muted)] mx-0.5">Esc</kbd> or <kbd className="inline-flex h-5 items-center rounded border border-[var(--border-default)] bg-[var(--bg-surface-4)] px-1.5 text-[0.625rem] font-mono text-[var(--text-muted)] mx-0.5">?</kbd> to close
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}