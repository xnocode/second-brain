"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { BlogGrid } from "@/components/BlogGrid";
import { FeaturedPost } from "@/components/FeaturedPost";
import { PostView } from "@/components/PostView";
import { Footer } from "@/components/Footer";
import { SearchDialog } from "@/components/SearchDialog";
import { ReadingProgress } from "@/components/ReadingProgress";
import { BackToTop } from "@/components/BackToTop";

import { AboutSection } from "@/components/AboutSection";
import { EmptyState } from "@/components/EmptyState";
import { TagCloud } from "@/components/TagCloud";
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "sonner";
import { ReadingStats } from "@/components/ReadingStats";
import { KeyboardShortcutsDialog } from "@/components/KeyboardShortcutsDialog";
import { BookOpen, LayoutGrid, List } from "lucide-react";
import { FullGraphModal, GraphToggleButton } from "@/components/InteractiveGraph";
import type { BlogPost } from "@/components/PostCard";
import { getBookmarks, toggleBookmark } from "@/lib/bookmarks";
import { getReadingStreak, getTotalRead, markAsRead, getRecentlyReadSlugs } from "@/lib/reading-history";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type Page =
  | { view: "home" }
  | { view: "blog" }
  | { view: "post"; slug: string }
  | { view: "categories" }
  | { view: "about" }
  | { view: "bookmarks" };

interface SiteData {
  postCount: number;
  categoryCount: number;
  tagCount: number;
  posts: BlogPost[];
  categories: { name: string; count: number }[];
  tags: { tag: string; count: number }[];
}

interface PostDetail extends BlogPost {
  content?: string;
}

/* ------------------------------------------------------------------ */
/*  Page transitions                                                   */
/* ------------------------------------------------------------------ */

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.25 } },
};

/* ------------------------------------------------------------------ */
/*  Main App Component                                                 */
/* ------------------------------------------------------------------ */

export default function HomePage() {
  const [page, setPage] = useState<Page>({ view: "home" });
  const [data, setData] = useState<SiteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [graphModalOpen, setGraphModalOpen] = useState(false);
  const [focusedPostIndex, setFocusedPostIndex] = useState(-1);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  // filteredPosts is derived — computed via useMemo below
  const [postDetail, setPostDetail] = useState<PostDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [bookmarkSlugs, setBookmarkSlugs] = useState<string[]>(() => getBookmarks());
  const [readingStreak, setReadingStreak] = useState(0);
  const [totalRead, setTotalRead] = useState(0);

  /* ---------- fetch site data ---------- */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [postsRes, catsRes, tagsRes, tagsCloudRes] = await Promise.all([
          fetch("/api/posts"),
          fetch("/api/categories"),
          fetch("/api/tags"),
          fetch("/api/tags-cloud"),
        ]);
        const postsData = await postsRes.json();
        const catsData = await catsRes.json();
        const tagsData = await tagsRes.json();
        const tagsCloudData = await tagsCloudRes.json();

        const posts: BlogPost[] = (postsData.posts || []).map(
          (p: Record<string, unknown>) => ({
            slug: p.slug as string,
            title: p.title as string,
            date: p.date as string,
            excerpt: p.excerpt as string,
            tags: (p.tags as string[]) || [],
            category: (p.category as string) || "Uncategorized",
            readingTime: p.readingTime as string,
            cover: p.cover as string | undefined,
          })
        );

        const categories: { name: string; count: number }[] = (
          catsData.categories || []
        ).map((c: Record<string, unknown>) => ({
          name: c.category as string,
          count: c.count as number,
        }));

        const tags: { tag: string; count: number }[] =
          tagsData.tags || [];

        if (cancelled) return;
        setData({
          postCount: posts.length,
          categoryCount: categories.length,
          tagCount: tags.length,
          posts,
          categories,
          tags: tagsCloudData.tags || [],
        });
      } catch (err) {
        console.error("Failed to fetch site data:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  /* ---------- navigation ---------- */
  const navigate = useCallback((target: string) => {
    if (
      target === "home" ||
      target === "blog" ||
      target === "categories" ||
      target === "about" ||
      target === "bookmarks"
    ) {
      setPage({ view: target });
      setActiveCategory(null);
      setActiveTag(null);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, []);

  const openPost = useCallback(
    async (slug: string) => {
      setPage({ view: "post", slug });
      setDetailLoading(true);
      window.scrollTo({ top: 0, behavior: "instant" });

      try {
        const res = await fetch(`/api/posts?slug=${encodeURIComponent(slug)}`);
        const json = await res.json();
        if (json.post) {
          setPostDetail(json.post as PostDetail);
          markAsRead(slug);
        }
      } catch (err) {
        console.error("Failed to fetch post:", err);
      } finally {
        setDetailLoading(false);
      }
    },
    []
  );

  const goBack = useCallback(() => {
    setPage({ view: "blog" });
    setPostDetail(null);
  }, []);

  /* ---------- category filter ---------- */
  const filteredPosts = useMemo(() => {
    if (!data) return [];
    if (activeCategory === null) {
      if (activeTag) {
        return data.posts.filter((p) =>
          p.tags.some((t) => t.toLowerCase() === activeTag.toLowerCase())
        );
      }
      return data.posts;
    }
    return data.posts.filter((p) => p.category === activeCategory);
  }, [data, activeCategory, activeTag]);

  /* ---------- tag click from article ---------- */
  const handleTagClick = useCallback(
    (tag: string) => {
      setActiveTag(tag);
      setActiveCategory(null);
      setPage({ view: "blog" });
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    []
  );

  /* ---------- bookmarks sync ---------- */
  const refreshBookmarks = useCallback(() => {
    setBookmarkSlugs(getBookmarks());
  }, []);

  const postSlugs = useMemo(() => data?.posts.map(p => p.slug) ?? [], [data?.posts]);
  const refreshReadingStats = useCallback(() => {
    const s = getReadingStreak();
    const t = getTotalRead(postSlugs);
    requestAnimationFrame(() => {
      setReadingStreak(s);
      setTotalRead(t);
    });
  }, [postSlugs]);

  /* ---------- recently read ---------- */
  const [recentReadSlugs, setRecentReadSlugs] = useState<string[]>(() => getRecentlyReadSlugs(5));

  const refreshRecentRead = useCallback(() => {
    setRecentReadSlugs(getRecentlyReadSlugs(5));
  }, []);

  useEffect(() => {
    const onBookmarksChanged = () => refreshBookmarks();
    const onHistoryChanged = () => {
      refreshReadingStats();
      refreshRecentRead();
    };
    window.addEventListener("bookmarks-changed", onBookmarksChanged);
    window.addEventListener("reading-history-changed", onHistoryChanged);
    return () => {
      window.removeEventListener("bookmarks-changed", onBookmarksChanged);
      window.removeEventListener("reading-history-changed", onHistoryChanged);
    };
  }, [refreshBookmarks, refreshReadingStats, refreshRecentRead]);

  /* ---------- bookmarked posts ---------- */
  const bookmarkedPosts: BlogPost[] = (() => {
    if (!data) return [];
    return data.posts.filter((p) => bookmarkSlugs.includes(p.slug));
  })();

  /* ---------- recently read posts ---------- */
  const recentlyReadPosts: BlogPost[] = (() => {
    if (!data) return [];
    return data.posts.filter((p) => recentReadSlugs.includes(p.slug));
  })();

  /* ---------- search shortcut ---------- */
  useEffect(() => {
    const isTypingElement = (el: HTMLElement | null): boolean => {
      if (!el) return false;
      const tag = el.tagName.toLowerCase();
      return tag === "input" || tag === "textarea" || el.isContentEditable;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
        return;
      }
      if (e.key === "/" && !isTypingElement(e.target as HTMLElement)) {
        e.preventDefault();
        setSearchOpen(true);
        return;
      }
      if (e.key === "?" && !isTypingElement(e.target as HTMLElement)) {
        e.preventDefault();
        setShortcutsOpen((v) => !v);
        return;
      }
      // j/k navigation in blog view
      if ((e.key === "j" || e.key === "k") && !isTypingElement(e.target as HTMLElement)) {
        const currentView = document.querySelector('[data-page-view]');
        if (currentView?.getAttribute("data-page-view") === "blog") {
          e.preventDefault();
          setFocusedPostIndex((prev) => {
            const max = filteredPosts.length - 1;
            const next = e.key === "j"
              ? Math.min(prev + 1, max)
              : Math.max(prev - 1, 0);
            // Scroll the post card into view
            const cards = document.querySelectorAll('[data-post-card]');
            if (cards[next]) {
              cards[next].scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return next;
          });
        }
      }
    };
    const handleOpenSearch = () => setSearchOpen(true);
    const handleNavigatePost = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.slug) openPost(detail.slug);
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("open-search", handleOpenSearch);
    window.addEventListener("navigate-post", handleNavigatePost);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("open-search", handleOpenSearch);
      window.removeEventListener("navigate-post", handleNavigatePost);
    };
  }, []);

  /* ---------- derive current page label ---------- */
  const currentPageLabel =
    page.view === "post"
      ? "blog"
      : page.view === "categories"
      ? "categories"
      : page.view === "bookmarks"
      ? "bookmarks"
      : page.view;

  /* ---------- related posts ---------- */
  const relatedPosts: BlogPost[] = (() => {
    if (!postDetail || !data) return [];
    const matched = data.posts.filter(
      (p) =>
        p.slug !== postDetail.slug &&
        (p.category === postDetail.category ||
          p.tags.some((t) => postDetail.tags.includes(t)))
    );
    // Fallback to recent posts if no matches
    if (matched.length === 0) {
      return data.posts.filter((p) => p.slug !== postDetail.slug).slice(0, 3);
    }
    return matched.slice(0, 3);
  })();

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <div className="relative min-h-screen flex flex-col bg-[var(--bg-base)]">
      <ReadingProgress />
      {/* Header */}
      <Header currentPage={currentPageLabel} onNavigate={navigate} />

      {/* Main Content */}
      <main className="flex-1">
        <AnimatePresence mode="wait">
          {/* ====== HOME ====== */}
          {page.view === "home" && (
            <motion.div
              key="home"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              {loading ? (
                <HomeSkeleton />
              ) : data ? (
                <>
                  <Hero
                    postCount={data.postCount}
                    categoryCount={data.categoryCount}
                    tagCount={data.tagCount}
                    readingStreak={readingStreak}
                    totalRead={totalRead}
                    onNavigate={navigate}
                  />

                  {/* Featured Post */}
                  {data.posts.length > 0 && (
                    <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mt-8 mb-16">
                      <FeaturedPost
                        post={data.posts[0]}
                        onClick={openPost}
                      />
                    </section>
                  )}

                  {/* Continue Reading — recently read posts */}
                  {recentlyReadPosts.length > 0 && (
                    <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mb-16">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[var(--border-subtle)] to-transparent" />
                      </div>
                      <div className="flex items-center gap-3 mb-6">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent-gold-muted)] text-[var(--accent-gold)]">
                          <BookOpen className="h-4 w-4" />
                        </div>
                        <div>
                          <span className="text-overline">Pick Up Where You Left Off</span>
                          <h2 className="text-h3 text-[var(--text-primary)] mt-0.5">
                            Continue Reading
                          </h2>
                        </div>
                      </div>
                      <BlogGrid posts={recentlyReadPosts.slice(0, 3)} onPostClick={openPost} />
                    </section>
                  )}

                  {/* Popular Tags */}
                  {data.tags.length > 0 && (
                    <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mb-16">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[var(--border-subtle)] to-transparent" />
                      </div>
                      <div className="mb-5">
                        <span className="text-overline">Discover</span>
                        <h2 className="text-h3 text-[var(--text-primary)] mt-2">
                          Popular Tags
                        </h2>
                      </div>
                      <TagCloud
                        tags={data.tags.slice(0, 8)}
                        onTagClick={(tag) => {
                          setActiveCategory(null);
                          setActiveTag(tag);
                          navigate("blog");
                        }}
                      />
                    </section>
                  )}

                  {/* Recent Posts */}
                  {data.posts.length > 1 && (
                    <section className="mb-24">
                      <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                        <div className="flex items-center gap-4 mb-6">
                          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[var(--border-subtle)] to-transparent" />
                        </div>
                      </div>
                      <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mb-8 flex items-end justify-between">
                        <div>
                          <span className="text-overline">Latest</span>
                          <h2 className="text-h2 text-[var(--text-primary)] mt-2">
                            Recent Articles
                          </h2>
                        </div>
                        <button
                          onClick={() => navigate("blog")}
                          className="text-sm text-[var(--accent-gold)] hover:text-[var(--accent-gold-hover)] transition-colors hidden sm:block"
                        >
                          View all →
                        </button>
                      </div>
                      <BlogGrid
                        posts={data.posts.slice(1, 7)}
                        onPostClick={openPost}
                      />
                    </section>
                  )}

                  {/* About Section */}
                  <AboutSection />


                </>
              ) : (
                <EmptyState
                  title="Welcome to Second Brain"
                  description="No posts yet. Add markdown files to content/posts/ to get started."
                />
              )}
            </motion.div>
          )}

          {/* ====== BLOG ====== */}
          {page.view === "blog" && (
            <motion.div
              key="blog"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="pt-24 pb-16"
              data-page-view="blog"
            >
              <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                {/* Page Header */}
                <div className="mb-10 flex items-start justify-between">
                  <div>
                    <span className="text-overline">Archive</span>
                    <h1 className="text-h1 text-[var(--text-primary)] mt-2">
                      {activeTag ? (
                        <span className="flex items-center gap-3">
                          Articles tagged
                          <span className="inline-flex items-center px-3 py-1 rounded-lg text-[var(--accent-gold)] bg-[var(--accent-gold-muted)] border border-[rgba(226,179,64,0.15)]">{activeTag}</span>
                        </span>
                      ) : activeCategory ? (
                        <span className="flex items-center gap-3">
                          {activeCategory}
                        </span>
                      ) : (
                        "All Articles"
                      )}
                    </h1>
                    <p className="mt-3 text-[var(--text-secondary)] text-lg max-w-2xl">
                      {activeTag
                        ? `${filteredPosts.length} article${filteredPosts.length !== 1 ? "s" : ""} with the tag "${activeTag}".`
                        : activeCategory
                          ? `${filteredPosts.length} article${filteredPosts.length !== 1 ? "s" : ""} in the ${activeCategory} category.`
                          : "Explore the complete collection of notes, guides, and thoughts published on Second Brain."
                      }
                    </p>
                    {(activeTag || activeCategory) && (
                      <button
                        onClick={() => { setActiveTag(null); setActiveCategory(null); }}
                        className="mt-3 text-sm text-[var(--accent-gold)] hover:text-[var(--accent-gold-hover)] transition-colors"
                      >
                        ← Show all articles
                      </button>
                    )}
                  </div>
                  <GraphToggleButton onClick={() => setGraphModalOpen(true)} />
                </div>

                {/* Posts Grid */}
                {loading ? (
                  <BlogSkeleton />
                ) : filteredPosts.length > 0 ? (
                  <BlogGrid
                    posts={filteredPosts}
                    onPostClick={openPost}
                    showViewToggle
                  />
                ) : (
                  <EmptyState
                    title="No articles found"
                    description={
                      activeTag
                        ? `No articles with the tag "${activeTag}" yet.`
                        : activeCategory
                          ? `No articles in the "${activeCategory}" category yet.`
                          : "Start adding markdown files to content/posts/ to see them here."
                    }
                    actionLabel={activeTag || activeCategory ? "Show all articles" : undefined}
                    onAction={
                      activeTag || activeCategory
                        ? () => { setActiveTag(null); setActiveCategory(null); }
                        : undefined
                    }
                  />
                )}
              </div>
            </motion.div>
          )}

          {/* ====== CATEGORIES ====== */}
          {page.view === "categories" && (
            <motion.div
              key="categories"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="pt-24 pb-16"
            >
              <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                <div className="mb-10">
                  <span className="text-overline">Browse</span>
                  <h1 className="text-h1 text-[var(--text-primary)] mt-2">
                    Categories
                  </h1>
                  <p className="mt-3 text-[var(--text-secondary)] text-lg max-w-2xl">
                    Browse articles by topic. Click a category to filter the
                    blog.
                  </p>
                </div>

                {loading ? (
                  <BlogSkeleton />
                ) : data && data.categories.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {data.categories.map((cat, i) => (
                      <motion.button
                        key={cat.name}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          delay: i * 0.06,
                          duration: 0.4,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                        onClick={() => {
                          setActiveCategory(cat.name);
                          setActiveTag(null);
                          setPage({ view: "blog" });
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        className="group relative flex items-center justify-between rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-3)] hover:border-[rgba(226,179,64,0.3)] p-6 text-left transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.3),0_0_15px_rgba(226,179,64,0.06)]"
                      >
                        <div>
                          <h3 className="text-lg font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent-gold)] transition-colors duration-300">
                            {cat.name}
                          </h3>
                          <p className="text-sm text-[var(--text-muted)] mt-1">
                            {cat.count} article{cat.count !== 1 ? "s" : ""}
                          </p>
                        </div>
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent-gold-muted)] text-[var(--accent-gold)] group-hover:bg-[rgba(226,179,64,0.25)] transition-colors duration-300">
                          <span className="text-sm font-bold">{cat.count}</span>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    title="No categories yet"
                    description="Categories will appear as you add posts with different categories."
                  />
                )}
              </div>
            </motion.div>
          )}

          {/* ====== BOOKMARKS ====== */}
          {page.view === "bookmarks" && (
            <motion.div
              key="bookmarks"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="pt-24 pb-16"
            >
              <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                {/* Page Header */}
                <div className="mb-10">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[var(--border-subtle)] to-transparent" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-overline">Saved</span>
                      <h1 className="text-h1 text-[var(--text-primary)] mt-2">
                        Bookmarks
                      </h1>
                      <p className="mt-3 text-[var(--text-secondary)] text-lg max-w-2xl">
                        {bookmarkedPosts.length > 0
                          ? `You have ${bookmarkedPosts.length} saved article${bookmarkedPosts.length !== 1 ? "s" : ""} for later reading.`
                          : "No bookmarks yet. Save articles to read later."}
                      </p>
                    </div>
                    {bookmarkedPosts.length > 0 && (
                      <ClearAllButton />
                    )}
                  </div>
                  {readingStreak > 0 && totalRead > 0 && (
                    <div className="mt-4">
                      <ReadingStats validSlugs={data?.posts.map(p => p.slug)} />
                    </div>
                  )}
                </div>

                {/* Recently Read Posts */}
                {recentlyReadPosts.length > 0 && (
                  <div className="mb-12">
                    <h2 className="text-h3 text-[var(--text-primary)] mb-6">Recently Read</h2>
                    <BlogGrid posts={recentlyReadPosts} onPostClick={openPost} />
                  </div>
                )}

                {/* Bookmarked Posts Grid */}
                {loading ? (
                  <BlogSkeleton />
                ) : bookmarkedPosts.length > 0 ? (
                  <BlogGrid
                    posts={bookmarkedPosts}
                    onPostClick={openPost}
                  />
                ) : (
                  <EmptyState
                    title="No bookmarks yet"
                    description="Save articles to read later by clicking the bookmark icon on any post."
                    actionLabel="Browse Articles"
                    onAction={() => navigate("blog")}
                  />
                )}
              </div>
            </motion.div>
          )}

          {/* ====== POST DETAIL ====== */}
          {page.view === "post" && (
            <motion.div
              key={`post-${page.slug}`}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              {detailLoading ? (
                <PostDetailSkeleton />
              ) : postDetail ? (
                <PostView
                  post={postDetail}
                  onBack={goBack}
                  onPostClick={openPost}
                  onNavigate={navigate}
                  onTagClick={handleTagClick}
                  relatedPosts={relatedPosts}
                />
              ) : (
                <div className="pt-32">
                  <EmptyState
                    title="Post not found"
                    description="The article you're looking for doesn't exist or may have been moved."
                    actionLabel="Back to Blog"
                    onAction={() => navigate("blog")}
                  />
                </div>
              )}
            </motion.div>
          )}

          {/* ====== ABOUT ====== */}
          {page.view === "about" && (
            <motion.div
              key="about"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="pt-24 pb-16"
            >
              <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                <div className="max-w-3xl mx-auto">
                  {/* About Header */}
                  <div className="text-center mb-16">
                    <span className="text-overline">About</span>
                    <h1 className="text-h1 text-[var(--text-primary)] mt-3">
                      About Second Brain
                    </h1>
                    <p className="mt-4 text-[var(--text-secondary)] text-lg leading-relaxed">
                      Second Brain is a personal knowledge repository designed
                      for developers, thinkers, and lifelong learners. It
                      transforms scattered notes into a structured, searchable
                      knowledge base.
                    </p>
                  </div>

                  {/* Philosophy */}
                  <div className="mb-16 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-3)] p-8 sm:p-10">
                    <h2 className="text-h3 text-[var(--text-primary)] mb-4">
                      The Philosophy
                    </h2>
                    <div className="text-[var(--text-secondary)] leading-relaxed space-y-4">
                      <p>
                        In a world of information overload, the ability to
                        capture, organize, and retrieve knowledge is a
                        superpower. Second Brain is built on the principle that
                        your notes should work for you — not the other way
                        around.
                      </p>
                      <p>
                        Inspired by the Zettelkasten method and tools like
                        Obsidian, this platform treats every note as a node in
                        a growing network of understanding. Ideas connect,
                        patterns emerge, and knowledge compounds over time.
                      </p>
                      <p>
                        Every article published here started as a rough note in
                        Obsidian, was refined through iterative thinking, and
                        emerged as a polished piece of knowledge worth sharing.
                      </p>
                    </div>
                  </div>

                  {/* How it works */}
                  <div className="mb-16">
                    <h2 className="text-h3 text-[var(--text-primary)] mb-8 text-center">
                      How It Works
                    </h2>
                    <div className="space-y-6">
                      {[
                        {
                          step: "01",
                          title: "Write in Obsidian",
                          description:
                            "Create markdown files in your blog/ folder using Obsidian or any editor. Add YAML frontmatter with title, date, tags, category, and set draft: false to publish.",
                        },
                        {
                          step: "02",
                          title: "Sync & Preview",
                          description:
                            "Run `bun run scripts/sync-vault.ts` to process your posts, then `bun run dev` to preview everything locally. Verify it looks right before going live.",
                        },
                        {
                          step: "03",
                          title: "Go Live",
                          description:
                            "Run `bun run publish` — it syncs your posts, commits, and pushes to GitHub. Vercel auto-deploys. Your Second Brain is live.",
                        },
                      ].map((item, i) => (
                        <motion.div
                          key={item.step}
                          initial={{ opacity: 0, y: 16 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{
                            delay: 0.1 + i * 0.1,
                            duration: 0.5,
                            ease: [0.22, 1, 0.36, 1],
                          }}
                          className="flex gap-6 items-start rounded-xl border border-[var(--border-subtle)] glass p-6 sm:p-8 hover:border-[rgba(226,179,64,0.2)] transition-colors duration-300"
                        >
                          <div className="shrink-0 flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent-gold-muted)] text-[var(--accent-gold)] font-bold text-lg">
                            {item.step}
                          </div>
                          <div>
                            <h3 className="text-base font-semibold text-[var(--text-primary)] mb-2">
                              {item.title}
                            </h3>
                            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                              {item.description}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Obsidian Integration */}
                  <div className="mb-16 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-3)] p-8 sm:p-10">
                    <h2 className="text-h3 text-[var(--text-primary)] mb-4">
                      Obsidian Integration
                    </h2>
                    <p className="text-[var(--text-secondary)] leading-relaxed mb-6">
                      Second Brain is designed to work seamlessly with Obsidian.
                      Your vault is the source of truth. The website is just a
                      beautiful window into your published thoughts.
                    </p>
                    <div className="rounded-lg bg-[var(--bg-surface-2)] border border-[var(--border-subtle)] p-4 sm:p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="h-3 w-3 rounded-full bg-red-500/60" />
                        <div className="h-3 w-3 rounded-full bg-yellow-500/60" />
                        <div className="h-3 w-3 rounded-full bg-green-500/60" />
                        <span className="ml-2 text-xs text-[var(--text-faint)]">
                          example-note.md
                        </span>
                      </div>
                      <pre className="text-sm text-[var(--text-secondary)] font-mono leading-relaxed overflow-x-auto">
                        <code>{`---
title: "My Published Note"
date: 2025-01-15
tags: [productivity, thinking]
category: "Thinking"
draft: false
excerpt: "A short description"
---

# My Published Note

This note will appear on the website because
\`draft\` is set to \`false\`.

## Key Points

- Write markdown in the blog/ folder
- Set \`draft: false\` to publish
- Run \`bun run scripts/sync-vault.ts\` then \`bun run dev\` to preview`}</code>
                      </pre>
                    </div>
                  </div>

                  {/* Features Grid */}
                  <AboutSection />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer — hidden on post detail for cleaner reading */}
      {page.view !== "post" && (
        <Footer
          categories={data?.categories.map((c) => c.name) || []}
          onNavigate={navigate}
          onCategoryClick={(cat) => {
            setActiveCategory(cat);
            navigate("blog");
          }}
        />
      )}

      {/* Search Dialog */}
      <SearchDialog
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onPostClick={openPost}
      />
      <KeyboardShortcutsDialog
        open={shortcutsOpen}
        onClose={() => setShortcutsOpen(false)}
      />
      <BackToTop />

      {/* Full Graph Modal */}
      <FullGraphModal
        open={graphModalOpen}
        onClose={() => setGraphModalOpen(false)}
        onNavigate={openPost}
      />
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: "var(--bg-surface-3, #161616)",
            border: "1px solid var(--border-subtle, rgba(255,255,255,0.06))",
            color: "var(--text-primary, #e5e5e5)",
          },
        }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Skeleton Loaders                                                   */
/* ------------------------------------------------------------------ */

function HomeSkeleton() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <Skeleton className="h-4 w-32 mb-6 bg-[var(--bg-surface-4)]" />
      <Skeleton className="h-20 w-80 mb-4 bg-[var(--bg-surface-4)] rounded-lg" />
      <Skeleton className="h-6 w-64 mb-10 bg-[var(--bg-surface-4)]" />
      <Skeleton className="h-12 w-40 bg-[var(--bg-surface-4)] rounded-lg" />
    </div>
  );
}

function BlogSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-3)] overflow-hidden"
        >
          <Skeleton className="h-48 w-full bg-[var(--bg-surface-4)]" />
          <div className="p-5 space-y-3">
            <Skeleton className="h-4 w-16 bg-[var(--bg-surface-4)] rounded" />
            <Skeleton className="h-5 w-full bg-[var(--bg-surface-4)] rounded" />
            <Skeleton className="h-5 w-3/4 bg-[var(--bg-surface-4)] rounded" />
            <Skeleton className="h-4 w-full bg-[var(--bg-surface-4)] rounded" />
            <Skeleton className="h-4 w-2/3 bg-[var(--bg-surface-4)] rounded" />
            <div className="flex gap-3 pt-2">
              <Skeleton className="h-3 w-20 bg-[var(--bg-surface-4)] rounded" />
              <Skeleton className="h-3 w-16 bg-[var(--bg-surface-4)] rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ClearAllButton() {
  const [confirming, setConfirming] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleClick = () => {
    if (!confirming) {
      requestAnimationFrame(() => setConfirming(true));
      timerRef.current = setTimeout(() => {
        requestAnimationFrame(() => setConfirming(false));
      }, 3000);
    } else {
      if (timerRef.current) clearTimeout(timerRef.current);
      const bookmarks = getBookmarks();
      bookmarks.forEach((slug) => toggleBookmark(slug));
      requestAnimationFrame(() => setConfirming(false));
    }
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        "shrink-0 text-sm px-3 py-1.5 rounded-lg border transition-all duration-200",
        confirming
          ? "text-red-400 border-red-400/30 bg-red-400/5 hover:bg-red-400/10"
          : "text-[var(--text-muted)] border-[var(--border-subtle)] hover:text-[var(--text-secondary)] hover:border-[var(--border-default)]"
      )}
    >
      {confirming ? "Confirm?" : "Clear All"}
    </button>
  );
}

function PostDetailSkeleton() {
  return (
    <div className="pt-32 pb-16 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto">
      <Skeleton className="h-5 w-20 bg-[var(--bg-surface-4)] rounded mb-4" />
      <Skeleton className="h-12 w-full bg-[var(--bg-surface-4)] rounded-lg mb-4" />
      <Skeleton className="h-12 w-3/4 bg-[var(--bg-surface-4)] rounded-lg mb-6" />
      <div className="flex gap-4 mb-8">
        <Skeleton className="h-4 w-24 bg-[var(--bg-surface-4)] rounded" />
        <Skeleton className="h-4 w-20 bg-[var(--bg-surface-4)] rounded" />
        <Skeleton className="h-4 w-32 bg-[var(--bg-surface-4)] rounded" />
      </div>
      <div className="space-y-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton
            key={i}
            className="h-4 w-full bg-[var(--bg-surface-4)] rounded"
            style={{ width: `${Math.random() * 40 + 60}%` }}
          />
        ))}
      </div>
    </div>
  );
}