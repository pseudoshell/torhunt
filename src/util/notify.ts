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
      // Windows 10/11 system tray notification balloon with OS audio chime
      const script = `
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
try { [System.Media.SystemSounds]::Asterisk.Play() } catch {}
$icon = [System.Drawing.SystemIcons]::Information
$notify = New-Object System.Windows.Forms.NotifyIcon
$notify.Icon = $icon
$notify.Text = "torhunt"
$notify.Visible = $true
$notify.ShowBalloonTip(5000, "${safeTitle}", "${safeMessage}", [System.Windows.Forms.ToolTipIcon]::Info)
Start-Sleep -s 5
$notify.Dispose()
`;
      const encoded = Buffer.from(script, "utf16le").toString("base64");
      const child = spawn("powershell", ["-NoProfile", "-NonInteractive", "-EncodedCommand", encoded], {
        detached: true,
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
