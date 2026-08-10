import { Box, Text } from "ink";
import { Logo } from "./Logo";
import { useStore, useQueueItems, useSeeds } from "../store";
import { formatBytesPerSec } from "../../util/format";
import { ICON } from "../theme";

export function HeaderBar({ width }: { width: number }) {
  const { queue, theme, notice } = useStore();
  const items = useQueueItems(queue);
  const seeds = useSeeds(queue);

  const activeCount = queue.activeCount;
  const seedingCount = queue.seedingCount;
  const downSpeed = items
    .filter((i) => i.status === "downloading")
    .reduce((acc, i) => acc + i.speed, 0);
  const upSpeed = Array.from(seeds.values())
    .filter((s) => s.status === "seeding")
    .reduce((acc, s) => acc + s.uploadSpeed, 0);

  const showStats = width >= 75;

  return (
    <Box
      width={width}
      justifyContent="space-between"
      alignItems="center"
    >
      <Box flexShrink={0}>
        <Logo layout="inline" />
      </Box>

      <Box flexGrow={1} justifyContent="flex-end" alignItems="center" marginLeft={2}>
        {notice ? (
          <Box flexShrink={1} minWidth={0} marginRight={showStats ? 2 : 0}>
            <Text color={theme.colors.good} bold wrap="truncate-end">
              {notice}
            </Text>
          </Box>
        ) : null}

        {showStats ? (
          <Box flexShrink={0} alignItems="center">
            {/* Active downloads / seeding pill */}
            <Box marginRight={2}>
              <Text color={activeCount > 0 ? theme.colors.accent : undefined} dimColor={activeCount === 0}>
                {`dl: ${activeCount}`}
              </Text>
              <Text dimColor>{` ${ICON.dot} `}</Text>
              <Text color={seedingCount > 0 ? theme.colors.good : undefined} dimColor={seedingCount === 0}>
                {`seed: ${seedingCount}`}
              </Text>
            </Box>

            {/* Speeds */}
            {(downSpeed > 0 || upSpeed > 0) ? (
              <Box marginRight={2}>
                <Text color={theme.colors.good} bold>
                  {`${ICON.down} ${formatBytesPerSec(downSpeed)}`}
                </Text>
                <Text dimColor>{`  `}</Text>
                <Text color={theme.colors.alt}>
                  {`${ICON.up} ${formatBytesPerSec(upSpeed)}`}
                </Text>
              </Box>
            ) : null}
          </Box>
        ) : null}
      </Box>
    </Box>
  );
}
