---
title: "Writing Posts"
date: 2025-06-28
tags: ["markdown", "writing", "guide"]
category: "Guide"
draft: false
excerpt: "Everything you can write in a post: markdown, wiki-links, task lists, and more."
cover: "/covers/writing-posts.png"
---

# Writing Posts

Your posts are standard markdown files with extra features. This covers every content type supported.

## Standard Markdown

All CommonMark syntax works: headings, bold, italic, strikethrough, links, blockquotes, ordered and unordered lists, tables, horizontal rules, and footnotes.

```markdown
## A Heading

**Bold text**, *italic text*, ~~strikethrough~~.

> A blockquote for emphasis.

| Column 1 | Column 2 |
|----------|----------|
| Cell 1   | Cell 2   |

1. First item
2. Second item

- Unordered item
- Another item

---

A footnote[^1] reference.

[^1]: The footnote content.
```

## Wiki-Links

The core feature of Second Brain. Wrap a post title in double brackets to create a link that becomes an edge in the knowledge graph:

```markdown
Read the [[setup-guide]] for installation instructions.
```

The sync script converts `[[post-title]]` to a URL-safe slug. On the website, hovering a wiki-link shows a preview card with the linked post's title, excerpt, and category. Clicking navigates to the post.

You can link to posts that don't exist yet — the link renders like Obsidian's unresolved links, useful for planning future content.

## Task Lists

Checkbox syntax renders with styled checkboxes:

```markdown
- [x] Install dependencies
- [x] Configure the vault
- [ ] Write first post
- [ ] Deploy to Vercel
```

Checked items show filled checkboxes, unchecked show empty ones. Update status in the markdown source and re-sync.

## PDF Embeds

Link to a `.pdf` file and it renders as an embedded viewer inline:

```markdown
[View the design spec](design-spec.pdf)
```

The viewer includes page navigation, zoom, and scrolling. Place the PDF in `public/` or sync it via `blog/attachments/`.

## Obsidian Ink

The blog renders handwritten and hand-drawn content from the Obsidian Ink plugin. Two code block types are recognized:

- `handwritten-ink` — handwritten text (notes, equations)
- `handdrawn-ink` — freehand sketches and diagrams

````markdown
```handwritten-ink
<svg data-ink xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 200">
  <path d="M10,80 Q30,20 50,80" stroke="currentColor" fill="none" stroke-width="2"/>
</svg>
```
````

The SVG uses `currentColor` for strokes, so it adapts to light and dark themes automatically. See [[obsidian-workflow]] for the full Ink setup guide.

## Code Blocks

Syntax highlighting via Shiki with an interactive Run button for executable languages. Full details in [[code-playground]].

## Math and Diagrams

LaTeX math and Mermaid diagrams are supported. See [[math-and-diagrams]] for the complete reference.

## Next Steps

- [[code-playground]] — Run code in 24 languages directly in posts.
- [[math-and-diagrams]] — LaTeX math and Mermaid diagrams.
- [[adding-images]] — The attachment workflow for images.
- [[obsidian-workflow]] — Setting up Obsidian with Ink for handwriting.