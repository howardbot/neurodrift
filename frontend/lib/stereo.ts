import { rng } from "@/lib/random";

// Random-dot stereograms (Julesz, 1960) and binocular geometry for /learn/seeing-3d.

export const RDS_SIZE = 120;

export type StereoShape = "square" | "ring" | "slant" | "letters";

// 5 × 7 bitmaps for the letters "3" and "D".
const GLYPHS = [
  ["11110", "00001", "00001", "01110", "00001", "00001", "11110"],
  ["11100", "10010", "10001", "10001", "10001", "10010", "11100"],
];

function inLetters(x: number, y: number): boolean {
  const scale = 8;
  const w = 5 * scale;
  const gap = 8;
  const x0 = (RDS_SIZE - (2 * w + gap)) / 2;
  const y0 = (RDS_SIZE - 7 * scale) / 2;
  for (let g = 0; g < GLYPHS.length; g++) {
    const gx = x - (x0 + g * (w + gap));
    const gy = y - y0;
    if (gx < 0 || gy < 0 || gx >= w || gy >= 7 * scale) continue;
    if (GLYPHS[g]![Math.floor(gy / scale)]![Math.floor(gx / scale)] === "1") return true;
  }
  return false;
}

/**
 * Disparity (in dots) at each cell. Positive is crossed disparity: the region is shifted
 * left in the right eye's image, so it appears nearer than the page.
 */
export function disparityAt(shape: StereoShape, depth: number, x: number, y: number): number {
  const c = RDS_SIZE / 2;
  const r = Math.hypot(x + 0.5 - c, y + 0.5 - c);
  switch (shape) {
    case "square":
      return Math.abs(x + 0.5 - c) < 26 && Math.abs(y + 0.5 - c) < 26 ? depth : 0;
    case "ring":
      return r > 22 && r < 40 ? depth : 0;
    case "slant":
      // A disc tilted about the vertical axis: one side nearer, the other farther.
      return r < 44 ? (depth * (x + 0.5 - c)) / 44 : 0;
    case "letters":
      return inLetters(x, y) ? depth : 0;
  }
}

export interface Stereogram {
  left: Uint8Array;
  right: Uint8Array;
}

/** Left image: random dots. Right image: the same dots, sampled through the disparity map. */
export function makeStereogram(shape: StereoShape, depth: number, seed = 1, density = 0.5): Stereogram {
  const rand = rng(seed);
  const n = RDS_SIZE;
  const left = new Uint8Array(n * n);
  // A wider strip of dots so shifted samples near the edges still find texture.
  const pad = 16;
  const wide = new Uint8Array((n + 2 * pad) * n);
  for (let i = 0; i < wide.length; i++) wide[i] = rand() < density ? 1 : 0;
  const at = (x: number, y: number) => wide[y * (n + 2 * pad) + x + pad]!;
  const right = new Uint8Array(n * n);
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      left[y * n + x] = at(x, y);
      right[y * n + x] = at(Math.max(-pad, Math.min(n + pad - 1, x + Math.round(disparityAt(shape, depth, x, y)))), y);
    }
  return { left, right };
}

export interface EyeGeometry {
  /** Angle of the object relative to the fixation point, seen from each eye (degrees, + is right). */
  leftDeg: number;
  rightDeg: number;
  /** Binocular disparity, degrees: positive = crossed (nearer than fixation). */
  disparity: number;
}

export function eyeGeometry(eyes: { lx: number; rx: number; y: number }, fix: { x: number; y: number }, obj: { x: number; y: number }): EyeGeometry {
  const ang = (ex: number, p: { x: number; y: number }) => (Math.atan2(p.x - ex, eyes.y - p.y) * 180) / Math.PI;
  const leftDeg = ang(eyes.lx, obj) - ang(eyes.lx, fix);
  const rightDeg = ang(eyes.rx, obj) - ang(eyes.rx, fix);
  return { leftDeg, rightDeg, disparity: leftDeg - rightDeg };
}
