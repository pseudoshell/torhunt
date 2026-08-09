import { Box, Text, useInput } from "ink";
import { useStore, useQueueItems, type Section } from "../store";
import { wrapStep } from "../move";
import { GUTTER, ICON } from "../theme";

interface NavItem {
  key: Section;
  label: string;
}

interface NavGroup {
  title?: string;
  items: NavItem[];
}

const GROUPS: NavGroup[] = [
  {
    title: "DISCOVER",
    items: [
      { key: "all", label: "All" },
      { key: "games", label: "Games" },
      { key: "movies", label: "Movies" },
      { key: "tv", label: "TV Shows" },
      { key: "anime", label: "Anime" },
    ],
  },
  {
    title: "TRANSFERS",
    items: [
      { key: "downloads", label: "Downloads" },
      { key: "seeding", label: "Seeding" },
    ],
  },
];

const NAV: NavItem[] = GROUPS.flatMap((g) => g.items);

export const RAIL_WIDTH = 15;

export function Sidebar() {
  const { section, setSection, region, setRegion, queue, theme } = useStore();
  const focused = region === "sidebar";
  const idx = Math.max(0, NAV.findIndex((n) => n.key === section));
  useQueueItems(queue);
  const active = queue.activeCount;
  const seeding = queue.seedingCount;

  useInput(
    (input, key) => {
      if (key.upArrow || input === "k") setSection(NAV[wrapStep(idx, -1, NAV.length)]!.key);
      else if (key.downArrow || input === "j") setSection(NAV[wrapStep(idx, 1, NAV.length)]!.key);
      else if (key.return) setRegion("content");
    },
    { isActive: focused },
  );

  return (
    <Box flexDirection="column" width={RAIL_WIDTH} marginRight={1}>
      {GROUPS.map((group, gi) => (
        <Box key={gi} flexDirection="column" marginTop={gi > 0 ? 1 : 0}>
          {group.title ? (
            <Box paddingLeft={1} marginBottom={0}>
              <Text color={theme.colors.rule} bold>
                {group.title}
              </Text>
            </Box>
          ) : null}
          {group.items.map((item) => {
            const selected = item.key === section;
            const count = item.key === "downloads" ? active : item.key === "seeding" ? seeding : 0;

            return (
              <Box key={item.key} justifyContent="space-between">
                <Box>
                  <Box width={GUTTER} flexShrink={0}>
                    {selected ? (
                      <Text color={focused ? theme.colors.accent : theme.colors.alt} bold={focused}>
                        {ICON.pointer}
                      </Text>
                    ) : null}
                  </Box>
                  <Text
                    color={selected ? (focused ? theme.colors.text : theme.colors.alt) : undefined}
                    dimColor={!selected}
                    bold={selected && focused}
                  >
                    {item.label}
                  </Text>
                </Box>
                {count > 0 ? (
                  <Box flexShrink={0} marginRight={1}>
                    <Text
                      color={
                        item.key === "downloads"
                          ? theme.colors.accent
                          : theme.colors.good
                      }
                      bold={selected}
                    >
                      {`${count}`}
                    </Text>
                  </Box>
                ) : null}
              </Box>
            );
          })}
        </Box>
      ))}
    </Box>
  );
}
