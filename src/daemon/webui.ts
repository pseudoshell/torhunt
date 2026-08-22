// Web remote: the static front-end served by `torhunt serve`, plus the two
// pieces of server plumbing it needs that the plain JSON API doesn't provide —
// an asset locator for the bundled HTML shell and a server-sent-event stream
// that pushes queue snapshots to the browser. Everything here is structural and
// dependency-free so it stays trivially testable without node:http.
//
// Security posture (mirrors serve.ts): the HTML shell carries no secrets, so it
// is served like /health — after the tokenless Host check but without bearer
// auth. Every data route (/events included) still requires authorization, and
// cross-site POSTs are rejected by origin comparison before any handler runs.

import { readFileSync } from "node:fs";

// The shell ships beside the bundle in dist/ (postbuild copies it there) and
// lives under src/daemon/assets/ in a checkout. Try both layouts; cache the
// first hit so a hot loop never re-stats the disk.
let cachedHtml: string | null | undefined;

export function loadUiHtml(): string | null {
  if (cachedHtml !== undefined) return cachedHtml;
  const candidates = [
    new URL("./ui.html", import.meta.url), // bundled: dist/ui.html
    new URL("./assets/ui.html", import.meta.url), // source tree
  ];
  for (const url of candidates) {
    try {
      cachedHtml = readFileSync(url, "utf8");
      return cachedHtml;
    } catch {
      // try the next layout
    }
  }
  cachedHtml = null;
  return cachedHtml;
}

// Minimal structural types so tests can pass plain objects instead of real
// http.ServerResponse / EventEmitter instances.
export interface EventStreamWriter {
  writeHead(status: number, headers: Record<string, string>): unknown;
  write(chunk: string): unknown;
  on(event: string, listener: () => void): unknown;
}

export interface QueueEventSource {
  on(event: string, listener: () => void): unknown;
  off(event: string, listener: () => void): unknown;
}

export const SSE_HEARTBEAT_MS = 15_000;

// Open an SSE stream on `res` and push a fresh snapshot on every queue update,
// plus a keepalive comment so intermediaries don't reap an idle connection.
// The stream cleans up after itself when the client disconnects.
export function openEventStream(
  res: EventStreamWriter,
  queue: QueueEventSource,
  snapshot: () => unknown,
): void {
  res.writeHead(200, {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-store",
    Connection: "keep-alive",
  });
  // Ask browsers to retry quickly after a daemon restart.
  res.write("retry: 3000\n\n");

  const push = (): void => {
    try {
      res.write(`data: ${JSON.stringify(snapshot())}\n\n`);
    } catch {
      // A torn write means the socket died; the close listener detaches us.
    }
  };
  push();

  queue.on("update", push);
  const heartbeat = setInterval(() => {
    try {
      res.write(": keepalive\n\n");
    } catch {
      // same as above — close will clean up
    }
  }, SSE_HEARTBEAT_MS);
  heartbeat.unref?.();

  const detach = (): void => {
    queue.off("update", push);
    clearInterval(heartbeat);
  };
  res.on("close", detach);
}

// Cross-site request guard for state-changing calls. Browsers attach an Origin
// header to every POST they send — same-origin ones match the request's Host,
// forged ones don't. curl and scripts send no Origin at all and pass through.
export function originAllowed(origin: string | undefined, hostHeader: string | undefined): boolean {
  if (!origin) return true;
  let originHost: string;
  try {
    originHost = new URL(origin).host.toLowerCase();
  } catch {
    return false; // malformed Origin is never trusted
  }
  if (!hostHeader) return false;
  return originHost === hostHeader.trim().toLowerCase();
}
