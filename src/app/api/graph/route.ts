import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { getAllPosts } from "@/lib/content";

const WIKI_LINK_PATTERN = /\[\[([^\]]+)\]\]/g;

interface GraphNode {
  id: string;
  title: string;
  category: string;
  connections: number;
}

interface GraphEdge {
  source: string;
  target: string;
}

function buildGraph() {
  const posts = getAllPosts();
  const slugSet = new Set(posts.map((p) => p.slug));
  const slugToTitle: Record<string, string> = {};

  for (const p of posts) {
    slugToTitle[p.slug] = p.frontmatter.title;
  }

  // Parse wiki-links from raw markdown files
  const edges: GraphEdge[] = [];
  const connectionCount: Record<string, number> = {};

  const postsDir = path.join(process.cwd(), "content/posts");
  if (fs.existsSync(postsDir)) {
    for (const file of fs.readdirSync(postsDir).filter((f) => f.endsWith(".md"))) {
      const slug = path.basename(file, ".md");
      const raw = fs.readFileSync(path.join(postsDir, file), "utf-8");
      const { content } = matter(raw);

      const matches = [...content.matchAll(WIKI_LINK_PATTERN)];
      for (const match of matches) {
        const target = match[1];
        let resolvedSlug: string | null = null;
        if (slugSet.has(target)) {
          resolvedSlug = target;
        } else {
          const found = posts.find((p) => p.frontmatter.title === target);
          if (found) resolvedSlug = found.slug;
        }

        if (resolvedSlug && resolvedSlug !== slug) {
          const edgeKey = [slug, resolvedSlug].sort().join("---");
          const exists = edges.some(
            (e) => [e.source, e.target].sort().join("---") === edgeKey
          );
          if (!exists) {
            edges.push({ source: slug, target: resolvedSlug });
            connectionCount[slug] = (connectionCount[slug] || 0) + 1;
            connectionCount[resolvedSlug] =
              (connectionCount[resolvedSlug] || 0) + 1;
          }
        }
      }
    }
  }

  const nodes: GraphNode[] = posts.map((p) => ({
    id: p.slug,
    title: p.frontmatter.title,
    category: p.frontmatter.category || "Uncategorized",
    connections: connectionCount[p.slug] || 0,
  }));

  return { nodes, edges };
}

let cachedGraph: { nodes: GraphNode[]; edges: GraphEdge[] } | null = null;
let cacheTime = 0;
const CACHE_TTL = 60_000;

function getGraph() {
  const now = Date.now();
  if (!cachedGraph || now - cacheTime > CACHE_TTL) {
    cachedGraph = buildGraph();
    cacheTime = now;
  }
  return cachedGraph;
}

export async function GET() {
  try {
    const graph = getGraph();
    return NextResponse.json(graph);
  } catch (error) {
    console.error("Error building graph:", error);
    return NextResponse.json({ error: "Failed to build graph" }, { status: 500 });
  }
}