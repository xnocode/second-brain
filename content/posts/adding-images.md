---
title: "Adding Images"
date: 2025-06-28
tags: ["images", "guide", "obsidian"]
category: "Guide"
draft: false
excerpt: "How to add images to your posts using the attachments folder."
cover: "/covers/adding-images.png"
---

# Adding Images

Images follow a simple workflow: put them in `blog/attachments/`, reference them in markdown, and the sync script handles the rest.

## The Attachment Folder

All images must live in `blog/attachments/`. Do not place them next to your markdown files in the root of `blog/`. The sync script only looks in the attachments folder when resolving image references.

## Referencing Images

Use standard markdown image syntax with the `/images/` path prefix:

```markdown
![My screenshot](/images/my-screenshot.png)
```

The sync script locates `my-screenshot.png` in `blog/attachments/`, copies it to `public/images/`, and the path works on the live site.

## What Happens During Sync

When you run `bun run scripts/sync-vault.ts`:

1. The script scans every post for image references.
2. It looks up each image in `blog/attachments/` by filename.
3. It copies the image to `public/images/` (only referenced images are copied).
4. The path in the markdown is left as `/images/filename.png`.

If an image is referenced but not found, a warning is logged and the image will appear broken on the blog.

## Cover Images

Cover images appear on article cards in the blog grid. Set the `cover` field in frontmatter with just the filename:

```yaml
---
title: "My Post"
date: 2025-06-28
tags: ["guide"]
category: "Guide"
draft: false
excerpt: "A post with a cover image."
cover: "my-cover-photo.jpg"
---
```

The sync script looks for the file in `blog/attachments/` and copies it to `public/images/`. Alternatively, place cover images directly in `public/covers/` and reference them with a full path (`/covers/my-cover-photo.jpg`) — these are not processed by the sync script.

## Supported Formats

| Format | Extensions | Best For |
|--------|-----------|----------|
| PNG | `.png` | Screenshots, diagrams, transparency |
| JPEG | `.jpg`, `.jpeg` | Photographs |
| GIF | `.gif` | Simple animations |
| WebP | `.webp` | Photos where file size matters |
| SVG | `.svg` | Diagrams, icons, line art |

## External URLs

External images work without sync processing:

```markdown
![External diagram](https://example.com/path/to/image.png)
```

These pass through unchanged and depend on the hosting server's availability.

## Complete Workflow

1. Create the attachments folder: `mkdir -p blog/attachments`
2. Copy or paste your image into `blog/attachments/`
3. Reference it in your post: `![description](/images/filename.png)`
4. Run the sync script: `bun run scripts/sync-vault.ts`
5. Verify the image renders in your browser

## Obsidian Settings for Attachments

To make the workflow seamless, configure Obsidian:

1. **Settings > Files and Links > Default location for new attachments**: Set to "In the folder specified below" and enter `blog/attachments`
2. **Settings > Files and Links > New link format**: Set to "Shortest path when possible"

With these settings, pasting an image in Obsidian saves it to `blog/attachments/` automatically.

## Troubleshooting

**Image not showing after sync.** Confirm the image exists in `blog/attachments/` with the exact filename. Filenames are case-sensitive — `Screenshot.png` and `screenshot.png` are different files.

**Works locally but broken on deploy.** The sync script may not have run during build. Verify the build command includes the sync step.

**Image not copying.** The sync script only copies images that are actively referenced in at least one post. Unreferenced images in `blog/attachments/` are ignored.

## Next Steps

- [[obsidian-workflow]] — Full Obsidian setup with Ink and attachment configuration.
- [[writing-posts]] — Wiki-links, code blocks, task lists, and all content features.
- [[deploy-to-vercel]] — Publishing your blog.