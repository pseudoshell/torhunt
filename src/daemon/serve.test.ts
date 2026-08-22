import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import os from "node:os";
import path from "node:path";
import http from "node:http";
import { AddressInfo } from "node:net";
import { EventEmitter } from "node:events";
import { promises as fs } from "node:fs";
import { handleApi, isAuthorized, extractMagnet, parseControl, applyControl, createServeHandler } from "./serve";
import type { Runtime } from "./runtime";

const HASH = "abcdef0123456789abcdef0123456789abcdef01";
const MAGNET = `magnet:?xt=urn:btih:${HASH}&dn=Example`;

describe("isAuthorized", () => {
  it("is open when no token is configured", () => {
    expect(isAuthorized(null, undefined)).toBe(true);
  });
  it("accepts a matching bearer token or raw token", () => {
    expect(isAuthorized("s3cret", "Bearer s3cret")).toBe(true);
    expect(isAuthorized("s3cret", "s3cret")).toBe(true);
  });
  it("rejects a missing or wrong token", () => {
    expect(isAuthorized("s3cret", undefined)).toBe(false);
    expect(isAuthorized("s3cret", "Bearer nope")).toBe(false);
  });
});

describe("extractMagnet", () => {
  it("reads a magnet from JSON", () => {
    expect(extractMagnet(`{"magnet":"${MAGNET}"}`)).toBe(MAGNET);
  });
  it("reads an infohash field", () => {
    expect(extractMagnet(`{"infohash":"${HASH}"}`)).toBe(HASH);
  });
  it("accepts a raw magnet body", () => {
    expect(extractMagnet(MAGNET)).toBe(MAGNET);
  });
  it("returns null for empty or unusable bodies", () => {
    expect(extractMagnet("")).toBeNull();
    expect(extractMagnet("{bad json")).toBeNull();
    expect(extractMagnet(`{"other":1}`)).toBeNull();
  });
});

describe("handleApi", () => {
  let dir: string;
  let add: ReturnType<typeof vi.fn>;
  let runtime: Runtime;

  beforeEach(async () => {
    dir = await fs.mkdtemp(path.join(os.tmpdir(), "torhunt-serve-"));
    add = vi.fn();
    runtime = {
      queue: {
        has: () => false,
        add,
        getItems: () => [],
        getSeeds: () => [],
      } as unknown as Runtime["queue"],
      downloadDir: dir,
    };
  });
  afterEach(async () => {
    await fs.rm(dir, { recursive: true, force: true }).catch(() => {});
  });

  it("serves /health without auth", async () => {
    const res = await handleApi(runtime, "tok", "GET", "/health", undefined, "");
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it("401s a protected route without a token", async () => {
    const res = await handleApi(runtime, "tok", "POST", "/add", undefined, `{"magnet":"${MAGNET}"}`);
    expect(res.status).toBe(401);
    expect(add).not.toHaveBeenCalled();
  });

  it("adds a magnet on POST /add", async () => {
    const res = await handleApi(runtime, "tok", "POST", "/add", "Bearer tok", `{"magnet":"${MAGNET}"}`);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ ok: true, outcome: "added" });
    expect(add).toHaveBeenCalledWith({ id: HASH, name: "Example", magnet: MAGNET }, dir);
  });

  it("400s an invalid magnet", async () => {
    const res = await handleApi(runtime, null, "POST", "/add", undefined, `{"magnet":"nope"}`);
    expect(res.status).toBe(400);
    expect(add).not.toHaveBeenCalled();
  });

  it("400s a .torrent file path (no filesystem reach over HTTP)", async () => {
    const res = await handleApi(runtime, null, "POST", "/add", undefined, "C:/secrets/x.torrent");
    expect(res.status).toBe(400);
    expect(add).not.toHaveBeenCalled();
  });

  it("lists downloads on GET /downloads", async () => {
    const res = await handleApi(runtime, null, "GET", "/downloads", undefined, "");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ downloads: [], seeds: [] });
  });

  it("404s an unknown route", async () => {
    const res = await handleApi(runtime, null, "GET", "/nope", undefined, "");
    expect(res.status).toBe(404);
  });

  it("400s POST /control with a malformed body", async () => {
    const res = await handleApi(runtime, null, "POST", "/control", undefined, `{"id":"x"}`);
    expect(res.status).toBe(400);
  });

  it("400s POST /control with an unknown action", async () => {
    const res = await handleApi(runtime, null, "POST", "/control", undefined, `{"id":"${HASH}","action":"boom"}`);
    expect(res.status).toBe(400);
    expect(String(res.body.error)).toContain("unknown action");
  });

  it("404s POST /control for an unknown torrent", async () => {
    const res = await handleApi(runtime, null, "POST", "/control", undefined, `{"id":"${HASH}","action":"pause"}`);
    expect(res.status).toBe(404);
  });

  it("pauses a known download on POST /control", async () => {
    const pause = vi.fn();
    runtime.queue = { has: (id: string) => id === HASH, pause } as unknown as Runtime["queue"];
    const res = await handleApi(runtime, null, "POST", "/control", undefined, `{"id":"${HASH}","action":"pause"}`);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ ok: true, action: "pause" });
    expect(pause).toHaveBeenCalledWith(HASH);
  });

  it("lists history on GET /history", async () => {
    const completedAt = Date.now();
    runtime.queue = {
      getItems: () => [],
      getSeeds: () => [],
      getHistory: () => [{ id: HASH, name: "Done", sizeBytes: 1234, completedAt }],
    } as unknown as Runtime["queue"];
    const res = await handleApi(runtime, null, "GET", "/history", undefined, "");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      history: [{ id: HASH, name: "Done", sizeBytes: 1234, completedAt }],
    });
  });

  it("400s /search without a query", async () => {
    const res = await handleApi(runtime, null, "GET", "/search", undefined, "");
    expect(res.status).toBe(400);
  });

  it("runs an injected search and validates the category", async () => {
    const search = vi.fn().mockResolvedValue({ results: [], failed: [] });
    runtime.queue = { getItems: () => [], getSeeds: () => [] } as unknown as Runtime["queue"];

    const ok = await handleApi(
      runtime, null, "GET", "/search", undefined, "",
      new URLSearchParams("q=ubuntu&cat=Movies"), search,
    );
    expect(ok.status).toBe(200);
    expect(search).toHaveBeenCalledWith("ubuntu", "Movies");

    const bogus = await handleApi(
      runtime, null, "GET", "/search", undefined, "",
      new URLSearchParams("q=ubuntu&cat=Bogus"), search,
    );
    expect(bogus.status).toBe(200);
    expect(search).toHaveBeenLastCalledWith("ubuntu", null);
  });
});

describe("createServeHandler (web remote routes)", () => {
  let server: http.Server;

  function fakeQueue(overrides: Record<string, unknown> = {}): Runtime["queue"] {
    const emitter = new EventEmitter();
    return Object.assign(emitter, {
      getItems: () => [],
      getSeeds: () => [],
      getHistory: () => [],
      has: () => false,
      add: vi.fn(),
      ...overrides,
    }) as unknown as Runtime["queue"];
  }

  function start(
    token: string | null,
    queue: Runtime["queue"],
    searchFn?: Parameters<typeof createServeHandler>[3],
  ): Promise<string> {
    const runtime = { queue, downloadDir: "unused" } as unknown as Runtime;
    server = http.createServer(createServeHandler(runtime, token, () => {}, searchFn));
    return new Promise((resolve) => {
      server.listen(0, "127.0.0.1", () =>
        resolve(`http://127.0.0.1:${(server.address() as AddressInfo).port}`),
      );
    });
  }

  afterEach(async () => {
    if (!server) return;
    server.closeAllConnections?.();
    await new Promise<void>((resolve) => server.close(() => resolve()));
    server = undefined as unknown as http.Server;
  });

  it("serves the web remote shell on /", async () => {
    const base = await start(null, fakeQueue());
    const res = await fetch(`${base}/`);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/html");
    const html = await res.text();
    expect(html).toContain("<!DOCTYPE html");
    expect(html).toContain("torhunt");
  });

  it("serves the shell on /ui as well", async () => {
    const base = await start(null, fakeQueue());
    const res = await fetch(`${base}/ui`);
    expect(res.status).toBe(200);
    expect(await res.text()).toContain("<!DOCTYPE html");
  });

  it("streams snapshots on /events without a token", async () => {
    const base = await start(null, fakeQueue());
    const controller = new AbortController();
    const res = await fetch(`${base}/events`, { signal: controller.signal });
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/event-stream");
    const reader = res.body!.getReader()!;
    const { value } = await reader.read();
    const text = new TextDecoder().decode(value);
    expect(text).toContain("retry:");
    expect(text).toContain('"downloads"');
    controller.abort();
  });

  it("401s /events with a wrong token", async () => {
    const base = await start("tok", fakeQueue());
    const res = await fetch(`${base}/events?token=nope`);
    expect(res.status).toBe(401);
  });

  it("accepts the correct token via query for /events", async () => {
    const base = await start("tok", fakeQueue());
    const controller = new AbortController();
    const res = await fetch(`${base}/events?token=tok`, { signal: controller.signal });
    expect(res.status).toBe(200);
    controller.abort();
  });

  it("rejects cross-site POSTs by origin", async () => {
    const base = await start(null, fakeQueue());
    const res = await fetch(`${base}/add`, {
      method: "POST",
      headers: { Origin: "http://evil.example", "Content-Type": "application/json" },
      body: JSON.stringify({ magnet: MAGNET }),
    });
    expect(res.status).toBe(403);
    expect(((await res.json()) as { error: string }).error).toContain("cross-origin");
  });

  it("lets same-origin POSTs through to the API", async () => {
    const add = vi.fn();
    const base = await start(null, fakeQueue({ add }));
    const res = await fetch(`${base}/add`, {
      method: "POST",
      headers: { Origin: base, "Content-Type": "application/json" },
      body: JSON.stringify({ magnet: MAGNET }),
    });
    expect(res.status).toBe(200);
    expect(add).toHaveBeenCalled();
  });

  it("keeps plain curl POSTs working (no Origin header)", async () => {
    const add = vi.fn();
    const base = await start(null, fakeQueue({ add }));
    const res = await fetch(`${base}/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ magnet: MAGNET }),
    });
    expect(res.status).toBe(200);
    expect(add).toHaveBeenCalled();
  });

  it("exposes history over HTTP for the Completed tab", async () => {
    const completedAt = Date.now();
    const base = await start(
      null,
      fakeQueue({ getHistory: () => [{ id: HASH, name: "Done", sizeBytes: 99, completedAt }] }),
    );
    const res = await fetch(`${base}/history`);
    expect(res.status).toBe(200);
    expect(((await res.json()) as { history: unknown[] }).history).toHaveLength(1);
  });

  it("wires /search end to end with the query string", async () => {
    const searchFn = vi.fn().mockResolvedValue({
      results: [{ infoHash: HASH, name: "Result", sizeBytes: 1, seeders: 2, leechers: 0, source: "yts", magnet: MAGNET }],
      failed: ["EZTV"],
    });
    const base = await start(null, fakeQueue(), searchFn);
    const res = await fetch(`${base}/search?q=film&cat=Movies`);
    expect(res.status).toBe(200);
    expect(searchFn).toHaveBeenCalledWith("film", "Movies");
    const body = (await res.json()) as { results: unknown[]; failed: string[] };
    expect(body.results).toHaveLength(1);
    expect(body.failed).toEqual(["EZTV"]);
  });
});

describe("parseControl", () => {
  it("reads id + action from JSON", () => {
    expect(parseControl(`{"id":"abc","action":"pause"}`)).toEqual({ id: "abc", action: "pause", deleteFiles: false });
  });
  it("reads the deleteFiles flag", () => {
    expect(parseControl(`{"id":"abc","action":"delete","deleteFiles":true}`)).toEqual({
      id: "abc",
      action: "delete",
      deleteFiles: true,
    });
  });
  it("returns null when id or action is missing/blank or the body isn't JSON", () => {
    expect(parseControl(`{"id":"abc"}`)).toBeNull();
    expect(parseControl(`{"action":"pause"}`)).toBeNull();
    expect(parseControl(`{"id":"  ","action":"pause"}`)).toBeNull();
    expect(parseControl(`pause abc`)).toBeNull();
    expect(parseControl("")).toBeNull();
  });
});

describe("applyControl", () => {
  const mkRuntime = (queue: Partial<Record<string, unknown>>): Runtime =>
    ({ queue: queue as unknown as Runtime["queue"], downloadDir: "/tmp" });

  it("resumes a paused download", async () => {
    const resume = vi.fn();
    const rt = mkRuntime({ has: (id: string) => id === "x", resume });
    expect(await applyControl(rt, { id: "x", action: "resume", deleteFiles: false })).toBe("ok");
    expect(resume).toHaveBeenCalledWith("x");
  });

  it("stops seeding but keeps files", async () => {
    const stopSeeding = vi.fn();
    const rt = mkRuntime({ getSeed: (id: string) => (id === "s" ? { id } : undefined), stopSeeding });
    expect(await applyControl(rt, { id: "s", action: "stop-seed", deleteFiles: false })).toBe("ok");
    expect(stopSeeding).toHaveBeenCalledWith("s");
  });

  it("starts seeding from a history entry", async () => {
    const startSeeding = vi.fn();
    const hist = { id: "h", name: "H", magnet: "m", dir: "/d", sizeBytes: 1, completedAt: 0 };
    const rt = mkRuntime({ getHistory: () => [hist], startSeeding });
    expect(await applyControl(rt, { id: "h", action: "start-seed", deleteFiles: false })).toBe("ok");
    expect(startSeeding).toHaveBeenCalledWith(hist);
  });

  it("delete forces deleteFiles:true; remove keeps files", async () => {
    const remove = vi.fn().mockResolvedValue(true);
    const rt = mkRuntime({ remove });
    expect(await applyControl(rt, { id: "z", action: "delete", deleteFiles: false })).toBe("ok");
    expect(remove).toHaveBeenCalledWith("z", { deleteFiles: true });
    remove.mockClear();
    await applyControl(rt, { id: "z", action: "remove", deleteFiles: false });
    expect(remove).toHaveBeenCalledWith("z", { deleteFiles: false });
  });

  it("reports not-found when remove finds nothing and unknown-action otherwise", async () => {
    const rt = mkRuntime({ remove: vi.fn().mockResolvedValue(false) });
    expect(await applyControl(rt, { id: "z", action: "remove", deleteFiles: false })).toBe("not-found");
    expect(await applyControl(mkRuntime({}), { id: "z", action: "nope", deleteFiles: false })).toBe("unknown-action");
  });
});
