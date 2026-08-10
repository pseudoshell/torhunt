import { promises as fs } from "node:fs";
import { searchHistoryFile } from "../config/paths";
import { serializeWrites, writeJsonAtomic } from "../util/atomic";

export const MAX_SEARCH_HISTORY = 50;

/**
 * Pure helper to add a search query into history list:
 * - Trims whitespace
 * - Drops empty queries or magnet link URLs
 * - Removes existing duplicate if present
 * - Inserts the new query at the beginning (most recent first)
 * - Limits the list to maxItems (default 50)
 */
export function addSearchQuery(
  history: string[],
  query: string,
  maxItems: number = MAX_SEARCH_HISTORY,
): string[] {
  const trimmed = query.trim();
  if (!trimmed) return history;
  // Don't clutter search history with raw magnet URIs
  if (/^magnet:\?/i.test(trimmed)) return history;

  const withoutDuplicate = history.filter(
    (item) => item.toLowerCase() !== trimmed.toLowerCase(),
  );
  return [trimmed, ...withoutDuplicate].slice(0, maxItems);
}

const write = serializeWrites();

export async function loadSearchHistory(): Promise<string[]> {
  try {
    const raw = await fs.readFile(searchHistoryFile, "utf8");
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
  } catch {
    return [];
  }
}

export function saveSearchHistory(history: string[]): Promise<void> {
  return write(() => writeJsonAtomic(searchHistoryFile, history));
}

export function clearSearchHistory(): Promise<void> {
  return saveSearchHistory([]);
}
