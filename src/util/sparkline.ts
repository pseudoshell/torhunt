const SPARK_CHARS = [" ", "▂", "▃", "▄", "▅", "▆", "▇", "█"];

/**
 * Generates a sparkline string from an array of numbers.
 * Normalizes values between min and max into 8 discrete block levels.
 */
export function sparkline(values: number[], targetLength?: number): string {
  if (!values || values.length === 0) {
    const len = targetLength ?? 8;
    return " ".repeat(len);
  }

  let data = values;
  if (targetLength && data.length < targetLength) {
    const padding = new Array(targetLength - data.length).fill(0);
    data = [...padding, ...data];
  } else if (targetLength && data.length > targetLength) {
    data = data.slice(-targetLength);
  }

  const max = Math.max(...data, 1);
  const min = 0;
  const range = max - min || 1;

  return data
    .map((v) => {
      const clamped = Math.max(0, v);
      const ratio = clamped / range;
      const idx = Math.min(
        SPARK_CHARS.length - 1,
        Math.floor(ratio * SPARK_CHARS.length),
      );
      return SPARK_CHARS[idx]!;
    })
    .join("");
}
