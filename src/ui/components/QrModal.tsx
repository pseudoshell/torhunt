import { useMemo } from "react";
import { Box, Text, useInput } from "ink";
import { compactMagnet, encodeQrMatrix, renderQrToTerminal } from "../../util/qrcode";
import { cleanText, truncate } from "../../util/format";
import { DEFAULT_THEME, type Theme } from "../theme";
import { useStore } from "../store";

interface QrModalProps {
  name: string;
  magnet: string;
  width: number;
  onClose: () => void;
  onCopy?: () => void;
}

export function QrModal({ name, magnet, width, onClose, onCopy }: QrModalProps) {
  const store = useStore();
  const theme: Theme = store?.theme ?? DEFAULT_THEME;

  const targetMagnet = useMemo(() => compactMagnet(magnet), [magnet]);

  const qrLines = useMemo(() => {
    try {
      const matrix = encodeQrMatrix(targetMagnet);
      return renderQrToTerminal(matrix);
    } catch {
      return [];
    }
  }, [targetMagnet]);

  useInput(
    (input, key) => {
      // Esc exclusively closes the modal banner
      if (key.escape) {
        onClose();
        return;
      }
      if (input === "c" || input === "C") {
        onCopy?.();
        return;
      }
    },
    { isActive: true },
  );

  const w = Math.max(40, width);
  const borderCol = theme.colors.accent;
  const titleCol = theme.colors.bright;

  return (
    <Box flexDirection="column" width={w} marginTop={1} marginBottom={1}>
      {/* Top Header Border */}
      <Box width={w}>
        <Text color={borderCol}>{"┌─[ "}</Text>
        <Text bold color={titleCol}>
          MOBILE QR HAND-OFF
        </Text>
        <Text color={borderCol}>{` ]${"─".repeat(Math.max(0, w - 26))}┐`}</Text>
      </Box>

      {/* Main Content Area */}
      <Box
        width={w}
        flexDirection="row"
        alignItems="center"
        paddingX={3}
        paddingY={1}
      >
        {/* Left: QR Code Box */}
        <Box
          flexDirection="column"
          flexShrink={0}
          marginRight={4}
          alignItems="center"
          justifyContent="center"
        >
          {qrLines.map((line, i) => (
            <Text key={i} color={theme.colors.accent} bold>
              {line}
            </Text>
          ))}
        </Box>

        {/* Right: Metadata & Actions */}
        <Box
          flexDirection="column"
          flexGrow={1}
          minWidth={0}
          justifyContent="center"
        >
          {/* Release Name */}
          <Box marginBottom={1}>
            <Text bold color={theme.colors.bright} wrap="wrap">
              {cleanText(name)}
            </Text>
          </Box>

          {/* Subtitle Instructions */}
          <Box marginBottom={1}>
            <Text dimColor>
              Scan with your phone camera to start downloading instantly
            </Text>
          </Box>

          {/* Magnet Preview */}
          <Box marginBottom={2}>
            <Text color={theme.colors.text} dimColor wrap="truncate-middle">
              {targetMagnet}
            </Text>
          </Box>

          {/* Action Key Pills */}
          <Box flexDirection="row" gap={3}>
            <Box>
              <Text color={theme.colors.accent} bold>[c]</Text>
              <Text color={theme.colors.text}> Copy magnet link</Text>
            </Box>
            <Box>
              <Text color={theme.colors.good} bold>[Esc]</Text>
              <Text color={theme.colors.text}> Close</Text>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Bottom Footer Border */}
      <Box width={w}>
        <Text color={borderCol}>{`└${"─".repeat(Math.max(0, w - 2))}┘`}</Text>
      </Box>
    </Box>
  );
}
