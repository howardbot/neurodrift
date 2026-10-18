import { columnMeans, inverse, matmul, r2, ridge, transpose, type Mat } from "@/lib/linalg";
import { poisson } from "@/lib/decoders";
import { gauss, rng } from "@/lib/random";

// A month of simulated recordings from one electrode array (/learn/drift). The same few
// population patterns drive every reach, but the neurons each channel picks up are slowly
// replaced and change their gain. Decoders: fixed (trained on day 0), retrained daily, and
// fixed but applied after aligning each day's patterns to day 0 (PCA + CCA).

export const CHANNELS = 64;
export const DIRECTIONS = 8;
export const BINS = 24; // per reach, 50 ms each
export const LATENTS = 3;
const DT = 0.05;
const TURNOVER_DAYS = 16; // mean time before a channel's neuron is replaced

export interface Channel {
  /** Day the original neuron is lost and a new one takes over the channel. */
  replacedOn: number;
  original: Unit;
  replacement: Unit;
  /** How fast the original neuron's gain changes, per day (log scale). */
  gainDrift: number;
}

interface Unit {
  base: number;
  gain: number;
  load: number[];
}

export interface Session {
  Y: Mat;
  V: Mat;
  cond: number[];
  bin: number[];
}

const speedProfile = (t: number) => Math.sin((Math.PI * (t + 0.5)) / BINS) ** 2;

// Small changes in the patterns themselves that grow over the month (different for each
// direction), so that no single realignment can undo everything, as in real recordings.
const PATTERN_CHANGE = (() => {
  const rand = rng(99);
  return Array.from({ length: DIRECTIONS }, () => Array.from({ length: LATENTS }, () => gauss(rand)));
})();

/** Population patterns for direction c at bin t on a given day: two direction signals and one shared ramp. */
export function latent(c: number, t: number, day = 0): number[] {
  const th = (2 * Math.PI * c) / DIRECTIONS;
  const g = speedProfile(t);
  const k = 0.22 * Math.sqrt(day / 30) * g;
  const e = PATTERN_CHANGE[c]!;
  return [Math.cos(th) * g + k * e[0]!, Math.sin(th) * g + k * e[1]!, (t / BINS - 0.5) * 0.9 + k * e[2]!];
}

export function handVelocity(c: number, t: number): [number, number] {
  const th = (2 * Math.PI * c) / DIRECTIONS;
  const g = speedProfile(t);
  return [Math.cos(th) * g, Math.sin(th) * g];
}

function unit(rand: () => number): Unit {
  return { base: 6 + 14 * rand(), gain: 14 + 16 * rand(), load: Array.from({ length: LATENTS }, () => gauss(rand)) };
}

export function makeArray(seed: number): Channel[] {
  const rand = rng(seed);
  return Array.from({ length: CHANNELS }, () => ({
    replacedOn: -TURNOVER_DAYS * Math.log(1 - rand()),
    original: unit(rand),
    replacement: unit(rand),
    gainDrift: 0.04 * gauss(rand),
  }));
}

export function unitOn(ch: Channel, day: number): Unit & { isNew: boolean } {
  if (day >= ch.replacedOn) return { ...ch.replacement, isNew: true };
  return { ...ch.original, gain: ch.original.gain * Math.exp(ch.gainDrift * day), isNew: false };
}

/** Causal smoothing of spike counts within each reach (an exponential filter). */
function smooth(Y: Mat, bin: number[]): Mat {
  const out: Mat = [];
  Y.forEach((y, i) => {
    const prev = bin[i] === 0 ? null : out[i - 1]!;
    out.push(prev ? y.map((v, j) => 0.5 * v + 0.5 * prev[j]!) : [...y]);
  });
  return out;
}

export function recordSession(array: Channel[], day: number, reps: number, seed: number): Session {
  const rand = rng(seed);
  const units = array.map((ch) => unitOn(ch, day));
  const Y: Mat = [];
  const V: Mat = [];
  const cond: number[] = [];
  const bin: number[] = [];
  for (let r = 0; r < reps; r++)
    for (let c = 0; c < DIRECTIONS; c++)
      for (let t = 0; t < BINS; t++) {
        const z = latent(c, t, day);
        Y.push(units.map((u) => poisson(Math.max(0, u.base + u.gain * u.load.reduce((s, l, k) => s + l * z[k]!, 0)) * DT, rand)));
        V.push(handVelocity(c, t));
        cond.push(c);
        bin.push(t);
      }
  return { Y: smooth(Y, bin), V, cond, bin };
}

/** Top-k eigenvectors of a symmetric matrix by orthogonal iteration (columns). */
export function topEigenvectors(C: Mat, k: number, iterations = 80): Mat {
  const n = C.length;
  const rand = rng(7);
  let Q: Mat = Array.from({ length: n }, () => Array.from({ length: k }, () => gauss(rand)));
  for (let it = 0; it < iterations; it++) Q = orthonormalise(matmul(C, Q));
  return Q;
}

/** Gram–Schmidt on the columns; also returns R so that X = Q R. */
export function qr(X: Mat): { Q: Mat; R: Mat } {
  const n = X.length;
  const k = X[0]!.length;
  const Q: Mat = X.map((r) => [...r]);
  const R: Mat = Array.from({ length: k }, () => new Array<number>(k).fill(0));
  for (let j = 0; j < k; j++) {
    for (let i = 0; i < j; i++) {
      let d = 0;
      for (let r = 0; r < n; r++) d += Q[r]![i]! * Q[r]![j]!;
      R[i]![j] = d;
      for (let r = 0; r < n; r++) Q[r]![j]! -= d * Q[r]![i]!;
    }
    let norm = 0;
    for (let r = 0; r < n; r++) norm += Q[r]![j]! ** 2;
    norm = Math.sqrt(norm) || 1e-12;
    R[j]![j] = norm;
    for (let r = 0; r < n; r++) Q[r]![j]! /= norm;
  }
  return { Q, R };
}

function orthonormalise(X: Mat): Mat {
  return qr(X).Q;
}

/** Singular value decomposition of a small square matrix via the eigenvectors of KᵀK. */
function smallSvd(K: Mat): { U: Mat; V: Mat } {
  const KtK = matmul(transpose(K), K);
  const V = topEigenvectors(KtK, K.length, 200);
  const KV = matmul(K, V);
  const U = orthonormalise(KV);
  return { U, V };
}

interface Pca {
  mean: number[];
  W: Mat; // channels × LATENTS
}

function pca(Y: Mat): Pca {
  const mean = columnMeans(Y);
  const Yc = Y.map((r) => r.map((v, j) => v - mean[j]!));
  const C = matmul(transpose(Yc), Yc).map((r) => r.map((v) => v / Y.length));
  return { mean, W: topEigenvectors(C, LATENTS) };
}

const project = (Y: Mat, p: Pca): Mat => matmul(Y.map((r) => r.map((v, j) => v - p.mean[j]!)), p.W);

/** Condition-averaged latent trajectories: DIRECTIONS × BINS rows. */
export function conditionAverage(Z: Mat, s: Session): Mat {
  const sums: Mat = Array.from({ length: DIRECTIONS * BINS }, () => new Array<number>(Z[0]!.length).fill(0));
  const counts = new Array<number>(DIRECTIONS * BINS).fill(0);
  Z.forEach((z, i) => {
    const row = s.cond[i]! * BINS + s.bin[i]!;
    z.forEach((v, j) => (sums[row]![j]! += v));
    counts[row]!++;
  });
  return sums.map((r, i) => r.map((v) => v / Math.max(1, counts[i]!)));
}

/**
 * CCA alignment: the k×k map M that carries day-k latents B into day-0 latent space,
 * found from condition-averaged trajectories (A ≈ B M).
 */
export function ccaMap(A: Mat, B: Mat): Mat {
  const centre = (X: Mat) => {
    const m = columnMeans(X);
    return X.map((r) => r.map((v, j) => v - m[j]!));
  };
  const a = qr(centre(A));
  const b = qr(centre(B));
  const { U, V } = smallSvd(matmul(transpose(a.Q), b.Q));
  return matmul(matmul(matmul(inverse(b.R), V), transpose(U)), a.R);
}

export interface DayResult {
  day: number;
  fixed: number;
  aligned: number;
  retrained: number;
}

export interface Lab {
  array: Channel[];
  day0: Session;
  pca0: Pca;
  latentDecoder: Mat;
  rawDecoder: Mat;
  avg0: Mat;
}

const withBias = (X: Mat) => X.map((r) => [...r, 1]);

export function setUpLab(seed = 3): Lab {
  const array = makeArray(seed);
  const day0 = recordSession(array, 0, 8, seed + 1);
  const pca0 = pca(day0.Y);
  const Z0 = project(day0.Y, pca0);
  return {
    array,
    day0,
    pca0,
    latentDecoder: ridge(withBias(Z0), day0.V, 1e-3),
    rawDecoder: ridge(withBias(day0.Y), day0.V, 1),
    avg0: conditionAverage(Z0, day0),
  };
}

export interface DayDetail extends DayResult {
  /** Condition-averaged latents of this day: raw (its own PCA axes) and aligned to day 0. */
  raw: Mat;
  alignedAvg: Mat;
  /** Decoded condition-averaged hand velocities: fixed decoder and aligned decoder. */
  fixedVel: Mat;
  alignedVel: Mat;
}

export function analyseDay(lab: Lab, day: number): DayDetail {
  const train = recordSession(lab.array, day, 6, 1000 + day);
  const test = recordSession(lab.array, day, 4, 2000 + day);
  // Fixed: day-0 weights applied to today's channels as they are.
  const fixedPred = matmul(withBias(test.Y), lab.rawDecoder);
  // Retrained: fitted on today's labelled data (the upper bound, but it needs new training).
  const todays = ridge(withBias(train.Y), train.V, 1);
  const retrainedPred = matmul(withBias(test.Y), todays);
  // Aligned: today's PCA, mapped onto day 0's patterns by CCA, then the day-0 latent decoder.
  const p = pca(train.Y);
  const avg = conditionAverage(project(train.Y, p), train);
  const M = ccaMap(lab.avg0, avg);
  const alignedTest = matmul(project(test.Y, p), M);
  const alignedPred = matmul(withBias(alignedTest), lab.latentDecoder);
  return {
    day,
    fixed: r2(test.V, fixedPred),
    aligned: r2(test.V, alignedPred),
    retrained: r2(test.V, retrainedPred),
    raw: avg,
    alignedAvg: matmul(avg, M),
    fixedVel: conditionAverage(fixedPred, test),
    alignedVel: conditionAverage(alignedPred, test),
  };
}
