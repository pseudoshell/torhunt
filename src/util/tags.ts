export type QualityTag = "4K" | "1080p" | "720p" | "x265" | "FitGirl" | "FLAC";

export const QUALITY_TAGS: readonly QualityTag[] = [
  "4K",
  "1080p",
  "720p",
  "x265",
  "FitGirl",
  "FLAC",
];

const TAG_PATTERNS: Record<QualityTag, RegExp> = {
  "4K": /\b(2160p|4k|uhd)\b/i,
  "1080p": /\b(1080p|fhd)\b/i,
  "720p": /\b(720p|hd)\b/i,
  x265: /\b(x265|hevc|h265|10bit)\b/i,
  FitGirl: /\b(fitgirl)\b/i,
  FLAC: /\b(flac|lossless|alac|ape)\b/i,
};

export function parseQualityTags(title: string): QualityTag[] {
  const result: QualityTag[] = [];
  for (const tag of QUALITY_TAGS) {
    if (TAG_PATTERNS[tag].test(title)) {
      result.push(tag);
    }
  }
  return result;
}

export function matchesQualityTag(title: string, tag: QualityTag | "ALL"): boolean {
  if (tag === "ALL") return true;
  return TAG_PATTERNS[tag]?.test(title) ?? true;
}
