import { useEffect, useState } from "react";
import { Text } from "ink";
import type { Theme } from "../theme";

interface ResultShimmerProps {
  text: string;
  theme: Theme;
}

export function ResultShimmer({ text, theme }: ResultShimmerProps) {
  const [beamIdx, setBeamIdx] = useState(-5);

  useEffect(() => {
    setBeamIdx(-5);
  }, [text]);

  useEffect(() => {
    // Total steps = text length + beam padding + short pause frames
    const totalSteps = text.length + 20;

    const timer = setInterval(() => {
      setBeamIdx((prev) => {
        const next = prev + 1;
        return next > totalSteps ? -5 : next;
      });
    }, 25);

    return () => clearInterval(timer);
  }, [text]);

  const beamWidth = 6;
  const peakColor = theme.colors.sheenPeak || "#ffffff";
  const mainColor = theme.colors.accent;

  // Rest state (when beam is off-screen or during pause)
  if (beamIdx < 0 || beamIdx >= text.length + beamWidth) {
    return (
      <Text color={mainColor} bold wrap="truncate-end">
        {text}
      </Text>
    );
  }

  const start = Math.max(0, beamIdx - Math.floor(beamWidth / 2));
  const end = Math.min(text.length, beamIdx + Math.ceil(beamWidth / 2));

  const partBefore = text.slice(0, start);
  const partBeam = text.slice(start, end);
  const partAfter = text.slice(end);

  return (
    <Text wrap="truncate-end">
      {partBefore ? (
        <Text color={mainColor} bold>
          {partBefore}
        </Text>
      ) : null}
      {partBeam ? (
        <Text color={peakColor} bold>
          {partBeam}
        </Text>
      ) : null}
      {partAfter ? (
        <Text color={mainColor} bold>
          {partAfter}
        </Text>
      ) : null}
    </Text>
  );
}
