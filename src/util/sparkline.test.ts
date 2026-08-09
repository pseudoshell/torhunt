import { describe, expect, it } from "vitest";
import { sparkline } from "./sparkline";

describe("sparkline", () => {
  it("generates correct characters for ascending values", () => {
    const res = sparkline([0, 10, 20, 30, 40, 50, 60, 70]);
    expect(res).toHaveLength(8);
    expect(res[0]).toBe(" ");
    expect(res[res.length - 1]).toBe("█");
  });

  it("handles empty arrays with padding", () => {
    const res = sparkline([], 6);
    expect(res).toBe("      ");
  });

  it("slices long arrays to targetLength", () => {
    const res = sparkline([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 4);
    expect(res).toHaveLength(4);
  });
});
