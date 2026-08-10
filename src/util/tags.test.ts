import { describe, expect, it } from "vitest";
import { parseQualityTags, matchesQualityTag } from "./tags";

describe("parseQualityTags", () => {
  it("parses 4K, 1080p, x265, and FitGirl tags accurately", () => {
    expect(parseQualityTags("Cyberpunk 2077 v2.12-FitGirl")).toEqual(["FitGirl"]);
    expect(parseQualityTags("House.of.the.Dragon.S03E08.2160p.4K.HEVC.x265")).toEqual(["4K", "x265"]);
    expect(parseQualityTags("Interstellar 2014 1080p BluRay x264")).toEqual(["1080p"]);
    expect(parseQualityTags("Daft Punk - Discovery (2001) [FLAC Lossless]")).toEqual(["FLAC"]);
  });

  it("handles matchesQualityTag correctly", () => {
    expect(matchesQualityTag("Avatar 2160p UHD", "4K")).toBe(true);
    expect(matchesQualityTag("Avatar 1080p", "4K")).toBe(false);
    expect(matchesQualityTag("Avatar 1080p", "ALL")).toBe(true);
  });
});
