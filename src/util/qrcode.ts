/**
 * Zero-dependency QR Code (Model 2, Byte Mode) Matrix Generator & Terminal Renderer.
 * Uses unicode half-block characters (▀, ▄, █, ' ') where each character cell
 * represents 1 module horizontally and 2 modules vertically, matching terminal
 * 1:2 character aspect ratio for a true 1:1 square QR matrix.
 */

const EXP_TABLE: number[] = new Array(512).fill(0);
const LOG_TABLE: number[] = new Array(256).fill(0);

(() => {
  let val = 1;
  for (let i = 0; i < 255; i++) {
    EXP_TABLE[i] = val;
    EXP_TABLE[i + 255] = val;
    LOG_TABLE[val] = i;
    val <<= 1;
    if (val & 256) val ^= 285;
  }
})();

function gfMul(x: number, y: number): number {
  if (x === 0 || y === 0) return 0;
  return EXP_TABLE[LOG_TABLE[x]! + LOG_TABLE[y]!]!;
}

function gfPolyMul(p1: number[], p2: number[]): number[] {
  const result: number[] = new Array(p1.length + p2.length - 1).fill(0);
  for (let i = 0; i < p1.length; i++) {
    for (let j = 0; j < p2.length; j++) {
      result[i + j]! ^= gfMul(p1[i]!, p2[j]!);
    }
  }
  return result;
}

function getGeneratorPoly(degree: number): number[] {
  let poly: number[] = [1];
  for (let i = 0; i < degree; i++) {
    poly = gfPolyMul(poly, [1, EXP_TABLE[i]!]);
  }
  return poly;
}

function calculateEcc(data: number[], eccCount: number): number[] {
  const gen = getGeneratorPoly(eccCount);
  const remainder: number[] = new Array(eccCount).fill(0);
  for (let i = 0; i < data.length; i++) {
    const factor = data[i]! ^ remainder[0]!;
    for (let j = 0; j < eccCount - 1; j++) {
      remainder[j] = remainder[j + 1]! ^ gfMul(gen[j + 1]!, factor);
    }
    remainder[eccCount - 1] = gfMul(gen[eccCount]!, factor);
  }
  return remainder;
}

// Version table: [version, totalBytes, eccBytesPerBlock, numBlocksGroup1, dataBytesPerBlockG1, numBlocksGroup2, dataBytesPerBlockG2]
const VERSION_TABLE_L: [number, number, number, number, number, number, number][] = [
  [1, 26, 7, 1, 19, 0, 0],
  [2, 44, 10, 1, 34, 0, 0],
  [3, 70, 15, 1, 55, 0, 0],
  [4, 100, 20, 1, 80, 0, 0],
  [5, 134, 26, 1, 108, 0, 0],
  [6, 172, 18, 2, 68, 0, 0],
  [7, 196, 20, 2, 78, 0, 0],
  [8, 242, 24, 2, 97, 0, 0],
  [9, 292, 30, 2, 116, 0, 0],
  [10, 346, 18, 2, 68, 2, 69],
  [11, 404, 20, 4, 81, 0, 0],
  [12, 466, 24, 2, 92, 2, 93],
  [13, 532, 26, 4, 107, 0, 0],
  [14, 581, 30, 3, 115, 1, 116],
];

const ALIGNMENT_PATTERN_POSITIONS = [
  [], // V1
  [6, 18], // V2
  [6, 22], // V3
  [6, 26], // V4
  [6, 30], // V5
  [6, 34], // V6
  [6, 22, 38], // V7
  [6, 24, 42], // V8
  [6, 26, 46], // V9
  [6, 28, 50], // V10
  [6, 30, 54], // V11
  [6, 32, 58], // V12
  [6, 34, 62], // V13
  [6, 26, 46, 66], // V14
];

function hexToBase32(hex: string): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = 0;
  let value = 0;
  let output = "";
  for (let i = 0; i < hex.length; i += 2) {
    value = (value << 8) | parseInt(hex.substring(i, i + 2), 16);
    bits += 8;
    while (bits >= 5) {
      output += alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += alphabet[(value << (5 - bits)) & 31];
  }
  return output;
}

/**
 * Strips trackers and formats the magnet URI using standard 32-char Base32 BTIH.
 * 52 characters total fits cleanly into a Version 3 QR code (29x29 modules).
 */
export function compactMagnet(magnet: string): string {
  const hashMatch = magnet.match(/urn:btih:([a-fA-F0-9]{40}|[a-zA-Z2-7]{32})/i);
  if (!hashMatch) return magnet.trim();
  const rawHash = hashMatch[1]!;
  const b32 = rawHash.length === 40 ? hexToBase32(rawHash) : rawHash.toUpperCase();
  // Fully uppercase so the QR encoder can use alphanumeric mode (5.5 bits/char
  // instead of 8), which drops the matrix from Version 3 (29×29) to Version 2
  // (25×25).  Magnet URI scheme/params and Base32 hashes are case-insensitive.
  return `MAGNET:?XT=URN:BTIH:${b32}`;
}

export function encodeQrMatrix(text: string): boolean[][] {
  // QR Alphanumeric charset: 0-9, A-Z, SP, $, %, *, +, -, ., /, :, ?
  const ALNUM = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:?";
  const alnumIndices: number[] = [];
  let isAlphanumeric = true;
  for (let i = 0; i < text.length; i++) {
    const idx = ALNUM.indexOf(text[i]!);
    if (idx === -1) {
      isAlphanumeric = false;
      break;
    }
    alnumIndices.push(idx);
  }

  const utf8 = Buffer.from(text, "utf-8");
  const dataLen = isAlphanumeric ? text.length : utf8.length;

  // Compute data bits needed for the chosen mode
  const dataBitsForVersion = (version: number): number => {
    if (isAlphanumeric) {
      const ccBits = version < 10 ? 9 : 13;
      const pairs = Math.floor(dataLen / 2);
      const odd = dataLen % 2;
      return 4 + ccBits + pairs * 11 + odd * 6;
    }
    const ccBits = version < 10 ? 8 : 16;
    return 4 + ccBits + dataLen * 8;
  };

  let chosenVer = -1;
  let verConfig: [number, number, number, number, number, number, number] | null = null;
  for (const row of VERSION_TABLE_L) {
    const version = row[0];
    const capacityBytes = row[3] * row[4] + row[5] * row[6];
    const totalDataBits = dataBitsForVersion(version);
    if (Math.ceil(totalDataBits / 8) <= capacityBytes) {
      chosenVer = version;
      verConfig = row;
      break;
    }
  }

  if (chosenVer === -1 || !verConfig) {
    chosenVer = 14;
    verConfig = VERSION_TABLE_L[VERSION_TABLE_L.length - 1]!;
  }

  const [version, totalCodewords, eccPerBlock, b1, d1, b2, d2] = verConfig;
  const dataCapacity = b1 * d1 + b2 * d2;

  const bits: number[] = [];
  const appendBits = (val: number, len: number): void => {
    for (let i = len - 1; i >= 0; i--) bits.push((val >>> i) & 1);
  };

  if (isAlphanumeric) {
    // Alphanumeric mode: indicator 0010, pairs encoded in 11 bits, odd in 6
    appendBits(0b0010, 4);
    const charCountBits = version < 10 ? 9 : 13;
    appendBits(dataLen, charCountBits);
    for (let i = 0; i < dataLen - 1; i += 2) {
      appendBits(alnumIndices[i]! * 45 + alnumIndices[i + 1]!, 11);
    }
    if (dataLen % 2 === 1) {
      appendBits(alnumIndices[dataLen - 1]!, 6);
    }
  } else {
    // Byte mode: indicator 0100, each byte in 8 bits
    appendBits(0b0100, 4);
    const charCountBits = version < 10 ? 8 : 16;
    appendBits(utf8.length, charCountBits);
    for (let i = 0; i < utf8.length; i++) {
      appendBits(utf8[i]!, 8);
    }
  }

  const maxDataBits = dataCapacity * 8;
  const termLen = Math.min(4, maxDataBits - bits.length);
  appendBits(0, termLen);

  while (bits.length % 8 !== 0) bits.push(0);

  const padBytes = [0xec, 0x11];
  let padIdx = 0;
  while (bits.length < maxDataBits) {
    appendBits(padBytes[padIdx % 2]!, 8);
    padIdx++;
  }

  const dataBytes: number[] = new Array(dataCapacity).fill(0);
  for (let i = 0; i < dataCapacity; i++) {
    let byteVal = 0;
    for (let b = 0; b < 8; b++) {
      byteVal = (byteVal << 1) | bits[i * 8 + b]!;
    }
    dataBytes[i] = byteVal;
  }

  const dataBlocks: number[][] = [];
  const eccBlocks: number[][] = [];
  let byteOffset = 0;

  for (let i = 0; i < b1; i++) {
    const block = dataBytes.slice(byteOffset, byteOffset + d1);
    dataBlocks.push(block);
    eccBlocks.push(calculateEcc(block, eccPerBlock));
    byteOffset += d1;
  }
  for (let i = 0; i < b2; i++) {
    const block = dataBytes.slice(byteOffset, byteOffset + d2);
    dataBlocks.push(block);
    eccBlocks.push(calculateEcc(block, eccPerBlock));
    byteOffset += d2;
  }

  const finalCodewords: number[] = new Array(totalCodewords).fill(0);
  let finalIdx = 0;
  const maxDataLen = Math.max(d1, d2);
  for (let i = 0; i < maxDataLen; i++) {
    for (const b of dataBlocks) {
      if (i < b.length) finalCodewords[finalIdx++] = b[i]!;
    }
  }
  for (let i = 0; i < eccPerBlock; i++) {
    for (const b of eccBlocks) {
      finalCodewords[finalIdx++] = b[i]!;
    }
  }

  const size = 17 + version * 4;
  const matrix: (boolean | null)[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => null),
  );
  const isFunction: boolean[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => false),
  );

  const setModule = (r: number, c: number, val: boolean, isFunc = true): void => {
    if (r >= 0 && r < size && c >= 0 && c < size) {
      matrix[r]![c] = val;
      if (isFunc) isFunction[r]![c] = true;
    }
  };

  const drawFinder = (r: number, c: number): void => {
    for (let dr = -1; dr <= 7; dr++) {
      for (let dc = -1; dc <= 7; dc++) {
        const row = r + dr;
        const col = c + dc;
        if (row >= 0 && row < size && col >= 0 && col < size) {
          if (dr === -1 || dr === 7 || dc === -1 || dc === 7) {
            setModule(row, col, false);
          } else if (dr === 0 || dr === 6 || dc === 0 || dc === 6) {
            setModule(row, col, true);
          } else if (dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4) {
            setModule(row, col, true);
          } else {
            setModule(row, col, false);
          }
        }
      }
    }
  };

  drawFinder(0, 0);
  drawFinder(0, size - 7);
  drawFinder(size - 7, 0);

  if (version >= 2) {
    const coords = ALIGNMENT_PATTERN_POSITIONS[version - 1] ?? [];
    for (const r of coords) {
      for (const c of coords) {
        if (isFunction[r]![c]) continue;
        for (let dr = -2; dr <= 2; dr++) {
          for (let dc = -2; dc <= 2; dc++) {
            const row = r + dr;
            const col = c + dc;
            if (dr === -2 || dr === 2 || dc === -2 || dc === 2 || (dr === 0 && dc === 0)) {
              setModule(row, col, true);
            } else {
              setModule(row, col, false);
            }
          }
        }
      }
    }
  }

  for (let i = 8; i < size - 8; i++) {
    if (matrix[6]![i] === null) setModule(6, i, i % 2 === 0);
    if (matrix[i]![6] === null) setModule(i, 6, i % 2 === 0);
  }

  setModule(4 * version + 9, 8, true);

  for (let i = 0; i <= 8; i++) {
    if (i !== 6) {
      isFunction[8]![i] = true;
      isFunction[i]![8] = true;
    }
  }
  for (let i = 0; i < 8; i++) {
    isFunction[8]![size - 1 - i] = true;
    isFunction[size - 1 - i]![8] = true;
  }

  let bitIndex = 0;
  const totalBits = finalCodewords.length * 8;
  let right = size - 1;
  let upwards = true;

  while (right > 0) {
    if (right === 6) right--;
    const colList = [right, right - 1];
    const rowRange = upwards
      ? Array.from({ length: size }, (_, i) => size - 1 - i)
      : Array.from({ length: size }, (_, i) => i);

    for (const row of rowRange) {
      for (const col of colList) {
        if (!isFunction[row]![col]) {
          let bit = false;
          if (bitIndex < totalBits) {
            const bytePos = bitIndex >>> 3;
            const bitOffset = 7 - (bitIndex & 7);
            bit = ((finalCodewords[bytePos]! >>> bitOffset) & 1) === 1;
            bitIndex++;
          }
          const mask = (row + col) % 2 === 0;
          matrix[row]![col] = bit !== mask;
        }
      }
    }
    right -= 2;
    upwards = !upwards;
  }

  const FORMAT_BITS = [1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 0, 0, 1, 0, 0];

  for (let i = 0; i < 6; i++) matrix[8]![i] = FORMAT_BITS[i] === 1;
  matrix[8]![7] = FORMAT_BITS[6] === 1;
  matrix[8]![8] = FORMAT_BITS[7] === 1;
  matrix[7]![8] = FORMAT_BITS[8] === 1;
  for (let i = 9; i < 15; i++) matrix[14 - i]![8] = FORMAT_BITS[i] === 1;

  for (let i = 0; i < 8; i++) matrix[size - 1 - i]![8] = FORMAT_BITS[i] === 1;
  for (let i = 8; i < 15; i++) matrix[8]![size - 15 + i] = FORMAT_BITS[i] === 1;

  return matrix.map((row) => row.map((c) => c ?? false));
}

/**
 * Render QR matrix to terminal lines using unicode half-block characters (▀, ▄, █, ' ').
 * 1 horizontal module = 1 monospace char width (8px).
 * 2 vertical modules = 1 monospace line height (16px / 2 = 8px).
 * This produces an exact 1:1 square geometry in standard terminal fonts.
 */
export function renderQrToTerminal(matrix: boolean[][]): string[] {
  const quietZone = 0;
  const size = matrix.length;
  const paddedSize = size + quietZone * 2;

  const padded: boolean[][] = Array.from({ length: paddedSize }, (_, r) =>
    Array.from({ length: paddedSize }, (_, c) => {
      const mr = r - quietZone;
      const mc = c - quietZone;
      return mr >= 0 && mr < size && mc >= 0 && mc < size ? (matrix[mr]?.[mc] ?? false) : false;
    }),
  );

  const lines: string[] = [];
  for (let r = 0; r < paddedSize; r += 2) {
    let rowStr = "";
    const topRow = padded[r]!;
    const botRow = r + 1 < paddedSize ? padded[r + 1]! : null;

    for (let c = 0; c < paddedSize; c++) {
      const top = topRow[c];
      const bot = botRow ? botRow[c] : false;

      if (top && bot) {
        rowStr += "█";
      } else if (top && !bot) {
        rowStr += "▀";
      } else if (!top && bot) {
        rowStr += "▄";
      } else {
        rowStr += " ";
      }
    }
    lines.push(rowStr);
  }

  return lines;
}

