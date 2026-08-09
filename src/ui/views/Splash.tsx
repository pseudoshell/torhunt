import { Box, Text, useInput, useStdin } from "ink";
import { Logo } from "../components/Logo";
import { UpdateBanner } from "../components/UpdateBanner";
import { SearchBar } from "../components/SearchBar";
import { LOGO_WIDTH } from "../logo";
import { useStore, useQueueItems } from "../store";
import { ICON } from "../theme";
import { formatBytesPerSec } from "../../util/format";

const QUICK_CATEGORIES = [
  { num: "1", key: "games", label: "games" },
  { num: "2", key: "movies", label: "movies" },
  { num: "3", key: "tv", label: "tv" },
  { num: "4", key: "anime", label: "anime" },
] as const;

export function Splash({
  updateVersion,
  recovered,
}: { updateVersion?: string | null; recovered?: boolean } = {}) {
  const { submitQuery, setSection, setView, queue, quitAll, cols, rows, theme } = useStore();
  const { isRawModeSupported } = useStdin();
  const items = useQueueItems(queue);

  const activeCount = queue.activeCount;
  const downSpeed = items
    .filter((i) => i.status === "downloading")
    .reduce((acc, i) => acc + i.speed, 0);

  useInput(
    (input, key) => {
      if (key.escape || (key.ctrl && input === "c")) {
        quitAll();
        return;
      }
      if (input === "1") {
        setSection("games");
        setView("browser");
      } else if (input === "2") {
        setSection("movies");
        setView("browser");
      } else if (input === "3") {
        setSection("tv");
        setView("browser");
      } else if (input === "4") {
        setSection("anime");
        setView("browser");
      } else if (input === "5" && activeCount > 0) {
        setSection("downloads");
        setView("browser");
      }
    },
    { isActive: isRawModeSupported },
  );

  const showLogo = cols >= LOGO_WIDTH + 2;
  const barWidth = Math.max(24, Math.min(cols - 6, 62));

  return (
    <Box
      height={Math.max(1, rows - 1)}
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
    >
      <UpdateBanner latest={updateVersion ?? null} />
      {recovered ? (
        <Text dimColor>{`↻ recovered from a crashed start · downloads paused`}</Text>
      ) : null}
      {showLogo ? (
        <Logo />
      ) : (
        <Text bold color={theme.colors.accent}>
          torlink
        </Text>
      )}
      <Box marginTop={2}>
        <Text color={theme.colors.text}>A curated, terminal-native torrent downloader.</Text>
      </Box>

      {/* Active transfers banner if downloading */}
      {activeCount > 0 ? (
        <Box marginTop={1}>
          <Text color={theme.colors.good} bold>
            {`${activeCount} active download${activeCount === 1 ? "" : "s"}`}
          </Text>
          <Text dimColor>{` · ${formatBytesPerSec(downSpeed)} · [5] downloads`}</Text>
        </Box>
      ) : null}

      <Box marginTop={1} width={barWidth}>
        <SearchBar
          width={barWidth}
          value=""
          editing
          placeholder="Search or paste a magnet link…"
          onSubmit={submitQuery}
          onExitDown={() => submitQuery("")}
        />
      </Box>

      {/* Quick Category Chips */}
      <Box marginTop={1} flexWrap="wrap" justifyContent="center">
        {QUICK_CATEGORIES.map((c) => (
          <Box key={c.key} marginX={1}>
            <Text dimColor>[</Text>
            <Text color={theme.colors.accent} bold>
              {` ${c.num}: `}
            </Text>
            <Text color={theme.colors.text}>{`${c.label} `}</Text>
            <Text dimColor>]</Text>
          </Box>
        ))}
      </Box>

      <Box marginTop={1}>
        <Text>
          <Text color={theme.colors.alt}>↵</Text>
          <Text dimColor> search</Text>
          <Text dimColor>{`  ${ICON.dot}  `}</Text>
          <Text color={theme.colors.alt}>⇥</Text>
          <Text dimColor> browse</Text>
          <Text dimColor>{`  ${ICON.dot}  `}</Text>
          <Text color={theme.colors.alt}>^c</Text>
          <Text dimColor> quit</Text>
        </Text>
      </Box>
    </Box>
  );
}
