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

  const hasActivity = activeCount > 0 || seedingCount > 0 || downSpeed > 0 || upSpeed > 0;
  const showFullStats = width >= 80;
  const showCompactStats = width >= 58 && !showFullStats;

  return (
    <Box
      width={width}
      justifyContent="space-between"
      alignItems="center"
    >
      {/* Left: Branding Logo */}
      <Box flexShrink={0}>
        <Logo layout="inline" />
      </Box>

      {/* Center & Right: Notifications & Telemetry */}
      <Box flexGrow={1} justifyContent="flex-end" alignItems="center" marginLeft={1}>
        {notice ? (
          <Box flexShrink={1} minWidth={0} marginRight={showFullStats || showCompactStats ? 2 : 0}>
            <Text color={theme.colors.sprout || theme.colors.good} bold wrap="truncate-end">
              {notice}
            </Text>
          </Box>
        ) : null}

        {showFullStats ? (
          <Box flexShrink={0} alignItems="center">
            {/* Speeds */}
            <Box marginRight={1}>
              <Text color={downSpeed > 0 ? theme.colors.good : undefined} dimColor={downSpeed === 0} bold={downSpeed > 0}>
                {`${ICON.down} ${formatBytesPerSec(downSpeed) || "0 B/s"}`}
              </Text>
              <Text color={theme.colors.rule}>{`  `}</Text>
              <Text color={upSpeed > 0 ? theme.colors.alt : undefined} dimColor={upSpeed === 0} bold={upSpeed > 0}>
                {`${ICON.up} ${formatBytesPerSec(upSpeed) || "0 B/s"}`}
              </Text>
            </Box>

            {/* Subtle Vertical Divider */}
            <Box marginX={1}>
              <Text color={theme.colors.rule}>│</Text>
            </Box>

            {/* Active Torrent Counters */}
            <Box>
              <Text
                color={activeCount > 0 ? theme.colors.accent : undefined}
                dimColor={activeCount === 0}
                bold={activeCount > 0}
              >
                {`${activeCount} dl`}
              </Text>
              <Text color={theme.colors.rule}>{` ${ICON.dot} `}</Text>
              <Text
                color={seedingCount > 0 ? (theme.colors.sprout || theme.colors.good) : undefined}
                dimColor={seedingCount === 0}
                bold={seedingCount > 0}
              >
                {`${seedingCount} seed`}
              </Text>
            </Box>
          </Box>
        ) : showCompactStats && hasActivity ? (
          <Box flexShrink={0} alignItems="center">
            {downSpeed > 0 || upSpeed > 0 ? (
              <Box marginRight={1}>
                <Text color={theme.colors.good} bold={downSpeed > 0}>
                  {`${ICON.down} ${formatBytesPerSec(downSpeed)}`}
                </Text>
                {upSpeed > 0 ? (
                  <>
                    <Text color={theme.colors.rule}>{` `}</Text>
                    <Text color={theme.colors.alt} bold>
                      {`${ICON.up} ${formatBytesPerSec(upSpeed)}`}
                    </Text>
                  </>
                ) : null}
              </Box>
            ) : (
              <Box>
                <Text color={activeCount > 0 ? theme.colors.accent : undefined} dimColor={activeCount === 0}>
                  {`${activeCount} dl`}
                </Text>
                <Text color={theme.colors.rule}>{` ${ICON.dot} `}</Text>
                <Text color={seedingCount > 0 ? theme.colors.good : undefined} dimColor={seedingCount === 0}>
                  {`${seedingCount} seed`}
                </Text>
              </Box>
            )}
          </Box>
        ) : null}
      </Box>
    </Box>
  );
}
