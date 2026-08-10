import { describe, expect, it } from "vitest";
import { StoreContext } from "../store";
import { fakeQueue, makeTestStore, renderUI } from "../testHarness";
import { SettingsView } from "./SettingsView";

describe("SettingsView", () => {
  it("renders download folder, theme, and spinner settings", () => {
    const store = makeTestStore({
      queue: fakeQueue([], []),
      section: "settings",
    });
    const ui = renderUI(
      <StoreContext.Provider value={store}>
        <SettingsView />
      </StoreContext.Provider>,
    );

    expect(ui.frame()).toContain("Download Folder:");
    expect(ui.frame()).toContain("Color Theme:");
    expect(ui.frame()).toContain("Spinner Style:");
    ui.unmount();
  });
});
