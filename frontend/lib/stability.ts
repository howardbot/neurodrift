/** Decoder stability as a function of session distance, from the stored train × test matrices. */

export type Matrix = (number | null | undefined)[][];

export interface StabilityPoint {
  test: number; // index of the test session in the experiment's order
  distance: number; // |train − test|, in positions of the session order (not days)
  direction: "same" | "before" | "after"; // test session before / after the training session in that order
  r: number | null;
  angle: number | null;
  chance: number | null;
}

const value = (m: Matrix | undefined, i: number, j: number): number | null => {
  const v = m?.[i]?.[j];
  return v === null || v === undefined || !Number.isFinite(v) ? null : v;
};

/** One point per test session for training session `train` (one row of each matrix). */
export function stabilityProfile(r: Matrix, train: number, angle?: Matrix, chance?: Matrix): StabilityPoint[] {
  return r.map((_, j) => ({
    test: j,
    distance: Math.abs(train - j),
    direction: j === train ? "same" : j < train ? "before" : "after",
    r: value(r, train, j),
    angle: value(angle, train, j),
    chance: value(chance, train, j),
  }));
}

/** Mean of the available cells at each distance |i − j|, over all training sessions. */
export function meanByDistance(m: Matrix): { distance: number; mean: number | null; n: number }[] {
  const n = m.length;
  return Array.from({ length: n }, (_, d) => {
    const vals: number[] = [];
    for (let i = 0; i < n; i++) {
      for (const j of d === 0 ? [i] : [i - d, i + d]) {
        const v = j >= 0 && j < n ? value(m, i, j) : null;
        if (v !== null) vals.push(v);
      }
    }
    return { distance: d, mean: vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null, n: vals.length };
  });
}
