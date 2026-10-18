// Synthetic recordings and a simplified spike-processing pipeline for the field-guide
// pages. Everything is deterministic for a given seed. These are teaching models: the
// filters are deliberately simple (moving averages), not the filters used in real
// pipelines.

import { gauss, rng } from "@/lib/random";
import type { TraceKind } from "@/content/learn";

// ---------------------------------------------------------------------------------------
// Example traces for the electrode explorer
// ---------------------------------------------------------------------------------------

export interface ExampleTrace {
  /** One or more channels, each an array of samples. */
  channels: number[][];
  /** Duration shown, in seconds. */
  seconds: number;
  unit: string;
  /** Value range used to scale every channel (min, max). */
  range: [number, number];
}

function sines(t: number, parts: [number, number, number][]): number {
  return parts.reduce((s, [amp, hz, phase]) => s + amp * Math.sin(2 * Math.PI * hz * t + phase), 0);
}

/** A spike waveform (µV) at time `dt` seconds after its trough-onset; `width` scales its duration. */
export function spikeShape(dt: number, amp: number, width = 1): number {
  const ms = dt * 1000;
  if (ms < -0.6 * width || ms > 2 * width) return 0;
  const trough = -amp * Math.exp(-((ms / width) ** 2) / (2 * 0.12 ** 2));
  const peak = 0.35 * amp * Math.exp(-(((ms - 0.45 * width) / width) ** 2) / (2 * 0.25 ** 2));
  return trough + peak;
}

function poissonTimes(rand: () => number, rateHz: number, seconds: number, refractory = 0.003): number[] {
  const times: number[] = [];
  let t = 0;
  for (;;) {
    t += refractory - Math.log(Math.max(rand(), 1e-12)) / rateHz;
    if (t >= seconds) return times;
    times.push(t);
  }
}

export function exampleTrace(kind: TraceKind, seed = 1): ExampleTrace {
  const rand = rng(seed * 7919 + kind.length);
  const field = (n: number, seconds: number, parts: [number, number, number][], noise: number) =>
    Array.from({ length: n }, (_, i) => sines((i / n) * seconds, parts) + noise * gauss(rand));

  switch (kind) {
    case "eeg": {
      const n = 500;
      const s = 2;
      const ch = Array.from({ length: n }, (_, i) => {
        const t = (i / n) * s;
        const envelope = 0.65 + 0.35 * Math.sin(2 * Math.PI * 0.6 * t);
        return envelope * 22 * Math.sin(2 * Math.PI * 10 * t) + 9 * Math.sin(2 * Math.PI * 1.5 * t + 0.4) + 3 * gauss(rand);
      });
      return { channels: [ch], seconds: s, unit: "µV", range: [-45, 45] };
    }
    case "ecog":
      return { channels: [field(600, 1.5, [[60, 4, 0], [30, 11, 1], [14, 24, 2], [7, 55, 0.5]], 5)], seconds: 1.5, unit: "µV", range: [-130, 130] };
    case "stentrode":
      return { channels: [field(600, 1.5, [[45, 3.5, 0.3], [20, 9, 1.2], [8, 20, 2]], 2.5)], seconds: 1.5, unit: "µV", range: [-90, 90] };
    case "utah": {
      const s = 0.5;
      const n = 1500;
      const spikes = [...poissonTimes(rand, 18, s).map((t) => [t, 85] as const), ...poissonTimes(rand, 10, s).map((t) => [t, 55] as const)];
      const ch = Array.from({ length: n }, (_, i) => {
        const t = (i / n) * s;
        return sines(t, [[45, 6, 0.2], [18, 17, 1]]) + spikes.reduce((v, [st, a]) => v + spikeShape(t - st, a), 0) + 7 * gauss(rand);
      });
      return { channels: [ch], seconds: s, unit: "µV", range: [-160, 110] };
    }
    case "tetrode": {
      const s = 0.25;
      const n = 1000;
      const units = [
        { times: poissonTimes(rand, 30, s), amps: [95, 62, 34, 22] },
        { times: poissonTimes(rand, 24, s), amps: [26, 48, 80, 40] },
      ];
      const channels = [0, 1, 2, 3].map((c) =>
        Array.from({ length: n }, (_, i) => {
          const t = (i / n) * s;
          return units.reduce((v, u) => v + u.times.reduce((w, st) => w + spikeShape(t - st, u.amps[c]!), 0), 0) + 6 * gauss(rand);
        }),
      );
      return { channels, seconds: s, unit: "µV", range: [-110, 60] };
    }
    case "neuropixels": {
      const s = 0.15;
      const n = 450;
      const nCh = 14;
      const units = [
        { centre: 3, amp: 110, times: poissonTimes(rand, 40, s) },
        { centre: 8, amp: 80, times: poissonTimes(rand, 30, s) },
        { centre: 11.5, amp: 95, times: poissonTimes(rand, 25, s) },
      ];
      const channels = Array.from({ length: nCh }, (_, c) =>
        Array.from({ length: n }, (_, i) => {
          const t = (i / n) * s;
          let v = 4 * gauss(rand);
          for (const u of units) {
            const a = u.amp * Math.exp(-((c - u.centre) ** 2) / (2 * 1.1 ** 2));
            if (a > 2) for (const st of u.times) v += spikeShape(t - st, a);
          }
          return v;
        }),
      );
      return { channels, seconds: s, unit: "µV", range: [-130, 60] };
    }
    case "patch": {
      // Leaky integrate-and-fire neuron driven by random excitatory inputs (mV).
      const s = 0.6;
      const dt = 0.0002;
      const n = Math.round(s / dt);
      const tau = 0.02;
      const inputs = poissonTimes(rand, 220, s, 0);
      let current = 0;
      let v = -65;
      let refractory = 0;
      let k = 0;
      const out: number[] = [];
      for (let i = 0; i < n; i++) {
        const t = i * dt;
        while (k < inputs.length && inputs[k]! <= t) {
          current += 3.2 + 2 * rand();
          k++;
        }
        current *= Math.exp(-dt / 0.005);
        if (refractory > 0) {
          // Repolarise from +30 to -72 mV over 1.5 ms, then recover towards -68 mV.
          refractory -= dt;
          const elapsed = 0.003 - refractory;
          v = elapsed < 0.0015 ? 30 - (elapsed / 0.0015) * 102 : -72 + ((elapsed - 0.0015) / 0.0015) * 4;
        } else {
          v += (dt / tau) * (-(v + 65) + current * 4);
          if (v >= -50) {
            refractory = 0.003;
            v = 30;
          }
        }
        out.push(v);
      }
      return { channels: [out], seconds: s, unit: "mV", range: [-80, 40] };
    }
  }
}

// ---------------------------------------------------------------------------------------
// The spike-processing pipeline
// ---------------------------------------------------------------------------------------

export const FS = 10_000; // samples per second

export interface Recording {
  fs: number;
  raw: number[];
  /** Ground truth: sample index of each spike's trough and the neuron that fired it. */
  truth: { index: number; unit: number }[];
}

export interface RecordingOptions {
  seed: number;
  /** Standard deviation of the background noise, µV. */
  noise: number;
  seconds?: number;
}

// Two neurons: a large narrow spike and a smaller, broader one.
export const UNITS = [
  { amp: 95, width: 0.8, rate: 14 },
  { amp: 60, width: 1.25, rate: 20 },
];

export function makeRecording({ seed, noise, seconds = 1 }: RecordingOptions): Recording {
  const rand = rng(seed);
  const n = Math.round(seconds * FS);
  const raw = Array.from({ length: n }, (_, i) => {
    const t = i / FS;
    return sines(t, [[110, 5, 0.3], [55, 11, 1.1], [25, 23, 2.2]]) + noise * gauss(rand);
  });
  const truth: Recording["truth"] = [];
  UNITS.forEach((u, unit) => {
    for (const t of poissonTimes(rand, u.rate, seconds - 0.004, 0.004)) {
      const start = Math.round(t * FS);
      for (let j = -8; j < 25; j++) {
        const i = start + j;
        if (i >= 0 && i < n) raw[i]! += spikeShape(j / FS, u.amp, u.width);
      }
      truth.push({ index: start, unit });
    }
  });
  truth.sort((a, b) => a.index - b.index);
  return { fs: FS, raw, truth };
}

/** Centred moving average (edges use the available samples). */
export function movingAverage(x: number[], window: number): number[] {
  const half = Math.floor(window / 2);
  const prefix = [0];
  for (const v of x) prefix.push(prefix[prefix.length - 1]! + v);
  return x.map((_, i) => {
    const lo = Math.max(0, i - half);
    const hi = Math.min(x.length, i + half + 1);
    return (prefix[hi]! - prefix[lo]!) / (hi - lo);
  });
}

/** Split a broadband signal into a slow "LFP" part and a fast "spike band" part. */
export function splitBands(raw: number[]): { lfp: number[]; spikeBand: number[] } {
  const lfp = movingAverage(raw, 81); // keeps roughly < 120 Hz at 10 kHz
  const slow = movingAverage(raw, 21); // removes roughly < 500 Hz
  return { lfp, spikeBand: raw.map((v, i) => v - slow[i]!) };
}

/** Robust noise estimate: median(|x|) / 0.6745 (Quiroga, Nadasdy & Ben-Shaul, 2004). */
export function noiseSigma(x: number[]): number {
  const a = x.map(Math.abs).sort((p, q) => p - q);
  const mid = Math.floor(a.length / 2);
  const median = a.length % 2 ? a[mid]! : (a[mid - 1]! + a[mid]!) / 2;
  return median / 0.6745;
}

/** Indices of negative threshold crossings, aligned to the trough, with a dead time. */
export function detectSpikes(x: number[], threshold: number, deadSamples = 15): number[] {
  const out: number[] = [];
  let i = 1;
  while (i < x.length) {
    if (x[i]! < -threshold && x[i - 1]! >= -threshold) {
      let best = i;
      for (let j = i; j < Math.min(x.length, i + 10); j++) if (x[j]! < x[best]!) best = j;
      out.push(best);
      i = best + deadSamples;
    } else i++;
  }
  return out;
}

export interface DetectionScore {
  hits: number;
  misses: number;
  falseAlarms: number;
  /** For each detection, the ground-truth unit it matched, or -1 for a false alarm. */
  matchedUnit: number[];
}

/** Match detections to true spikes within ±`tolerance` samples (each truth used once). */
export function scoreDetections(detected: number[], truth: Recording["truth"], tolerance = 8): DetectionScore {
  const used = new Set<number>();
  const matchedUnit = detected.map((d) => {
    let best = -1;
    let bestDist = Infinity;
    truth.forEach((t, k) => {
      const dist = Math.abs(t.index - d);
      if (!used.has(k) && dist <= tolerance && dist < bestDist) {
        best = k;
        bestDist = dist;
      }
    });
    if (best < 0) return -1;
    used.add(best);
    return truth[best]!.unit;
  });
  const hits = matchedUnit.filter((u) => u >= 0).length;
  return { hits, misses: truth.length - hits, falseAlarms: detected.length - hits, matchedUnit };
}

export const SNIPPET_PRE = 8;
export const SNIPPET_POST = 20;

export function snippets(x: number[], indices: number[]): number[][] {
  return indices
    .filter((i) => i - SNIPPET_PRE >= 0 && i + SNIPPET_POST < x.length)
    .map((i) => x.slice(i - SNIPPET_PRE, i + SNIPPET_POST));
}

/** Two features per snippet: trough depth (µV) and trough-to-peak time (ms). */
export function features(snips: number[][], fs = FS): [number, number][] {
  return snips.map((s) => {
    const trough = SNIPPET_PRE;
    let peak = trough;
    for (let j = trough; j < s.length; j++) if (s[j]! > s[peak]!) peak = j;
    return [-s[trough]!, ((peak - trough) / fs) * 1000];
  });
}

/** k-means with k = 2 on standardised features; deterministic start at the extremes of feature 0. */
export function kmeans2(points: [number, number][], iterations = 25): number[] {
  if (points.length < 2) return points.map(() => 0);
  const mean = [0, 1].map((d) => points.reduce((s, p) => s + p[d]!, 0) / points.length);
  const sd = [0, 1].map((d) => Math.sqrt(points.reduce((s, p) => s + (p[d]! - mean[d]!) ** 2, 0) / points.length) || 1);
  const z = points.map((p) => [(p[0] - mean[0]!) / sd[0]!, (p[1] - mean[1]!) / sd[1]!] as const);
  const byDepth = [...z.keys()].sort((a, b) => z[b]![0] - z[a]![0]);
  let centres = [z[byDepth[0]!]!, z[byDepth[byDepth.length - 1]!]!].map((c) => [...c]);
  let labels = z.map(() => 0);
  for (let it = 0; it < iterations; it++) {
    labels = z.map((p) => {
      const d = centres.map((c) => (p[0] - c[0]!) ** 2 + (p[1] - c[1]!) ** 2);
      return d[0]! <= d[1]! ? 0 : 1;
    });
    centres = centres.map((c, k) => {
      const members = z.filter((_, i) => labels[i] === k);
      if (!members.length) return c;
      return [0, 1].map((d) => members.reduce((s, p) => s + p[d]!, 0) / members.length);
    });
  }
  return labels;
}

/** Spike counts per bin for each cluster: rows = clusters, columns = time bins. */
export function binCounts(indices: number[], labels: number[], nClusters: number, nSamples: number, binSamples: number): number[][] {
  const nBins = Math.ceil(nSamples / binSamples);
  const counts = Array.from({ length: nClusters }, () => new Array<number>(nBins).fill(0));
  indices.forEach((idx, i) => {
    const label = labels[i] ?? 0;
    counts[label]![Math.min(nBins - 1, Math.floor(idx / binSamples))]! += 1;
  });
  return counts;
}

/** min/max envelope of `x` in `buckets` buckets: keeps spikes visible when drawing a long trace. */
export function envelope(x: number[], buckets: number): [number, number][] {
  const size = x.length / buckets;
  return Array.from({ length: buckets }, (_, b) => {
    let lo = Infinity;
    let hi = -Infinity;
    for (let i = Math.floor(b * size); i < Math.min(x.length, Math.floor((b + 1) * size)); i++) {
      if (x[i]! < lo) lo = x[i]!;
      if (x[i]! > hi) hi = x[i]!;
    }
    return [lo, hi];
  });
}
