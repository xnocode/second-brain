import { NextResponse } from "next/server";
import { getAllPosts } from "@/lib/content";

const BASE_URL = "https://secondbrain.dev";

export async function GET() {
  const posts = getAllPosts();

  const staticPages = [
    { url: `${BASE_URL}`, priority: "1.0", changefreq: "daily" },
    { url: `${BASE_URL}/blog`, priority: "0.9", changefreq: "daily" },
    { url: `${BASE_URL}/categories`, priority: "0.7", changefreq: "weekly" },
    { url: `${BASE_URL}/about`, priority: "0.5", changefreq: "monthly" },
  ];

  const postPages = posts.map((post) => ({
    url: `${BASE_URL}/blog/${post.slug}`,
    priority: "0.8",
    changefreq: "monthly",
    lastmod: post.frontmatter.date,
  }));

  const allPages = [...staticPages, ...postPages];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages
  .map((page) => {
    const lastmod = page.lastmod ? `\n    <lastmod>${page.lastmod}</lastmod>` : "";
    return `  <url>
    <loc>${page.url}</loc>${lastmod}
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`;
  })
  .join("\n")}
</urlset>`;

  return new NextResponse(xml.trim(), {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=600",
    },
  });
}