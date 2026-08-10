import type { DownloadFocus, Region, ResultFocus, Section, SeedFocus } from "./store";

export interface Hint {
  keys: string;
  label: string;
}

interface HelpGroup {
  title: string;
  hints: Hint[];
}

export const HELP_GROUPS: HelpGroup[] = [
  {
    title: "Navigate",
    hints: [
      { keys: "↑↓←→ / hjkl", label: "Navigate panes and lists" },
      { keys: "↵", label: "Open" },
      { keys: "tab", label: "Switch pane" },
      { keys: "esc", label: "Back" },
      { keys: "o", label: "Default download folder" },
      { keys: "t", label: "Extra trackers" },
      { keys: "T", label: "Color theme" },
      { keys: "L", label: "Spinner style" },
      { keys: "q", label: "Quit" },
    ],
  },
  {
    title: "Search",
    hints: [
      { keys: "/", label: "Edit search" },
      { keys: "q / 1-7", label: "Quality filter (1-7)" },
      { keys: "f", label: "Filter list" },
      { keys: "d", label: "Download (shift+d: folder)" },
      { keys: "b", label: "Bookmark for later" },
      { keys: "s", label: "Sort results" },
      { keys: "z", label: "Hide dead torrents" },
      { keys: "y", label: "Copy magnet" },
      { keys: "↵", label: "Open details" },
      { keys: "e", label: "Export as .torrent" },
      { keys: "m", label: "Paste magnet" },
    ],
  },
  {
    title: "Downloads",
    hints: [
      { keys: "p", label: "Pause/resume" },
      { keys: "c", label: "Cancel or remove (shift+c: all)" },
      { keys: "f", label: "Retry failed" },
      { keys: "d", label: "Download again" },
      { keys: "e", label: "Open folder" },
      { keys: "s", label: "Export torrent file" },
    ],
  },
  {
    title: "Seeding",
    hints: [
      { keys: "p", label: "Pause/resume" },
      { keys: "c", label: "Remove (shift+c: all)" },
      { keys: "e", label: "Open folder" },
    ],
  },
  {
    title: "Bookmarks",
    hints: [
      { keys: "↵ / d", label: "Download (shift+d: folder)" },
      { keys: "b / c", label: "Remove bookmark" },
      { keys: "y", label: "Copy magnet" },
      { keys: "C", label: "Clear all" },
    ],
  },
];

const NAVIGATE: Hint = { keys: "↑↓←→", label: "Move" };

const ALWAYS: Hint = { keys: "?", label: "Keys" };

const SWITCH: Hint = { keys: "tab", label: "Switch" };

const FOLDER: Hint = { keys: "e", label: "Folder" };

const TORRENT: Hint = { keys: "s", label: "Export" };

const EXPORT: Hint = { keys: "e", label: "Export" };

export function footerHints(
  region: Region,
  section: Section,
  downloadFocus?: DownloadFocus | null,
  seedFocus?: SeedFocus | null,
  resultFocus?: ResultFocus | null,
): Hint[] {
  if (region === "sidebar") {
    if (section === "downloads") {
      return [
        NAVIGATE,
        { keys: "↵", label: "Focus" },
        { keys: "p", label: "Pause" },
        { keys: "c", label: "Stop" },
        SWITCH,
        ALWAYS,
      ];
    }
    return [
      NAVIGATE,
      { keys: "↵", label: "Open" },
      SWITCH,
      ALWAYS,
      { keys: "q", label: "Quit" },
    ];
  }
  if (section === "seeding") {
    const label =
      seedFocus === "seeding" ? "Pause" : seedFocus === "missing" ? "Retry" : "Resume";
    return [{ keys: "p", label }, { keys: "c", label: "Remove from list" }, FOLDER, SWITCH, ALWAYS];
  }
  if (section === "bookmarks") {
    return [
      NAVIGATE,
      { keys: "↵/d", label: "Download" },
      { keys: "b", label: "Remove" },
      { keys: "y", label: "Copy" },
      SWITCH,
      ALWAYS,
    ];
  }
  if (section === "completed") {
    return [
      NAVIGATE,
      { keys: "↵/e", label: "Open Folder" },
      { keys: "d", label: "Redownload" },
      { keys: "c", label: "Remove" },
      SWITCH,
      ALWAYS,
    ];
  }
  if (section === "settings") {
    return [
      NAVIGATE,
      { keys: "↵", label: "Configure" },
      SWITCH,
      ALWAYS,
    ];
  }
  if (section === "downloads") {
    if (downloadFocus === "paused") {
      return [{ keys: "p", label: "Resume" }, { keys: "c", label: "Cancel" }, FOLDER, TORRENT, SWITCH, ALWAYS];
    }
    if (downloadFocus === "failed") {
      return [{ keys: "f", label: "Retry" }, { keys: "c", label: "Remove" }, FOLDER, TORRENT, SWITCH, ALWAYS];
    }
    if (downloadFocus === "recent") {
      return [
        { keys: "d", label: "Redownload" },
        { keys: "c", label: "Remove from list" },
        FOLDER,
        TORRENT,
        SWITCH,
        ALWAYS,
      ];
    }
    return [{ keys: "p", label: "Pause" }, { keys: "c", label: "Cancel" }, FOLDER, TORRENT, SWITCH, ALWAYS];
  }
  return [
    NAVIGATE,
    { keys: "d", label: "Download" },
    { keys: "b", label: "Bookmark" },
    { keys: "q", label: "Quality" },
    resultFocus === "detail" ? EXPORT : { keys: "s", label: "Sort" },
    { keys: "/", label: "Search" },
    { keys: "f", label: "Filter" },
    SWITCH,
    ALWAYS,
  ];
}
