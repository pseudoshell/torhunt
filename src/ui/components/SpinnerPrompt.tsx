import { useContext, useState } from "react";
import { Box, Text, useInput } from "ink";
import { Panel } from "./Panel";
import { PromptHints } from "./PromptHints";
import { Spinner } from "./Spinner";
import { SPINNERS, type SpinnerPreset } from "../spinnerPresets";
import { wrapStep, windowStart } from "../move";
import { DEFAULT_THEME, ICON } from "../theme";
import { StoreContext } from "../store";

interface SpinnerPromptProps {
  width: number;
  currentSpinnerId: string;
  onPreview?: (spinnerId: string) => void;
  onSelect: (spinnerId: string) => void;
  onCancel: () => void;
}

export function SpinnerPrompt({
  width,
  currentSpinnerId,
  onPreview,
  onSelect,
  onCancel,
}: SpinnerPromptProps) {
  const store = useContext(StoreContext);
  const theme = store?.theme ?? DEFAULT_THEME;
  const rows = store?.rows ?? 24;
  const initialIdx = Math.max(
    0,
    SPINNERS.findIndex((s) => s.id === currentSpinnerId),
  );
  const [cursor, setCursor] = useState(initialIdx);

  useInput((input, key) => {
    if (key.upArrow || input === "k") {
      const next = wrapStep(cursor, -1, SPINNERS.length);
      setCursor(next);
      onPreview?.(SPINNERS[next]!.id);
    } else if (key.downArrow || input === "j") {
      const next = wrapStep(cursor, 1, SPINNERS.length);
      setCursor(next);
      onPreview?.(SPINNERS[next]!.id);
    } else if (key.return) {
      onSelect(SPINNERS[cursor]!.id);
    } else if (key.escape) {
      onCancel();
    }
  });

  // Fit within terminal: reserve rows for header(3) + panel borders(2) + hints(2) + margin
  const maxVisible = Math.max(3, rows - 8);
  const visibleCount = Math.min(SPINNERS.length, maxVisible);
  const start = windowStart(cursor, SPINNERS.length, visibleCount);
  const visible = SPINNERS.slice(start, start + visibleCount);

  return (
    <Box flexDirection="column" width={width}>
      <Panel
        title="spinner styles"
        width={width}
        focused
        height={visibleCount + 1}
      >
        <Box flexDirection="column">
          {visible.map((s: SpinnerPreset, vi: number) => {
            const idx = start + vi;
            const isSelected = idx === cursor;
            const isCurrent = s.id === currentSpinnerId;
            return (
              <Box key={s.id} justifyContent="space-between">
                <Box>
                  <Box width={2} flexShrink={0}>
                    <Text color={theme.colors.accent} bold>
                      {isSelected ? ICON.pointer : " "}
                    </Text>
                  </Box>
                  <Box width={10} flexShrink={0}>
                    <Spinner preset={s} />
                  </Box>
                  <Box width={18} flexShrink={0}>
                    <Text
                      bold={isSelected}
                      color={isSelected ? theme.colors.accent : undefined}
                      dimColor={!isSelected}
                    >
                      {s.name}
                    </Text>
                  </Box>
                  <Box flexGrow={1} minWidth={0}>
                    <Text dimColor wrap="truncate-end">
                      {s.description}
                    </Text>
                  </Box>
                </Box>
                <Box flexShrink={0} marginLeft={1}>
                  {isCurrent ? (
                    <Text color={theme.colors.good} bold>
                      {" ✓"}
                    </Text>
                  ) : (
                    <Text>{"  "}</Text>
                  )}
                </Box>
              </Box>
            );
          })}
        </Box>
      </Panel>
      <Box marginTop={1}>
        <PromptHints submitLabel="apply spinner" />
      </Box>
    </Box>
  );
}
