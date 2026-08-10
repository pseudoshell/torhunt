import { describe, expect, it } from "vitest";
import {
  acquireKeepAwake,
  isKeepAwakeActive,
  releaseKeepAwake,
} from "./power";

describe("power management utility", () => {
  it("acquires and releases keep-awake process lock safely", () => {
    expect(isKeepAwakeActive()).toBe(false);
    acquireKeepAwake();
    expect(isKeepAwakeActive()).toBe(true);
    // Double acquire should be a no-op
    acquireKeepAwake();
    expect(isKeepAwakeActive()).toBe(true);
    releaseKeepAwake();
    expect(isKeepAwakeActive()).toBe(false);
    // Double release should be a no-op
    releaseKeepAwake();
    expect(isKeepAwakeActive()).toBe(false);
  });
});
