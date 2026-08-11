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
  const safeTitle = title.replace(/["'\\]/g, "");
  const safeMessage = message.replace(/["'\\]/g, "");

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
        $toast = [Windows.UI.Notifications.ToastNotification]::new($xml)
        [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier("torhunt").Show($toast)
      `;
      spawn("powershell", ["-NoProfile", "-NonInteractive", "-Command", script], {
        windowsHide: true,
        stdio: "ignore",
      }).unref();
    } else if (platform === "darwin") {
      spawn(
        "osascript",
        ["-e", `display notification "${safeMessage}" with title "${safeTitle}"`],
        { stdio: "ignore" },
      ).unref();
    } else if (platform === "linux") {
      spawn("notify-send", [safeTitle, safeMessage], {
        stdio: "ignore",
      }).unref();
    }
  } catch {
    // Ignore if OS notification daemon is unavailable
  }
}
