import { useEffect, useRef, useState } from "react";
import { Box, Text, useInput } from "ink";
import { useStore, useQueueItems, type DownloadFocus } from "../store";
import { Panel } from "./Panel";
import { ProgressBar } from "./ProgressBar";
import { wrapStep, windowStart } from "../move";
import { GUTTER, ICON, sourceStyle } from "../theme";
import {
  cleanText,
  formatBytes,
  formatBytesPerSec,
  formatEtaShort,
  truncate,
} from "../../util/format";
import type { QueueItem } from "../../download/types";
import type { Theme } from "../theme";
import { sparkline } from "../../util/sparkline";

const ROWS_PER_ACTIVE = 2;
const MARK = 2;

function statusColor(status: QueueItem["status"], theme: Theme): string {
  if (status === "failed") return theme.colors.bad;
  if (status === "paused" || status === "queued") return theme.colors.paused;
  return theme.colors.accent;
}

function statusIcon(status: QueueItem["status"]): string {
  if (status === "failed") return ICON.error;
  if (status === "paused") return ICON.pause;
  if (status === "queued") return ICON.pending;
  return ICON.down;
}

function rightStats(it: QueueItem, speedHistory?: number[]): string {
  if (it.status === "downloading") {
    const speed = formatBytesPerSec(it.speed) || "…";
    const spark = speedHistory && speedHistory.length > 1 ? ` ${sparkline(speedHistory, 6)}` : "";
    const eta = it.eta ? `  ${formatEtaShort(it.eta)}` : "";
    return `${it.progress}%  ${speed}${spark}  ${ICON.peer}${it.peers}${eta}`;
  }
  if (it.status === "paused") return `paused  ${it.progress}%`;
  if (it.status === "queued") return `queued  ${it.progress}%`;
  return truncate(it.error || "failed", 28);
}

export function Downloads() {
  const {
    queue,
    region,
    contentWidth,
    listRows,
    openDownloadFolder,
    setDownloadFocus,
    exportTorrent,
    openQrModal,
    theme,
  } = useStore();
  const active = useQueueItems(queue);
  const focused = region === "content";

  const speedMapRef = useRef<Map<string, number[]>>(new Map());
  useEffect(() => {
    for (const it of active) {
      if (it.status === "downloading") {
        const prev = speedMapRef.current.get(it.id) ?? [];
        const updated = [...prev, it.speed].slice(-10);
        speedMapRef.current.set(it.id, updated);
      }
    }
  }, [active]);

  const total = active.length;
  const [cursor, setCursor] = useState(0);
  const clamped = Math.min(cursor, Math.max(0, total - 1));

  useInput(
    (input, key) => {
      if (key.upArrow || input === "k") setCursor(wrapStep(clamped, -1, total));
      else if (key.downArrow || input === "j") setCursor(wrapStep(clamped, 1, total));
      else if (input === "f") queue.retryFailed();
      else if (input === "e") {
        const item = active[clamped];
        if (item?.dir) openDownloadFolder(item.dir);
      } else if (input === "s") {
        const item = active[clamped];
        if (item) exportTorrent({ id: item.id, name: item.name });
      } else if (input === "Q") {
        const item = active[clamped];
        if (item?.magnet) openQrModal({ name: item.name, magnet: item.magnet });
      } else {
        const it = active[clamped];
        if (!it) return;
        if (input === "c") queue.cancel(it.id);
        else if (input === "p") queue.togglePause(it.id);
      }
    },
    { isActive: focused && total > 0 },
  );

  useInput(
    (input) => {
      const first = active[0];
      if (!first) return;
      if (input === "p") queue.togglePause(first.id);
      else if (input === "c") queue.cancel(first.id);
    },
    { isActive: !focused && region === "sidebar" && active.length > 0 },
  );

  let focusKind: DownloadFocus | null = null;
  if (focused && total > 0) {
    const st = active[clamped]?.status;
    if (st === "downloading" || st === "paused" || st === "failed") focusKind = st;
  }
  useEffect(() => {
    setDownloadFocus(focusKind);
    return () => setDownloadFocus(null);
  }, [focusKind, setDownloadFocus]);

  const panelH = Math.max(5, listRows - 1);

  if (total === 0) {
    return (
      <Panel title="downloads" width={contentWidth} focused={focused} height={panelH}>
        <Text dimColor>Nothing downloading right now. Search for torrents or press / to start downloading.</Text>
      </Panel>
    );
  }

  const ceiling = Math.max(1, panelH - 1);
  const maxActive = Math.min(active.length, Math.max(1, Math.floor(ceiling / ROWS_PER_ACTIVE)));
  const activeStart = windowStart(clamped, active.length, maxActive);
  const activeVisible = active.slice(activeStart, activeStart + maxActive);

  const inner = contentWidth - 4;
  const gap = 2;
  const barW = Math.max(8, Math.min(28, Math.floor(inner * 0.4)));
  const statsW = Math.max(6, inner - MARK - GUTTER - 1 - barW - gap);

  return (
    <Panel title="downloads" width={contentWidth} focused={focused} count={active.length > 0 ? `- ${active.length}` : undefined} height={panelH}>
      {activeVisible.map((it, i) => {
        const here = activeStart + i === clamped && focused;
        const sc = statusColor(it.status, theme);
        const ss = sourceStyle(it.source, theme);
        return (
          <Box key={it.id} flexDirection="column">
            <Box>
              <Box width={MARK} flexShrink={0}>
                <Text color={here ? theme.colors.bright : theme.colors.accent} bold>
                  {here ? ICON.pointer : ""}
                </Text>
              </Box>
              <Box width={GUTTER} flexShrink={0}>
                <Text color={sc}>{statusIcon(it.status)}</Text>
              </Box>
              <Box flexGrow={1} minWidth={0} marginLeft={1}>
                <Text
                  wrap="truncate-end"
                  bold={here}
                  color={here ? theme.colors.bright : undefined}
                  dimColor={!here}
                >
                  {cleanText(it.name)}
                </Text>
              </Box>
              <Box width={10} flexShrink={0} marginLeft={1} justifyContent="flex-end">
                <Text dimColor={!here} bold={here}>
                  {it.totalBytes > 0 ? formatBytes(it.totalBytes) : "-"}
                </Text>
              </Box>
              <Box width={4} flexShrink={0} marginLeft={1} justifyContent="flex-end">
                <Text
                  color={it.source ? ss.color : undefined}
                  dimColor={!it.source || !here}
                  bold={here}
                >{it.source ? ss.tag : "mag"}
                </Text>
              </Box>
            </Box>
            <Box>
              <Box width={MARK + GUTTER + 1} flexShrink={0} />
              <ProgressBar
                pct={it.progress}
                width={barW}
                color={sc}
                animate={it.status === "downloading"}
              />
              <Box marginLeft={gap} flexShrink={0}>
                <Text dimColor>{truncate(rightStats(it, speedMapRef.current.get(it.id)), statsW)}</Text>
              </Box>
            </Box>
          </Box>
        );
      })}
    </Panel>
  );
}
