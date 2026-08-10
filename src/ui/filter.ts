import { getSource } from "../sources/registry";
import type { TorrentResult } from "../sources/types";
import { matchesQualityTag, type QualityTag } from "../util/tags";

export function filterResults(
  list: TorrentResult[],
  hideDead: boolean,
  textFilter: string = "",
  qualityFilter: QualityTag | "ALL" = "ALL",
): TorrentResult[] {
  let filtered = list;

  if (hideDead) {
    filtered = filtered.filter((r) => r.seeders > 0 || !getSource(r.source).reportsHealth);
  }

  if (qualityFilter !== "ALL") {
    filtered = filtered.filter((r) => matchesQualityTag(r.name, qualityFilter));
  }

  const text = textFilter.trim().toLowerCase();
  if (text) {
    const tokens = text.split(/\s+/);
    const scored = filtered.map((r) => {
      const name = r.name.toLowerCase();
      let score = 0;

      const matchesAll = tokens.every((token) => name.includes(token));
      if (!matchesAll) return { r, score: 0 };

      score += 10;

      const normalizedText = tokens.join(" ");
      if (name.includes(normalizedText)) {
        score += 50;
      } else {
        let lastIndex = -1;
        let inOrder = true;
        for (const token of tokens) {
          const idx = name.indexOf(token, lastIndex + 1);
          if (idx === -1 || idx < lastIndex) {
            inOrder = false;
            break;
          }
          lastIndex = idx;
        }
        if (inOrder) score += 20;
      }

      return { r, score };
    });

    filtered = scored
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((x) => x.r);
  }

  return filtered;
}
