import { useState } from "react";
import { Box, Text, useInput } from "ink";
import { useStore } from "../store";
import { Panel } from "./Panel";
import { TextField } from "./TextField";
import { THEMES } from "../theme";
import { SPINNERS } from "../spinnerPresets";
import { saveConfig } from "../../config/config";
import { normalizeDownloadDir } from "../../config/folder";

export function SettingsView() {
  const {
    config,
    setConfig,
    theme,
    setThemeId,
    spinner,
    setSpinnerId,
    openThemePicker,
    openSpinnerPicker,
    contentWidth,
    region,
    listRows,
    setNotice,
    setCaptureMode,
  } = useStore();

  const focused = region === "content";
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [editingPath, setEditingPath] = useState(false);
  const [pathInput, setPathInput] = useState(config.downloadDir);

  const SETTING_ITEMS = [
    { id: "downloadDir", label: "Download Folder" },
    { id: "theme", label: "Color Theme" },
    { id: "spinner", label: "Spinner Loader" },
  ];

  useInput(
    (input, key) => {
      if (editingPath) {
        if (key.escape) {
          setEditingPath(false);
          setCaptureMode("none");
          setPathInput(config.downloadDir);
          return;
        }
        return;
      }

      if (key.upArrow || input === "k") {
        setSelectedIdx((i) => Math.max(0, i - 1));
      } else if (key.downArrow || input === "j") {
        setSelectedIdx((i) => Math.min(SETTING_ITEMS.length - 1, i + 1));
      } else if (key.return || input === " ") {
        const item = SETTING_ITEMS[selectedIdx];
        if (item?.id === "downloadDir") {
          setEditingPath(true);
          setCaptureMode("text");
        } else if (item?.id === "theme") {
          openThemePicker();
        } else if (item?.id === "spinner") {
          openSpinnerPicker();
        }
      }
    },
    { isActive: focused },
  );

  const onSavePath = (val: string) => {
    setEditingPath(false);
    setCaptureMode("none");
    const normalized = normalizeDownloadDir(val);
    const nextCfg = { ...config, downloadDir: normalized };
    setConfig(nextCfg);
    saveConfig(nextCfg);
    setNotice(`Saved download folder: ${normalized}`);
  };

  const panelH = Math.max(8, listRows - 1);

  return (
    <Panel title="settings" width={contentWidth} focused={focused} height={panelH}>
      <Box flexDirection="column" gap={1}>
        {/* Item 0: Download Directory */}
        <Box justifyContent="space-between" alignItems="center">
          <Box>
            <Text color={selectedIdx === 0 && focused ? theme.colors.bright : undefined} bold={selectedIdx === 0 && focused}>
              {selectedIdx === 0 && focused ? "→ " : "  "}Download Folder:
            </Text>
          </Box>
          <Box flexShrink={1} minWidth={0} marginLeft={2}>
            {editingPath ? (
              <TextField
                defaultValue={config.downloadDir}
                onSubmit={onSavePath}
              />
            ) : (
              <Text color={theme.colors.accent} bold wrap="truncate-end">
                {config.downloadDir}
              </Text>
            )}
          </Box>
        </Box>

        {/* Item 1: Theme */}
        <Box justifyContent="space-between" alignItems="center">
          <Box>
            <Text color={selectedIdx === 1 && focused ? theme.colors.bright : undefined} bold={selectedIdx === 1 && focused}>
              {selectedIdx === 1 && focused ? "→ " : "  "}Color Theme:
            </Text>
          </Box>
          <Box marginLeft={2}>
            <Text color={theme.colors.alt} bold>
              {`[${theme.name}]`}
            </Text>
          </Box>
        </Box>

        {/* Item 2: Spinner */}
        <Box justifyContent="space-between" alignItems="center">
          <Box>
            <Text color={selectedIdx === 2 && focused ? theme.colors.bright : undefined} bold={selectedIdx === 2 && focused}>
              {selectedIdx === 2 && focused ? "→ " : "  "}Spinner Style:
            </Text>
          </Box>
          <Box marginLeft={2}>
            <Text color={theme.colors.good} bold>
              {`[${spinner.name}] (${spinner.frames[0]})`}
            </Text>
          </Box>
        </Box>

        <Box marginTop={1}>
          <Text dimColor>
            Press ↵ on Color Theme or Spinner Style to open full interactive list. Press ↵ on Download Folder to edit path.
          </Text>
        </Box>
      </Box>
    </Panel>
  );
}
