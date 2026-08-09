import { describe, expect, it } from "vitest";
import {
  THEMES,
  DEFAULT_THEME,
  getTheme,
  nextTheme,
  sourceStyle,
  lerpHex,
} from "./theme";

describe("theme system", () => {
  it("includes all advertised themes with valid color structures", () => {
    expect(THEMES.length).toBeGreaterThanOrEqual(16);
    const ids = THEMES.map((t) => t.id);
    expect(ids).toContain("electric-cyan");
    expect(ids).toContain("classic-iris");
    expect(ids).toContain("matrix-green");
    expect(ids).toContain("amber-gold");
    expect(ids).toContain("catppuccin-rose");
    expect(ids).toContain("monochrome-slate");
    expect(ids).toContain("crimson-ruby");
    expect(ids).toContain("synthwave-sunset");
    expect(ids).toContain("nordic-frost");
    expect(ids).toContain("tokyo-night");
    expect(ids).toContain("solarized-dark");
    expect(ids).toContain("cyber-emerald");
    expect(ids).toContain("dracula");
    expect(ids).toContain("gruvbox-dark");
    expect(ids).toContain("monokai-pro");
    expect(ids).toContain("deep-ocean");

    for (const t of THEMES) {
      expect(t.name).toBeTruthy();
      expect(t.icon).toBeTruthy();
      expect(t.description).toBeTruthy();
      expect(t.colors.accent).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(t.colors.text).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(t.colors.good).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(t.colors.rule).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(t.colors.base).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(t.colors.shade).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });

  it("defaults to electric-cyan", () => {
    expect(DEFAULT_THEME.id).toBe("electric-cyan");
    expect(getTheme()).toBe(DEFAULT_THEME);
    expect(getTheme("unknown-id")).toBe(DEFAULT_THEME);
  });

  it("retrieves a theme by id", () => {
    const iris = getTheme("classic-iris");
    expect(iris.name).toBe("Classic Iris");
    expect(iris.colors.accent).toBe("#a78bfa");
  });

  it("cycles to the next theme in list and wraps", () => {
    const first = THEMES[0]!;
    const second = THEMES[1]!;
    const last = THEMES[THEMES.length - 1]!;

    expect(nextTheme(first.id).id).toBe(second.id);
    expect(nextTheme(last.id).id).toBe(first.id);
    expect(nextTheme("unknown").id).toBe(first.id);
  });

  it("resolves sourceStyle for different themes", () => {
    const cyan = getTheme("electric-cyan");
    const iris = getTheme("classic-iris");

    const fgCyan = sourceStyle("fitgirl", cyan);
    const fgIris = sourceStyle("fitgirl", iris);

    expect(fgCyan.tag).toBe("FG");
    expect(fgCyan.color).toBe(cyan.colors.accent);
    expect(fgIris.color).toBe(iris.colors.accent);
  });

  it("lerpHex correctly interpolates between two hex colors", () => {
    expect(lerpHex("#000000", "#ffffff", 0)).toBe("#000000");
    expect(lerpHex("#000000", "#ffffff", 1)).toBe("#ffffff");
    expect(lerpHex("#000000", "#ffffff", 0.5)).toBe("#808080");
  });
});
