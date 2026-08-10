import { describe, expect, it } from "vitest";
import { StoreContext } from "../store";
import { fakeQueue, makeTestStore, renderUI } from "../testHarness";
import { CompletedView } from "./CompletedView";
import type { HistoryItem } from "../../download/history";

const historyItem: HistoryItem = {
  id: "h1",
  name: "Ubuntu 24.04 Desktop ISO",
  source: "eztv",
  sizeBytes: 2.5e9,
  magnet: "magnet:?xt=urn:btih:h1",
  dir: "C:/Downloads",
  completedAt: Date.now(),
};

describe("CompletedView", () => {
  it("renders list of completed downloads", () => {
    const queue = fakeQueue([], [historyItem]);
    const store = makeTestStore({ queue, section: "completed" });
    const ui = renderUI(
      <StoreContext.Provider value={store}>
        <CompletedView />
      </StoreContext.Provider>,
    );

    expect(ui.frame()).toContain("Ubuntu 24.04 Desktop ISO");
    expect(ui.frame()).toContain("2.33 GB");
    ui.unmount();
  });
});
