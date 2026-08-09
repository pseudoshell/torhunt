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
    frames: ["[■···]", "[·■··]", "[··■·]", "[···■]", "[··■·]", "[·■··]"],
    intervalMs: 90,
  },
  {
    id: "cylon",
    name: "Cylon Bar",
    description: "Knight Rider sweep scanner bar",
    frames: ["[=  ]", "[== ]", "[ ==]", "[  =]", "[ ==]", "[== ]"],
    intervalMs: 90,
  },
  {
    id: "pulse",
    name: "Phosphor Pulse",
    description: "Breathing shade block pulse",
    frames: ["█", "▓", "▒", "░", "▒", "▓"],
    intervalMs: 100,
  },
  {
    id: "baton",
    name: "Unix Baton",
    description: "Classic rotating slash pipe",
    frames: ["—", "\\", "|", "/"],
    intervalMs: 100,
  },
  {
    id: "arrow",
    name: "Arrow Compass",
    description: "Smooth directional arrow rotation",
    frames: ["←", "↖", "↑", "↗", "→", "↘", "↓", "↙"],
    intervalMs: 80,
  },
  {
    id: "boxspin",
    name: "Box Rotate",
    description: "Clean quadrant box rotation",
    frames: ["◰", "◳", "◲", "◱"],
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
    id: "pipe",
    name: "Pipe Build",
    description: "Terminal pipe junction rotation",
    frames: ["┤", "┘", "┴", "└", "├", "┌", "┬", "┐"],
    intervalMs: 90,
  },
  {
    id: "toggle",
    name: "Binary Toggle",
    description: "Retro binary flip switch",
    frames: ["⊟", "⊞", "⊟", "⊠"],
    intervalMs: 120,
  },
] as const;

export const DEFAULT_SPINNER = SPINNERS[0]!;

export function getSpinner(id?: string): SpinnerPreset {
  if (!id) return DEFAULT_SPINNER;
  return SPINNERS.find((s) => s.id === id) ?? DEFAULT_SPINNER;
}
