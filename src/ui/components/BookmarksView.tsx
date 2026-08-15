import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import { useStore } from "../store";
import { Panel } from "./Panel";
import { wrapStep, windowStart } from "../move";
import { GUTTER, ICON, sourceStyle } from "../theme";
import { cleanText, formatBytes, formatRelative } from "../../util/format";

const MARK = 2;
const SIZE_W = 10;
const DATE_W = 14;
const SRC_W = 4;

export function BookmarksView() {
  const {
    bookmarks,
    removeBookmark,
    clearBookmarks,
    region,
    contentWidth,
    listRows,
    startDownload,
    requestDownloadTo,
    copyMagnet,
    openQrModal,
    theme,
  } = useStore();
  const focused = region === "content";

  const total = bookmarks.length;
  const [cursor, setCursor] = useState(0);
  const clamped = Math.min(cursor, Math.max(0, total - 1));

  useInput(
    (input, key) => {
      if (key.upArrow || input === "k") setCursor(wrapStep(clamped, -1, total));
      else if (key.downArrow || input === "j") setCursor(wrapStep(clamped, 1, total));
      else if (key.return || input === "d") {
        const b = bookmarks[clamped];
        if (b) {
          startDownload({
            id: b.id,
            name: b.name,
            magnet: b.magnet,
            source: b.source,
            sizeBytes: b.sizeBytes,
          });
        }
      } else if (input === "D") {
        const b = bookmarks[clamped];
        if (b) {
          requestDownloadTo({
            id: b.id,
            name: b.name,
            magnet: b.magnet,
            source: b.source,
            sizeBytes: b.sizeBytes,
          });
        }
      } else if (input === "b" || input === "c") {
        const b = bookmarks[clamped];
        if (b) removeBookmark(b.id);
      } else if (input === "y") {
        const b = bookmarks[clamped];
        if (b) copyMagnet({ name: b.name, magnet: b.magnet });
      } else if (input === "Q") {
        const b = bookmarks[clamped];
        if (b?.magnet) openQrModal({ name: b.name, magnet: b.magnet });
      } else if (input === "C") {
        clearBookmarks();
      }
    },
    { isActive: focused && total > 0 },
  );

  const panelH = Math.max(5, listRows - 1);

  if (total === 0) {
    return (
      <Panel title="bookmarks" width={contentWidth} focused={focused} height={panelH}>
        <Text dimColor>No bookmarks yet. Press b on any search result to save it for later.</Text>
      </Panel>
    );
  }

  const selectedItem = bookmarks[clamped];

  const maxVisibleRows = Math.max(1, panelH - 3);
  const startLine = windowStart(clamped, total, maxVisibleRows);
  const visibleLines = bookmarks.slice(startLine, startLine + maxVisibleRows);

  return (
    <Panel
      title="bookmarks"
      width={contentWidth}
      focused={focused}
      count={total > 0 ? `- ${total}` : undefined}
      height={panelH}
    >
      <Box justifyContent="space-between" alignItems="center">
        <Text color={theme.colors.good} bold>
          ★ {total} {total === 1 ? "file" : "files"} bookmarked
        </Text>
      </Box>

      <Box flexDirection="column" marginTop={1}>
        {visibleLines.map((b, i) => {
          const actualIdx = startLine + i;
          const here = actualIdx === clamped && focused;
          const ss = sourceStyle(b.source, theme);
          return (
            <Box key={b.id}>
              <Box width={MARK} flexShrink={0}>
                <Text color={theme.colors.accent} bold>
                  {here ? ICON.pointer : ""}
                </Text>
              </Box>
              <Box width={GUTTER} flexShrink={0}>
                <Text color={theme.colors.good}>★</Text>
              </Box>
              <Box flexGrow={1} minWidth={0} marginLeft={1}>
                <Text
                  wrap="truncate-end"
                  bold={here}
                  color={here ? theme.colors.bright : undefined}
                  dimColor={!here}
                >
                  {cleanText(b.name)}
                </Text>
              </Box>
              <Box width={SIZE_W} flexShrink={0} marginLeft={1} justifyContent="flex-end">
                <Text dimColor={!here} bold={here}>
                  {b.sizeBytes > 0 ? formatBytes(b.sizeBytes) : "-"}
                </Text>
              </Box>
              <Box width={DATE_W} flexShrink={0} marginLeft={1} justifyContent="flex-end">
                <Text dimColor={!here} bold={here}>
                  {formatRelative(b.bookmarkedAt / 1000) || "─"}
                </Text>
              </Box>
              <Box width={SRC_W} flexShrink={0} marginLeft={1} justifyContent="flex-end">
                <Text color={b.source ? ss.color : undefined} dimColor={!b.source || !here} bold={here}>
                  {b.source ? ss.tag : "mag"}
                </Text>
              </Box>
            </Box>
          );
        })}
      </Box>
    </Panel>
  );
}
