// Headless HTTP add API: torhunt exposes a tiny local server so another program
// (a seedbox web app, a script, curl) can hand it a torrent over HTTP instead of
// a keypress. It complements the watch folder — same headless runtime, a
// different doorway.
//
// Default port 9161 sits next to Tor's control port (9051 / browser 9151); it's
// deliberately non-standard and overridable with --port. Binds 127.0.0.1 by
// default; exposing it on a public interface requires a token.

import http from "node:http";
import { startRuntime, addInput, type Runtime } from "./runtime";
import { startSeedReaper } from "./seed-reaper";
import { LOOPBACK_HOSTS, isAuthorized, hostHeaderOk } from "./auth";
import { loadUiHtml, openEventStream, originAllowed } from "./webui";
import { VERSION } from "../version";

export { isAuthorized } from "./auth";

export const DEFAULT_API_PORT = 9161;

const MAX_BODY_BYTES = 64 * 1024; // a magnet is small; cap the body hard

export interface ApiResponse {
  status: number;
  body: Record<string, unknown>;
}

export interface ServeOptions {
  port?: number;
  host?: string;
  token?: string;
  downloadDir?: string;
  /** Stop seeding each torrent this long after it finishes (ms). */
  seedTimeMs?: number;
  /** With seedTimeMs, also delete the files when the timer expires. */
  deleteFiles?: boolean;
}

// Pull a magnet / info hash out of a request body. Accepts JSON ({ magnet } or
// { infohash }) or a raw body that is itself a magnet or info hash — forgiving,
// so callers don't have to guess the exact envelope.
export function extractMagnet(bodyText: string): string | null {
  const raw = bodyText.trim();
  if (!raw) return null;
  if (raw.startsWith("{")) {
    try {
      const obj = JSON.parse(raw) as Record<string, unknown>;
      const val = obj.magnet ?? obj.infohash ?? obj.infoHash ?? obj.hash;
      return typeof val === "string" && val.trim() ? val.trim() : null;
    } catch {
      return null;
    }
  }
  return raw;
}

// Control actions the headless API accepts (POST /control). A seedbox web app
// drives per-torrent buttons through these instead of the interactive keymap.
export const CONTROL_ACTIONS = [
  "pause", // pause an active/queued download
  "resume", // resume a paused download
  "start-seed", // (re)start seeding a finished torrent
  "stop-seed", // stop seeding but keep the files
  "remove", // forget the torrent, keep files on disk
  "delete", // forget the torrent AND delete its files
] as const;
export type ControlAction = (typeof CONTROL_ACTIONS)[number];

export interface ControlRequest {
  id: string;
  action: string;
  deleteFiles: boolean;
}

// Parse a control request body: JSON { id, action, deleteFiles? }. Returns null
// for anything missing the two required string fields; the action string itself
// is validated later so an unknown action gets a precise error.
export function parseControl(bodyText: string): ControlRequest | null {
  const raw = bodyText.trim();
  if (!raw.startsWith("{")) return null;
  let obj: Record<string, unknown>;
  try {
    obj = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
  const id = typeof obj.id === "string" ? obj.id.trim() : "";
  const action = typeof obj.action === "string" ? obj.action.trim() : "";
  if (!id || !action) return null;
  return { id, action, deleteFiles: obj.deleteFiles === true };
}

export type ControlOutcome = "ok" | "not-found" | "unknown-action";

// Apply a parsed control request to the queue. Pure over the runtime so it's
// unit-testable with a fake queue.
export async function applyControl(
  runtime: Runtime,
  req: ControlRequest,
): Promise<ControlOutcome> {
  const q = runtime.queue;
  const { id, action, deleteFiles } = req;
  switch (action as ControlAction) {
    case "pause":
      if (!q.has(id)) return "not-found";
      q.pause(id);
      return "ok";
    case "resume":
      if (!q.has(id)) return "not-found";
      q.resume(id);
      return "ok";
    case "stop-seed":
      if (!q.getSeed(id)) return "not-found";
      q.stopSeeding(id);
      return "ok";
    case "start-seed": {
      const h = q.getHistory().find((x) => x.id === id);
      if (!h) return "not-found";
      q.startSeeding(h);
      return "ok";
    }
    case "remove":
    case "delete": {
      const found = await q.remove(id, { deleteFiles: action === "delete" || deleteFiles });
      return found ? "ok" : "not-found";
    }
    default:
      return "unknown-action";
  }
}

function statusPayload(runtime: Runtime): Record<string, unknown> {
  const downloads = runtime.queue.getItems().map((it) => ({
    id: it.id,
    name: it.name,
    status: it.status,
    progress: it.progress,
    peers: it.peers,
    speed: it.speed,
    // Extra context for the web remote; additive so existing API consumers
    // that only read the original fields keep working untouched.
    totalBytes: it.totalBytes,
    downloadedBytes: it.downloadedBytes,
    eta: it.eta,
  }));
  const seeds = runtime.queue.getSeeds().map((s) => ({
    id: s.id,
    name: s.name,
    status: s.status,
    peers: s.peers,
    uploaded: s.uploaded,
  }));
  return { downloads, seeds };
}

// Completed-download archive for the web remote's Completed tab. Read-only and
// capped by whatever the queue keeps (HISTORY_MAX), so the payload stays small.
function historyPayload(runtime: Runtime): Record<string, unknown> {
  const history = runtime.queue.getHistory().map((h) => ({
    id: h.id,
    name: h.name,
    sizeBytes: h.sizeBytes,
    completedAt: h.completedAt,
  }));
  return { history };
}

// Pure request router — no node:http types, so it's trivially testable.
export async function handleApi(
  runtime: Runtime,
  token: string | null,
  method: string,
  urlPath: string,
  authHeader: string | undefined,
  bodyText: string,
): Promise<ApiResponse> {
  if (method === "GET" && urlPath === "/health") {
    return { status: 200, body: { ok: true, version: VERSION } };
  }
  if (!isAuthorized(token, authHeader)) {
    return { status: 401, body: { error: "unauthorized" } };
  }
  if (method === "GET" && (urlPath === "/downloads" || urlPath === "/status")) {
    return { status: 200, body: statusPayload(runtime) };
  }
  if (method === "GET" && urlPath === "/history") {
    return { status: 200, body: historyPayload(runtime) };
  }
  if (method === "POST" && urlPath === "/add") {
    const magnet = extractMagnet(bodyText);
    if (!magnet) return { status: 400, body: { error: "missing magnet or info hash" } };
    const outcome = await addInput(runtime, magnet);
    if (outcome === "invalid") return { status: 400, body: { error: "invalid magnet or info hash" } };
    return { status: 200, body: { ok: true, outcome } };
  }
  if (method === "POST" && urlPath === "/control") {
    const req = parseControl(bodyText);
    if (!req) return { status: 400, body: { error: "missing or invalid { id, action }" } };
    const outcome = await applyControl(runtime, req);
    if (outcome === "unknown-action") {
      return { status: 400, body: { error: `unknown action: ${req.action}` } };
    }
    if (outcome === "not-found") return { status: 404, body: { error: "no such torrent" } };
    return { status: 200, body: { ok: true, id: req.id, action: req.action } };
  }
  return { status: 404, body: { error: "not found" } };
}

// Read the body up to the size cap. On overflow resolve tooLarge immediately
// (further chunks are ignored) so the caller can answer 413 on a live socket
// and close the connection afterwards, instead of writing to a destroyed one.
function readBody(req: http.IncomingMessage): Promise<{ text: string; tooLarge: boolean }> {
  return new Promise((resolve) => {
    let size = 0;
    let settled = false;
    const chunks: Buffer[] = [];
    req.on("data", (c: Buffer) => {
      if (settled) return;
      size += c.length;
      if (size > MAX_BODY_BYTES) {
        settled = true;
        resolve({ text: "", tooLarge: true });
        return;
      }
      chunks.push(c);
    });
    req.on("end", () => {
      if (settled) return;
      settled = true;
      resolve({ text: Buffer.concat(chunks).toString("utf8"), tooLarge: false });
    });
    req.on("error", () => {
      if (settled) return;
      settled = true;
      resolve({ text: "", tooLarge: false });
    });
  });
}

function log(message: string): void {
  console.log(`[torhunt serve] ${new Date().toISOString()} ${message}`);
}

// Build the request handler for the headless add API. Split out from runServe
// so tests can spin a real server against a fake runtime.
export function createServeHandler(
  runtime: Runtime,
  token: string | null,
  logFn: (message: string) => void = log,
): (req: http.IncomingMessage, res: http.ServerResponse) => void {
  return (req, res) => {
    void (async () => {
      const method = req.method ?? "GET";
      const url = new URL(req.url ?? "/", "http://localhost");
      const urlPath = url.pathname;
      // Tokenless means loopback-bound; require a loopback Host so a hostile
      // webpage can't reach us through DNS rebinding.
      if (!token && !hostHeaderOk(req.headers.host)) {
        res.writeHead(403, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "forbidden host" }));
        logFn(`${method} ${urlPath} -> 403 (host)`);
        return;
      }
      // Web remote shell. Like /health it carries no secrets — data stays
      // behind auth below — so any browser that passes the Host check gets it.
      if (method === "GET" && (urlPath === "/" || urlPath === "/ui")) {
        const html = loadUiHtml();
        if (html === null) {
          res.writeHead(404, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "web ui not bundled" }));
          return;
        }
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" });
        res.end(html);
        return;
      }
      // Live snapshot stream. EventSource can't set headers, so the token is
      // also accepted as a query parameter here (never on JSON routes).
      if (method === "GET" && urlPath === "/events") {
        const queryToken = url.searchParams.get("token");
        const auth =
          req.headers.authorization ?? (queryToken ? `Bearer ${queryToken}` : undefined);
        if (!isAuthorized(token, auth)) {
          res.writeHead(401, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "unauthorized" }));
          logFn(`GET /events -> 401`);
          return;
        }
        openEventStream(res, runtime.queue, () => statusPayload(runtime));
        logFn("event stream attached");
        return;
      }
      // Browsers attach Origin to every POST they send; cross-site ones don't
      // match our Host. curl and scripts send no Origin and pass untouched.
      // This keeps the JSON API un-forgeable from hostile web pages even in
      // tokenless mode (where parsers alone already reject form encodings).
      if (method !== "GET" && method !== "HEAD" && !originAllowed(req.headers.origin, req.headers.host)) {
        res.writeHead(403, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "cross-origin request rejected" }));
        logFn(`${method} ${urlPath} -> 403 (origin)`);
        return;
      }
      const body = method === "POST" ? await readBody(req) : { text: "", tooLarge: false };
      if (body.tooLarge) {
        res.writeHead(413, { "Content-Type": "application/json", Connection: "close" });
        res.end(JSON.stringify({ error: "body too large" }));
        res.once("finish", () => req.destroy());
        logFn(`${method} ${urlPath} -> 413`);
        return;
      }
      const bodyText = body.text;
      let out: ApiResponse;
      try {
        out = await handleApi(runtime, token, method, urlPath, req.headers.authorization, bodyText);
      } catch {
        out = { status: 500, body: { error: "internal error" } };
      }
      const payload = JSON.stringify(out.body);
      res.writeHead(out.status, { "Content-Type": "application/json" });
      res.end(payload);
      if (method !== "GET" || urlPath !== "/health") {
        logFn(`${method} ${urlPath} -> ${out.status}`);
      }
    })();
  };
}

export async function runServe(options: ServeOptions = {}): Promise<void> {
  const port = options.port ?? DEFAULT_API_PORT;
  const host = options.host ?? "127.0.0.1";
  const token = options.token && options.token.trim() ? options.token.trim() : null;

  // Fail soft, not open: never expose a public interface without a token.
  if (!LOOPBACK_HOSTS.has(host) && !token) {
    console.error(
      `error: refusing to bind ${host} without a token. Pass --token <secret> ` +
        `(or set TORHUNT_API_TOKEN), or bind 127.0.0.1.`,
    );
    process.exit(1);
    return;
  }

  const runtime = await startRuntime(options.downloadDir);

  if (options.seedTimeMs && options.seedTimeMs > 0) {
    startSeedReaper(runtime.queue, options.seedTimeMs, { deleteFiles: options.deleteFiles, log });
  }

  const server = http.createServer(createServeHandler(runtime, token));

  await new Promise<void>((resolve) => {
    server.listen(port, host, () => {
      log(`listening on http://${host}:${port}  (downloads -> ${runtime.downloadDir})`);
      log(token ? "auth: token required" : "auth: none (loopback only)");
      resolve();
    });
  });

  await new Promise<void>((resolve) => {
    const shutdown = (): void => {
      server.close();
      runtime.queue.suspend();
      resolve();
    };
    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  });
}
