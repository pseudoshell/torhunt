import { describe, it, expect, vi } from "vitest";
import { searchTorrents, SEARCH_RESULT_CAP } from "./websearch";
import type { Source, SourceGroup, TorrentResult } from "../sources/types";

const HASH_A = "a".repeat(40);
const HASH_B = "b".repeat(40);

function result(over: Partial<TorrentResult> = {}): TorrentResult {
  const infoHash = over.infoHash ?? HASH_A;
  return {
    infoHash,
    name: "Torrent",
    sizeBytes: 1024,
    seeders: 5,
    leechers: 1,
    source: "yts",
    magnet: `magnet:?xt=urn:btih:${infoHash}`,
    ...over,
  };
}

function makeSource(
  id: Source["id"],
  label: string,
  groups: SourceGroup[],
  behavior: (() => Promise<TorrentResult[]>) | TorrentResult[],
): Source {
  return {
    id,
    label,
    groups,
    homepage: "https://example.invalid",
    reportsHealth: true,
    search: () => (typeof behavior === "function" ? behavior() : Promise.resolve(behavior)),
  };
}

describe("searchTorrents", () => {
  it("merges results from all sources, healthiest first", async () => {
    const sources = [
      makeSource("yts", "YTS", ["Movies"], [result({ infoHash: HASH_A, seeders: 3 })]),
      makeSource("eztv", "EZTV", ["TV"], [result({ infoHash: HASH_B, seeders: 30 })]),
    ];
    const out = await searchTorrents("query", null, { sources });
    expect(out.results.map((r) => r.infoHash)).toEqual([HASH_B, HASH_A]);
    expect(out.failed).toEqual([]);
  });

  it("dedupes the same torrent across indexers, keeping the healthiest row", async () => {
    const sources = [
      makeSource("yts", "YTS", ["Movies"], [result({ seeders: 2 })]),
      makeSource("tpb-movies", "TPB", ["Movies"], [result({ seeders: 9 })]),
    ];
    const out = await searchTorrents("query", null, { sources });
    expect(out.results).toHaveLength(1);
    expect(out.results[0]!.seeders).toBe(9);
  });

  it("degrades failing sources to the failed list instead of throwing", async () => {
    const sources = [
      makeSource("yts", "YTS", ["Movies"], [result({})]),
      makeSource("nyaa", "Nyaa", ["Anime"], async () => {
        throw new Error("down");
      }),
      makeSource("eztv", "EZTV", ["TV"], async () => {
        throw new Error("also down");
      }),
      makeSource("subsplease", "SubsPlease", ["Anime"], async () => {
        throw new Error("down too");
      }),
    ];
    const out = await searchTorrents("query", null, { sources });
    expect(out.results).toHaveLength(1);
    expect(out.failed).toEqual(["Nyaa", "EZTV", "SubsPlease"]);
  });

  it("only queries sources matching the requested category", async () => {
    const animeSearch = vi.fn(async () => [] as TorrentResult[]);
    const movieSearch = vi.fn(async () => [] as TorrentResult[]);
    const anime = makeSource("nyaa", "Nyaa", ["Anime"], []);
    anime.search = animeSearch;
    const movies = makeSource("yts", "YTS", ["Movies"], []);
    movies.search = movieSearch;

    await searchTorrents("query", "Anime", { sources: [anime, movies] });

    expect(animeSearch).toHaveBeenCalledTimes(1);
    expect(movieSearch).not.toHaveBeenCalled();
  });

  it("caps the merged result list", async () => {
    const many = Array.from({ length: SEARCH_RESULT_CAP + 20 }, (_, i) =>
      result({ infoHash: i.toString(16).padStart(40, "0"), seeders: SEARCH_RESULT_CAP + 20 - i }),
    );
    const out = await searchTorrents("query", null, {
      sources: [makeSource("yts", "YTS", ["Movies"], many)],
    });
    expect(out.results).toHaveLength(SEARCH_RESULT_CAP);
  });

  it("propagates the abort deadline to each source", async () => {
    const seen: (AbortSignal | undefined)[] = [];
    const src = makeSource("yts", "YTS", ["Movies"], []);
    src.search = (_q, opts) => {
      seen.push(opts?.signal);
      return Promise.resolve([]);
    };
    await searchTorrents("q", null, { sources: [src], timeoutMs: 1000 });
    expect(seen[0]).toBeInstanceOf(AbortSignal);
  });
});
