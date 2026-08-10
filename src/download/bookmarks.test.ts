import { promises as fs } from "node:fs";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { loadBookmarks, saveBookmarks, type BookmarkItem } from "./bookmarks";
import { bookmarksFile } from "../config/paths";

describe("bookmarks persistence", () => {
  beforeEach(async () => {
    await fs.rm(bookmarksFile, { force: true }).catch(() => {});
  });

  afterEach(async () => {
    await fs.rm(bookmarksFile, { force: true }).catch(() => {});
  });

  it("saves and loads bookmark items", async () => {
    const items: BookmarkItem[] = [
      {
        id: "bm-1",
        name: "Test Movie 1080p",
        magnet: "magnet:?xt=urn:btih:1234567890abcdef",
        source: "yts",
        sizeBytes: 1500000000,
        bookmarkedAt: Date.now(),
      },
    ];

    await saveBookmarks(items);
    const loaded = await loadBookmarks();
    expect(loaded).toHaveLength(1);
    expect(loaded[0]?.id).toBe("bm-1");
    expect(loaded[0]?.name).toBe("Test Movie 1080p");
  });

  it("returns empty array when file does not exist", async () => {
    const loaded = await loadBookmarks();
    expect(loaded).toEqual([]);
  });
});
