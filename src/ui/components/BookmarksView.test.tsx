import React from "react";
import { describe, expect, it } from "vitest";
import { StoreContext } from "../store";
import { BookmarksView } from "./BookmarksView";
import { makeTestStore, renderUI, stripAnsi } from "../testHarness";
import type { BookmarkItem } from "../../download/bookmarks";

describe("BookmarksView", () => {
  it("renders list of bookmarked items", () => {
    const now = Date.now();
    const bookmarks: BookmarkItem[] = [
      { id: "a", name: "Alpha", sizeBytes: 1e9, magnet: "m:a", bookmarkedAt: now },
      { id: "b", name: "Beta", sizeBytes: 2e9, magnet: "m:b", bookmarkedAt: now - 86400 * 1000 * 3 },
    ];

    const store = makeTestStore({
      section: "bookmarks",
      bookmarks,
    });

    const { frame, unmount } = renderUI(
      <StoreContext.Provider value={store}>
        <BookmarksView />
      </StoreContext.Provider>,
    );

    const f = frame();
    expect(f).toContain("Alpha");
    expect(f).toContain("Beta");
    unmount();
  });

  it("shows empty state message when there are no bookmarks", () => {
    const store = makeTestStore({
      section: "bookmarks",
      bookmarks: [],
    });

    const { frame, unmount } = renderUI(
      <StoreContext.Provider value={store}>
        <BookmarksView />
      </StoreContext.Provider>,
    );

    const f = frame();
    expect(f).toContain("No bookmarks yet");
    unmount();
  });
});
