import { useContext, useEffect, useState } from "react";
import { Text } from "ink";
import { DEFAULT_THEME } from "../theme";
import { StoreContext } from "../store";

const FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

export function Spinner({ label }: { label?: string }) {
  const store = useContext(StoreContext);
  const theme = store?.theme ?? DEFAULT_THEME;
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setFrame((f) => (f + 1) % FRAMES.length), 80);
    timer.unref?.();
    return () => clearInterval(timer);
  }, []);
  return (
    <Text>
      <Text color={theme.colors.accent}>{FRAMES[frame]}</Text>
      {label ? <Text dimColor>{` ${label}`}</Text> : null}
    </Text>
  );
}
