import { useState } from "react";
import { Box, Text, useInput } from "ink";
import { useStore } from "../store";
import { Panel } from "./Panel";
import { TextField } from "./TextField";
import { THEMES } from "../theme";
import { SPINNERS } from "../spinnerPresets";
import { saveConfig } from "../../config/config";
import { normalizeDownloadDir } from "../../config/folder";
import { VERSION } from "../../version";

export function SettingsView() {
  const {
    config,
    setConfig,
    queue,
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
    updateVersion,
  } = useStore();

  const focused = region === "content";
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [editingPath, setEditingPath] = useState(false);
  const [pathInput, setPathInput] = useState(config.downloadDir);

  const SETTING_ITEMS = [
    { id: "downloadDir", label: "Download Folder" },
    { id: "theme", label: "Color Theme" },
    { id: "spinner", label: "Spinner Loader" },
    { id: "preventSleep", label: "Stay Awake" },
    { id: "onComplete", label: "When Finished" },
  ];

  const togglePreventSleep = () => {
    const nextVal = !(config.preventSleep ?? true);
    const nextCfg = { ...config, preventSleep: nextVal };
    setConfig(nextCfg);
    saveConfig(nextCfg);
    setNotice(nextVal ? "Stay Awake enabled: OS will not sleep while downloading" : "Stay Awake disabled: Standard OS sleep enabled");
  };

  const cycleOnComplete = () => {
    const current = config.onComplete ?? "none";
    const next: "none" | "sleep" | "shutdown" =
      current === "none" ? "sleep" : current === "sleep" ? "shutdown" : "none";
    const nextCfg = { ...config, onComplete: next };
    setConfig(nextCfg);
    saveConfig(nextCfg);
    const label =
      next === "sleep"
        ? "When downloads finish: Put PC to Sleep"
        : next === "shutdown"
        ? "When downloads finish: Shutdown PC"
        : "When downloads finish: Stay on (Do nothing)";
    setNotice(label);
  };

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
        } else if (item?.id === "preventSleep") {
          togglePreventSleep();
        } else if (item?.id === "onComplete") {
          cycleOnComplete();
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
    queue.updateDefaultDir(normalized);
    setNotice(`Saved download folder: ${normalized}`);
  };

  const panelH = Math.max(8, listRows - 1);

  return (
    <Panel title="settings" width={contentWidth} focused={focused} height={panelH}>
      <Box flexDirection="column" justifyContent="space-between" height={panelH}>
        <Box flexDirection="column">
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
              <Text color={theme.colors.accent} bold>
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
              <Text color={theme.colors.accent} bold>
                {`[${spinner.name}] (${spinner.frames[0]})`}
              </Text>
            </Box>
          </Box>

          {/* Item 3: Stay Awake */}
          <Box justifyContent="space-between" alignItems="center">
            <Box>
              <Text color={selectedIdx === 3 && focused ? theme.colors.bright : undefined} bold={selectedIdx === 3 && focused}>
                {selectedIdx === 3 && focused ? "→ " : "  "}Stay Awake:
              </Text>
            </Box>
            <Box marginLeft={2}>
              <Text color={(config.preventSleep ?? true) ? theme.colors.good : theme.colors.alt} bold>
                {(config.preventSleep ?? true) ? "[Enabled]" : "[Disabled]"}
              </Text>
            </Box>
          </Box>

          {/* Item 4: On Complete */}
          <Box justifyContent="space-between" alignItems="center">
            <Box>
              <Text color={selectedIdx === 4 && focused ? theme.colors.bright : undefined} bold={selectedIdx === 4 && focused}>
                {selectedIdx === 4 && focused ? "→ " : "  "}On Queue Finish:
              </Text>
            </Box>
            <Box marginLeft={2}>
              <Text
                color={
                  config.onComplete === "sleep"
                    ? theme.colors.accent
                    : config.onComplete === "shutdown"
                    ? theme.colors.bad
                    : theme.colors.alt
                }
                bold
              >
                {config.onComplete === "sleep"
                  ? "[Put PC to Sleep]"
                  : config.onComplete === "shutdown"
                  ? "[Shutdown PC]"
                  : "[Stay On]"}
              </Text>
            </Box>
          </Box>

          <Box marginTop={1}>
            <Text dimColor>
              Press ↵ to edit folder, pick theme/spinner, toggle stay awake, or cycle finish action.
            </Text>
          </Box>
        </Box>

        {/* Anchored to the bottom-right inside the Settings panel */}
        <Box justifyContent="flex-end" alignItems="center">
          {updateVersion ? (
            <Box marginRight={1}>
              <Text color={theme.colors.accent} bold>
                {`↑ v${updateVersion} available (run torhunt update)`}
              </Text>
              <Text color={theme.colors.rule}>{"  │  "}</Text>
            </Box>
          ) : null}
          <Text color={theme.colors.alt} dimColor>
            {`v${VERSION}`}
          </Text>
        </Box>
      </Box>
    </Panel>
  );
}
