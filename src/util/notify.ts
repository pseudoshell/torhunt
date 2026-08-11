import { spawn } from "node:child_process";
import os from "node:os";

/**
 * Sends a native OS desktop notification.
 * - Windows: Uses PowerShell ToastNotification API with App ID 'torhunt'
 * - macOS: Uses AppleScript display notification
 * - Linux: Uses notify-send
 */
export function sendNotification(title: string, message: string): void {
  const platform = os.platform();
  const safeTitle = title.replace(/[<>&"'\\]/g, "").replace(/[\$()]/g, "");
  const safeMessage = message.replace(/[<>&"'\\]/g, "").replace(/[\$()]/g, "");

  try {
    if (platform === "win32") {
      // Windows 10/11 native XML Toast Notification
      const script = `
[Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null
[Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom.XmlDocument, ContentType = WindowsRuntime] | Out-Null
$template = @"
<toast>
    <visual>
        <binding template="ToastGeneric">
            <text>${safeTitle}</text>
            <text>${safeMessage}</text>
        </binding>
    </visual>
</toast>
"@
$xml = New-Object Windows.Data.Xml.Dom.XmlDocument
$xml.LoadXml($template)
$toast = New-Object Windows.UI.Notifications.ToastNotification $xml
$appId = '{1AC14E77-02E7-4E5D-B744-2EB1AE5198B7}\\WindowsPowerShell\\v1.0\\powershell.exe'
[Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier($appId).Show($toast)
`;
      const encoded = Buffer.from(script, "utf16le").toString("base64");
      const child = spawn("powershell", ["-NoProfile", "-NonInteractive", "-EncodedCommand", encoded], {
        windowsHide: true,
        stdio: "ignore",
      });
      child.on("error", () => {});
      child.unref();
    } else if (platform === "darwin") {
      // macOS: Native AppleScript notification with system sound tone
      const child = spawn(
        "osascript",
        ["-e", `display notification "${safeMessage}" with title "${safeTitle}" sound name "Glass"`],
        { stdio: "ignore" },
      );
      child.on("error", () => {});
      child.unref();
    } else if (platform === "linux") {
      // Linux: notify-send with -a torhunt app tag and normal urgency
      const child = spawn("notify-send", ["-a", "torhunt", "-u", "normal", safeTitle, safeMessage], {
        stdio: "ignore",
      });
      child.on("error", () => {
        // Fallback for older libnotify versions without -a flag
        const fallback = spawn("notify-send", [safeTitle, safeMessage], { stdio: "ignore" });
        fallback.on("error", () => {});
        fallback.unref();
      });
      child.unref();
    }
  } catch {
    // Ignore if OS notification daemon is unavailable
  }
}
