import { describe, expect, it } from "vitest";
import { compactMagnet, encodeQrMatrix, renderQrToTerminal } from "./qrcode";

describe("qrcode generator", () => {
  it("compacts magnet links to minimal btih urn", () => {
    const longMagnet =
      "magnet:?xt=urn:btih:da39a3ee5e6b4b0d3255bfef95601890afd80709&dn=Ubuntu&tr=udp://tracker.opentrackr.org:1337/announce";
    const compacted = compactMagnet(longMagnet);
    expect(compacted).toBe("magnet:?xt=urn:btih:3I42H3S6NNFQ2MSVX7XZKYAYSCX5QBYJ");
  });

  it("encodes a small string to a valid square matrix", () => {
    const matrix = encodeQrMatrix("hello world");
    expect(matrix.length).toBeGreaterThan(20);
    expect(matrix[0]?.length).toBe(matrix.length);
  });

  it("encodes a full magnet URI into a scannable matrix and terminal half-block lines", () => {
    const magnet = "magnet:?xt=urn:btih:0123456789abcdef0123456789abcdef01234567&dn=Ubuntu+24.04";
    const matrix = encodeQrMatrix(magnet);
    expect(matrix.length).toBeGreaterThan(30);

    const lines = renderQrToTerminal(matrix);
    expect(lines.length).toBeGreaterThan(12);
    expect(lines[0]?.length).toBeGreaterThan(25);
    expect(lines.some((l) => l.includes("█") || l.includes("▀") || l.includes("▄"))).toBe(true);
  });
});
