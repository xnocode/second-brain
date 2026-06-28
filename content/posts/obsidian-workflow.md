---
title: "Obsidian Workflow"
date: 2025-06-28
tags: ["obsidian", "workflow", "guide"]
category: "Tools"
draft: false
excerpt: "Set up Obsidian as your writing environment with Ink, attachments, and sync."
cover: "/covers/obsidian-workflow.png"
---

# Obsidian Workflow

Write posts in Obsidian, sync to your blog. This covers the full configuration.

## Setting Up the Vault

Your `blog/` folder is the Obsidian vault. Open it directly:

1. Open Obsidian.
2. Click **Open folder as vault**.
3. Select your `blog/` directory.

All `.md` files in the root of `blog/` appear as notes. Subdirectories like `attachments/` and `Ink/` are ignored by the sync script.

## Recommended Obsidian Settings

### Files and Links

- **Default location for new attachments**: Set to **"In the folder specified below"** and enter `blog/attachments`. Every pasted or dragged image saves here automatically.
- **New link format**: Set to **"Shortest path when possible"**. The sync script converts wiki-links regardless of this setting, but shortest path keeps your markdown clean.

### Editor

- **Default editing mode**: **"Source mode"** is recommended so you see raw markdown and wiki-link syntax (`[[post-title]]`) directly. Live Preview works too, but source mode gives you full control.

### Appearance

The blog's dark theme matches Obsidian's default dark mode. If you use the blog's light theme, switch Obsidian to light mode too for visual consistency while writing.

## Writing Workflow

1. Create a new note in Obsidian (`blog/my-post.md`).
2. Add frontmatter at the top (title, date, tags, category, draft, excerpt).
3. Write your content using markdown, wiki-links, code blocks, math, etc.
4. Paste images — they save to `blog/attachments/` automatically.
5. When ready to publish, run the sync script from your terminal:

```bash
bun run scripts/sync-vault.ts
```

6. Preview locally with `bun run dev`.
7. Commit and push when satisfied.

## Obsidian Ink Plugin

The Obsidian Ink plugin lets you write and draw directly inside notes. The blog natively renders Ink content as inline SVG.

### Installation

1. Open **Settings > Community plugins** in Obsidian.
2. Enable community plugins if not already on.
3. Click **Browse**, search for **"Ink"**.
4. Install and enable the plugin.

### Directory Setup

```bash
mkdir -p blog/Ink
```

### Using Ink

1. Open a note in Obsidian.
2. Open the command palette (`Cmd+P` / `Ctrl+P`).
3. Search for "Ink" and select **New handwriting section**.
4. A canvas appears. Write or draw using your mouse, trackpad, or stylus.
5. **Freeze** the drawing to convert it to static SVG. This is required before syncing — the blog only renders static SVG, not live canvases.

After freezing, your note contains a code block with either `handwritten-ink` or `handdrawn-ink` as the language identifier. The blog extracts and renders the SVG inline, adapting to both light and dark themes.

### Ink Use Cases

- **Handwritten notes** — personal annotations with a notebook feel
- **Sketches** — quick box-and-arrow diagrams faster than Mermaid
- **Math** — hand-drawn equations alongside typed LaTeX
- **Signatures** — a personal touch on about pages

## Keyboard Shortcuts in Obsidian

| Shortcut | Action |
|----------|--------|
| `Cmd+P` / `Ctrl+P` | Command palette |
| `Cmd+L` / `Ctrl+L` | Toggle bold |
| `Cmd+I` / `Ctrl+I` | Toggle italic |
| `Cmd+K` / `Ctrl+K` | Insert link |
| `[[` | Insert wiki-link (Obsidian default) |

## Tips

- Use a stylus for Ink — pressure sensitivity produces noticeably better handwriting.
- Match the Ink canvas width to your blog's content column for consistent sizing.
- Test Ink content in both light and dark themes. Complex drawings with many overlapping strokes may be harder to read in dark mode.
- Files prefixed with `_` (e.g., `_template.md`) are skipped by the sync script. Use them for templates.

## Next Steps

- [[setup-guide]] — Project setup from GitHub.
- [[writing-posts]] — All content features including Ink syntax.
- [[adding-images]] — The attachment workflow.
- [[deploy-to-vercel]] — Publishing your blog.