import { useContext, type ReactNode } from "react";
import { Box, Text } from "ink";
import { DEFAULT_THEME } from "../theme";
import { StoreContext } from "../store";

interface PanelProps {
  title: string;
  width: number;
  focused?: boolean;
  count?: string;
  height?: number;
  children: ReactNode;
}

export function Panel({ title, width, focused, count, height, children }: PanelProps) {
  const store = useContext(StoreContext);
  const theme = store?.theme ?? DEFAULT_THEME;
  const borderColor = focused ? theme.colors.accent : theme.colors.rule;
  const titleColor = focused ? theme.colors.bright : theme.colors.alt;
  const w = Math.max(10, width);
  const cap = title.toUpperCase();
  const label = count ? `${cap} ${count}` : cap;

  // Build a cleaner top bar:  ┌─[ TITLE ]──────────────────┐
  // Fixed chars: ┌─ (2) + [ (2) + ] (2) + ┐ (1) = 7
  const fixedChars = 7;
  const fillLen = Math.max(0, w - fixedChars - label.length);

  return (
    <Box flexDirection="column" width={w}>
      <Box>
        <Text color={borderColor}>{"┌─[ "}</Text>
        <Text bold color={titleColor}>
          {label}
        </Text>
        <Text color={borderColor}>{` ]${"─".repeat(fillLen)}┐`}</Text>
      </Box>
      <Box
        width={w}
        height={height}
        flexGrow={height ? 0 : 1}
        flexDirection="column"
        paddingX={1}
        overflow="hidden"
      >
        {children}
      </Box>
      <Box>
        <Text color={borderColor}>{`└${"─".repeat(Math.max(0, w - 2))}┘`}</Text>
      </Box>
    </Box>
  );
}
