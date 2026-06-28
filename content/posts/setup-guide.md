---
title: "Setup Guide"
date: 2025-06-28
tags: ["setup", "guide", "github"]
category: "Guide"
draft: false
excerpt: "Set up Second Brain from the GitHub repo to a running site in under 5 minutes."
cover: "/covers/setup-guide.png"
---

# Setup Guide

Set up your Second Brain blog from scratch using the GitHub repo at [https://github.com/xnocode](https://github.com/xnocode).

## Prerequisites

- **Bun** 1.0+ — install from [bun.sh](https://bun.sh)
- **Git** — any recent version

That's it. The database is SQLite (bundled via Prisma), no external services needed.

## Step 1: Clone the Repository

```bash
git clone https://github.com/xnocode/second-brain.git
cd second-brain
```

## Step 2: Install Dependencies

```bash
bun install
```

This pulls Next.js 16, Tailwind CSS 4, shadcn/ui, Prisma, Framer Motion, and everything else.

## Step 3: Initialize the Database

```bash
bun run db:push
```

Creates the SQLite database with tables for posts, categories, tags, and reading stats.

## Step 4: Sync Your Posts

```bash
bun run scripts/sync-vault.ts
```

This reads markdown files from `blog/`, processes frontmatter, converts wiki-links, copies images, and writes everything to `content/posts/`. If the repo comes with sample posts in `blog/`, they'll appear on the site after this step.

## Step 5: Start the Dev Server

```bash
bun run dev
```

Open your browser. The site is running.

## Folder Structure

```
second-brain/
├── blog/                    # Your vault — edit only here
│   ├── attachments/         # All images go here
│   ├── Ink/                 # Obsidian Ink SVG files
│   ├── my-first-post.md     # Top-level .md files only
│   └── _template.md         # Skipped by sync (underscore prefix)
├── content/posts/           # Auto-generated — never edit directly
├── public/
│   ├── images/              # Synced from blog/attachments/
│   └── covers/              # Cover images for article cards
├── src/                     # Next.js app, components, lib
├── scripts/sync-vault.ts    # The sync script
└── prisma/schema.prisma     # Database schema
```

The `blog/` folder is where you write. Everything else is generated or managed automatically.

## Frontmatter

Every post needs YAML frontmatter at the top:

```yaml
---
title: "My Post Title"
date: 2025-06-28
tags: ["tag1", "tag2"]
category: "Guide"
draft: false
excerpt: "A short summary shown on post cards."
cover: "my-cover-image.png"
---
```

| Field | Required | Description |
|-------|----------|-------------|
| `title` | Yes | Display title |
| `date` | Yes | Publication date (YYYY-MM-DD), controls sort order |
| `tags` | Yes | Array of strings for filtering |
| `category` | Yes | One of: Guide, Thinking, Tools, Knowledge, Design |
| `draft` | Yes | `true` hides the post from the site |
| `excerpt` | Yes | 1-2 sentence summary for cards |
| `cover` | No | Cover image filename (looked up in `blog/attachments/`) |

## Sync Commands

```bash
# Basic sync
bun run scripts/sync-vault.ts

# Preview without writing files
bun run scripts/sync-vault.ts --dry-run

# Remove posts from content/posts/ when source was deleted from blog/
bun run scripts/sync-vault.ts --clean

# Use a custom source directory
bun run scripts/sync-vault.ts --source /path/to/your/vault

# Combine flags
bun run scripts/sync-vault.ts --source /path/to/vault --clean --dry-run
```

## First Post

Create `blog/my-first-post.md`:

```markdown
---
title: "My First Post"
date: 2025-06-28
tags: ["guide", "hello-world"]
category: "Guide"
draft: false
excerpt: "My first post on Second Brain."
---

# My First Post

This is my first post. I can use **bold**, *italic*, and ~~strikethrough~~.

> "The best way to learn is to teach." — Richard Feynman

- [x] Clone the repo
- [x] Run sync
- [ ] Write more posts
- [ ] Deploy

Check out [[setup-guide]] for the full setup instructions.
```

Run `bun run scripts/sync-vault.ts` and refresh. Your post is live.

## Next Steps

- [[writing-posts]] — Wiki-links, code blocks, and all content features.
- [[code-playground]] — Run code directly in your blog posts.
- [[deploy-to-vercel]] — Publish your blog to the web.