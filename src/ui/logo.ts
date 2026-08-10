export const LOGO_LINES: readonly string[] = [
  "              ⌕              ",
  "             ─┼─             ",
  "             └┴┘             ",
  " ▀█▀ █▀█ █▀█ █ █ █ █ █▄ █ ▀█▀ ",
  "  █  █▄█ █▀▄ █▀█ █▄█ █ ▀█  █  ",
];

export const INLINE_LOGO_LINES: readonly string[] = [
  " ▀█▀ █▀█ █▀█ █ █ █ █ █▄ █ ▀█▀  ─┼─",
  "  █  █▄█ █▀▄ █▀█ █▄█ █ ▀█  █   └┴┘",
];

export const LOGO_WIDTH = Math.max(...LOGO_LINES.map((l) => [...l].length));

export const STACKED_ANCHOR_CELLS: ReadonlySet<string> = new Set([
  "0,14",
  "1,13",
  "1,14",
  "1,15",
  "2,13",
  "2,14",
  "2,15",
]);

export const INLINE_ANCHOR_CELLS: ReadonlySet<string> = new Set([
  "0,31",
  "0,32",
  "0,33",
  "1,31",
  "1,32",
  "1,33",
]);
