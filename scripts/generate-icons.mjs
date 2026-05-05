/**
 * Generates PWA PNG icons using only Node.js built-ins (zlib, fs, Buffer).
 * Run: node scripts/generate-icons.mjs
 */
import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dir = dirname(fileURLToPath(import.meta.url));
const PUBLIC = resolve(__dir, '../public');

// ── PNG encoder ────────────────────────────────────────────────────────────

function crc32(buf) {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    t[i] = c >>> 0;
  }
  let crc = 0xFFFFFFFF;
  for (const b of buf) crc = t[(crc ^ b) & 0xFF] ^ (crc >>> 8);
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function pngChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf  = Buffer.allocUnsafe(4);
  lenBuf.writeUInt32BE(data.length);
  const crcBuf = Buffer.allocUnsafe(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function encodePNG(rgba, width, height) {
  const stride = width * 4;
  const rows   = Buffer.allocUnsafe(height * (stride + 1));
  for (let y = 0; y < height; y++) {
    rows[y * (stride + 1)] = 0; // None filter
    rgba.copy(rows, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  const ihdr = Buffer.allocUnsafe(13);
  ihdr.writeUInt32BE(width,  0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', deflateSync(rows, { level: 6 })),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

// ── Scanline polygon fill ──────────────────────────────────────────────────

function fillPolygon(rgba, size, pts, r, g, b) {
  let yMin = Infinity, yMax = -Infinity;
  for (const [, y] of pts) { if (y < yMin) yMin = y; if (y > yMax) yMax = y; }
  const n = pts.length;
  for (let y = Math.ceil(yMin); y <= Math.floor(yMax); y++) {
    if (y < 0 || y >= size) continue;
    const xs = [];
    for (let i = 0; i < n; i++) {
      const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % n];
      if ((y1 <= y && y2 > y) || (y2 <= y && y1 > y))
        xs.push(x1 + (y - y1) / (y2 - y1) * (x2 - x1));
    }
    xs.sort((a, b) => a - b);
    for (let j = 0; j + 1 < xs.length; j += 2) {
      for (let x = Math.round(xs[j]); x <= Math.round(xs[j + 1]); x++) {
        if (x < 0 || x >= size) continue;
        const i = (y * size + x) * 4;
        rgba[i] = r; rgba[i + 1] = g; rgba[i + 2] = b; rgba[i + 3] = 255;
      }
    }
  }
}

// ── Icon drawing ───────────────────────────────────────────────────────────

function drawIcon(size) {
  const rgba = Buffer.alloc(size * size * 4);
  // Background: #6366f1
  for (let i = 0; i < size * size; i++) {
    rgba[i * 4] = 0x63; rgba[i * 4 + 1] = 0x66; rgba[i * 4 + 2] = 0xF1; rgba[i * 4 + 3] = 0xFF;
  }

  const s = size;
  // Lightning bolt: two white parallelogram stripes with a visible gap (notch) between them.
  // Coords are fractions of icon size.

  // Upper stripe: top=[55%,3%]→[75%,3%], bottom=[32%,50%]→[52%,50%]
  fillPolygon(rgba, s, [
    [s * 0.55, s * 0.03],
    [s * 0.75, s * 0.03],
    [s * 0.52, s * 0.50],
    [s * 0.32, s * 0.50],
  ], 255, 255, 255);

  // Lower stripe: top=[48%,55%]→[68%,55%], bottom=[25%,97%]→[45%,97%]
  fillPolygon(rgba, s, [
    [s * 0.68, s * 0.55],
    [s * 0.45, s * 0.97],
    [s * 0.25, s * 0.97],
    [s * 0.48, s * 0.55],
  ], 255, 255, 255);

  return rgba;
}

// ── Generate files ─────────────────────────────────────────────────────────

const targets = [
  { size: 192, name: 'pwa-192x192.png' },
  { size: 512, name: 'pwa-512x512.png' },
  { size: 180, name: 'apple-touch-icon.png' },
];

for (const { size, name } of targets) {
  const rgba = drawIcon(size);
  writeFileSync(resolve(PUBLIC, name), encodePNG(rgba, size, size));
  console.log(`✓ ${name} (${size}×${size})`);
}
