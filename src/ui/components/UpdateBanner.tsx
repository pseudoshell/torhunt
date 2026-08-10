import { Text } from "ink";

// A quiet one-liner above the wordmark when a newer release exists. Passive by
// design: it never steals focus or a key, it just points at `torlnk update`.
export function UpdateBanner({ latest }: { latest: string | null }) {
  if (!latest) return null;
  return <Text dimColor>{`↑ torhunt v${latest} available · torhunt update`}</Text>;
}
