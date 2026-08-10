import { useContext } from "react";
import { Box, Text } from "ink";
import { TextField } from "./TextField";
import { DEFAULT_THEME, ICON } from "../theme";
import { StoreContext } from "../store";

interface SearchBarProps {
  width: number;
  value: string;
  placeholder?: string;
  editing: boolean;
  onSubmit: (value: string) => void;
  onChange?: (value: string) => void;
  onExitDown?: () => void;
  onExitLeft?: () => void;
}

export function SearchBar({
  width,
  value,
  placeholder = "Search torrents…",
  editing,
  onSubmit,
  onChange,
  onExitDown,
  onExitLeft,
}: SearchBarProps) {
  const store = useContext(StoreContext);
  const theme = store?.theme ?? DEFAULT_THEME;
  const borderColor = editing ? theme.colors.accent : theme.colors.rule;
  const promptColor = editing ? theme.colors.bright : theme.colors.alt;
  const w = Math.max(10, width);
  const innerW = Math.max(1, w - 4); // account for borders + padding

  // ┌─[ 🔍 SEARCH ]────────────────────┐
  const label = "SEARCH";
  // Fixed chars: ┌─ (2) + [ (2) + ] (2) + ┐ (1) = 7
  const fillLen = Math.max(0, w - 7 - label.length);

  return (
    <Box flexDirection="column" width={w}>
      <Box>
        <Text color={borderColor}>{"┌─[ "}</Text>
        <Text bold color={promptColor}>{label}</Text>
        <Text color={borderColor}>{` ]${"─".repeat(fillLen)}┐`}</Text>
      </Box>
      <Box>
        <Text color={borderColor}>{"│ "}</Text>
        <Box flexGrow={1} minWidth={0}>
          <Text color={promptColor}>{`${ICON.pointer} `}</Text>
          {editing ? (
            <TextField
              defaultValue={value}
              placeholder={placeholder}
              history={store?.searchHistory}
              width={Math.max(1, innerW - 3)}
              onSubmit={onSubmit}
              onChange={onChange}
              onExitDown={onExitDown}
              onExitLeft={onExitLeft}
            />
          ) : value ? (
            <Text wrap="truncate-end">{value}</Text>
          ) : (
            <Text dimColor>{placeholder}</Text>
          )}
        </Box>
        <Text color={borderColor}>{" │"}</Text>
      </Box>
      <Box>
        <Text color={borderColor}>{`└${"─".repeat(Math.max(0, w - 2))}┘`}</Text>
      </Box>
    </Box>
  );
}
