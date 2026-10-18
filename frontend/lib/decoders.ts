import { add, columnMeans, inverse, matmul, matvec, r2, ridge, transpose, type Mat } from "@/lib/linalg";
import { gauss, rng } from "@/lib/random";

// Toy motor-cortex neurons and three classic decoders (/learn/decoders). Velocities are in
// arena units per second (the arena spans −1…1); spike counts are per 50 ms bin.

export const DT = 0.05;

export interface Neuron {
  base: number;
  gain: number;
  /** Preferred direction, radians. */
  pd: number;
  /** Extra firing with speed, whatever the direction (some neurons only). */
  speed: number;
}

export function makeNeurons(n: number, seed: number): Neuron[] {
  const rand = rng(seed);
  return Array.from({ length: n }, () => ({
    base: 8 + 17 * rand(),
    gain: 10 + 16 * rand(),
    pd: 2 * Math.PI * rand(),
    speed: rand() < 0.3 ? 6 + 10 * rand() : 0,
  }));
}

/** Firing rate (spikes/s) for a velocity: cosine tuning, rectified at zero. */
export function rate(nr: Neuron, vx: number, vy: number): number {
  const along = vx * Math.cos(nr.pd) + vy * Math.sin(nr.pd);
  return Math.max(0, nr.base + nr.gain * along + nr.speed * Math.hypot(vx, vy));
}

export function poisson(lambda: number, rand: () => number): number {
  const L = Math.exp(-lambda);
  let k = 0;
  let p = rand();
  while (p > L) {
    k++;
    p *= rand();
  }
  return k;
}

export function spikeCounts(neurons: Neuron[], vx: number, vy: number, rand: () => number): number[] {
  return neurons.map((nr) => poisson(rate(nr, vx, vy) * DT, rand));
}

export interface Dataset {
  V: Mat;
  Y: Mat;
}

/** Smoothly wandering hand velocity (an Ornstein–Uhlenbeck process) and the spikes it evokes. */
export function makeDataset(neurons: Neuron[], bins: number, seed: number): Dataset {
  const rand = rng(seed);
  const V: Mat = [];
  const Y: Mat = [];
  let vx = 0;
  let vy = 0;
  for (let t = 0; t < bins; t++) {
    vx = 0.92 * vx + 0.25 * gauss(rand);
    vy = 0.92 * vy + 0.25 * gauss(rand);
    V.push([vx, vy]);
    Y.push(spikeCounts(neurons, vx, vy, rand));
  }
  return { V, Y };
}

export interface Decoder {
  /** Takes this bin's spike counts, returns the decoded velocity. */
  step(y: number[]): [number, number];
}

export type DecoderKind = "pv" | "kalman" | "mlp";

export const DECODER_KINDS: DecoderKind[] = ["pv", "kalman", "mlp"];

// ---------------------------------------------------------------------------------------
// Population vector (Georgopoulos et al. 1986)
// ---------------------------------------------------------------------------------------

export function fitPopulationVector(data: Dataset): () => Decoder {
  // Fit each neuron's baseline and preferred direction: count ≈ b + ax·vx + ay·vy.
  const X = data.V.map(([vx, vy]) => [1, vx!, vy!]);
  const W = ridge(X, data.Y, 1e-6); // 3 × N
  const n = data.Y[0]!.length;
  const units = Array.from({ length: n }, (_, i) => {
    const b = W[0]![i]!;
    const ax = W[1]![i]!;
    const ay = W[2]![i]!;
    const m = Math.hypot(ax, ay) || 1e-9;
    return { b, m, ux: ax / m, uy: ay / m };
  });
  return () => ({
    step(y) {
      // Each neuron votes for its preferred direction, weighted by how far it is above baseline.
      let px = 0;
      let py = 0;
      units.forEach((u, i) => {
        const w = (y[i]! - u.b) / u.m;
        px += w * u.ux;
        py += w * u.uy;
      });
      return [(2 / n) * px, (2 / n) * py];
    },
  });
}

// ---------------------------------------------------------------------------------------
// Kalman filter (Wu et al. 2006): velocity evolves smoothly; spikes are a noisy linear readout.
// ---------------------------------------------------------------------------------------

export function fitKalman(data: Dataset): () => Decoder {
  const { V, Y } = data;
  const T = V.length;
  // Dynamics: v_t = A v_{t−1} + w.
  const A = transpose(ridge(V.slice(0, -1), V.slice(1), 1e-6));
  const pred = V.slice(0, -1).map((v) => matvec(A, v));
  const resid = V.slice(1).map((v, t) => v.map((x, j) => x - pred[t]![j]!));
  const Wn = matmul(transpose(resid), resid).map((r) => r.map((x) => x / (T - 1)));
  // Observation: y_t − ȳ = H v_t + q.
  const ybar = columnMeans(Y);
  const Yc = Y.map((r) => r.map((x, j) => x - ybar[j]!));
  const H = transpose(ridge(V, Yc, 1e-6)); // N × 2
  const fit = V.map((v) => matvec(H, v));
  const q = Yc.map((r, t) => r.map((x, j) => x - fit[t]![j]!));
  const Q = matmul(transpose(q), q).map((r, i) => r.map((x, j) => x / T + (i === j ? 1e-3 : 0)));
  const Qi = inverse(Q);
  const HtQi = matmul(transpose(H), Qi); // 2 × N
  const HtQiH = matmul(HtQi, H); // 2 × 2
  return () => {
    let x = [0, 0];
    let P: Mat = [
      [1, 0],
      [0, 1],
    ];
    return {
      step(y) {
        const xp = matvec(A, x);
        const Pp = add(matmul(matmul(A, P), transpose(A)), Wn);
        P = inverse(add(inverse(Pp), HtQiH));
        const innov = y.map((v, j) => v - ybar[j]! - H[j]![0]! * xp[0]! - H[j]![1]! * xp[1]!);
        const gain = matvec(matmul(P, HtQi), innov);
        x = [xp[0]! + gain[0]!, xp[1]! + gain[1]!];
        return [x[0]!, x[1]!];
      },
    };
  };
}

// ---------------------------------------------------------------------------------------
// A small neural network: the last few bins of spikes → velocity, one hidden layer.
// ---------------------------------------------------------------------------------------

export const MLP_HISTORY = 3;
const HIDDEN = 24;

export interface MlpOptions {
  seed?: number;
  /** Total number of gradient steps (mini-batches of 32). */
  steps?: number;
}

/** Trains in small chunks, so a page can show the network improving as it learns. */
export class MlpTrainer {
  stepsDone = 0;
  private readonly W1: Mat;
  private readonly b1: number[];
  private readonly W2: Mat;
  private readonly b2: number[];
  private readonly m1: Mat[];
  private readonly m2: Mat[];
  private readonly rand: () => number;
  private readonly mean: number[];
  private readonly sd: number[];
  private readonly Z: Mat;
  private readonly D: number;

  constructor(
    private readonly data: Dataset,
    seed = 1,
  ) {
    this.rand = rng(seed);
    const n = data.Y[0]!.length;
    this.mean = columnMeans(data.Y);
    this.sd = this.mean.map((m, j) => Math.sqrt(data.Y.reduce((s, r) => s + (r[j]! - m) ** 2, 0) / data.Y.length) + 0.5);
    this.Z = data.Y.map((y) => this.norm(y));
    this.D = n * MLP_HISTORY;
    const init = (fanIn: number, fanOut: number) => {
      const s = Math.sqrt(6 / (fanIn + fanOut));
      return Array.from({ length: fanOut }, () => Array.from({ length: fanIn }, () => (2 * this.rand() - 1) * s));
    };
    this.W1 = init(this.D, HIDDEN);
    this.b1 = new Array<number>(HIDDEN).fill(0);
    this.W2 = init(HIDDEN, 2);
    this.b2 = [0, 0];
    this.m1 = this.params().map((p) => p.map((r) => r.map(() => 0)));
    this.m2 = this.params().map((p) => p.map((r) => r.map(() => 0)));
  }

  private params(): Mat[] {
    return [this.W1, [this.b1], this.W2, [this.b2]];
  }

  private norm(y: number[]): number[] {
    return y.map((v, j) => (v - this.mean[j]!) / this.sd[j]!);
  }

  private forward(x: number[]): { h: number[]; o: number[] } {
    const h = this.W1.map((w, k) => Math.tanh(w.reduce((s, v, j) => s + v * x[j]!, this.b1[k]!)));
    const o = this.W2.map((w, k) => w.reduce((s, v, j) => s + v * h[j]!, this.b2[k]!));
    return { h, o };
  }

  /** Runs `steps` more mini-batch updates (Adam, with a little weight decay). */
  train(steps: number): this {
    const { Z, data, D } = this;
    const T = data.V.length;
    const params = this.params();
    const input = (t: number) => {
      const out: number[] = [];
      for (let h = 0; h < MLP_HISTORY; h++) out.push(...(Z[t - h] ?? Z[0]!));
      return out;
    };
    for (let s = 0; s < steps; s++) {
      const step = ++this.stepsDone;
      const g = params.map((p) => p.map((r) => r.map(() => 0)));
      for (let b = 0; b < 32; b++) {
        const t = Math.floor(this.rand() * T);
        const x = input(t);
        const { h, o } = this.forward(x);
        const dOut = o.map((v, k) => (v - data.V[t]![k]!) / 32);
        for (let k = 0; k < 2; k++) {
          for (let j = 0; j < HIDDEN; j++) g[2]![k]![j]! += dOut[k]! * h[j]!;
          g[3]![0]![k]! += dOut[k]!;
        }
        for (let j = 0; j < HIDDEN; j++) {
          const dh = (dOut[0]! * this.W2[0]![j]! + dOut[1]! * this.W2[1]![j]!) * (1 - h[j]! * h[j]!);
          if (dh === 0) continue;
          const gj = g[0]![j]!;
          for (let i = 0; i < D; i++) gj[i]! += dh * x[i]!;
          g[1]![0]![j]! += dh;
        }
      }
      const c1 = 1 - 0.9 ** step;
      const c2 = 1 - 0.999 ** step;
      params.forEach((p, pi) =>
        p.forEach((row, r) =>
          row.forEach((w, c) => {
            const grad = g[pi]![r]![c]! + 1e-4 * w;
            this.m1[pi]![r]![c] = 0.9 * this.m1[pi]![r]![c]! + 0.1 * grad;
            this.m2[pi]![r]![c] = 0.999 * this.m2[pi]![r]![c]! + 0.001 * grad * grad;
            row[c] = w - (0.004 * (this.m1[pi]![r]![c]! / c1)) / (Math.sqrt(this.m2[pi]![r]![c]! / c2) + 1e-8);
          }),
        ),
      );
    }
    return this;
  }

  /** A decoder using the weights as they are now (later training does not change it). */
  factory(): () => Decoder {
    const W1 = this.W1.map((r) => [...r]);
    const b1 = [...this.b1];
    const W2 = this.W2.map((r) => [...r]);
    const b2 = [...this.b2];
    const norm = (y: number[]) => this.norm(y);
    return () => {
      const hist: number[][] = [];
      return {
        step(y) {
          hist.unshift(norm(y));
          if (hist.length > MLP_HISTORY) hist.pop();
          const x: number[] = [];
          for (let h = 0; h < MLP_HISTORY; h++) x.push(...(hist[h] ?? hist[hist.length - 1]!));
          const hid = W1.map((w, k) => Math.tanh(w.reduce((s, v, j) => s + v * x[j]!, b1[k]!)));
          return [W2[0]!.reduce((s, v, j) => s + v * hid[j]!, b2[0]!), W2[1]!.reduce((s, v, j) => s + v * hid[j]!, b2[1]!)];
        },
      };
    };
  }
}

export function fitMlp(data: Dataset, { seed = 1, steps = MLP_STEPS }: MlpOptions = {}): () => Decoder {
  return new MlpTrainer(data, seed).train(steps).factory();
}

export const MLP_STEPS = 3000;

export type Factories = Record<DecoderKind, () => Decoder>;

export function trainAll(data: Dataset, mlp: MlpOptions = {}): Factories {
  return { pv: fitPopulationVector(data), kalman: fitKalman(data), mlp: fitMlp(data, mlp) };
}

/** Variance of the true velocity explained by each decoder on held-out data (R²). */
export function evaluate(factories: Factories, test: Dataset): Record<DecoderKind, number> {
  const out = {} as Record<DecoderKind, number>;
  for (const k of DECODER_KINDS) {
    const d = factories[k]();
    out[k] = r2(test.V, test.Y.map((y) => d.step(y)));
  }
  return out;
}

