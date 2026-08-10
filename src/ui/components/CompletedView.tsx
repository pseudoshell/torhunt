import { useState } from "react";
import { Box, Text, useInput } from "ink";
import { useStore, useQueueHistory } from "../store";
import { Panel } from "./Panel";
import { wrapStep, windowStart } from "../move";
import { GUTTER, ICON, sourceStyle } from "../theme";
import { cleanText, formatBytes, formatRelative } from "../../util/format";

const MARK = 2;
const SIZE_W = 10;
const DATE_W = 14;
const SRC_W = 4;

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

  const rows = Math.max(1, panelH - 2);
  const start = windowStart(clamped, total, rows);
  const visible = history.slice(start, start + rows);
  const selectedItem = history[clamped];

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
          {ICON.done} {total} {total === 1 ? "file" : "files"} available on disk
        </Text>
        {selectedItem ? (
          <Text dimColor wrap="truncate-end">
            Location: {selectedItem.dir}
          </Text>
        ) : null}
      </Box>

      <Box flexDirection="column" marginTop={1}>
        <Box>
          <Box width={MARK} flexShrink={0} />
          <Box width={GUTTER} flexShrink={0} />
          <Box flexGrow={1} minWidth={0} marginLeft={1}>
            <Text bold dimColor>Name</Text>
          </Box>
          <Box width={SIZE_W} flexShrink={0} marginLeft={1} justifyContent="flex-end">
            <Text bold dimColor>Size</Text>
          </Box>
          <Box width={DATE_W} flexShrink={0} marginLeft={1} justifyContent="flex-end">
            <Text bold dimColor>Completed</Text>
          </Box>
          <Box width={SRC_W} flexShrink={0} marginLeft={1} justifyContent="flex-end">
            <Text bold dimColor>Src</Text>
          </Box>
        </Box>

        {visible.map((h, i) => {
          const here = start + i === clamped && focused;
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
                  {formatRelative(h.completedAt) || "─"}
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
