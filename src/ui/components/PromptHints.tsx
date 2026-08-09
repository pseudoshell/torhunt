import { useContext } from "react";
import { Box, Text } from "ink";
import { DEFAULT_THEME, ICON } from "../theme";
import { StoreContext } from "../store";

// The one-line action row under a modal prompt: the submit verb carries the
// visual weight, esc stays quiet.
export function PromptHints({ submitLabel }: { submitLabel: string }) {
  const store = useContext(StoreContext);
  const theme = store?.theme ?? DEFAULT_THEME;
  return (
    <Box>
      <Text color={theme.colors.accent} bold>
        ↵
      </Text>
      <Text color={theme.colors.text}>{` ${submitLabel}`}</Text>
      <Text dimColor>{`  ${ICON.dot}  `}</Text>
      <Text color={theme.colors.alt}>esc</Text>
      <Text dimColor> cancel</Text>
    </Box>
  );
}
