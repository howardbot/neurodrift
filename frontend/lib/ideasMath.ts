// Small simulations behind the gadgets on /ideas.

/** Largest Lyapunov exponent of the Lorenz system with the classic parameters (about 0.906). */
export const LORENZ_LYAPUNOV = 0.906;

type Vec = [number, number, number];

function lorenz([x, y, z]: Vec): Vec {
  // Lorenz (1963): sigma = 10, rho = 28, beta = 8/3.
  return [10 * (y - x), x * (28 - z) - y, x * y - (8 / 3) * z];
}

function rk4(s: Vec, dt: number): Vec {
  const add = (a: Vec, b: Vec, k: number): Vec => [a[0] + k * b[0], a[1] + k * b[1], a[2] + k * b[2]];
  const k1 = lorenz(s);
  const k2 = lorenz(add(s, k1, dt / 2));
  const k3 = lorenz(add(s, k2, dt / 2));
  const k4 = lorenz(add(s, k3, dt));
  return [0, 1, 2].map((i) => s[i]! + (dt / 6) * (k1[i]! + 2 * k2[i]! + 2 * k3[i]! + k4[i]!)) as Vec;
}

/**
 * Two runs of the Lorenz system from points `eps` apart on its attractor, for `duration` time
 * units: x of each run, the distance between them, and when that distance first exceeds 1.
 */
export function lorenzTwins(eps: number, duration: number, dt = 0.01, every = 4) {
  let a: Vec = [1, 1, 1];
  for (let i = 0; i < 1000; i++) a = rk4(a, dt); // settle onto the attractor first
  let b: Vec = [a[0] + eps, a[1], a[2]];
  const steps = Math.round(duration / dt);
  const n = Math.floor(steps / every) + 1;
  const out = { t: new Float64Array(n), a: new Float64Array(n), b: new Float64Array(n), dist: new Float64Array(n), partsAt: duration, perDigit: Math.LN10 / LORENZ_LYAPUNOV };
  let found = false;
  for (let i = 0; i <= steps; i++) {
    const d = Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
    if (!found && d > 1) {
      out.partsAt = i * dt;
      found = true;
    }
    if (i % every === 0) {
      const k = i / every;
      out.t[k] = i * dt;
      out.a[k] = a[0];
      out.b[k] = b[0];
      out.dist[k] = d;
    }
    a = rk4(a, dt);
    b = rk4(b, dt);
  }
  return out;
}

/** An elementary cellular automaton (Wolfram numbering) from a starting row; cells beyond the edges are off. */
export function automaton(rule: number, top: boolean[], rows: number): boolean[][] {
  const grid = [top];
  for (let r = 1; r < rows; r++) {
    const prev = grid[r - 1]!;
    grid.push(prev.map((_, i) => ((rule >> ((prev[i - 1] ? 4 : 0) | (prev[i] ? 2 : 0) | (prev[i + 1] ? 1 : 0))) & 1) === 1));
  }
  return grid;
}
