import { describe, it, expect } from "vitest";
import { managedInstallOwner } from "./run";

describe("managedInstallOwner", () => {
  it("names nix for a store path, whatever the separators", () => {
    expect(managedInstallOwner("/nix/store/abc123-torhunt-1.4.2")).toBe("nix");
    expect(managedInstallOwner("\\nix\\store\\abc123-torhunt-1.4.2")).toBe("nix");
  });

  it("names the package manager when the root is not writable", () => {
    const denied = (): void => {
      throw new Error("EACCES");
    };
    expect(managedInstallOwner("/usr/lib/node_modules/torhunt", denied)).toBe("your package manager");
  });

  it("returns null for a writable root we own", () => {
    expect(managedInstallOwner("/home/u/dev/torhunt", () => {})).toBeNull();
  });
});
