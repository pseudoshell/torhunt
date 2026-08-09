import { useContext } from "react";
import { Box, Text } from "ink";
import { DEFAULT_THEME } from "../theme";
import type { Hint } from "../keymap";
import { StoreContext } from "../store";

export function Footer({ hints }: { hints: Hint[] }) {
  const store = useContext(StoreContext);
  const theme = store?.theme ?? DEFAULT_THEME;
  return (
    <Box>
      {/* App budgets exactly one row for the footer, so the hints truncate
          rather than wrapping and pushing the layout past the terminal. */}
      <Text wrap="truncate-end">
        {hints.map((h, i) => (
          <Text key={h.keys + h.label}>
            {i > 0 ? <Text dimColor>{"   "}</Text> : null}
            <Text color={theme.colors.alt}>{h.keys}</Text>
            <Text dimColor>{` ${h.label}`}</Text>
          </Text>
        ))}
      </Text>
    </Box>
  );
}
