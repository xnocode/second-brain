/**
 * Blog Sync Tool — flat blog/ → content/posts/
 *
 * Reads .md files directly from your `blog/` folder (flat, no subfolders).
 * Files with frontmatter (title, date, tags, draft: false) get synced to content/posts/.
 *
 * Usage:
 *   bun run scripts/sync-vault.ts                        # Sync from blog/
 *   bun run scripts/sync-vault.ts --source /other/path   # Override source folder
 *   bun run scripts/sync-vault.ts --dry-run              # Preview only
 *   bun run scripts/sync-vault.ts --clean                # Remove orphaned posts
 */

import fs from "fs";
import path from "path";
import matter from "gray-matter";

// ─── Config ───────────────────────────────────────────────────────────────────

const PROJECT_ROOT = process.cwd();
const DEFAULT_BLOG_DIR = path.join(PROJECT_ROOT, "blog");
const CONTENT_DIR = path.join(PROJECT_ROOT, "content/posts");
const PUBLIC_DIR = path.join(PROJECT_ROOT, "public");

// ─── Types ────────────────────────────────────────────────────────────────────

interface SyncResult {
  sourceDir: string;
  totalFiles: number;
  blogFiles: number;
  synced: string[];
  skipped: string[];
  removed: string[];
  errors: string[];
  imagesCopied: number;
}

interface ParsedNote {
  filePath: string;
  fileName: string;
  slug: string;
  title: string | null;
  date: string | null;
  tags: string[];
  category: string | null;
  draft: boolean;
  excerpt: string | null;
  cover: string | null;
  content: string;
  rawFrontmatter: Record<string, unknown>;
  isBlogPost: boolean;
}

// ─── Args ─────────────────────────────────────────────────────────────────────

function parseArgs(args: string[]) {
  const sourceIdx = args.indexOf("--source");
  const dryRun = args.includes("--dry-run");
  const clean = args.includes("--clean");
  const source = sourceIdx !== -1 && args[sourceIdx + 1]
    ? args[sourceIdx + 1]
    : undefined;

  return { source, dryRun, clean };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function copyIfChanged(src: string, dest: string): boolean {
  if (fs.existsSync(dest)) {
    const srcStat = fs.statSync(src);
    const destStat = fs.statSync(dest);
    if (srcStat.size === destStat.size && srcStat.mtimeMs <= destStat.mtimeMs) {
      return false;
    }
  }
  ensureDir(path.dirname(dest));
  fs.copyFileSync(src, dest);
  return true;
}

/** Read ONLY top-level .md files (flat — no subfolders) */
function readTopLevelMdFiles(dir: string): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isFile() && entry.name.endsWith(".md")) {
      results.push(path.join(dir, entry.name));
    }
  }
  return results;
}

function extractImagePaths(content: string, frontmatter: Record<string, unknown>, sourceDir: string): { localPath: string; fullPath: string }[] {
  const images: { localPath: string; fullPath: string }[] = [];
  const attachDir = path.join(sourceDir, "attachments");

  if (typeof frontmatter.cover === "string" && frontmatter.cover) {
    const imgName = path.basename(frontmatter.cover);
    const candidates = [
      path.join(attachDir, imgName),
      path.join(sourceDir, frontmatter.cover),
      path.join(sourceDir, imgName),
    ];
    for (const c of candidates) {
      if (fs.existsSync(c)) {
        images.push({ localPath: imgName, fullPath: c });
        break;
      }
    }
  }

  // ![[image.png]] style
  const wikiImageRegex = /!\[\[([^\]]+\.(png|jpg|jpeg|gif|webp|svg|mp3|wav|ogg|flac|aac|m4a|webm))\]\]/gi;
  let match;
  while ((match = wikiImageRegex.exec(content)) !== null) {
    const imgName = match[1];
    const candidates = [
      path.join(attachDir, imgName),
      path.join(sourceDir, imgName),
    ];
    for (const c of candidates) {
      if (fs.existsSync(c)) {
        images.push({ localPath: imgName, fullPath: c });
        break;
      }
    }
  }

  // ![alt](path) style (local only — images + audio files)
  const mdMediaRegex = /!\[([^\]]*)\]\(([^)]+\.(png|jpg|jpeg|gif|webp|svg|mp3|wav|ogg|flac|aac|m4a|webm))\)/gi;
  while ((match = mdMediaRegex.exec(content)) !== null) {
    const mediaPath = match[2];
    if (mediaPath && !mediaPath.startsWith("http") && !mediaPath.startsWith("/")) {
      const candidates = [
        path.join(attachDir, path.basename(mediaPath)),
        path.join(sourceDir, mediaPath),
      ];
      for (const c of candidates) {
        if (fs.existsSync(c)) {
          images.push({ localPath: path.basename(mediaPath), fullPath: c });
          break;
        }
      }
    }
  }

  const seen = new Set<string>();
  return images.filter(img => {
    if (seen.has(img.localPath)) return false;
    seen.add(img.localPath);
    return true;
  });
}

// ─── Core Logic ───────────────────────────────────────────────────────────────

function parseNote(filePath: string): ParsedNote | null {
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    const { data, content } = matter(raw);
    const fileName = path.basename(filePath, ".md");
    const slug = toSlug(fileName);

    let rawDate: string | null = null;
    if (data.date !== undefined) {
      rawDate = typeof data.date === "string" ? data.date
        : data.date instanceof Date ? data.date.toISOString().split("T")[0]
        : String(data.date);
    }

    // A file is a "blog post" if it has the required frontmatter fields
    const isBlogPost = !!(data.title && data.date && data.draft !== undefined);

    return {
      filePath,
      fileName,
      slug,
      title: typeof data.title === "string" ? data.title : null,
      date: rawDate,
      tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
      category: typeof data.category === "string" ? data.category : null,
      draft: data.draft === true,
      excerpt: typeof data.excerpt === "string" ? data.excerpt : null,
      cover: typeof data.cover === "string" ? data.cover : null,
      content,
      rawFrontmatter: data,
      isBlogPost,
    };
  } catch {
    return null;
  }
}

function validateNote(note: ParsedNote): string[] {
  const issues: string[] = [];
  if (!note.title || note.title.trim() === "") {
    issues.push("Missing: title");
  }
  if (!note.date) {
    issues.push("Missing: date (YYYY-MM-DD)");
  } else if (isNaN(new Date(note.date).getTime())) {
    issues.push(`Invalid date: "${note.date}"`);
  }
  if (!Array.isArray(note.rawFrontmatter.tags)) {
    issues.push("Missing: tags (must be array, e.g. [obsidian, guide])");
  }
  if (note.rawFrontmatter.draft === undefined) {
    issues.push("Missing: draft (true or false)");
  }
  return issues;
}

function buildOutputContent(note: ParsedNote): string {
  const fm: Record<string, unknown> = {
    title: note.title || note.fileName,
    date: note.date || new Date().toISOString().split("T")[0],
    tags: note.tags,
    category: note.category || "General",
    draft: false,
  };

  if (note.excerpt) fm.excerpt = note.excerpt;
  if (note.cover) fm.cover = note.cover;

  let content = note.content;

  // Convert ![[image.png]] → ![image.png](/images/image.png)
  content = content.replace(
    /!\[\[([^\]]+\.(png|jpg|jpeg|gif|webp|svg|mp3|wav|ogg|flac|aac|m4a|webm))\]\]/gi,
    (_, mediaPath) => `![${path.basename(mediaPath)}](/images/${path.basename(mediaPath)})`
  );

  // Convert local media paths ![alt](relative/path.png) → ![alt](/images/filename.png)
  content = content.replace(
    /!\[([^\]]*)\]\(([^)]+\.(png|jpg|jpeg|gif|webp|svg|mp3|wav|ogg|flac|aac|m4a|webm))\)/gi,
    (_, alt, mediaPath) => {
      if (mediaPath.startsWith("http") || mediaPath.startsWith("/")) return _;
      return `![${alt}](/images/${path.basename(mediaPath)})`;
    }
  );

  // Convert [[Note Title]] → [[slug]]
  content = content.replace(
    /\[\[([^\]]+)\]\]/g,
    (match, linkText) => {
      if (/^[a-z0-9-]+$/.test(linkText)) return match;
      return `[[${toSlug(linkText)}]]`;
    }
  );

  const fmString = Object.entries(fm)
    .map(([key, value]) => {
      if (key === "date") return `${key}: ${value}`;
      if (Array.isArray(value)) return `${key}: [${value.map(v => `"${v}"`).join(", ")}]`;
      if (typeof value === "string") return `${key}: "${value}"`;
      if (typeof value === "boolean") return `${key}: ${value}`;
      return `${key}: ${value}`;
    })
    .join("\n");

  return `---\n${fmString}\n---\n\n${content.trim()}\n`;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function main() {
  const { source: sourceArg, dryRun, clean } = parseArgs(process.argv.slice(2));

  // Resolve source: --source flag > default blog/
  let blogDir = DEFAULT_BLOG_DIR;
  if (sourceArg) {
    blogDir = path.resolve(PROJECT_ROOT, sourceArg);
  }

  if (!fs.existsSync(blogDir)) {
    console.log("");
    console.log("═══════════════════════════════════════════════════════");
    console.log("  🧠 Second Brain — Blog Sync");
    console.log("═══════════════════════════════════════════════════════");
    console.log("");
    console.log(`  ❌ Blog folder not found: ${blogDir}`);
    console.log("");
    console.log("  Create it and add your first post:");
    console.log("");
    console.log(`    mkdir -p ${path.relative(PROJECT_ROOT, blogDir)}`);
    console.log("");
    console.log("  Then add .md files with frontmatter:");
    console.log("");
    console.log('    ---');
    console.log('    title: "My First Post"');
    console.log("    date: 2025-06-28");
    console.log('    tags: ["hello", "world"]');
    console.log("    draft: false");
    console.log('    ---');
    console.log("");
    console.log("  Your post content here...");
    console.log("");
    process.exit(1);
  }

  console.log("");
  console.log("═══════════════════════════════════════════════════════");
  console.log("  🧠 Second Brain — Blog Sync");
  console.log("═══════════════════════════════════════════════════════");
  console.log(`  📂 Source:        ${blogDir}`);
  console.log(`  📁 Blog output:   ${CONTENT_DIR}`);
  console.log(`  🔧 Mode:          ${dryRun ? "DRY RUN" : clean ? "SYNC + CLEAN" : "SYNC"}`);
  console.log("");

  const result: SyncResult = {
    sourceDir: blogDir,
    totalFiles: 0,
    blogFiles: 0,
    synced: [],
    skipped: [],
    removed: [],
    errors: [],
    imagesCopied: 0,
  };

  // ── Step 1: Scan blog/ (flat, top-level only) ────────────────────────

  const allFiles = readTopLevelMdFiles(blogDir);
  result.totalFiles = allFiles.length;

  console.log(`  📄 Found ${allFiles.length} markdown files in blog/`);
  console.log("");

  if (allFiles.length === 0) {
    console.log("  ⚠️  No markdown files found. Add .md files with blog frontmatter to publish.");
    console.log("");
    process.exit(0);
  }

  // ── Step 2: Find publishable posts ────────────────────────────────────

  console.log("── Scanning Posts ───────────────────────────────────────");
  console.log("");

  const publishedSlugs = new Map<string, ParsedNote>();
  const allBlogSlugs = new Set<string>();

  for (const filePath of allFiles) {
    const fileName = path.basename(filePath, ".md");

    // Skip files starting with _ (templates, private)
    if (fileName.startsWith("_")) {
      console.log(`  🔇 SKIP:  ${fileName} (starts with _)`);
      continue;
    }

    const note = parseNote(filePath);
    if (!note) {
      result.errors.push(path.basename(filePath));
      console.log(`  ⚠️  ERROR: ${path.basename(filePath)} (could not parse)`);
      continue;
    }

    // Skip files without blog frontmatter
    if (!note.isBlogPost) {
      console.log(`  📝 NOTE:  ${fileName} (no frontmatter — not a blog post)`);
      continue;
    }

    result.blogFiles++;
    allBlogSlugs.add(note.slug);

    const issues = validateNote(note);

    if (note.draft) {
      result.skipped.push(note.slug);
      console.log(`  🔮 DRAFT: ${note.title || note.fileName}`);
      continue;
    }

    if (issues.length > 0) {
      result.skipped.push(note.slug);
      console.log(`  ⚠️  SKIP:  ${note.title || note.fileName} (${issues.join(", ")})`);
      continue;
    }

    publishedSlugs.set(note.slug, note);
    console.log(`  ✅ READY: ${note.title}`);
  }

  const nonBlogCount = allFiles.length - result.blogFiles;
  console.log("");
  console.log(`  📊 ${result.blogFiles} blog posts, ${nonBlogCount} other files ignored`);
  console.log(`  📤 ${publishedSlugs.size} ready to publish, ${result.skipped.length} drafts/skipped`);
  console.log("");

  if (dryRun) {
    console.log("── DRY RUN COMPLETE (no files changed) ────────────────");
    console.log("");
    process.exit(0);
  }

  // ── Step 3: Sync to content/posts/ ───────────────────────────────────

  console.log("── Syncing to Blog ──────────────────────────────────────");
  console.log("");

  ensureDir(CONTENT_DIR);

  for (const [slug, note] of publishedSlugs) {
    const destPath = path.join(CONTENT_DIR, `${slug}.md`);
    const outputContent = buildOutputContent(note);

    try {
      let changed = true;
      if (fs.existsSync(destPath)) {
        const existing = fs.readFileSync(destPath, "utf-8");
        if (existing === outputContent) changed = false;
      }

      if (changed) {
        fs.writeFileSync(destPath, outputContent, "utf-8");
        console.log(`  📝 ${slug}.md`);
      } else {
        console.log(`  ✓  ${slug}.md (unchanged)`);
      }
      result.synced.push(slug);

      // Copy images (look in blog/ folder)
      const images = extractImagePaths(note.content, note.rawFrontmatter, blogDir);
      for (const img of images) {
        const destImg = path.join(PUBLIC_DIR, "images", img.localPath);
        if (copyIfChanged(img.fullPath, destImg)) {
          result.imagesCopied++;
          console.log(`  🖼️  ${img.localPath}`);
        }
      }
    } catch (err) {
      result.errors.push(slug);
      console.error(`  ❌ ${slug}.md: ${(err as Error).message}`);
    }
  }

  // ── Step 3.5: Copy Obsidian Ink files ────────────────────────────────

  const inkDir = path.join(blogDir, "Ink");
  if (fs.existsSync(inkDir)) {
    console.log("");
    console.log("── Syncing Ink Files ───────────────────────────────────");
    console.log("");
    const inkImagesDir = path.join(PUBLIC_DIR, "images", "ink");
    ensureDir(inkImagesDir);

    function copyInkFilesRecursive(dir: string, base: string) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relPath = path.relative(base, fullPath);
        if (entry.isDirectory()) {
          copyInkFilesRecursive(fullPath, base);
        } else if (/\.(png|jpg|jpeg|gif|webp|svg)$/i.test(entry.name)) {
          const dest = path.join(inkImagesDir, relPath);
          if (copyIfChanged(fullPath, dest)) {
            result.imagesCopied++;
            console.log(`  🖊️  ink/${relPath}`);
          }
        }
      }
    }

    copyInkFilesRecursive(inkDir, inkDir);
  }

  // ── Step 4: Clean orphans ───────────────────────────────────────────

  if (clean) {
    console.log("");
    console.log("── Cleaning Orphans ────────────────────────────────────");
    console.log("");

    if (fs.existsSync(CONTENT_DIR)) {
      const existingPosts = fs.readdirSync(CONTENT_DIR).filter(f => f.endsWith(".md"));
      for (const file of existingPosts) {
        const slug = path.basename(file, ".md");
        if (!allBlogSlugs.has(slug)) {
          fs.unlinkSync(path.join(CONTENT_DIR, file));
          result.removed.push(slug);
          console.log(`  🗑️  ${file}`);
        }
      }
    }
    if (result.removed.length === 0) {
      console.log("  ✓  None.");
    }
  }

  // ── Summary ──────────────────────────────────────────────────────────

  console.log("");
  console.log("═══════════════════════════════════════════════════════");
  if (result.errors.length === 0) {
    console.log("  ✅ Done!");
  } else {
    console.log("  ⚠️  Done with errors");
  }
  console.log("═══════════════════════════════════════════════════════");
  console.log(`  📝 Synced:  ${result.synced.length}`);
  console.log(`  🔮 Skipped: ${result.skipped.length} (drafts/issues)`);
  if (clean) console.log(`  🗑️  Removed:  ${result.removed.length}`);
  console.log(`  🖼️  Images:   ${result.imagesCopied}`);
  if (result.errors.length > 0) console.log(`  ❌ Errors:   ${result.errors.length}`);
  console.log("");

  if (result.errors.length > 0) process.exit(1);
}

main();