import { useContext, useEffect, useState } from "react";
import { Text } from "ink";
import { DEFAULT_THEME } from "../theme";
import { DEFAULT_SPINNER, type SpinnerPreset } from "../spinnerPresets";
import { StoreContext } from "../store";

export function Spinner({
  label,
  preset: overridePreset,
}: {
  label?: string;
  preset?: SpinnerPreset;
}) {
  const store = useContext(StoreContext);
  const theme = store?.theme ?? DEFAULT_THEME;
  const spinner = overridePreset ?? store?.spinner ?? DEFAULT_SPINNER;
  const frames = spinner.frames;
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    setFrame(0);
    const timer = setInterval(() => setFrame((f) => (f + 1) % frames.length), spinner.intervalMs);
    timer.unref?.();
    return () => clearInterval(timer);
  }, [frames, spinner.intervalMs]);

  return (
    <Text>
      <Text color={theme.colors.accent}>{frames[frame % frames.length]}</Text>
      {label ? <Text dimColor>{` ${label}`}</Text> : null}
    </Text>
  );
}
