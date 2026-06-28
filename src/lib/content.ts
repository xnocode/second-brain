import fs from "fs";
import path from "path";
import matter from "gray-matter";
import readingTime from "reading-time";

// --- TypeScript Interfaces ---

export interface PostFrontmatter {
  title: string;
  date: string;
  tags: string[];
  category?: string;
  draft: boolean;
  excerpt?: string;
  cover?: string;
  author?: string;
}

export interface Post {
  slug: string;
  frontmatter: PostFrontmatter;
  content: string;
  readingTime: string;
}

export interface TagWithCount {
  tag: string;
  count: number;
}

export interface CategoryWithCount {
  category: string;
  count: number;
}

// --- Helpers ---

const POSTS_DIR = path.join(process.cwd(), "content/posts");

function getPostFiles(): string[] {
  if (!fs.existsSync(POSTS_DIR)) {
    return [];
  }
  return fs.readdirSync(POSTS_DIR).filter((file) => file.endsWith(".md"));
}

function parsePostFile(filePath: string): Post {
  const fileContent = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(fileContent);
  const slug = path.basename(filePath, ".md");
  const stats = readingTime(content);

  return {
    slug,
    frontmatter: data as PostFrontmatter,
    content,
    readingTime: stats.text,
  };
}

function sortPostsByDate(posts: Post[]): Post[] {
  return posts.sort((a, b) => {
    const dateA = new Date(a.frontmatter.date).getTime();
    const dateB = new Date(b.frontmatter.date).getTime();
    return dateB - dateA;
  });
}

// --- Public Functions ---

/**
 * Returns all published posts (draft !== true), sorted by date descending.
 */
export function getAllPosts(): Post[] {
  const files = getPostFiles();
  const posts = files
    .map((file) => parsePostFile(path.join(POSTS_DIR, file)))
    .filter((post) => post.frontmatter.draft !== true);

  return sortPostsByDate(posts);
}

/**
 * Returns a single post by its slug, regardless of draft status.
 */
export function getPostBySlug(slug: string): Post | null {
  const filePath = path.join(POSTS_DIR, `${slug}.md`);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  return parsePostFile(filePath);
}

/**
 * Returns all published posts filtered by category.
 */
export function getPostsByCategory(category: string): Post[] {
  const allPosts = getAllPosts();
  return allPosts.filter(
    (post) => post.frontmatter.category?.toLowerCase() === category.toLowerCase()
  );
}

/**
 * Returns all published posts filtered by tag.
 */
export function getPostsByTag(tag: string): Post[] {
  const allPosts = getAllPosts();
  return allPosts.filter((post) =>
    post.frontmatter.tags?.some(
      (t) => t.toLowerCase() === tag.toLowerCase()
    )
  );
}

/**
 * Returns all unique tags with their post counts.
 */
export function getAllTags(): TagWithCount[] {
  const allPosts = getAllPosts();
  const tagMap = new Map<string, number>();

  for (const post of allPosts) {
    const tags = post.frontmatter.tags ?? [];
    for (const tag of tags) {
      tagMap.set(tag, (tagMap.get(tag) ?? 0) + 1);
    }
  }

  return Array.from(tagMap.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Returns all unique categories with their post counts.
 */
export function getAllCategories(): CategoryWithCount[] {
  const allPosts = getAllPosts();
  const categoryMap = new Map<string, number>();

  for (const post of allPosts) {
    const category = post.frontmatter.category;
    if (category) {
      categoryMap.set(category, (categoryMap.get(category) ?? 0) + 1);
    }
  }

  return Array.from(categoryMap.entries())
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Searches published posts by matching query against title, excerpt, and content.
 */
export function searchPosts(query: string): Post[] {
  const allPosts = getAllPosts();
  const normalizedQuery = query.toLowerCase().trim();

  if (!normalizedQuery) {
    return allPosts;
  }

  return allPosts.filter((post) => {
    const { title, excerpt, tags, category } = post.frontmatter;
    const content = post.content.toLowerCase();

    return (
      title.toLowerCase().includes(normalizedQuery) ||
      (excerpt?.toLowerCase().includes(normalizedQuery) ?? false) ||
      content.includes(normalizedQuery) ||
      (tags?.some((t) => t.toLowerCase().includes(normalizedQuery)) ?? false) ||
      (category?.toLowerCase().includes(normalizedQuery) ?? false)
    );
  });
}