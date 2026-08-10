import type { SourceId } from "../sources/types";

export interface ThemeColors {
  accent: string;
  text: string;
  alt: string;
  good: string;
  warn: string;
  bad: string;
  bright: string;
  rule: string;
  paused: string;
  base: string;
  shade: string;
  sprout: string;
  sheenPeak: string;
}

export interface Theme {
  id: string;
  name: string;
  description: string;
  icon: string;
  colors: ThemeColors;
  sourceStyles?: Partial<Record<SourceId, { tag?: string; color: string }>>;
}

export const THEMES: readonly Theme[] = [
  {
    id: "electric-cyan",
    name: "Electric Cyan",
    description: "Vibrant high-voltage cyan with emerald & ice highlights",
    icon: "⚡",
    colors: {
      accent: "#00e5ff",
      text: "#e6f9ff",
      alt: "#00b4d8",
      good: "#00ff9d",
      warn: "#ffd166",
      bad: "#ff3864",
      bright: "#80f4ff",
      rule: "#1e4d61",
      paused: "#52798e",
      base: "#0077b6",
      shade: "#032845",
      sprout: "#00ffcc",
      sheenPeak: "#e0faff",
    },
    sourceStyles: {
      subsplease: { color: "#64dfdf" },
      "tpb-movies": { color: "#48cae4" },
      "tpb-tv": { color: "#48cae4" },
      "x1337-movies": { color: "#f77f00" },
      "x1337-tv": { color: "#f77f00" },
      bittorrented: { color: "#0096c7" },
    },
  },
  {
    id: "classic-iris",
    name: "Classic Iris",
    description: "The original sleek purple and violet palette",
    icon: "💜",
    colors: {
      accent: "#a78bfa",
      text: "#e9e4f5",
      alt: "#b9a7e6",
      good: "#86d6a2",
      warn: "#f0c560",
      bad: "#ee7d92",
      bright: "#d8b4fe",
      rule: "#6b6577",
      paused: "#7c7785",
      base: "#7c5cd6",
      shade: "#4c3a8a",
      sprout: "#c084fc",
      sheenPeak: "#f4efff",
    },
    sourceStyles: {
      subsplease: { color: "#b9a7e6" },
      "tpb-movies": { color: "#5fd0c5" },
      "tpb-tv": { color: "#5fd0c5" },
      "x1337-movies": { color: "#f6a55c" },
      "x1337-tv": { color: "#f6a55c" },
      bittorrented: { color: "#7db8f0" },
    },
  },
  {
    id: "matrix-green",
    name: "Matrix Green",
    description: "Cyberpunk phosphor terminal glow",
    icon: "🟢",
    colors: {
      accent: "#00ff66",
      text: "#e0ffe8",
      alt: "#00cc55",
      good: "#00ff66",
      warn: "#ffcc00",
      bad: "#ff3355",
      bright: "#66ff99",
      rule: "#1a4d2e",
      paused: "#336644",
      base: "#008f39",
      shade: "#003814",
      sprout: "#39ff14",
      sheenPeak: "#e0ffe8",
    },
    sourceStyles: {
      subsplease: { color: "#00ee77" },
      "tpb-movies": { color: "#33ff99" },
      "tpb-tv": { color: "#33ff99" },
      "x1337-movies": { color: "#ffaa00" },
      "x1337-tv": { color: "#ffaa00" },
      bittorrented: { color: "#00cc88" },
    },
  },
  {
    id: "amber-gold",
    name: "Amber Gold",
    description: "Retro monochromatic amber CRT display",
    icon: "🟠",
    colors: {
      accent: "#ff9f1c",
      text: "#fff5e6",
      alt: "#fca311",
      good: "#ffd166",
      warn: "#ffe49e",
      bad: "#e63946",
      bright: "#ffbf69",
      rule: "#4a3b2c",
      paused: "#665544",
      base: "#b36b00",
      shade: "#4d2e00",
      sprout: "#ffd166",
      sheenPeak: "#fff8f0",
    },
    sourceStyles: {
      subsplease: { color: "#fca311" },
      "tpb-movies": { color: "#e9c46a" },
      "tpb-tv": { color: "#e9c46a" },
      "x1337-movies": { color: "#e76f51" },
      "x1337-tv": { color: "#e76f51" },
      bittorrented: { color: "#f4a261" },
    },
  },
  {
    id: "catppuccin-rose",
    name: "Catppuccin Rose",
    description: "Soft pastel flamingo, rose and lavender",
    icon: "🌸",
    colors: {
      accent: "#f38ba8",
      text: "#cdd6f4",
      alt: "#f5c2e7",
      good: "#a6e3a1",
      warn: "#f9e2af",
      bad: "#eba0ac",
      bright: "#fab387",
      rule: "#45475a",
      paused: "#6c7086",
      base: "#b44d70",
      shade: "#5c1d34",
      sprout: "#f5c2e7",
      sheenPeak: "#fcf0f5",
    },
    sourceStyles: {
      subsplease: { color: "#f5c2e7" },
      "tpb-movies": { color: "#94e2d5" },
      "tpb-tv": { color: "#94e2d5" },
      "x1337-movies": { color: "#fab387" },
      "x1337-tv": { color: "#fab387" },
      bittorrented: { color: "#89b4fa" },
    },
  },
  {
    id: "monochrome-slate",
    name: "Monochrome Slate",
    description: "Minimalist high-contrast slate & titanium",
    icon: "⚪",
    colors: {
      accent: "#e2e8f0",
      text: "#f8fafc",
      alt: "#94a3b8",
      good: "#4ade80",
      warn: "#fbbf24",
      bad: "#f87171",
      bright: "#ffffff",
      rule: "#334155",
      paused: "#64748b",
      base: "#64748b",
      shade: "#1e293b",
      sprout: "#f8fafc",
      sheenPeak: "#ffffff",
    },
    sourceStyles: {
      subsplease: { color: "#cbd5e1" },
      "tpb-movies": { color: "#94a3b8" },
      "tpb-tv": { color: "#94e2d5" },
      "x1337-movies": { color: "#f59e0b" },
      "x1337-tv": { color: "#f59e0b" },
      bittorrented: { color: "#38bdf8" },
    },
  },
  {
    id: "crimson-ruby",
    name: "Crimson Ruby",
    description: "Deep noir wine with radiant ruby and gold embers",
    icon: "🩸",
    colors: {
      accent: "#ff2a5f",
      text: "#fff0f3",
      alt: "#ff6384",
      good: "#00f5a0",
      warn: "#ffb703",
      bad: "#d90429",
      bright: "#ff758f",
      rule: "#4a192c",
      paused: "#7a4d5e",
      base: "#9d0208",
      shade: "#370617",
      sprout: "#ff758f",
      sheenPeak: "#fff5f7",
    },
    sourceStyles: {
      subsplease: { color: "#ff6384" },
      "tpb-movies": { color: "#ff758f" },
      "tpb-tv": { color: "#ff758f" },
      "x1337-movies": { color: "#ffb703" },
      "x1337-tv": { color: "#ffb703" },
      bittorrented: { color: "#ff4d6d" },
    },
  },
  {
    id: "synthwave-sunset",
    name: "Synthwave Sunset",
    description: "80s retro synthwave with neon magenta, cyber cyan and dusk violet",
    icon: "🌌",
    colors: {
      accent: "#ff007f",
      text: "#fdf2f8",
      alt: "#00f0ff",
      good: "#39ff14",
      warn: "#ffbd00",
      bad: "#ff0055",
      bright: "#ff66cc",
      rule: "#43144a",
      paused: "#6b4670",
      base: "#7b1fa2",
      shade: "#2a0845",
      sprout: "#00f0ff",
      sheenPeak: "#ffe6f9",
    },
    sourceStyles: {
      subsplease: { color: "#00f0ff" },
      "tpb-movies": { color: "#ff66cc" },
      "tpb-tv": { color: "#ff66cc" },
      "x1337-movies": { color: "#ffbd00" },
      "x1337-tv": { color: "#ffbd00" },
      bittorrented: { color: "#00f0ff" },
    },
  },
  {
    id: "nordic-frost",
    name: "Nordic Frost",
    description: "Deep Arctic navy with glacier ice and polar auroras",
    icon: "❄️",
    colors: {
      accent: "#88c0d0",
      text: "#eceff4",
      alt: "#81a1c1",
      good: "#a3be8c",
      warn: "#ebcb8b",
      bad: "#bf616a",
      bright: "#e5e9f0",
      rule: "#3b4252",
      paused: "#4c566a",
      base: "#5e81ac",
      shade: "#2e3440",
      sprout: "#88c0d0",
      sheenPeak: "#f5f9fc",
    },
    sourceStyles: {
      subsplease: { color: "#88c0d0" },
      "tpb-movies": { color: "#81a1c1" },
      "tpb-tv": { color: "#81a1c1" },
      "x1337-movies": { color: "#ebcb8b" },
      "x1337-tv": { color: "#ebcb8b" },
      bittorrented: { color: "#8fbcbb" },
    },
  },
  {
    id: "tokyo-night",
    name: "Tokyo Night",
    description: "Cyberpunk midnight neon with electric indigo and storm cyan",
    icon: "🌃",
    colors: {
      accent: "#7aa2f7",
      text: "#c0caf5",
      alt: "#bb9af7",
      good: "#9ece6a",
      warn: "#e0af68",
      bad: "#f7768e",
      bright: "#7dcfff",
      rule: "#292e42",
      paused: "#565f89",
      base: "#3d59a1",
      shade: "#1a1b26",
      sprout: "#7dcfff",
      sheenPeak: "#e4f0ff",
    },
    sourceStyles: {
      subsplease: { color: "#7dcfff" },
      "tpb-movies": { color: "#bb9af7" },
      "tpb-tv": { color: "#bb9af7" },
      "x1337-movies": { color: "#e0af68" },
      "x1337-tv": { color: "#e0af68" },
      bittorrented: { color: "#7aa2f7" },
    },
  },
  {
    id: "solarized-dark",
    name: "Solarized Dark",
    description: "Precision solar cyan and amber engineered for terminal purists",
    icon: "☀️",
    colors: {
      accent: "#2aa198",
      text: "#93a1a1",
      alt: "#268bd2",
      good: "#859900",
      warn: "#b58900",
      bad: "#dc322f",
      bright: "#eee8d5",
      rule: "#073642",
      paused: "#586e75",
      base: "#268bd2",
      shade: "#002b36",
      sprout: "#2aa198",
      sheenPeak: "#fdf6e3",
    },
    sourceStyles: {
      subsplease: { color: "#2aa198" },
      "tpb-movies": { color: "#268bd2" },
      "tpb-tv": { color: "#268bd2" },
      "x1337-movies": { color: "#cb4b16" },
      "x1337-tv": { color: "#cb4b16" },
      bittorrented: { color: "#6c71c4" },
    },
  },
  {
    id: "cyber-emerald",
    name: "Cyber Emerald",
    description: "Radioactive neon emerald with jade & mint glow",
    icon: "💎",
    colors: {
      accent: "#10b981",
      text: "#ecfdf5",
      alt: "#34d399",
      good: "#059669",
      warn: "#f59e0b",
      bad: "#f43f5e",
      bright: "#6ee7b7",
      rule: "#064e3b",
      paused: "#047857",
      base: "#059669",
      shade: "#022c22",
      sprout: "#6ee7b7",
      sheenPeak: "#f0fdf4",
    },
    sourceStyles: {
      subsplease: { color: "#34d399" },
      "tpb-movies": { color: "#6ee7b7" },
      "tpb-tv": { color: "#6ee7b7" },
      "x1337-movies": { color: "#f59e0b" },
      "x1337-tv": { color: "#f59e0b" },
      bittorrented: { color: "#10b981" },
    },
  },
  {
    id: "dracula",
    name: "Dracula",
    description: "Iconic dark purple with vampiric pink, cyan and orange fangs",
    icon: "🧛",
    colors: {
      accent: "#bd93f9",
      text: "#f8f8f2",
      alt: "#ff79c6",
      good: "#50fa7b",
      warn: "#f1fa8c",
      bad: "#ff5555",
      bright: "#8be9fd",
      rule: "#44475a",
      paused: "#6272a4",
      base: "#6272a4",
      shade: "#282a36",
      sprout: "#8be9fd",
      sheenPeak: "#f8f8f2",
    },
    sourceStyles: {
      subsplease: { color: "#8be9fd" },
      "tpb-movies": { color: "#ff79c6" },
      "tpb-tv": { color: "#ff79c6" },
      "x1337-movies": { color: "#ffb86c" },
      "x1337-tv": { color: "#ffb86c" },
      bittorrented: { color: "#bd93f9" },
    },
  },
  {
    id: "gruvbox-dark",
    name: "Gruvbox Dark",
    description: "Warm retro earthy tones with ochre, rust and olive",
    icon: "🪵",
    colors: {
      accent: "#fabd2f",
      text: "#ebdbb2",
      alt: "#fe8019",
      good: "#b8bb26",
      warn: "#fabd2f",
      bad: "#fb4934",
      bright: "#fbf1c7",
      rule: "#3c3836",
      paused: "#665c54",
      base: "#d79921",
      shade: "#1d2021",
      sprout: "#fe8019",
      sheenPeak: "#fbf1c7",
    },
    sourceStyles: {
      subsplease: { color: "#b8bb26" },
      "tpb-movies": { color: "#83a598" },
      "tpb-tv": { color: "#83a598" },
      "x1337-movies": { color: "#fe8019" },
      "x1337-tv": { color: "#fe8019" },
      bittorrented: { color: "#d3869b" },
    },
  },
  {
    id: "monokai-pro",
    name: "Monokai Pro",
    description: "Legendary code editor warm neon with coral, lime and violet",
    icon: "🔥",
    colors: {
      accent: "#ffd866",
      text: "#fcfcfa",
      alt: "#78dce8",
      good: "#a9dc76",
      warn: "#ffd866",
      bad: "#ff6188",
      bright: "#ab9df2",
      rule: "#403e41",
      paused: "#727072",
      base: "#fc9867",
      shade: "#2d2a2e",
      sprout: "#a9dc76",
      sheenPeak: "#fcfcfa",
    },
    sourceStyles: {
      subsplease: { color: "#78dce8" },
      "tpb-movies": { color: "#ab9df2" },
      "tpb-tv": { color: "#ab9df2" },
      "x1337-movies": { color: "#fc9867" },
      "x1337-tv": { color: "#fc9867" },
      bittorrented: { color: "#a9dc76" },
    },
  },
  {
    id: "deep-ocean",
    name: "Deep Ocean",
    description: "Abyssal midnight blue with bioluminescent teal and coral",
    icon: "🌊",
    colors: {
      accent: "#82aaff",
      text: "#c3e8ff",
      alt: "#89ddff",
      good: "#c3e88d",
      warn: "#ffcb6b",
      bad: "#f07178",
      bright: "#b2ccd6",
      rule: "#1f2d3d",
      paused: "#4e6e8e",
      base: "#546e7a",
      shade: "#0f111a",
      sprout: "#89ddff",
      sheenPeak: "#e8f4ff",
    },
    sourceStyles: {
      subsplease: { color: "#89ddff" },
      "tpb-movies": { color: "#c792ea" },
      "tpb-tv": { color: "#c792ea" },
      "x1337-movies": { color: "#ffcb6b" },
      "x1337-tv": { color: "#ffcb6b" },
      bittorrented: { color: "#82aaff" },
    },
  },
] as const;

export const DEFAULT_THEME: Theme = THEMES[0]!;

export function getTheme(id?: string): Theme {
  if (!id) return DEFAULT_THEME;
  return THEMES.find((t) => t.id === id) ?? DEFAULT_THEME;
}

export function nextTheme(currentId: string): Theme {
  const idx = THEMES.findIndex((t) => t.id === currentId);
  const nextIdx = idx === -1 ? 0 : (idx + 1) % THEMES.length;
  return THEMES[nextIdx]!;
}

// Fallback constant for backwards compatibility
export const COLOR = DEFAULT_THEME.colors;
export const RULE = DEFAULT_THEME.colors.rule;

export const ICON = {
  done: "✓",
  error: "✗",
  pending: "·",
  pointer: "→",
  dot: "·",
  warn: "⚠",
  bar: "▌",
  down: "↓",
  up: "↑",
  peer: "•",
  pause: "||",
} as const;

export const GUTTER = 2;

const BASE_SOURCE_TAGS: Record<SourceId, string> = {
  fitgirl: "FG",
  yts: "YTS",
  eztv: "EZTV",
  nyaa: "NYAA",
  subsplease: "SUB",
  "tpb-movies": "TPB",
  "tpb-tv": "TPB",
  "x1337-movies": "1337",
  "x1337-tv": "1337",
  bittorrented: "BT",
};

export function sourceStyle(
  id?: SourceId,
  theme: Theme = DEFAULT_THEME,
): { tag: string; color: string } {
  if (!id) return { tag: "•", color: theme.colors.alt };
  const tag = BASE_SOURCE_TAGS[id] ?? "•";
  const custom = theme.sourceStyles?.[id]?.color;
  if (custom) return { tag, color: custom };
  switch (id) {
    case "fitgirl":
      return { tag, color: theme.colors.accent };
    case "yts":
      return { tag, color: theme.colors.good };
    case "eztv":
      return { tag, color: theme.colors.warn };
    case "nyaa":
      return { tag, color: theme.colors.bright };
    default:
      return { tag, color: theme.colors.alt };
  }
}

export const SOURCE_STYLE = Object.fromEntries(
  Object.keys(BASE_SOURCE_TAGS).map((k) => [
    k,
    sourceStyle(k as SourceId, DEFAULT_THEME),
  ]),
) as Record<SourceId, { tag: string; color: string }>;

function rgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const n = parseInt(clean, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function lerpHex(a: string, b: string, t: number): string {
  const [ar, ag, ab] = rgb(a);
  const [br, bg, bb] = rgb(b);
  const c = (x: number, y: number) =>
    Math.round(x + (y - x) * t)
      .toString(16)
      .padStart(2, "0");
  return `#${c(ar, br)}${c(ag, bg)}${c(ab, bb)}`;
}

export const ACCENT_RAMP: readonly [string, string] = [COLOR.accent, COLOR.bright];

