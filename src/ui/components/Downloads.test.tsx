import { afterEach, describe, expect, it, vi } from "vitest";
import { StoreContext } from "../store";
import { fakeQueue, makeTestStore, renderUI, type RenderedUI } from "../testHarness";
import { Downloads } from "./Downloads";
import type { QueueItem } from "../../download/types";

const NOW_MS = 1_760_000_000_000;

const activeItem = (id: string, name: string): QueueItem => ({
  id,
  name,
  source: "yts",
  magnet: `magnet:?xt=urn:btih:${id}`,
  dir: "C:/dl",
  status: "downloading",
  progress: 40,
  totalBytes: 2e9,
  downloadedBytes: 8e8,
  speed: 5e6,
  peers: 12,
  eta: 240,
  addedAt: NOW_MS,
});

const ACTIVE = [activeItem("q1", "fedora workstation 42 iso")];

let ui: RenderedUI | null = null;
afterEach(() => {
  ui?.unmount();
  ui = null;
});

function mount(items: QueueItem[] = ACTIVE): RenderedUI {
  ui = renderUI(
    <StoreContext.Provider
      value={makeTestStore({ queue: fakeQueue(items, []), section: "downloads" })}
    >
      <Downloads />
    </StoreContext.Provider>,
  );
  return ui;
}

describe("Downloads active view", () => {
  it("renders active downloading items", async () => {
    const u = mount();
    await vi.waitFor(() => expect(u.frame()).toContain("fedora workstation 42 iso"));
    expect(u.frame()).toContain("40%");
  });

  it("shows empty state when no active downloads exist", async () => {
    const u = mount([]);
    await vi.waitFor(() => expect(u.frame()).toContain("Nothing downloading right now"));
  });

  it("renders a waiting item as queued, not failed", async () => {
    const queued: QueueItem = {
      ...activeItem("q2", "kubuntu 25.10 iso"),
      status: "queued",
      progress: 0,
      downloadedBytes: 0,
      speed: 0,
      peers: 0,
      eta: undefined,
    };
    const u = mount([queued]);
    await vi.waitFor(() => expect(u.frame()).toContain("kubuntu 25.10"));
    expect(u.frame()).toContain("queued  0%");
    expect(u.frame()).not.toContain("failed");
  });
});
