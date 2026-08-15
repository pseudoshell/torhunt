import { describe, expect, it } from "vitest";
import { compactMagnet, encodeQrMatrix, renderQrToTerminal } from "./qrcode";

describe("qrcode generator", () => {
  it("compacts magnet links to minimal uppercase btih urn", () => {
    const longMagnet =
      "magnet:?xt=urn:btih:da39a3ee5e6b4b0d3255bfef95601890afd80709&dn=Ubuntu&tr=udp://tracker.opentrackr.org:1337/announce";
    const compacted = compactMagnet(longMagnet);
    expect(compacted).toBe("MAGNET:?XT=URN:BTIH:3I42H3S6NNFQ2MSVX7XZKYAYSCX5QBYJ");
  });

  it("encodes a small string to a valid square matrix", () => {
    const matrix = encodeQrMatrix("hello world");
    expect(matrix.length).toBeGreaterThan(20);
    expect(matrix[0]?.length).toBe(matrix.length);
  });

  it("uses alphanumeric mode for uppercase input producing a valid compact matrix", () => {
    const magnet = compactMagnet(
      "magnet:?xt=urn:btih:da39a3ee5e6b4b0d3255bfef95601890afd80709",
    );
    const matrix = encodeQrMatrix(magnet);
    // 52 uppercase chars fit in Version 3 (29x29)
    expect(matrix.length).toBe(29);
    expect(matrix[0]?.length).toBe(29);

    // Short alphanumeric string fits in Version 1 (21x21)
    const shortMatrix = encodeQrMatrix("TEST1234");
    expect(shortMatrix.length).toBe(21);
  });

  it("encodes a full magnet URI into a scannable matrix and terminal half-block lines", () => {
    const magnet = "magnet:?xt=urn:btih:0123456789abcdef0123456789abcdef01234567&dn=Ubuntu+24.04";
    const matrix = encodeQrMatrix(magnet);
    expect(matrix.length).toBeGreaterThan(20);

    const lines = renderQrToTerminal(matrix);
    expect(lines.length).toBeGreaterThan(10);
    expect(lines[0]?.length).toBeGreaterThan(20);
    expect(lines.some((l) => l.includes("█") || l.includes("▀") || l.includes("▄"))).toBe(true);
  });
});
