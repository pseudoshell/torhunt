import { useContext } from "react";
import { Text } from "ink";
import { DEFAULT_THEME } from "../theme";
import { StoreContext } from "../store";

export function Rule({ width, color }: { width: number; color?: string }) {
  const store = useContext(StoreContext);
  const ruleColor = color ?? store?.theme?.colors.rule ?? DEFAULT_THEME.colors.rule;
  return <Text color={ruleColor}>{"─".repeat(Math.max(1, width))}</Text>;
}
