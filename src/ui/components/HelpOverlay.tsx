import { Box, Text } from "ink";
import { COL_GAP, FRAME, KEY_W, pickLayout } from "../helpLayout";
import { HELP_GROUPS } from "../keymap";
import { useStore } from "../store";
import { ICON } from "../theme";
import { Panel } from "./Panel";

const FOOT_FULL = "Your downloaded files always stay on disk.";

export function HelpOverlay() {
  const { cols, rows, theme } = useStore();
  const m = pickLayout(cols);
  const width = Math.min(m.width, cols - 2);
  // Condense when the full card exceeds the terminal, or the card is too narrow.
  const short = rows < m.gridH + 10 || width - FRAME < FOOT_FULL.length;

  return (
    <Panel title="shortcuts" width={width} focused>
      <Box marginTop={short ? 0 : 1} flexDirection="row">
        {m.layout.map((col, ci) => (
          <Box
            key={col.join("-")}
            flexDirection="column"
            width={Math.min(m.colWidths[ci]!, width - FRAME)}
            marginRight={ci < m.layout.length - 1 ? COL_GAP : 0}
          >
            {col.map((gi, pos) => {
              const group = HELP_GROUPS[gi]!;
              return (
                <Box
                  key={group.title}
                  flexDirection="column"
                  marginTop={pos > 0 ? 1 : 0}
                >
                  <Text bold color={theme.colors.bright}>{group.title}</Text>
                  {group.hints.map((h) => (
                    <Box key={h.keys + h.label}>
                      <Box width={KEY_W[gi]} flexShrink={0}>
                        <Text color={theme.colors.accent}>{h.keys}</Text>
                      </Box>
                      <Text dimColor wrap="truncate-end">
                        {h.label}
                      </Text>
                    </Box>
                  ))}
                </Box>
              );
            })}
          </Box>
        ))}
      </Box>
      {short ? (
        <Box marginTop={1}>
          <Text dimColor wrap="truncate-end">
            {`? or esc closes ${ICON.dot} files stay on disk`}
          </Text>
        </Box>
      ) : (
        <Box marginTop={1} flexDirection="column">
          <Text dimColor>{FOOT_FULL}</Text>
          <Text color={theme.colors.alt}>Press ? or esc to close</Text>
        </Box>
      )}
    </Panel>
  );
}
