import { readFileSync } from "node:fs";
import { inflateSync } from "node:zlib";
import { createHash } from "node:crypto";
const bytes = readFileSync(process.argv[2] || "apps/web/public/avatars/max.png");
const width = bytes.readUInt32BE(16),
  height = bytes.readUInt32BE(20);
if (bytes[24] !== 8 || bytes[25] !== 6 || bytes[28] !== 0)
  throw new Error("Expected non-interlaced 8-bit RGBA PNG.");
const compressed = [];
for (let offset = 8; offset < bytes.length; ) {
  const length = bytes.readUInt32BE(offset),
    type = bytes.toString("ascii", offset + 4, offset + 8);
  if (type === "IDAT") compressed.push(bytes.subarray(offset + 8, offset + 8 + length));
  offset += length + 12;
}
const data = inflateSync(Buffer.concat(compressed)),
  stride = width * 4;
let previous = new Uint8Array(stride),
  transparent = 0,
  opaque = 0;
function paeth(a, b, c) {
  const p = a + b - c,
    pa = Math.abs(p - a),
    pb = Math.abs(p - b),
    pc = Math.abs(p - c);
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
}
for (let y = 0; y < height; y++) {
  const base = y * (stride + 1),
    filter = data[base],
    row = new Uint8Array(stride);
  for (let x = 0; x < stride; x++) {
    const left = x >= 4 ? row[x - 4] : 0,
      above = previous[x],
      upper = x >= 4 ? previous[x - 4] : 0;
    row[x] =
      (data[base + 1 + x] +
        (filter === 0
          ? 0
          : filter === 1
            ? left
            : filter === 2
              ? above
              : filter === 3
                ? Math.floor((left + above) / 2)
                : filter === 4
                  ? paeth(left, above, upper)
                  : NaN)) &
      255;
    if (x % 4 === 3) {
      if (row[x] === 0) transparent++;
      if (row[x] === 255) opaque++;
    }
  }
  previous = row;
}
if (!transparent || !opaque) throw new Error("Expected both transparent and visible pixels.");
console.log(
  JSON.stringify({
    width,
    height,
    transparentPixels: transparent,
    opaquePixels: opaque,
    sha256: createHash("sha256").update(bytes).digest("hex"),
  }),
);
