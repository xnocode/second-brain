const STORAGE_KEY = "secondbrain-bookmarks";

export function getBookmarks(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

export function isBookmarked(slug: string): boolean {
  return getBookmarks().includes(slug);
}

export function toggleBookmark(slug: string): boolean {
  const current = getBookmarks();
  const index = current.indexOf(slug);
  if (index > -1) {
    current.splice(index, 1);
  } else {
    current.push(slug);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  window.dispatchEvent(new CustomEvent("bookmarks-changed"));
  return index === -1; // true = added, false = removed
}