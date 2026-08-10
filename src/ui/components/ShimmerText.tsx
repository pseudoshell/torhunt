import { useEffect, useState } from "react";
import { Text } from "ink";
import { lerpHex, type Theme } from "../theme";

interface ShimmerTextProps {
  text: string;
  theme: Theme;
  bold?: boolean;
  dwellDelayMs?: number;
}

export function ShimmerText({
  text,
  theme,
  bold = true,
  dwellDelayMs = 350,
}: ShimmerTextProps) {
  const [shimmering, setShimmering] = useState(false);
  const [frame, setFrame] = useState(0);

  // Dwell timer: wait dwellDelayMs of remaining on the item before starting shimmer
  useEffect(() => {
    setShimmering(false);
    setFrame(0);
    const dwellTimer = setTimeout(() => {
      setShimmering(true);
    }, dwellDelayMs);
    return () => clearTimeout(dwellTimer);
  }, [text, dwellDelayMs]);

  // Frame timer: animates shimmer beam only after dwell threshold is reached
  useEffect(() => {
    if (!shimmering) return;
    const timer = setInterval(() => {
      setFrame((f) => f + 1);
    }, 60);
    return () => clearInterval(timer);
  }, [shimmering]);

  if (!shimmering) {
    // While moving / exploring: clean steady bright text without shimmering
    return (
      <Text color={theme.colors.bright} bold={bold} wrap="truncate-end">
        {text}
      </Text>
    );
  }

  // Active shimmer sweep after cursor rests on item
  const cycleFrame = frame % 60;
  const chars = [...text];
  const total = Math.max(1, chars.length - 1);

  if (cycleFrame > 24) {
    return (
      <Text color={theme.colors.bright} bold={bold} wrap="truncate-end">
        {text}
      </Text>
    );
  }

  const sweepT = cycleFrame / 24;
  const beamCenter = sweepT * 1.6 - 0.3; // moves from -0.3 to 1.3
  const beamRadius = 0.25;

  const peak = theme.colors.sheenPeak || "#ffffff";
  const bright = theme.colors.bright;
  const accent = theme.colors.accent;

  return (
    <Text wrap="truncate-end">
      {chars.map((ch, i) => {
        const tX = i / total;
        const dist = Math.abs(tX - beamCenter);

        let color = bright;
        if (dist < beamRadius) {
          const norm = dist / beamRadius;
          if (norm < 0.3) {
            color = lerpHex(peak, bright, norm / 0.3);
          } else {
            color = lerpHex(bright, accent, (norm - 0.3) / 0.7);
          }
        }

        return (
          <Text key={i} color={color} bold={bold}>
            {ch}
          </Text>
        );
      })}
    </Text>
  );
}
