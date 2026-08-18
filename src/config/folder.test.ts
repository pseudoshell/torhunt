import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  expandHome,
  getCategoryForSource,
  normalizeDownloadDir,
  resolveDownloadDir,
} from "./folder";

const HOME = path.join(path.sep, "home", "ada");

describe("expandHome", () => {
  it("maps a bare tilde to the home directory", () => {
    expect(expandHome("~", HOME)).toBe(HOME);
  });

  it("expands a leading ~/ segment", () => {
    expect(expandHome("~/Movies", HOME)).toBe(path.join(HOME, "Movies"));
  });

  it("expands a leading ~\\ segment for paths typed on Windows", () => {
    expect(expandHome("~\\Movies", HOME)).toBe(path.join(HOME, "Movies"));
  });

  it("leaves an absolute path untouched apart from trimming", () => {
    const abs = path.join(path.sep, "mnt", "media");
    expect(expandHome(`  ${abs}  `, HOME)).toBe(abs);
  });

  it("does not expand a tilde that is not a path prefix", () => {
    expect(expandHome("~weird", HOME)).toBe("~weird");
  });
});

describe("normalizeDownloadDir", () => {
  it("returns an empty string for blank input", () => {
    expect(normalizeDownloadDir("   ", HOME)).toBe("");
  });

  it("normalizes a tilde path into a usable directory", () => {
    expect(normalizeDownloadDir("~/Downloads/torhunt", HOME)).toBe(
      path.normalize(path.join(HOME, "Downloads", "torhunt")),
    );
  });

  it("appends Downloads to a bare Windows drive root to prevent EPERM errors", () => {
    expect(normalizeDownloadDir("Z:\\", HOME)).toBe(path.normalize("Z:\\Downloads"));
    expect(normalizeDownloadDir("Z:", HOME)).toBe(path.normalize("Z:\\Downloads"));
  });
});

describe("getCategoryForSource", () => {
  it("maps fitgirl to Games", () => {
    expect(getCategoryForSource("fitgirl")).toBe("Games");
  });

  it("maps yts and tpb-movies to Movies", () => {
    expect(getCategoryForSource("yts")).toBe("Movies");
    expect(getCategoryForSource("tpb-movies")).toBe("Movies");
  });

  it("maps eztv to TV", () => {
    expect(getCategoryForSource("eztv")).toBe("TV");
  });

  it("maps nyaa and subsplease to Anime", () => {
    expect(getCategoryForSource("nyaa")).toBe("Anime");
    expect(getCategoryForSource("subsplease")).toBe("Anime");
  });

  it("defaults unknown or missing sources to Other", () => {
    expect(getCategoryForSource(undefined)).toBe("Other");
    expect(getCategoryForSource("unknown-source")).toBe("Other");
  });
});

describe("resolveDownloadDir", () => {
  it("nests torhunt parent folder and category subfolders when enabled", () => {
    const base = path.join(HOME, "Downloads");
    expect(resolveDownloadDir(base, { source: "yts", categorySubfolders: true }, HOME)).toBe(
      path.normalize(path.join(HOME, "Downloads", "torhunt", "Movies")),
    );
    expect(resolveDownloadDir(base, { source: "fitgirl", categorySubfolders: true }, HOME)).toBe(
      path.normalize(path.join(HOME, "Downloads", "torhunt", "Games")),
    );
    expect(resolveDownloadDir(base, { source: undefined, categorySubfolders: true }, HOME)).toBe(
      path.normalize(path.join(HOME, "Downloads", "torhunt", "Other")),
    );
  });

  it("uses torhunt parent folder without category subfolder when categorySubfolders is false", () => {
    const base = path.join(HOME, "Downloads");
    expect(resolveDownloadDir(base, { source: "yts", categorySubfolders: false }, HOME)).toBe(
      path.normalize(path.join(HOME, "Downloads", "torhunt")),
    );
  });

  it("prevents double torhunt/torhunt nesting if input path already ends in torhunt", () => {
    const base = path.join(HOME, "Downloads", "torhunt");
    expect(resolveDownloadDir(base, { source: "yts", categorySubfolders: true }, HOME)).toBe(
      path.normalize(path.join(HOME, "Downloads", "torhunt", "Movies")),
    );
    expect(resolveDownloadDir(base, { source: "yts", categorySubfolders: false }, HOME)).toBe(
      path.normalize(path.join(HOME, "Downloads", "torhunt")),
    );
  });
});
