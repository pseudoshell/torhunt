import { useContext, useEffect, useState } from "react";
import { Box, Text } from "ink";
import {
  LOGO_LINES,
  INLINE_LOGO_LINES,
  STACKED_ANCHOR_CELLS,
  INLINE_ANCHOR_CELLS,
} from "../logo";
import { DEFAULT_THEME, lerpHex, type Theme } from "../theme";
import { StoreContext } from "../store";

function getBaseSheen(tX: number, tY: number, theme: Theme): string {
  const factor = (tX + tY) / 2;
  const top = theme.colors.bright;
  const accent = theme.colors.accent;
  const base = theme.colors.base;
  const shade = theme.colors.shade;

  if (factor < 0.25) return lerpHex(top, accent, factor / 0.25);
  if (factor < 0.6) return lerpHex(accent, base, (factor - 0.25) / 0.35);
  return lerpHex(base, shade, (factor - 0.6) / 0.4);
}

function getSheen(tX: number, tY: number, theme: Theme, frame: number): string {
  const cycleFrame = frame % 90;
  const baseColor = getBaseSheen(tX, tY, theme);

  if (cycleFrame <= 36) {
    const sweepT = cycleFrame / 36;
    const beamCenter = sweepT * 1.6 - 0.3;
    const dist = Math.abs(tX - beamCenter);
    const beamRadius = 0.22;

    if (dist < beamRadius) {
      const norm = dist / beamRadius;
      const peak = theme.colors.sheenPeak || "#ffffff";
      const bright = theme.colors.bright;

      if (norm < 0.3) {
        return lerpHex(peak, bright, norm / 0.3);
      }
      return lerpHex(bright, baseColor, (norm - 0.3) / 0.7);
    }
  }

  return baseColor;
}

export function Logo({
  theme: customTheme,
  animated = true,
  layout = "stacked",
}: {
  theme?: Theme;
  animated?: boolean;
  layout?: "stacked" | "inline";
} = {}) {
  const store = useContext(StoreContext);
  const theme = customTheme ?? store?.theme ?? DEFAULT_THEME;
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    if (!animated) return;
    const timer = setInterval(() => {
      setFrame((f) => f + 1);
    }, 50);
    return () => clearInterval(timer);
  }, [animated]);

  const lines = layout === "inline" ? INLINE_LOGO_LINES : LOGO_LINES;
  const anchorCells = layout === "inline" ? INLINE_ANCHOR_CELLS : STACKED_ANCHOR_CELLS;
  const rows = lines.length;

  return (
    <Box flexDirection="column">
      {lines.map((line, row) => {
        const textRow = layout === "stacked" ? Math.max(0, row - 2) : row;
        const textRows = layout === "stacked" ? 2 : rows;
        const tY = textRow / Math.max(1, textRows - 1);
        const chars = [...line];
        const last = Math.max(1, chars.length - 1);

        return (
          <Box key={row}>
            {chars.map((ch, i) => {
              if (ch === " ") return <Text key={i}> </Text>;

              const tX = i / last;
              const isAnchor = anchorCells.has(`${row},${i}`);

              if (isAnchor) {
                const cycleFrame = frame % 90;
                let anchorColor = theme.colors.sprout;
                if (cycleFrame <= 36) {
                  const sweepT = cycleFrame / 36;
                  const beamCenter = sweepT * 1.6 - 0.3;
                  const dist = Math.abs(tX - beamCenter);
                  if (dist < 0.22) {
                    const peak = theme.colors.sheenPeak || "#ffffff";
                    anchorColor = lerpHex(peak, theme.colors.sprout, dist / 0.22);
                  }
                }
                return (
                  <Text key={i} bold color={anchorColor}>
                    {ch}
                  </Text>
                );
              }

              return (
                <Text key={i} bold color={getSheen(tX, tY, theme, frame)}>
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
