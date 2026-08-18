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
      // Windows 10/11 native WinRT Toast Notification with registered PowerShell AppID, sound cue & NotifyIcon fallback
      const xmlPayload = `<toast><visual><binding template="ToastGeneric"><text>${safeTitle}</text><text>${safeMessage}</text></binding></visual><audio src="ms-winsoundevent:Notification.Default"/></toast>`;
      const psXmlString = "'" + xmlPayload.replace(/'/g, "''") + "'";
      const appId = "{1AC14E77-02E7-4E5D-B744-2EB1AE5198B7}\\WindowsPowerShell\\v1.0\\powershell.exe";
      const script = `
$success = $false
try {
    [Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null
    [Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom.XmlDocument, ContentType = WindowsRuntime] | Out-Null
    $xml = New-Object Windows.Data.Xml.Dom.XmlDocument
    $xml.LoadXml(${psXmlString})
    $toast = New-Object Windows.UI.Notifications.ToastNotification $xml
    $notifier = [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier('${appId}')
    $notifier.Show($toast)
    $success = $true
} catch {}

if (-not $success) {
    try {
        Add-Type -AssemblyName System.Windows.Forms
        Add-Type -AssemblyName System.Drawing
        $notify = New-Object System.Windows.Forms.NotifyIcon
        $notify.Icon = [System.Drawing.SystemIcons]::Information
        $notify.BalloonTipIcon = [System.Windows.Forms.ToolTipIcon]::Info
        $notify.BalloonTipTitle = '${safeTitle}'
        $notify.BalloonTipText = '${safeMessage}'
        $notify.Visible = $true
        $notify.ShowBalloonTip(5000)
        Start-Sleep -s 5
        $notify.Dispose()
    } catch {}
}
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
        { detached: true, stdio: "ignore" },
      );
      child.on("error", () => {});
      child.unref();
    } else if (platform === "linux") {
      // Linux: notify-send with -a torhunt app tag and normal urgency
      const child = spawn("notify-send", ["-a", "torhunt", "-u", "normal", safeTitle, safeMessage], {
        detached: true,
        stdio: "ignore",
      });
      child.on("error", () => {
        // Fallback for older libnotify versions without -a flag
        const fallback = spawn("notify-send", [safeTitle, safeMessage], { detached: true, stdio: "ignore" });
        fallback.on("error", () => {});
        fallback.unref();
      });
      child.unref();
    }
  } catch {
    // Ignore if OS notification daemon is unavailable
  }
}
