export interface SpinnerPreset {
  id: string;
  name: string;
  description: string;
  frames: string[];
  intervalMs: number;
}

export const SPINNERS: readonly SpinnerPreset[] = [
  {
    id: "dots",
    name: "Braille Dots",
    description: "Classic terminal braille dot circle",
    frames: ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"],
    intervalMs: 80,
  },
  {
    id: "radar",
    name: "Radar Scanner",
    description: "Retro phosphor radar oscilloscope blip",
    frames: ["■···", "·■··", "··■·", "···■", "··■·", "·■··"],
    intervalMs: 90,
  },
  {
    id: "cylon",
    name: "Cylon Bar",
    description: "Knight Rider sweep scanner bar",
    frames: ["=  ", "== ", " ==", "  =", " ==", "== "],
    intervalMs: 90,
  },
  {
    id: "baton",
    name: "Unix Baton",
    description: "Classic rotating slash pipe",
    frames: ["—", "\\", "|", "/"],
    intervalMs: 100,
  },
  {
    id: "meter",
    name: "Signal Meter",
    description: "Retro signal strength meter pulse",
    frames: ["▰▱▱", "▰▰▱", "▰▰▰", "▱▰▰", "▱▱▰", "▱▱▱"],
    intervalMs: 100,
  },
  {
    id: "cassette",
    name: "Retro Cassette",
    description: "Analog cassette tape reel spinning",
    frames: ["[ ◐  ◯ ]", "[ ◓  ◯ ]", "[ ◑  ◯ ]", "[ ◒  ◯ ]"],
    intervalMs: 100,
  },
  {
    id: "crt",
    name: "CRT Scanline",
    description: "Retro CRT monitor phosphor sweep",
    frames: ["░▒▓█▓▒░", "▒▓█▓▒░░", "▓█▓▒░░░", "█▓▒░░░▓", "▓▒░░░▓█", "▒░░░▓█▓"],
    intervalMs: 80,
  },
  {
    id: "arcade",
    name: "Retro Arcade",
    description: "8-bit arcade bounce scanner",
    frames: ["[C     ]", "[ C    ]", "[  C   ]", "[   C  ]", "[    C ]", "[     C]", "[    C ]", "[   C  ]", "[  C   ]", "[ C    ]"],
    intervalMs: 80,
  },
  {
    id: "synthwave",
    name: "Synthwave Grid",
    description: "Neon synthwave neon pulse grid",
    frames: ["▲ △ △ △", "△ ▲ △ △", "△ △ ▲ △", "△ △ △ ▲", "△ △ ▲ △", "△ ▲ △ △"],
    intervalMs: 90,
  },
] as const;

export const DEFAULT_SPINNER = SPINNERS.find((s) => s.id === "meter") ?? SPINNERS[0]!;

export function getSpinner(id?: string): SpinnerPreset {
  if (!id) return DEFAULT_SPINNER;
  return SPINNERS.find((s) => s.id === id) ?? DEFAULT_SPINNER;
}
