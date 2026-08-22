import { describe, it, expect } from "vitest";
import { EventEmitter } from "node:events";
import {
  loadUiHtml,
  openEventStream,
  originAllowed,
  type EventStreamWriter,
} from "./webui";

describe("loadUiHtml", () => {
  it("finds the web remote shell in the source tree", () => {
    const html = loadUiHtml();
    expect(html).not.toBeNull();
    expect(html).toContain("<!DOCTYPE html");
    expect(html).toContain("torhunt");
  });

  it("caches the shell after the first read", () => {
    expect(loadUiHtml()).toBe(loadUiHtml());
  });
});

describe("originAllowed", () => {
  it("allows requests without an Origin (curl, scripts, health checks)", () => {
    expect(originAllowed(undefined, "localhost:9161")).toBe(true);
  });

  it("allows same-origin browser posts regardless of case or trailing path", () => {
    expect(originAllowed("http://localhost:9161", "localhost:9161")).toBe(true);
    expect(originAllowed("http://LOCALHOST:9161/add", "localhost:9161")).toBe(true);
  });

  it("rejects cross-site origins", () => {
    expect(originAllowed("http://evil.example", "localhost:9161")).toBe(false);
    expect(originAllowed("http://localhost:9999", "localhost:9161")).toBe(false);
  });

  it("rejects malformed origins and requests with no host", () => {
    expect(originAllowed("not a url", "localhost:9161")).toBe(false);
    expect(originAllowed("http://localhost:9161", undefined)).toBe(false);
  });
});

describe("openEventStream", () => {
  function fakeRes(): {
    head: { status: number; headers: Record<string, string> } | null;
    writes: string[];
    on(event: string, listener: () => void): unknown;
    writeHead(status: number, headers: Record<string, string>): void;
    write(chunk: string): void;
    emitClose(): void;
  } {
    const listeners = new Map<string, () => void>();
    return {
      head: null,
      writes: [],
      on(event, listener) {
        listeners.set(event, listener);
        return this;
      },
      writeHead(status, headers) {
        this.head = { status, headers };
      },
      write(chunk) {
        this.writes.push(chunk);
      },
      emitClose() {
        listeners.get("close")?.();
      },
    };
  }

  it("writes sse headers, an initial snapshot, and pushes on queue updates", () => {
    const res = fakeRes();
    const queue = new EventEmitter();
    openEventStream(res as unknown as EventStreamWriter, queue, () => ({ n: 1 }));
    expect(res.head?.status).toBe(200);
    expect(res.head?.headers["Content-Type"]).toContain("text/event-stream");
    expect(res.head?.headers["Cache-Control"]).toBe("no-store");
    expect(res.writes[0]).toContain("retry:");
    expect(res.writes[1]).toBe('data: {"n":1}\n\n');
    queue.emit("update");
    expect(res.writes[2]).toBe('data: {"n":1}\n\n');
  });

  it("detaches from the queue when the client disconnects", () => {
    const res = fakeRes();
    const queue = new EventEmitter();
    openEventStream(res as unknown as EventStreamWriter, queue, () => ({}));
    res.emitClose();
    const before = res.writes.length;
    queue.emit("update");
    expect(res.writes.length).toBe(before);
  });

  it("survives a snapshot function that throws", () => {
    const res = fakeRes();
    const queue = new EventEmitter();
    openEventStream(res as unknown as EventStreamWriter, queue, () => {
      throw new Error("boom");
    });
    queue.emit("update");
    expect(res.writes.every((w) => !w.startsWith("data: {"))).toBe(true);
  });
});
