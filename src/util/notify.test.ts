import { describe, expect, it } from "vitest";
import { sendNotification } from "./notify";

describe("sendNotification utility", () => {
  it("executes sendNotification without throwing errors or crashing", () => {
    expect(() => {
      sendNotification("torhunt", "Test notification message");
    }).not.toThrow();
  });
});
