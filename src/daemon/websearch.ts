// Headless search bridge: run the same source adapters the TUI's
// useConcurrentSearch hook runs, but resolved as a single HTTP response instead
// of a streaming render. Sources race in parallel under one deadline; a source
// failing or timing out degrades to an entry in `failed` rather than failing
// the whole request, mirroring how the TUI shows per-source status and keeps
// the rest of the results.
import { SOURCES } from "../sources/registry";
import type { Source, SourceGroup, TorrentResult } from "../sources/types";

export const SEARCH_RESULT_CAP = 60;

// The TUI gives multi-step scrapers 15s before timing them out gracefully; a
// search that outlives that is dead weight for an HTTP caller too.
const SOURCE_TIMEOUT_MS = 15_000;

export interface SearchDeps {
  sources?: readonly Source[];
  timeoutMs?: number;
}

export interface SearchOutcome {
  results: TorrentResult[];
  failed: string[];
}

// Same ordering the TUI defaults to: healthiest first, newest as tiebreak.
function defaultOrder(list: TorrentResult[]): TorrentResult[] {
  return list.sort((a, b) => {
    if (b.seeders !== a.seeders) return b.seeders - a.seeders;
    return (b.added ?? 0) - (a.added ?? 0);
  });
}

// Same infoHash dedupe the results view applies: several indexers often return
// the same torrent, and the healthiest row wins.
function dedupe(list: TorrentResult[]): TorrentResult[] {
  const byHash = new Map<string, TorrentResult>();
  for (const r of list) {
    const existing = byHash.get(r.infoHash);
    if (!existing || r.seeders > existing.seeders) byHash.set(r.infoHash, r);
  }
  return [...byHash.values()];
}

export async function searchTorrents(
  query: string,
  category: SourceGroup | null,
  deps: SearchDeps = {},
): Promise<SearchOutcome> {
  const pool = deps.sources ?? SOURCES;
  const picked = category
    ? pool.filter((s) => s.groups?.includes(category))
    : pool;
  const signal = AbortSignal.timeout(deps.timeoutMs ?? SOURCE_TIMEOUT_MS);
  const settled = await Promise.all(
    picked.map(async (source) => {
      try {
        return {
          ok: true as const,
          label: source.label,
          results: await source.search(query, { signal }),
        };
      } catch {
        return { ok: false as const, label: source.label, results: [] as TorrentResult[] };
      }
    }),
  );
  const failed = [...new Set(settled.filter((s) => !s.ok).map((s) => s.label))];
  const results = defaultOrder(dedupe(settled.flatMap((s) => s.results))).slice(
    0,
    SEARCH_RESULT_CAP,
  );
  return { results, failed };
}
