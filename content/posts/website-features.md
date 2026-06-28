---
title: "Website Features"
date: 2025-06-28
tags: ["features", "guide", "search"]
category: "Guide"
draft: false
excerpt: "A tour of every feature your Second Brain blog ships with."
cover: "/covers/website-features.png"
---

Everything the blog does beyond rendering markdown.

## Search (Cmd+K)

Press `Cmd+K` on macOS or `Ctrl+K` on Windows/Linux to open the search dialog. It indexes post titles and body content, returns results as you type, and highlights matching text in gold. Navigate results with arrow keys, press Enter to select. The search index is built client-side — no server round-trips needed.

## 3-Column Article Layout

Articles render in three columns on desktop:

- **Left** — scroll-spy table of contents (h2 and h3 headings)
- **Center** — article content with breadcrumb and metadata
- **Right** — focused knowledge graph showing direct connections

On mobile, the center column takes full width, the TOC becomes a slide-out drawer, and the graph is hidden. The layout activates at the `lg` breakpoint (1024px).

## Table of Contents

Generated automatically from post headings. The active heading is tracked via IntersectionObserver — a heading becomes active when you scroll past 70% of its section. Clicking any item smooth-scrolls to that heading. The TOC is always visible on desktop and accessible via a drawer button on mobile.

## Bookmarks

Readers can save posts to a personal bookmarks list. Stored in `localStorage` — no account required. A dedicated bookmarks page shows all saved posts in a grid. Toggle bookmarks from any article view or the bookmarks page itself.

Note: since bookmarks use localStorage, each reader's bookmarks are private to their browser. They don't sync across devices.

## Categories

Posts are organized by the `category` frontmatter field. Five built-in categories: Guide, Thinking, Tools, Knowledge, Design. The blog listing page has category filter buttons. Each category has a distinct color used consistently across post cards, graph nodes, and filter buttons.

## Dark / Light Theme

The blog defaults to dark mode and respects the operating system's color scheme on first visit. The theme toggle in the header (sun/moon icon) lets readers override the preference, and the choice persists across sessions. The transition between themes is animated smoothly.

## Reading Progress Bar

A thin gold progress bar at the top of the viewport fills from left to right as you scroll through an article. It's article-specific and only appears when reading a post, not on the homepage or listing pages.

## Reading Stats

The blog tracks reading activity in `localStorage`:

- **Streak** — consecutive days of reading at least one article
- **Total read** — count of unique articles read

Stats are shown on the homepage hero section. Like bookmarks, they're private to the browser.

## Continue Reading

The homepage includes a "Continue Reading" section that tracks recently viewed posts. Returning visitors see their last-read posts as cards, making it easy to pick up where they left off.

## Audio and Video Embeds

- **Audio** — Use `![name](file.mp3)` to embed an audio player. Supports MP3, WAV, OGG, FLAC, AAC, M4A, WebM. Files go in `blog/attachments/` and are synced automatically.
- **Video** — Paste a YouTube or Vimeo URL on its own line to get an embedded video player. All YouTube URL formats are supported (watch, youtu.be, embed, shorts). An "Open in New Tab" button lets viewers watch on the original platform.

See [[audio-and-video]] for the full guide.

## Code Playground

Every code block with a supported language gets a **Run** button that executes the code live. An **Input (stdin)** field lets readers provide program input before running. Output appears in a panel below the code block.

See [[code-playground]] for the full guide.

## Keyboard Shortcuts

Press `?` to see all available shortcuts:

| Shortcut | Action |
|----------|--------|
| `Cmd+K` / `Ctrl+K` | Open search |
| `?` | Show keyboard shortcuts |
| `Esc` | Go back or close modal |
| `J` / `K` | Next / previous post |

## Back to Top

A floating button appears in the bottom-right corner after scrolling down. Clicking it smooth-scrolls to the top. It fades in and out based on scroll position.

## Responsive Design

Built mobile-first with Tailwind CSS. All touch targets meet the 44px minimum. The layout adapts at every breakpoint — single column on mobile, multi-column on desktop.

## RSS Feed

Auto-generated at `/rss.xml` with every published post's title, excerpt, date, and link. Submit the URL to any RSS reader.

## Sitemap

Auto-generated at `/sitemap.xml` listing all published posts with URLs and modification dates. Submit to Google Search Console for indexing.

## Wiki-Link Preview Cards

Hovering over any `[[wiki-link]]` shows a preview card with the linked post's title, excerpt, and category. Readers can decide whether to navigate without leaving the current article. The preview appears after a brief hover delay.

## Obsidian Ink

The blog renders Obsidian Ink SVG drawings inline. Write `handwritten-ink` or `handdrawn-ink` code blocks with SVG path data, and they render as live SVG graphics in your posts.

See [[obsidian-ink]] for the full guide.

## PDF Embeds

Link to a PDF file using markdown link syntax and it automatically embeds as an inline viewer with page navigation and a header bar showing the file name.

## Next Steps

- [[knowledge-graph]] — How the graph visualizes post connections.
- [[code-playground]] — Interactive code execution with stdin support.
- [[audio-and-video]] — Embed audio and video in your posts.
- [[deploy-to-vercel]] — Publish your blog to the web.