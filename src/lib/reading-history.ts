const STORAGE_KEY = "secondbrain-reading-history";

interface ReadEntry {
  slug: string;
  readAt: string;
}

const MAX_HISTORY = 50;

export function getReadingHistory(): ReadEntry[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

export function markAsRead(slug: string): void {
  const history = getReadingHistory().filter((e) => e.slug !== slug);
  history.unshift({ slug, readAt: new Date().toISOString() });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, MAX_HISTORY)));
  window.dispatchEvent(new CustomEvent("reading-history-changed"));
}

export function isRead(slug: string): boolean {
  return getReadingHistory().some((e) => e.slug === slug);
}

export function getReadingStreak(): number {
  const history = getReadingHistory();
  if (history.length === 0) return 0;
  const days = new Set(history.map((e) => new Date(e.readAt).toDateString()));
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    if (days.has(d.toDateString())) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

export function getTotalRead(validSlugs?: string[]): number {
  const history = getReadingHistory();
  const unique = new Set(history.map((e) => e.slug));
  if (validSlugs && validSlugs.length > 0) {
    const validSet = new Set(validSlugs);
    return [...unique].filter((s) => validSet.has(s)).length;
  }
  return unique.size;
}

export function getRecentlyReadSlugs(limit: number = 5): string[] {
  const history = getReadingHistory();
  // Deduplicate by slug while preserving order
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const entry of history) {
    if (!seen.has(entry.slug)) {
      seen.add(entry.slug);
      unique.push(entry.slug);
      if (unique.length >= limit) break;
    }
  }
  return unique;
}