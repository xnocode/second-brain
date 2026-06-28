"use client";

import { motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { Brain, Github, Twitter, Rss, Mail, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const navLinks = [
  { label: "Home", page: "home" },
  { label: "Blog", page: "blog" },
  { label: "Categories", page: "categories" },
  { label: "About", page: "about" },
  { label: "Bookmarks", page: "bookmarks" },
];

const socialLinks = [
  { icon: Github, label: "GitHub", href: "https://github.com/xnocode" },
  { icon: Twitter, label: "Twitter", href: "#" },
  { icon: Rss, label: "RSS", href: "/rss.xml" },
];

interface FooterProps {
  categories?: string[];
  onNavigate?: (page: string) => void;
  onCategoryClick?: (category: string) => void;
}

export function Footer({ categories = [], onNavigate, onCategoryClick }: FooterProps) {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSubscribe = () => {
    if (!email.trim()) return;
    setEmail("");
    setSubscribed(true);
    toast.success("You're subscribed!", {
      description: "We'll notify you of new articles.",
    });
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setSubscribed(false), 3000);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <footer className="mt-auto border-t border-[var(--border-subtle)] bg-[var(--bg-base)]">
      {/* Gradient top border */}
      <div className="gradient-header-border" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent-gold-muted)]">
                <Brain className="h-4.5 w-4.5 text-[var(--accent-gold)]" />
              </div>
              <span className="text-lg font-bold text-[var(--text-primary)]">
                Second Brain
              </span>
            </div>
            <p className="text-sm text-[var(--text-muted)] leading-relaxed mb-6 max-w-xs">
              A personal knowledge repository where ideas crystallize into
              lasting understanding. Built with Obsidian and Next.js.
            </p>

            {/* Newsletter */}
            <div>
              <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3">
                Stay Updated
              </p>
              <div className="flex gap-2">
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubscribe()}
                  placeholder="your@email.com"
                  className="h-9 bg-[var(--bg-surface-3)] border-[var(--border-subtle)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus-visible:border-[var(--accent-gold)] focus-visible:ring-[var(--accent-gold)]/20 rounded-lg transition-all duration-300"
                />
                <Button
                  size="icon"
                  onClick={handleSubscribe}
                  className="h-9 w-9 shrink-0 bg-[var(--accent-gold)] text-[#050505] hover:bg-[var(--accent-gold-hover)] rounded-lg"
                >
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
              {subscribed && (
                <motion.span
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-emerald-400 text-sm mt-2 block"
                >
                  ✓ You&apos;re subscribed!
                </motion.span>
              )}

              {/* Keyboard shortcut hint */}
              <div className="mt-5 flex items-center gap-2 text-[var(--text-muted)]">
                <span className="text-xs">Press</span>
                <kbd className="bg-[var(--bg-surface-4)] border border-[var(--border-subtle)] rounded px-1.5 py-0.5 text-xs font-mono">
                  ⌘K
                </kbd>
                <span className="text-xs">or</span>
                <kbd className="bg-[var(--bg-surface-4)] border border-[var(--border-subtle)] rounded px-1.5 py-0.5 text-xs font-mono">
                  /
                </kbd>
                <span className="text-xs">to search</span>
                <span className="text-[var(--text-faint)] mx-1">·</span>
                <span className="text-xs">Press</span>
                <kbd className="bg-[var(--bg-surface-4)] border border-[var(--border-subtle)] rounded px-1.5 py-0.5 text-xs font-mono">
                  ?
                </kbd>
                <span className="text-xs">for shortcuts</span>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">
              Navigation
            </h4>
            <ul className="space-y-3">
              {navLinks.map((link) => (
                <li key={link.label}>
                  <button
                    onClick={() => onNavigate?.(link.page)}
                    className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors duration-200"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">
              Categories
            </h4>
            <ul className="space-y-3">
              {(categories.length > 0
                ? categories
                : ["Thinking", "Tools", "Knowledge", "Guide", "Design"]
              ).map((cat) => (
                <li key={cat}>
                  <button
                    onClick={() => onCategoryClick?.(cat)}
                    className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors duration-200"
                  >
                    {cat}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">
              Connect
            </h4>
            <ul className="space-y-3">
              {socialLinks.map((social) => (
                <li key={social.label}>
                  <a
                    href={social.href}
                    className="flex items-center gap-2.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors duration-200"
                  >
                    <social.icon className="h-4 w-4" />
                    {social.label}
                  </a>
                </li>
              ))}
              <li>
                <a
                  href="mailto:hello@secondbrain.dev"
                  className="flex items-center gap-2.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors duration-200"
                >
                  <Mail className="h-4 w-4" />
                  Email
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-[var(--border-subtle)] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[var(--text-muted)]">
            &copy; {new Date().getFullYear()} Second Brain. All rights reserved.
          </p>
          <p className="text-xs text-[var(--text-muted)]">
            Built with{" "}
            <span className="text-[var(--accent-gold)]">Obsidian</span> +{" "}
            <span className="text-[var(--accent-gold)]">Next.js</span>
          </p>
        </div>
      </div>
    </footer>
  );
}