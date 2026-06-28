import { getAllPosts } from "@/lib/content";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");

  const posts = getAllPosts().filter((p) => p.frontmatter.draft !== true);
  const post = slug ? posts.find((p) => p.slug === slug) : null;

  const title = post?.frontmatter.title || "Second Brain";
  const category = post?.frontmatter.category || "Knowledge Repository";
  const date = post?.frontmatter.date || new Date().toISOString().split("T")[0];

  // Create SVG-based OG image
  const svg = `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#050505"/>
        <stop offset="100%" style="stop-color:#111111"/>
      </linearGradient>
      <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" style="stop-color:#e2b340"/>
        <stop offset="100%" style="stop-color:#f0c850"/>
      </linearGradient>
    </defs>
    <rect width="1200" height="630" fill="url(#bg)"/>
    <rect x="0" y="0" width="1200" height="4" fill="url(#accent)"/>
    <circle cx="100" cy="100" r="200" fill="rgba(226,179,64,0.05)"/>
    <circle cx="1100" cy="530" r="150" fill="rgba(226,179,64,0.03)"/>
    <text x="80" y="80" font-family="system-ui, -apple-system, sans-serif" font-size="18" fill="#e2b340" font-weight="600" letter-spacing="3">${escapeXml(category.toUpperCase())}</text>
    <text x="80" y="340" font-family="system-ui, -apple-system, sans-serif" font-size="48" fill="#fafafa" font-weight="700" letter-spacing="-0.5">${escapeXml(truncate(title, 40))}</text>
    <text x="80" y="400" font-family="system-ui, -apple-system, sans-serif" font-size="48" fill="#fafafa" font-weight="700" letter-spacing="-0.5">${escapeXml(title.length > 40 ? truncate(title.slice(40), 40) : "")}</text>
    <text x="80" y="560" font-family="system-ui, -apple-system, sans-serif" font-size="20" fill="#71717a">secondbrain.dev · ${escapeXml(date)}</text>
    <rect x="80" y="580" width="40" height="3" rx="1.5" fill="#e2b340"/>
  </svg>`;

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function truncate(str: string, len: number): string {
  if (str.length <= len) return str;
  return str.slice(0, len).trim() + "…";
}