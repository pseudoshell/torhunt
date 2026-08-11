import { describe, expect, it } from "vitest";
import { DEFAULT_SPINNER, SPINNERS, getSpinner } from "./spinnerPresets";

describe("spinnerPresets", () => {
  it("defines unique IDs for all spinners", () => {
    const ids = SPINNERS.map((s) => s.id);
    expect(new Set(ids).size).toBe(SPINNERS.length);
  });

  it("contains at least 5 distinct spinner styles", () => {
    expect(SPINNERS.length).toBeGreaterThanOrEqual(5);
  });

  it("every preset has non-empty frames and valid interval", () => {
    for (const s of SPINNERS) {
      expect(s.frames.length).toBeGreaterThan(1);
      expect(s.intervalMs).toBeGreaterThan(0);
      expect(s.name.length).toBeGreaterThan(0);
    }
  });

  it("getSpinner falls back to default on invalid or missing id", () => {
    expect(getSpinner()).toEqual(DEFAULT_SPINNER);
    expect(getSpinner("non-existent")).toEqual(DEFAULT_SPINNER);
    expect(getSpinner("radar").id).toBe("radar");
    expect(getSpinner("baton").id).toBe("baton");
    expect(getSpinner("crt").id).toBe("crt");
    expect(getSpinner("pacman").id).toBe("pacman");
  });
});
