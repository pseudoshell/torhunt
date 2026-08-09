import { useContext } from "react";
import { Box, Text } from "ink";
import { LOGO_LINES, SPROUT_CELLS } from "../logo";
import { DEFAULT_THEME, lerpHex, type Theme } from "../theme";
import { StoreContext } from "../store";

const HIGHLIGHT = "#ffffff";

function getSheen(t: number, theme: Theme): string {
  const top = theme.colors.bright;
  const accent = theme.colors.accent;
  const base = theme.colors.base;
  const shade = theme.colors.shade;
  if (t < 0.15) return lerpHex(HIGHLIGHT, top, t / 0.15);
  if (t < 0.4) return lerpHex(top, accent, (t - 0.15) / 0.25);
  if (t < 0.7) return lerpHex(accent, base, (t - 0.4) / 0.3);
  return lerpHex(base, shade, (t - 0.7) / 0.3);
}

export function Logo() {
  const store = useContext(StoreContext);
  const theme = store?.theme ?? DEFAULT_THEME;
  const rows = LOGO_LINES.length;

  return (
    <Box flexDirection="column">
      {LOGO_LINES.map((line, row) => {
        const textRow = Math.max(0, row - 1);
        const textRows = Math.max(1, rows - 1);
        const tY = textRow / (textRows - 1 || 1);
        const chars = [...line];
        const last = Math.max(1, chars.length - 1);

        return (
          <Box key={row}>
            {chars.map((ch, i) => {
              if (ch === " ") return <Text key={i}> </Text>;

              if (SPROUT_CELLS.has(`${row},${i}`)) {
                return (
                  <Text key={i} bold color={theme.colors.sprout}>
                    {ch}
                  </Text>
                );
              }

              const tX = i / last;
              const factor = (tX + tY) / 2;

              return (
                <Text key={i} bold color={getSheen(factor, theme)}>
                  {ch}
                </Text>
              );
            })}
          </Box>
        );
      })}
    </Box>
  );
}
