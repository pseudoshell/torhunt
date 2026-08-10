import { promises as fs, mkdirSync, writeFileSync, renameSync } from "node:fs";
import path from "node:path";
import { bookmarksFile } from "../config/paths";
import { serializeWrites, writeJsonAtomic } from "../util/atomic";
import type { SourceId } from "../sources/types";

export const BOOKMARKS_CAP = 200;

export interface BookmarkItem {
  id: string;
  name: string;
  source?: SourceId;
  magnet: string;
  sizeBytes: number;
  bookmarkedAt: number;
}

const write = serializeWrites();

export function saveBookmarks(items: BookmarkItem[]): Promise<void> {
  return write(() => writeJsonAtomic(bookmarksFile, items.slice(0, BOOKMARKS_CAP)));
}

export function saveBookmarksSync(items: BookmarkItem[]): void {
  try {
    mkdirSync(path.dirname(bookmarksFile), { recursive: true });
    const tmp = `${bookmarksFile}.sync.tmp`;
    writeFileSync(tmp, JSON.stringify(items.slice(0, BOOKMARKS_CAP), null, 2), "utf8");
    renameSync(tmp, bookmarksFile);
  } catch {}
}

function isBookmarkItem(v: unknown): v is BookmarkItem {
  if (!v || typeof v !== "object") return false;
  const r = v as Record<string, unknown>;
  return typeof r.id === "string" && typeof r.name === "string" && typeof r.magnet === "string";
}

export async function loadBookmarks(): Promise<BookmarkItem[]> {
  let raw: string;
  try {
    raw = await fs.readFile(bookmarksFile, "utf8");
  } catch {
    return [];
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter(isBookmarkItem).slice(0, BOOKMARKS_CAP) : [];
  } catch {
    return [];
  }
}
