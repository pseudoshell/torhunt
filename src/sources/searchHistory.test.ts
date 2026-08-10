import { promises as fs } from "node:fs";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  addSearchQuery,
  clearSearchHistory,
  loadSearchHistory,
  saveSearchHistory,
} from "./searchHistory";
import { searchHistoryFile } from "../config/paths";

describe("searchHistory module", () => {
  beforeEach(async () => {
    await fs.rm(searchHistoryFile, { force: true }).catch(() => {});
  });

  afterEach(async () => {
    await fs.rm(searchHistoryFile, { force: true }).catch(() => {});
  });

  describe("addSearchQuery", () => {
    it("adds new search query to the front", () => {
      const history = ["Inception", "Interstellar"];
      const result = addSearchQuery(history, "Oppenheimer");
      expect(result).toEqual(["Oppenheimer", "Inception", "Interstellar"]);
    });

    it("moves existing duplicate to the front and avoids duplicate entries (case-insensitive)", () => {
      const history = ["Oppenheimer", "Inception", "Interstellar"];
      const result = addSearchQuery(history, "inception");
      expect(result).toEqual(["inception", "Oppenheimer", "Interstellar"]);
    });

    it("ignores empty or whitespace queries", () => {
      const history = ["Inception"];
      expect(addSearchQuery(history, "")).toEqual(["Inception"]);
      expect(addSearchQuery(history, "   ")).toEqual(["Inception"]);
    });

    it("ignores raw magnet links", () => {
      const history = ["Inception"];
      expect(
        addSearchQuery(history, "magnet:?xt=urn:btih:1234567890abcdef"),
      ).toEqual(["Inception"]);
    });

    it("enforces maxItems limit", () => {
      const history = ["a", "b", "c"];
      const result = addSearchQuery(history, "d", 3);
      expect(result).toEqual(["d", "a", "b"]);
    });
  });

  describe("persistence", () => {
    it("saves and loads search history from disk", async () => {
      const items = ["House of the Dragon", "The Batman", "Dune 2"];
      await saveSearchHistory(items);
      const loaded = await loadSearchHistory();
      expect(loaded).toEqual(items);
    });

    it("returns empty array when file does not exist", async () => {
      const loaded = await loadSearchHistory();
      expect(loaded).toEqual([]);
    });

    it("clears search history", async () => {
      await saveSearchHistory(["House of the Dragon"]);
      await clearSearchHistory();
      const loaded = await loadSearchHistory();
      expect(loaded).toEqual([]);
    });
  });
});
