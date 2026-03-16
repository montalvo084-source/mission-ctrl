/**
 * Mission Ctrl — Icon Generator
 * Draws a HUD-style targeting reticle on a dark background.
 * Outputs: public/apple-touch-icon.png (180×180)
 *          public/icon-192.png         (192×192)
 *          public/icon-512.png         (512×512)
 *          public/favicon.png          (32×32)
 */

import { PNG } from 'pngjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, '..', 'public');

// ─── Colours ─────────────────────────────────────────────────
const BG      = [10,  10,  15,  255];   // #0a0a0f
const BG2     = [18,  18,  26,  255];   // #12121a
const ACCENT  = [0,   255, 136, 255];   // #00ff88
const PURPLE  = [123, 97,  255, 255];   // #7b61ff
const GOLD    = [255, 215, 0,   255];   // #ffd700
const BORDER  = [30,  30,  46,  255];   // #1e1e2e
const TRANSP  = [0,   0,   0,   0  ];

// ─── Helpers ─────────────────────────────────────────────────
function setPixel(png, x, y, color) {
  if (x < 0 || x >= png.width || y < 0 || y >= png.height) return;
  const idx = (png.width * y + x) * 4;
  png.data[idx]     = color[0];
  png.data[idx + 1] = color[1];
  png.data[idx + 2] = color[2];
  png.data[idx + 3] = color[3];
}

function blendPixel(png, x, y, color, alpha) {
  if (x < 0 || x >= png.width || y < 0 || y >= png.height) return;
  const idx = (png.width * y + x) * 4;
  const bg = [png.data[idx], png.data[idx+1], png.data[idx+2], png.data[idx+3]];
  const a = alpha / 255;
  png.data[idx]     = Math.round(bg[0] * (1 - a) + color[0] * a);
  png.data[idx + 1] = Math.round(bg[1] * (1 - a) + color[1] * a);
  png.data[idx + 2] = Math.round(bg[2] * (1 - a) + color[2] * a);
  png.data[idx + 3] = Math.min(255, bg[3] + alpha);
}

// Anti-aliased circle outline
function drawCircle(png, cx, cy, r, color, thickness = 1) {
  for (let angle = 0; angle < Math.PI * 2; angle += 0.003) {
    for (let t = 0; t < thickness; t += 0.5) {
      const rr = r - t;
      const x = Math.round(cx + Math.cos(angle) * rr);
      const y = Math.round(cy + Math.sin(angle) * rr);
      setPixel(png, x, y, color);
    }
  }
}

// Filled circle
function fillCircle(png, cx, cy, r, color) {
  for (let y = cy - r; y <= cy + r; y++) {
    for (let x = cx - r; x <= cx + r; x++) {
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
      if (dist <= r) setPixel(png, x, y, color);
    }
  }
}

// Rounded rectangle fill
function fillRoundedRect(png, x, y, w, h, r, color) {
  for (let py = y; py < y + h; py++) {
    for (let px = x; px < x + w; px++) {
      const dx = Math.max(0, Math.max(x + r - px, px - (x + w - r - 1)));
      const dy = Math.max(0, Math.max(y + r - py, py - (y + h - r - 1)));
      if (dx * dx + dy * dy <= r * r) setPixel(png, px, py, color);
    }
  }
}

// Horizontal line
function drawHLine(png, x1, x2, y, color, thickness = 1) {
  for (let x = x1; x <= x2; x++) {
    for (let t = 0; t < thickness; t++) {
      setPixel(png, x, y + t, color);
    }
  }
}

// Vertical line
function drawVLine(png, x, y1, y2, color, thickness = 1) {
  for (let y = y1; y <= y2; y++) {
    for (let t = 0; t < thickness; t++) {
      setPixel(png, x + t, y, color);
    }
  }
}

// Glow effect around a circle
function drawGlow(png, cx, cy, r, color, glowRadius = 6) {
  for (let gy = cy - r - glowRadius; gy <= cy + r + glowRadius; gy++) {
    for (let gx = cx - r - glowRadius; gx <= cx + r + glowRadius; gx++) {
      const dist = Math.sqrt((gx - cx) ** 2 + (gy - cy) ** 2);
      const ringDist = Math.abs(dist - r);
      if (ringDist < glowRadius) {
        const alpha = Math.floor((1 - ringDist / glowRadius) * 80);
        blendPixel(png, gx, gy, color, alpha);
      }
    }
  }
}

// ─── Icon Drawing ─────────────────────────────────────────────
function drawIcon(size) {
  const png = new PNG({ width: size, height: size, filterType: -1 });
  const cx = size / 2;
  const cy = size / 2;

  // Scale factor relative to 180px design
  const s = size / 180;

  // Fill background
  for (let i = 0; i < png.data.length; i += 4) {
    png.data[i]     = BG[0];
    png.data[i + 1] = BG[1];
    png.data[i + 2] = BG[2];
    png.data[i + 3] = BG[3];
  }

  // Rounded rect background card (slightly lighter)
  const pad = Math.round(6 * s);
  fillRoundedRect(png, pad, pad, size - pad * 2, size - pad * 2, Math.round(28 * s), BG2);

  // ── Outer ring (border colour) ───────────────────────────
  const outerR = Math.round(70 * s);
  drawGlow(png, cx, cy, outerR, ACCENT, Math.round(8 * s));
  drawCircle(png, cx, cy, outerR, BORDER, Math.round(1.5 * s));

  // ── Middle ring (accent) ─────────────────────────────────
  const midR = Math.round(52 * s);
  drawGlow(png, cx, cy, midR, ACCENT, Math.round(6 * s));
  drawCircle(png, cx, cy, midR, ACCENT, Math.round(2 * s));

  // ── Inner ring (purple) ──────────────────────────────────
  const innerR = Math.round(28 * s);
  drawGlow(png, cx, cy, innerR, PURPLE, Math.round(5 * s));
  drawCircle(png, cx, cy, innerR, PURPLE, Math.round(1.5 * s));

  // ── Crosshair lines (gap around centre) ─────────────────
  const lineThick = Math.max(1, Math.round(2 * s));
  const gapR = Math.round(12 * s);   // gap around centre
  const lineEnd = Math.round(62 * s);

  // horizontal
  drawHLine(png, Math.round(cx - lineEnd), Math.round(cx - gapR), Math.round(cy - Math.floor(lineThick / 2)), ACCENT, lineThick);
  drawHLine(png, Math.round(cx + gapR),    Math.round(cx + lineEnd), Math.round(cy - Math.floor(lineThick / 2)), ACCENT, lineThick);
  // vertical
  drawVLine(png, Math.round(cx - Math.floor(lineThick / 2)), Math.round(cy - lineEnd), Math.round(cy - gapR), ACCENT, lineThick);
  drawVLine(png, Math.round(cx - Math.floor(lineThick / 2)), Math.round(cy + gapR),    Math.round(cy + lineEnd), ACCENT, lineThick);

  // ── Corner brackets (outside outer ring) ────────────────
  const bOff  = Math.round(80 * s);  // distance from centre
  const bLen  = Math.round(12 * s);  // bracket arm length
  const bThick = Math.max(1, Math.round(2 * s));
  const corners = [[-1, -1], [1, -1], [-1, 1], [1, 1]];
  corners.forEach(([sx, sy]) => {
    const bx = Math.round(cx + sx * bOff);
    const by = Math.round(cy + sy * bOff);
    // horizontal arm
    drawHLine(png, bx, bx + sx * bLen, by, GOLD, bThick);
    // vertical arm
    drawVLine(png, bx, by, by + sy * bLen, GOLD, bThick);
  });

  // ── Centre dot ──────────────────────────────────────────
  fillCircle(png, Math.round(cx), Math.round(cy), Math.round(4 * s), ACCENT);
  drawGlow(png, Math.round(cx), Math.round(cy), Math.round(4 * s), ACCENT, Math.round(6 * s));

  // ── Tick marks on mid ring ───────────────────────────────
  const tickAngles = [0, Math.PI / 2, Math.PI, Math.PI * 1.5];
  const tickLen = Math.round(6 * s);
  tickAngles.forEach(angle => {
    const x1 = Math.round(cx + Math.cos(angle) * (midR - tickLen));
    const y1 = Math.round(cy + Math.sin(angle) * (midR - tickLen));
    const x2 = Math.round(cx + Math.cos(angle) * (midR + tickLen));
    const y2 = Math.round(cy + Math.sin(angle) * (midR + tickLen));
    for (let t = 0; t <= 1; t += 0.05) {
      const px = Math.round(x1 + (x2 - x1) * t);
      const py = Math.round(y1 + (y2 - y1) * t);
      setPixel(png, px, py, ACCENT);
    }
  });

  return png;
}

// ─── Favicon (32×32) ─────────────────────────────────────────
function drawFavicon(size) {
  const png = new PNG({ width: size, height: size, filterType: -1 });
  const cx = size / 2;
  const cy = size / 2;
  const s = size / 32;

  // Background
  for (let i = 0; i < png.data.length; i += 4) {
    png.data[i]     = BG[0];
    png.data[i + 1] = BG[1];
    png.data[i + 2] = BG[2];
    png.data[i + 3] = BG[3];
  }

  fillRoundedRect(png, 1, 1, size - 2, size - 2, Math.round(5 * s), BG2);
  drawCircle(png, cx, cy, Math.round(11 * s), ACCENT, Math.round(1.5 * s));
  drawCircle(png, cx, cy, Math.round(6 * s), PURPLE, 1);
  drawHLine(png, Math.round(cx - 10 * s), Math.round(cx - 3 * s), Math.round(cy), ACCENT, 1);
  drawHLine(png, Math.round(cx + 3 * s),  Math.round(cx + 10 * s), Math.round(cy), ACCENT, 1);
  drawVLine(png, Math.round(cx), Math.round(cy - 10 * s), Math.round(cy - 3 * s), ACCENT, 1);
  drawVLine(png, Math.round(cx), Math.round(cy + 3 * s),  Math.round(cy + 10 * s), ACCENT, 1);
  fillCircle(png, Math.round(cx), Math.round(cy), Math.round(2 * s), ACCENT);

  return png;
}

// ─── Write files ─────────────────────────────────────────────
function writePNG(png, filename) {
  const outPath = path.join(publicDir, filename);
  const buf = PNG.sync.write(png, { colorType: 6 });
  fs.writeFileSync(outPath, buf);
  console.log(`✓ ${filename} (${png.width}×${png.height})`);
}

writePNG(drawIcon(180), 'apple-touch-icon.png');
writePNG(drawIcon(192), 'icon-192.png');
writePNG(drawIcon(512), 'icon-512.png');
writePNG(drawFavicon(32), 'favicon.png');
console.log('Icons generated!');
