import { Box, Text } from "ink";
import { type QualityTag } from "../../util/tags";
import type { Theme } from "../theme";

interface QualityFilterBarProps {
  activeTag: QualityTag | "ALL";
  theme: Theme;
}

export function QualityFilterBar({ activeTag, theme }: QualityFilterBarProps) {
  const options: { tag: QualityTag | "ALL"; num: string }[] = [
    { tag: "ALL", num: "1" },
    { tag: "4K", num: "2" },
    { tag: "1080p", num: "3" },
    { tag: "720p", num: "4" },
    { tag: "x265", num: "5" },
    { tag: "FitGirl", num: "6" },
    { tag: "FLAC", num: "7" },
  ];

  return (
    <Box gap={1} alignItems="center">
      <Text dimColor>QUALITY:</Text>
      {options.map(({ tag, num }) => {
        const selected = activeTag === tag;
        return (
          <Text
            key={tag}
            color={selected ? theme.colors.bright : undefined}
            dimColor={!selected}
            bold={selected}
          >
            <Text color={selected ? theme.colors.accent : undefined} dimColor={!selected}>
              {num}:
            </Text>
            {selected ? `[${tag}]` : tag}
          </Text>
        );
      })}
    </Box>
  );
}
