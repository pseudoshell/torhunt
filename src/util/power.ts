import { spawn, type ChildProcess } from "node:child_process";
import os from "node:os";

export type CompletionAction = "none" | "sleep" | "shutdown";

let keepAwakeProc: ChildProcess | null = null;

/**
 * Tells the OS to keep the system awake while downloads are actively in progress.
 * - Windows: Runs a lightweight keepalive script calling SetThreadExecutionState (ES_SYSTEM_REQUIRED | ES_CONTINUOUS)
 * - macOS: Spawns caffeinate -d -i -m
 * - Linux: Spawns systemd-inhibit or sleep lock
 */
export function acquireKeepAwake(): void {
  if (keepAwakeProc) return;
  try {
    const platform = os.platform();
    if (platform === "win32") {
      const script = `
        $code = '[DllImport("kernel32.dll")] public static extern uint SetThreadExecutionState(uint esFlags);'
        $type = Add-Type -MemberDefinition $code -Name Power -PassThru
        $type::SetThreadExecutionState(0x80000001)
        while ($true) { Start-Sleep -Seconds 3600 }
      `;
      keepAwakeProc = spawn("powershell", ["-NoProfile", "-NonInteractive", "-Command", script], {
        windowsHide: true,
        stdio: "ignore",
      });
      keepAwakeProc.unref();
    } else if (platform === "darwin") {
      keepAwakeProc = spawn("caffeinate", ["-d", "-i", "-m"], {
        stdio: "ignore",
      });
      keepAwakeProc.unref();
    } else if (platform === "linux") {
      keepAwakeProc = spawn(
        "systemd-inhibit",
        ["--what=idle:sleep", "--why=torhunt downloading", "sleep", "infinity"],
        { stdio: "ignore" },
      );
      keepAwakeProc.unref();
    }
  } catch {
    // Ignore if platform power tools are unavailable
  }
}

/**
 * Releases the keep-awake system lock when active downloads complete or pause.
 */
export function releaseKeepAwake(): void {
  if (!keepAwakeProc) return;
  try {
    keepAwakeProc.kill();
  } catch {
    // Ignore
  }
  keepAwakeProc = null;
}

export function isKeepAwakeActive(): boolean {
  return keepAwakeProc !== null;
}

/**
 * Triggers OS Sleep / Suspend.
 */
export function triggerSleep(): void {
  const platform = os.platform();
  try {
    if (platform === "win32") {
      spawn(
        "powershell",
        [
          "-NoProfile",
          "-NonInteractive",
          "-Command",
          "[System.Reflection.Assembly]::LoadWithPartialName('System.Windows.Forms') | Out-Null; [System.Windows.Forms.Application]::SetSuspendState([System.Windows.Forms.PowerState]::Suspend, $false, $false)",
        ],
        { windowsHide: true, stdio: "ignore" },
      ).unref();
    } else if (platform === "darwin") {
      spawn("pmset", ["sleepnow"], { stdio: "ignore" }).unref();
    } else if (platform === "linux") {
      spawn("systemctl", ["suspend"], { stdio: "ignore" }).unref();
    }
  } catch {
    // Ignore
  }
}

/**
 * Triggers OS Shutdown (with safety notice / cancel grace period on Windows).
 */
export function triggerShutdown(): void {
  const platform = os.platform();
  try {
    if (platform === "win32") {
      spawn(
        "shutdown",
        [
          "/s",
          "/t",
          "30",
          "/c",
          "torhunt: All downloads finished. Shutting down in 30 seconds (run 'shutdown /a' in terminal to cancel).",
        ],
        { windowsHide: true, stdio: "ignore" },
      ).unref();
    } else if (platform === "darwin") {
      spawn("osascript", ["-e", 'tell app "System Events" to shut down'], {
        stdio: "ignore",
      }).unref();
    } else if (platform === "linux") {
      spawn("shutdown", ["-h", "+1", "torhunt: All downloads finished."], {
        stdio: "ignore",
      }).unref();
    }
  } catch {
    // Ignore
  }
}
