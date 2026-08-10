import { useState } from "react";
import { Box, Text, useInput } from "ink";
import { useStore, useQueueHistory } from "../store";
import { Panel } from "./Panel";
import { wrapStep, windowStart } from "../move";
import { GUTTER, ICON, sourceStyle } from "../theme";
import { cleanText, formatBytes, formatRelative } from "../../util/format";
import type { HistoryItem } from "../../download/history";

const MARK = 2;
const SIZE_W = 10;
const DATE_W = 14;
const SRC_W = 4;

interface CategorizedHistory {
  today: HistoryItem[];
  yesterday: HistoryItem[];
  older: HistoryItem[];
}

function categorizeHistory(items: HistoryItem[]): CategorizedHistory {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfYesterday = startOfToday - 86400 * 1000;

  const today: HistoryItem[] = [];
  const yesterday: HistoryItem[] = [];
  const older: HistoryItem[] = [];

  for (const h of items) {
    if (h.completedAt >= startOfToday) {
      today.push(h);
    } else if (h.completedAt >= startOfYesterday) {
      yesterday.push(h);
    } else {
      older.push(h);
    }
  }

  return { today, yesterday, older };
}

export function CompletedView() {
  const { queue, region, contentWidth, listRows, openDownloadFolder, startDownload, copyMagnet, theme } =
    useStore();
  const history = useQueueHistory(queue);
  const focused = region === "content";

  const total = history.length;
  const [cursor, setCursor] = useState(0);
  const clamped = Math.min(cursor, Math.max(0, total - 1));

  useInput(
    (input, key) => {
      if (key.upArrow || input === "k") setCursor(wrapStep(clamped, -1, total));
      else if (key.downArrow || input === "j") setCursor(wrapStep(clamped, 1, total));
      else if (key.return || input === "e") {
        const h = history[clamped];
        if (h) openDownloadFolder(h.dir);
      } else if (input === "d") {
        const h = history[clamped];
        if (h)
          startDownload({
            id: h.id,
            name: h.name,
            magnet: h.magnet,
            source: h.source,
            sizeBytes: h.sizeBytes,
          });
      } else if (input === "y") {
        const h = history[clamped];
        if (h) copyMagnet({ name: h.name, magnet: h.magnet });
      } else if (input === "c") {
        const h = history[clamped];
        if (h) queue.removeHistory(h.id);
      } else if (input === "C") {
        queue.clearHistory();
      }
    },
    { isActive: focused && total > 0 },
  );

  const panelH = Math.max(5, listRows - 1);

  if (total === 0) {
    return (
      <Panel title="completed downloads" width={contentWidth} focused={focused} height={panelH}>
        <Text dimColor>No completed downloads yet. All 100% finished downloads will appear here.</Text>
      </Panel>
    );
  }

  const categorized = categorizeHistory(history);
  const selectedItem = history[clamped];

  const flatRows: { type: "header" | "item"; title?: string; item?: HistoryItem; flatIdx?: number }[] = [];
  let itemIndex = 0;

  if (categorized.today.length > 0) {
    flatRows.push({ type: "header", title: `Today (${categorized.today.length})` });
    for (const item of categorized.today) {
      flatRows.push({ type: "item", item, flatIdx: itemIndex++ });
    }
  }

  if (categorized.yesterday.length > 0) {
    flatRows.push({ type: "header", title: `Yesterday (${categorized.yesterday.length})` });
    for (const item of categorized.yesterday) {
      flatRows.push({ type: "item", item, flatIdx: itemIndex++ });
    }
  }

  if (categorized.older.length > 0) {
    flatRows.push({ type: "header", title: `Older (${categorized.older.length})` });
    for (const item of categorized.older) {
      flatRows.push({ type: "item", item, flatIdx: itemIndex++ });
    }
  }

  const maxVisibleRows = Math.max(1, panelH - 3);
  const selectedLineIdx = flatRows.findIndex((r) => r.type === "item" && r.flatIdx === clamped);
  const startLine = windowStart(selectedLineIdx >= 0 ? selectedLineIdx : 0, flatRows.length, maxVisibleRows);
  const visibleLines = flatRows.slice(startLine, startLine + maxVisibleRows);

  return (
    <Panel
      title="completed downloads"
      width={contentWidth}
      focused={focused}
      count={`(${total})`}
      height={panelH}
    >
      <Box justifyContent="space-between" alignItems="center">
        <Text color={theme.colors.good} bold>
          {ICON.done} {total} {total === 1 ? "file" : "files"} completed
        </Text>
        {selectedItem ? (
          <Text dimColor wrap="truncate-end">
            Location: {selectedItem.dir}
          </Text>
        ) : null}
      </Box>

      <Box flexDirection="column" marginTop={1}>
        {visibleLines.map((row, i) => {
          if (row.type === "header") {
            return (
              <Box key={`h-${i}`} marginTop={i > 0 ? 1 : 0}>
                <Text color={theme.colors.rule} bold>
                  {`── ${row.title} ────────────────────────────────────────────────────────────`}
                </Text>
              </Box>
            );
          }

          const h = row.item!;
          const here = row.flatIdx === clamped && focused;
          const ss = sourceStyle(h.source, theme);
          return (
            <Box key={h.id}>
              <Box width={MARK} flexShrink={0}>
                <Text color={theme.colors.accent} bold>{here ? ICON.pointer : ""}</Text>
              </Box>
              <Box width={GUTTER} flexShrink={0}>
                <Text color={theme.colors.good}>{ICON.done}</Text>
              </Box>
              <Box flexGrow={1} minWidth={0} marginLeft={1}>
                <Text wrap="truncate-end" bold={here} color={here ? theme.colors.bright : undefined} dimColor={!here}>
                  {cleanText(h.name)}
                </Text>
              </Box>
              <Box width={SIZE_W} flexShrink={0} marginLeft={1} justifyContent="flex-end">
                <Text dimColor={!here} bold={here}>
                  {h.sizeBytes > 0 ? formatBytes(h.sizeBytes) : "-"}
                </Text>
              </Box>
              <Box width={DATE_W} flexShrink={0} marginLeft={1} justifyContent="flex-end">
                <Text dimColor={!here} bold={here}>
                  {formatRelative(h.completedAt / 1000) || "─"}
                </Text>
              </Box>
              <Box width={SRC_W} flexShrink={0} marginLeft={1} justifyContent="flex-end">
                <Text color={h.source ? ss.color : undefined} dimColor={!h.source || !here} bold={here}>
                  {h.source ? ss.tag : "mag"}
                </Text>
              </Box>
            </Box>
          );
        })}
      </Box>
    </Panel>
  );
}
