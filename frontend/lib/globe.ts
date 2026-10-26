// Geometry for the dotted globe on /places: an even (Fibonacci) lattice of points over the sphere,
// the land mask in content/globeLand.ts, and an orthographic view that can turn to any place.

const D2R = Math.PI / 180;
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

export type LonLat = [number, number];
export type Vec3 = [number, number, number];

/** The i-th of n lattice points as [lon, lat] in degrees (scripts/make-globe-land.mjs uses the same formula). */
export function latticePoint(i: number, n: number): LonLat {
  return [(((i * GOLDEN_ANGLE) % (2 * Math.PI)) * 180) / Math.PI - 180, (Math.asin(1 - (2 * i + 1) / n) * 180) / Math.PI];
}

/** Lattice indices of land points, from alternating run lengths (sea first). */
export function decodeRuns(runs: string): number[] {
  const out: number[] = [];
  let i = 0;
  let land = false;
  for (const part of runs.split(",")) {
    const length = Number(part);
    if (land) for (let k = 0; k < length; k++) out.push(i + k);
    i += length;
    land = !land;
  }
  return out;
}

/** Unit vector for a point: y towards the North Pole, z towards (0°, 0°), x towards 90° E. */
export function toVec([lon, lat]: LonLat): Vec3 {
  const la = lat * D2R;
  const lo = lon * D2R;
  return [Math.cos(la) * Math.sin(lo), Math.sin(la), Math.cos(la) * Math.cos(lo)];
}

/**
 * Turns the globe so (lon0, lat0) faces the viewer. Returns screen-space [x right, y up, z towards
 * the viewer]; points with z > 0 are on the visible side.
 */
export function view(v: Vec3, lon0: number, lat0: number): Vec3 {
  const a = -lon0 * D2R;
  const x1 = v[0] * Math.cos(a) + v[2] * Math.sin(a);
  const z1 = -v[0] * Math.sin(a) + v[2] * Math.cos(a);
  const b = lat0 * D2R;
  return [x1, v[1] * Math.cos(b) - z1 * Math.sin(b), v[1] * Math.sin(b) + z1 * Math.cos(b)];
}

/** The shortest signed turn (degrees) from longitude `from` to `to`. */
export function lonDelta(from: number, to: number): number {
  return ((((to - from) % 360) + 540) % 360) - 180;
}

/** Index of the lattice point nearest to a place (for tests and checks). */
export function nearestLattice(p: LonLat, n: number): number {
  const target = toVec(p);
  let best = 0;
  let bestDot = -2;
  for (let i = 0; i < n; i++) {
    const v = toVec(latticePoint(i, n));
    const d = v[0] * target[0] + v[1] * target[1] + v[2] * target[2];
    if (d > bestDot) {
      bestDot = d;
      best = i;
    }
  }
  return best;
}

/**
 * How a land dot is shaded on /places, from its province or state code (ISO 3166-2, e.g. "CN-SD"):
 * 2 = a province or state with one of the places, 1 = elsewhere in a country with one of the
 * places, 0 = anywhere else (or no code).
 */
export function shadeOf(code: string | undefined, regions: Set<string>, countries: Set<string>): 0 | 1 | 2 {
  if (!code) return 0;
  if (regions.has(code)) return 2;
  return countries.has(code.slice(0, 2)) ? 1 : 0;
}
