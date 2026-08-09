import { useState } from "react";
import { Box, Text, useInput } from "ink";
import { Panel } from "./Panel";
import { PromptHints } from "./PromptHints";
import { THEMES, getTheme, type Theme } from "../theme";
import { wrapStep } from "../move";

interface ThemePromptProps {
  width: number;
  currentThemeId: string;
  onPreview?: (themeId: string) => void;
  onSelect: (themeId: string) => void;
  onCancel: () => void;
}

export function ThemePrompt({
  width,
  currentThemeId,
  onPreview,
  onSelect,
  onCancel,
}: ThemePromptProps) {
  const initialIdx = Math.max(
    0,
    THEMES.findIndex((t) => t.id === currentThemeId),
  );
  const [cursor, setCursor] = useState(initialIdx);

  useInput((input, key) => {
    if (key.upArrow || input === "k") {
      const next = wrapStep(cursor, -1, THEMES.length);
      setCursor(next);
      onPreview?.(THEMES[next]!.id);
    } else if (key.downArrow || input === "j") {
      const next = wrapStep(cursor, 1, THEMES.length);
      setCursor(next);
      onPreview?.(THEMES[next]!.id);
    } else if (key.return) {
      onSelect(THEMES[cursor]!.id);
    } else if (key.escape) {
      onCancel();
    }
  });

  const activeTheme = getTheme(THEMES[cursor]?.id ?? currentThemeId);

  return (
    <Box flexDirection="column" width={width}>
      <Panel
        title="color themes"
        width={width}
        focused
        height={THEMES.length + 3}
      >
        <Box flexDirection="column">
          {THEMES.map((t: Theme, idx: number) => {
            const isSelected = idx === cursor;
            const isCurrent = t.id === currentThemeId;
            return (
              <Box key={t.id} justifyContent="space-between">
                <Box>
                  <Box width={2} flexShrink={0}>
                    <Text color={activeTheme.colors.accent} bold>
                      {isSelected ? "❯" : " "}
                    </Text>
                  </Box>
                  <Box width={18} flexShrink={0}>
                    <Text
                      bold={isSelected}
                      color={isSelected ? activeTheme.colors.accent : undefined}
                      dimColor={!isSelected}
                    >
                      {t.name}
                    </Text>
                  </Box>
                  <Box flexGrow={1} minWidth={0}>
                    <Text dimColor wrap="truncate-end">
                      {t.description}
                    </Text>
                  </Box>
                </Box>
                <Box flexShrink={0} marginLeft={1}>
                  <Text color={t.colors.accent}>█</Text>
                  <Text color={t.colors.good}>█</Text>
                  <Text color={t.colors.alt}>█</Text>
                  <Text color={t.colors.rule}>█</Text>
                  {isCurrent ? (
                    <Text color={activeTheme.colors.good} bold>
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
        <PromptHints submitLabel="apply theme" />
      </Box>
    </Box>
  );
}
