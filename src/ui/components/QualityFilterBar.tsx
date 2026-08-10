import { Box, Text } from "ink";
import { QUALITY_TAGS, type QualityTag } from "../../util/tags";
import type { Theme } from "../theme";

interface QualityFilterBarProps {
  activeTag: QualityTag | "ALL";
  theme: Theme;
}

export function QualityFilterBar({ activeTag, theme }: QualityFilterBarProps) {
  const options: (QualityTag | "ALL")[] = ["ALL", ...QUALITY_TAGS];

  return (
    <Box gap={1} alignItems="center">
      <Text dimColor>QUALITY:</Text>
      {options.map((tag) => {
        const selected = activeTag === tag;
        return (
          <Text
            key={tag}
            color={selected ? theme.colors.bright : undefined}
            dimColor={!selected}
            bold={selected}
          >
            {selected ? `[${tag}]` : tag}
          </Text>
        );
      })}
    </Box>
  );
}
