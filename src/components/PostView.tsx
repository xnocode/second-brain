"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Clock, Calendar, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

import { PostCard, type BlogPost } from "@/components/PostCard";
import { cn } from "@/lib/utils";
import { CodeBlockEnhancer } from "@/components/CodeBlockEnhancer";
import { MermaidRenderer } from "@/components/MermaidRenderer";
import { ShareButtons } from "@/components/ShareButtons";
import { BreadcrumbNav } from "@/components/BreadcrumbNav";
import { BookmarkButton } from "@/components/BookmarkButton";
import { MobileTocDrawer } from "@/components/MobileTocDrawer";
import { ReadingPosition } from "@/components/ReadingPosition";
import { ArticleGraph } from "@/components/InteractiveGraph";
import { DesktopToc } from "@/components/DesktopToc";
import { WikiLinkPreview } from "@/components/WikiLinkPreview";

interface PostViewProps {
  post: BlogPost & { content?: string };
  onBack: () => void;
  onPostClick: (slug: string) => void;
  onNavigate: (page: string) => void;
  onTagClick: (tag: string) => void;
  relatedPosts: BlogPost[];
}

export function PostView({ post, onBack, onPostClick, onNavigate, onTagClick, relatedPosts }: PostViewProps) {
  const [headings, setHeadings] = useState<{ id: string; text: string; level: number }[]>([]);
  const [activeHeading, setActiveHeading] = useState("");
  const [wordCount, setWordCount] = useState(0);
  const activeHeadingRef = useRef("");
  const isFirstRender = useRef(true);
  const isProgrammaticScroll = useRef(false);
  const headingIdsRef = useRef<string[]>([]);
  const contentRef = useRef<HTMLElement | null>(null);

  const scrollToHeading = useCallback((id: string) => {
    // Immediately highlight the clicked item
    setActiveHeading(id);
    activeHeadingRef.current = id;
    // Mark as programmatic scroll to prevent scroll-spy interference
    isProgrammaticScroll.current = true;
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    // Re-enable scroll-spy after scroll animation finishes
    setTimeout(() => {
      isProgrammaticScroll.current = false;
    }, 1000);
  }, []);

  // Extract headings from content for TOC (depends on DOM being ready)
  useEffect(() => {
    if (!post.content) return;
    const el = document.getElementById("post-content");
    if (!el) return;

    const headingEls = el.querySelectorAll("h2, h3");
    const items: { id: string; text: string; level: number }[] = [];
    headingEls.forEach((h) => {
      const id = h.id || h.textContent?.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "";
      if (!h.id) h.id = id;
      items.push({ id, text: h.textContent || "", level: h.tagName === "H2" ? 2 : 3 });
    });

    // Schedule heading update via requestAnimationFrame to avoid synchronous setState
    const rafId = requestAnimationFrame(() => {
      setHeadings(items);
    });

    // Store heading IDs for scroll-spy
    headingIdsRef.current = items.map((item) => item.id);

    // Scroll-spy: find the last heading that has scrolled past the top portion of the viewport
    const updateActiveOnScroll = () => {
      if (isProgrammaticScroll.current) return;

      const ids = headingIdsRef.current;
      if (ids.length === 0) return;

      // Default to first heading if none found
      let activeId = ids[0];
      // Use a generous threshold: any heading visible in the top 70% of the viewport
      // is considered "past". This handles articles with tall code blocks between headings.
      const threshold = window.innerHeight * 0.7;

      // Walk backwards to find the last heading above the threshold
      for (let i = ids.length - 1; i >= 0; i--) {
        const el = document.getElementById(ids[i]);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        if (rect.top <= threshold) {
          activeId = ids[i];
          break;
        }
      }

      if (activeHeadingRef.current !== activeId) {
        activeHeadingRef.current = activeId;
        requestAnimationFrame(() => setActiveHeading(activeId));
      }
    };

    // Use IntersectionObserver for efficiency, plus a scroll listener as backup
    const observer = new IntersectionObserver(
      (entries) => {
        if (isProgrammaticScroll.current) return;
        // On each intersection change, run the full scroll-spy check
        updateActiveOnScroll();
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: [0, 1] }
    );

    headingEls.forEach((h) => observer.observe(h));

    // Also listen for scroll events as a reliable fallback
    let scrollRafId = 0;
    const onScroll = () => {
      cancelAnimationFrame(scrollRafId);
      scrollRafId = requestAnimationFrame(updateActiveOnScroll);
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    // Set initial active heading
    updateActiveOnScroll();

    isFirstRender.current = false;
    return () => {
      cancelAnimationFrame(rafId);
      cancelAnimationFrame(scrollRafId);
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, [post.content]);

  // Compute word count from content (no DOM dependency)
  useEffect(() => {
    if (!post.content) return;
    const plainText = post.content.replace(/<[^>]*>/g, "").replace(/&\w+;/g, " ");
    const count = plainText.split(/\s+/).filter(Boolean).length;
    const wcRaf = requestAnimationFrame(() => setWordCount(count));
    return () => cancelAnimationFrame(wcRaf);
  }, [post.content]);

  // Attach click handlers for video preview thumbnails
  useEffect(() => {
    if (!post.content) return;
    const el = document.getElementById("post-content");
    if (!el) return;

    const handlePreviewClick = (e: Event) => {
      const target = (e.target as HTMLElement).closest("[data-video-embed-preview]");
      if (!target) return;
      e.preventDefault();
      e.stopPropagation();

      const wrapper = target.closest(".video-embed-wrapper");
      if (!wrapper) return;

      // Hide the preview thumbnail
      target.remove();

      // Move data-src to src so iframe only loads when user clicks
      const iframe = wrapper.querySelector("iframe[data-video-embed-iframe]") as HTMLIFrameElement;
      if (iframe) {
        const dataSrc = iframe.getAttribute("data-src");
        if (dataSrc) {
          iframe.src = dataSrc;
          iframe.removeAttribute("data-src");
        }
      }

      // Show the iframe container
      const container = wrapper.querySelector(".video-embed-container") as HTMLElement;
      if (container) {
        container.style.display = "";
      }

      // Hide the header when video is playing
      const header = wrapper.querySelector(".video-embed-header") as HTMLElement;
      if (header) {
        header.style.display = "none";
      }
    };

    el.addEventListener("click", handlePreviewClick);
    return () => el.removeEventListener("click", handlePreviewClick);
  }, [post.content]);

  return (
    <div className="min-h-screen">
      {/* Back button */}
      <div className="fixed top-20 left-4 sm:left-6 lg:left-8 z-30">
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Button
            variant="ghost"
            onClick={onBack}
            className="back-button gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[rgba(5,5,5,0.6)] backdrop-blur-md border border-[var(--border-subtle)] hover:bg-[rgba(22,22,22,0.8)] rounded-lg h-9 px-3"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Back</span>
          </Button>
        </motion.div>
      </div>

      {/* Content + TOC + Graph layout — 3-column */}
      <div className="relative max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-32">
        <div className="flex gap-8 lg:gap-10">
          {/* Left TOC Sidebar — desktop only */}
          {headings.length > 0 && (
            <aside className="hidden xl:flex flex-col w-52 shrink-0">
              <div className="sticky top-24">
                <p className="text-overline mb-4">On this page</p>
                <DesktopToc
                  headings={headings}
                  activeHeading={activeHeading}
                  onHeadingClick={scrollToHeading}
                />
              </div>
            </aside>
          )}

          {/* Center Column — meta + content */}
          <div className="flex-1 min-w-0 max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" as const }}
              className="mb-8"
            >
              {/* Breadcrumb (includes title) */}
              <div className="mb-4">
                <BreadcrumbNav
                  category={post.category}
                  title={post.title}
                  onNavigate={onNavigate}
                  onBack={onBack}
                />
              </div>

              {/* Meta row */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-[var(--text-muted)]">
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  {post.date}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  {post.readingTime}
                </span>
                <ReadingPosition
                  totalHeadings={headings.length}
                  activeHeadingIndex={headings.findIndex((h) => h.id === activeHeading)}
                />
                {wordCount > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[rgba(16,185,129,0.1)] text-[#34d399] text-xs font-medium">
                    <FileText className="h-3 w-3" />
                    {wordCount.toLocaleString()} words
                  </span>
                )}
                <ShareButtons title={post.title} slug={post.slug} />
                <BookmarkButton slug={post.slug} size="sm" />
              </div>

              {/* Tags */}
              {post.tags.length > 0 && (
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {post.tags.map((tag) => (
                    <button
                      key={tag}
                      onClick={(e) => {
                        e.stopPropagation();
                        onTagClick(tag);
                      }}
                      className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium text-[var(--text-secondary)] bg-[var(--bg-surface-3)] border border-[var(--border-subtle)] hover:border-[var(--accent-gold)] hover:text-[var(--accent-gold)] transition-all duration-200"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              )}
            </motion.div>

            <motion.article
              ref={(el) => { contentRef.current = el; }}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.5 }}
              id="post-content"
              className="prose"
            >
              {post.content ? (
                <div
                  dangerouslySetInnerHTML={{
                    __html: post.content,
                  }}
                />
              ) : (
                <p className="text-[var(--text-muted)] italic">
                  Content loading...
                </p>
              )}
            </motion.article>
            {/* Wiki-link hover preview */}
            <WikiLinkPreview
              containerRef={contentRef}
              onNavigate={onPostClick}
            />
            <CodeBlockEnhancer />
            <MermaidRenderer />
            <MobileTocDrawer headings={headings} activeHeading={activeHeading} onHeadingClick={scrollToHeading} />
          </div>

          {/* Right Graph Sidebar — desktop only */}
          <aside className="hidden lg:flex flex-col w-60 shrink-0">
            <div className="sticky top-24">
              <ArticleGraph
                currentSlug={post.slug}
                onNavigate={onPostClick}
              />
            </div>
          </aside>
        </div>
      </div>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <section className="mt-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pb-16">
          <div className="border-t border-[var(--border-subtle)] pt-12">
            <h2 className="text-h3 text-[var(--text-primary)] mb-8">Related Posts</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedPosts.map((rp) => (
                <PostCard key={rp.slug} post={rp} onClick={onPostClick} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}