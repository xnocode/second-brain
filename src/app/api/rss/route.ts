import { getAllPosts } from "@/lib/content";

export async function GET() {
  const posts = getAllPosts();

  const siteUrl = "https://secondbrain.dev";
  const siteTitle = "Second Brain";
  const siteDescription = "Where ideas crystallize into knowledge";

  const items = posts
    .map((post) => {
      const url = `${siteUrl}/#${post.slug}`;
      const date = new Date(post.frontmatter.date).toUTCString();
      const excerpt = post.frontmatter.excerpt || "";
      const content = post.content.replace(/</g, "&lt;").replace(/>/g, "&gt;");

      return `    <item>
      <title><![CDATA[${post.frontmatter.title}]]></title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${date}</pubDate>
      <description><![CDATA[${excerpt}]]></description>
      <content:encoded><![CDATA[${content}]]></content:encoded>
      ${(post.frontmatter.tags || []).map((tag: string) => `<category>${tag}</category>`).join("\n      ")}
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${siteTitle}</title>
    <link>${siteUrl}</link>
    <description>${siteDescription}</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${siteUrl}/rss.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}