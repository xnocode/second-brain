import { NextRequest, NextResponse } from "next/server";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeSlug from "rehype-slug";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { rehypeWikiLinks } from "@/lib/rehype-wiki-links";
import { transformInkEmbeds } from "@/lib/transform-ink-embeds";
import {
  getAllPosts,
  getPostBySlug,
  getPostsByCategory,
  getPostsByTag,
  searchPosts,
  type Post,
} from "@/lib/content";

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function postToSummary(post: Post) {
  return {
    slug: post.slug,
    title: post.frontmatter.title,
    date: formatDate(post.frontmatter.date),
    excerpt: post.frontmatter.excerpt || "",
    tags: post.frontmatter.tags || [],
    category: post.frontmatter.category || "Uncategorized",
    readingTime: post.readingTime,
    cover: post.frontmatter.cover,
    author: post.frontmatter.author,
  };
}

/** Extract a highlight snippet from full content around a match */
function extractHighlight(
  content: string,
  query: string,
  contextChars = 50
): string {
  const plain = content
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`[^`]+`/g, "")
    .replace(/#{1,6}\s+/g, "")
    .replace(/\*+([^*]+)\*+/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, "")
    .replace(/\[\[([^\]]+)\]\]/g, "$1")
    .replace(/^[>\-|*]+\s/gm, "")
    .replace(/\n{2,}/g, " ")
    .replace(/\n/g, " ")
    .trim();

  const lowerPlain = plain.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const idx = lowerPlain.indexOf(lowerQuery);

  if (idx === -1) return "";

  const start = Math.max(0, idx - contextChars);
  const end = Math.min(plain.length, idx + query.length + contextChars);

  let snippet = "";
  if (start > 0) snippet += "...";
  snippet += plain.slice(start, end).trim();
  if (end < plain.length) snippet += "...";

  return snippet;
}

/** Build wiki-links options from all posts */
function getWikiLinksOptions() {
  const posts = getAllPosts();
  const slugs = posts.map((p) => p.slug);
  const slugToTitle: Record<string, string> = {};
  for (const p of posts) {
    slugToTitle[p.slug] = p.frontmatter.title;
  }
  return { slugs, slugToTitle };
}

function createProcessor() {
  const wikiOptions = getWikiLinksOptions();

  return unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkMath)
    .use(remarkRehype)
    .use(rehypeWikiLinks, wikiOptions)
    .use(rehypeSlug)
    .use(rehypeKatex, { throwOnError: false })
    .use(rehypePrettyCode, {
      theme: {
        dark: "one-dark-pro",
        light: "one-light",
      },
      keepBackground: false,
      defaultLang: "plaintext",
    })
    .use(rehypeStringify);
}

/** Strip the first h1 from markdown content — the title is already in the header */
function stripFirstH1(markdown: string): string {
  // Match a top-level heading at the very start (after optional whitespace/newline)
  return markdown.replace(/^\s*#\s+.+\n?/, "");
}

async function postToDetail(post: Post) {
  const contentWithoutH1 = stripFirstH1(post.content);
  const processor = createProcessor();
  const processed = await processor.process(contentWithoutH1);
  let html = String(processed);
  html = transformInkEmbeds(html);

  // Transform PDF links into embedded viewers
  html = transformPdfLinks(html);

  // Transform audio file images into <audio> players
  html = transformAudioLinks(html);

  // Transform video URLs (YouTube, Vimeo) into embeds
  html = transformVideoLinks(html);

  return {
    ...postToSummary(post),
    content: html,
  };
}

/** Convert <a href="*.pdf"> links into embedded PDF viewers */
function transformPdfLinks(html: string): string {
  return html.replace(
    /<a\s+href="([^"]+\.pdf(?:\?[^"]*)?)"[^>]*>([\s\S]*?)<\/a>/gi,
    (_match, href, linkText) => {
      const encodedHref = href.replace(/"/g, "&quot;");
      const text = linkText.trim() || "PDF Document";
      return `<div class="pdf-embed-wrapper"><div class="pdf-embed-header"><div class="pdf-embed-info"><svg class="pdf-embed-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg><span class="pdf-embed-title">${text}</span></div><a href="${href}" target="_blank" rel="noopener noreferrer" class="pdf-embed-open-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg><span>Open in New Tab</span></a></div><div class="pdf-embed-container"><iframe src="${href}" class="pdf-embed-iframe" title="${text}"></iframe></div></div>`;
    }
  );
}

/** Convert <img> tags with audio src into <audio> players */
function transformAudioLinks(html: string): string {
  return html.replace(
    /<img[^>]+src="([^"]+\.(?:mp3|wav|ogg|flac|aac|m4a|webm)(?:\?[^"]*)?)"[^>]*alt="([^"]*)"[^>]*\/?>|<img[^>]+alt="([^"]*)"[^>]*src="([^"]+\.(?:mp3|wav|ogg|flac|aac|m4a|webm)(?:\?[^"]*)?)"[^>]*\/?>/gi,
    (_match, src1, alt1, alt2, src2) => {
      const src = src1 || src2;
      const alt = alt1 || alt2 || "Audio";
      const encodedSrc = src.replace(/"/g, "&quot;");
      return `<div class="audio-embed-wrapper"><div class="audio-embed-header"><div class="audio-embed-info"><svg class="audio-embed-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg><span class="audio-embed-title">${alt}</span></div></div><audio controls class="audio-embed-player" preload="metadata"><source src="${src}" />Your browser does not support the audio element.</audio></div>`;
    }
  );
}

/** Convert standalone YouTube/Vimeo links or bare URLs into embedded iframes */
function transformVideoLinks(html: string): string {
  // Pattern 1: <a> tag wrapping a YouTube/Vimeo URL
  html = html.replace(
    /<a\s+href="(https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)[\w-]+(?:[&?][^\s"<>]*)*|https?:\/\/(?:www\.)?vimeo\.com\/\d+(?:\?[^\s"<>]*)?)"[^>]*>([\s\S]*?)<\/a>/gi,
    (_match, href, text) => {
      const video = extractVideoId(href);
      if (!video) return _match;
      return buildVideoEmbed(href, video);
    }
  );

  // Pattern 2: <p> tag with a bare YouTube/Vimeo URL (not wrapped in <a>)
  html = html.replace(
    /<p>(?:\s*)(https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)[\w-]+(?:[&?][^\s"<>]*)*|https?:\/\/(?:www\.)?vimeo\.com\/\d+(?:\?[^\s"<>]*)?)(?:\s*)<\/p>/gi,
    (_match, url) => {
      const video = extractVideoId(url);
      if (!video) return _match;
      return buildVideoEmbed(url, video);
    }
  );

  return html;
}

function buildVideoEmbed(url: string, video: { embedUrl: string; platform: string; videoId?: string }): string {
  const encodedUrl = video.embedUrl.replace(/"/g, "&quot;");
  const thumbnailUrl = video.videoId
    ? `https://img.youtube.com/vi/${video.videoId}/hqdefault.jpg`
    : '';
  // When thumbnail exists, use data-src to prevent iframe from loading until user clicks play
  const iframeSrcAttr = thumbnailUrl
    ? ` data-src="${encodedUrl}" src=""`
    : ` src="${encodedUrl}"`;

  return `<div class="video-embed-wrapper"><div class="video-embed-header"><div class="video-embed-info"><svg class="video-embed-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg><span class="video-embed-platform">${video.platform}</span></div><a href="${url}" target="_blank" rel="noopener noreferrer" class="video-embed-open-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg><span>Open in New Tab</span></a></div>${thumbnailUrl ? `<div class="video-embed-preview" data-video-embed-preview><img class="video-embed-thumbnail" src="${thumbnailUrl}" alt="${video.platform} Video Thumbnail" loading="lazy" /><div class="video-embed-play-btn"><svg viewBox="0 0 68 48" width="68" height="48"><path d="M66.52 7.74c-.78-2.93-2.49-5.41-5.08-7.14-2.03-1.37-4.3-2.04-6.69-1.96C49.41-.86 43.51.5 37.63.5c-5.89 0-11.78-1.36-17.13-.86-2.38.08-4.65.59-6.68 1.96-2.6 1.73-4.3 4.21-5.08 7.14C7.36 12.17 7 17.7 7 24.32c0 6.6.36 12.15 1.74 16.58.78 2.93 2.49 5.41 5.08 7.14 2.03 1.37 4.3 2.04 6.69 1.96 5.35.5 11.24-.86 17.13-.86 5.89 0 11.78 1.36 17.13.86 2.38-.08 4.65-.59 6.68-1.96 2.6-1.73 4.3-4.21 5.08-7.14C67.64 36.47 68 30.92 68 24.32c0-6.62-.36-12.15-1.48-16.58z" fill="#1f1f1f" fill-opacity="0.8"/><path d="M45 24L27 14v20" fill="#fff"/></svg></div></div>` : ''}<div class="video-embed-container"${thumbnailUrl ? ' style="display:none"' : ''}><iframe data-video-embed-iframe${iframeSrcAttr} class="video-embed-iframe" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen title="${video.platform} Video"></iframe></div></div>`;
}

function extractVideoId(url: string): { embedUrl: string; platform: string; videoId?: string } | null {
  // YouTube — various URL formats
  const ytMatch = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([\w-]+)/
  );
  if (ytMatch) {
    return { embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}?modestbranding=1&rel=0&showinfo=0`, platform: "YouTube", videoId: ytMatch[1] };
  }
  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) {
    return { embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}`, platform: "Vimeo", videoId: undefined };
  }
  return null;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const slug = searchParams.get("slug");
    const category = searchParams.get("category");
    const tag = searchParams.get("tag");
    const search = searchParams.get("search");

    if (slug) {
      const post = getPostBySlug(slug);
      if (!post) {
        return NextResponse.json({ error: "Post not found" }, { status: 404 });
      }
      const detail = await postToDetail(post);
      return NextResponse.json({ post: detail });
    }

    if (category) {
      const posts = getPostsByCategory(category);
      return NextResponse.json({
        posts: posts.map(postToSummary),
        count: posts.length,
      });
    }

    if (tag) {
      const posts = getPostsByTag(tag);
      return NextResponse.json({
        posts: posts.map(postToSummary),
        count: posts.length,
      });
    }

    if (search) {
      const posts = searchPosts(search);
      const results = posts.map((post) => {
        const summary = postToSummary(post);
        const highlight = extractHighlight(post.content, search);
        return {
          ...summary,
          highlight: highlight || summary.excerpt,
        };
      });
      return NextResponse.json({
        posts: results,
        count: results.length,
      });
    }

    const posts = getAllPosts();
    return NextResponse.json({
      posts: posts.map(postToSummary),
      count: posts.length,
    });
  } catch (error) {
    console.error("Error fetching posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 }
    );
  }
}