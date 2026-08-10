import { describe, expect, it } from "vitest";
import { StoreContext } from "../store";
import { fakeQueue, makeTestStore, renderUI } from "../testHarness";
import { CompletedView } from "./CompletedView";
import type { HistoryItem } from "../../download/history";

const now = Date.now();
const todayItem: HistoryItem = {
  id: "h1",
  name: "Ubuntu 24.04 Desktop ISO",
  source: "eztv",
  sizeBytes: 2.5e9,
  magnet: "magnet:?xt=urn:btih:h1",
  dir: "C:/Downloads",
  completedAt: now,
};

const olderItem: HistoryItem = {
  id: "h2",
  name: "Debian 12 Netinst ISO",
  source: "yts",
  sizeBytes: 1.2e9,
  magnet: "magnet:?xt=urn:btih:h2",
  dir: "C:/Downloads",
  completedAt: now - 3 * 86400 * 1000,
};

describe("CompletedView", () => {
  it("renders list of completed downloads grouped by date", () => {
    const queue = fakeQueue([], [todayItem, olderItem]);
    const store = makeTestStore({ queue, section: "completed" });
    const ui = renderUI(
      <StoreContext.Provider value={store}>
        <CompletedView />
      </StoreContext.Provider>,
    );

    expect(ui.frame()).toContain("Today");
    expect(ui.frame()).toContain("Ubuntu 24.04 Desktop ISO");
    expect(ui.frame()).toContain("Older");
    expect(ui.frame()).toContain("Debian 12 Netinst ISO");
    ui.unmount();
  });
});
