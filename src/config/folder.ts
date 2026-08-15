import os from "node:os";
import path from "node:path";

// We read the raw input field, so expand a leading ~ ourselves (~\ too, for
// paths pasted from Windows). ~bob isn't us, so leave it alone.
export function expandHome(input: string, home: string = os.homedir()): string {
  const trimmed = input.trim();
  if (trimmed === "~") return home;
  if (trimmed.startsWith("~/") || trimmed.startsWith("~\\")) {
    return path.join(home, trimmed.slice(2));
  }
  return trimmed;
}

// Typed input -> a path for fs.mkdir. Blank returns "" (caller: leave it be).
export function normalizeDownloadDir(input: string, home: string = os.homedir()): string {
  const expanded = expandHome(input, home);
  if (!expanded) return "";
  const trimmed = expanded.trim();
  if (/^[a-zA-Z]:[\\/]?$/.test(trimmed)) {
    const drive = trimmed[0]!.toUpperCase();
    return path.normalize(`${drive}:\\Downloads`);
  }
  return path.normalize(expanded);
}

export function getCategoryForSource(source?: string): string {
  if (!source) return "Other";
  const lower = source.toLowerCase();
  if (lower.includes("fitgirl")) return "Games";
  if (lower.includes("yts") || lower.includes("movies")) return "Movies";
  if (lower.includes("eztv") || lower.includes("tv")) return "TV";
  if (lower.includes("nyaa") || lower.includes("subsplease") || lower.includes("anime")) return "Anime";
  return "Other";
}

export interface FolderResolveOptions {
  source?: string;
  categorySubfolders?: boolean;
}

export function resolveDownloadDir(
  inputDir: string,
  options?: FolderResolveOptions,
  home: string = os.homedir(),
): string {
  const norm = normalizeDownloadDir(inputDir, home);
  if (!norm) return "";

  const baseName = path.basename(norm).toLowerCase();
  const torhuntDir = baseName === "torhunt" ? norm : path.join(norm, "torhunt");

  const enabled = options?.categorySubfolders ?? true;
  if (!enabled) {
    return path.normalize(torhuntDir);
  }

  const category = getCategoryForSource(options?.source);
  return path.normalize(path.join(torhuntDir, category));
}
