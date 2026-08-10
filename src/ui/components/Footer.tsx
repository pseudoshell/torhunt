import { useContext } from "react";
import { Box, Text } from "ink";
import { DEFAULT_THEME } from "../theme";
import type { Hint } from "../keymap";
import { StoreContext } from "../store";
import { VERSION } from "../../version";

export function Footer({
  hints,
  width,
}: {
  hints: Hint[];
  width?: number;
}) {
  const store = useContext(StoreContext);
  const theme = store?.theme ?? DEFAULT_THEME;
  return (
    <Box width={width} justifyContent="space-between" alignItems="center">
      {/* App budgets exactly one row for the footer, so the hints truncate
          rather than wrapping and pushing the layout past the terminal. */}
      <Box flexShrink={1} minWidth={0}>
        <Text wrap="truncate-end">
          {hints.map((h, i) => (
            <Text key={h.keys + h.label}>
              {i > 0 ? <Text color={theme.colors.rule}>{" │ "}</Text> : null}
              <Text color={theme.colors.accent} bold>{h.keys}</Text>
              <Text dimColor>{` ${h.label}`}</Text>
            </Text>
          ))}
        </Text>
      </Box>
      <Box flexShrink={0} marginLeft={2}>
        <Text color={theme.colors.alt} dimColor>
          {`torhunt v${VERSION}`}
        </Text>
      </Box>
    </Box>
  );
}
