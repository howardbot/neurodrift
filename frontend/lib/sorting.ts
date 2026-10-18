import { SORT_METHODS, SORT_QUESTIONS, SORT_RULES, type SortMethodId, type SortQuestion } from "@/content/learn";
import { gauss, rng } from "@/lib/random";

// Toy spike-sorting data and the scoring behind /learn/sorting-methods.

export interface SpikePoint {
  /** Spike height on wire 1 and wire 2 of a tetrode-like electrode, µV. */
  x: number;
  y: number;
  /** True source: 0–2 are neurons, 3 is background "hash" from distant cells. */
  unit: number;
  /** Time in the recording, 0 (start) … 1 (end). */
  t: number;
}

export const CLOUD_UNITS = [
  { n: 130, x: 150, y: 72, sx: 11, sy: 9 },
  { n: 110, x: 84, y: 146, sx: 9, sy: 12 },
  { n: 90, x: 116, y: 110, sx: 9, sy: 9 },
] as const;
export const HASH = { n: 70, x: 64, y: 62, sx: 9, sy: 9 };
export const NOISE_UNIT = 3;

/** Electrode drift over the recording: as the wires slide closer, every neuron's spikes grow on both. */
export const DRIFT = { x: 30, y: 28 };

export function makeSpikeCloud(seed: number, drift: boolean): SpikePoint[] {
  const rand = rng(seed);
  const out: SpikePoint[] = [];
  const add = (unit: number, c: { n: number; x: number; y: number; sx: number; sy: number }, moves: boolean) => {
    for (let i = 0; i < c.n; i++) {
      const t = rand();
      const shift = drift && moves ? t - 0.5 : 0;
      out.push({ x: c.x + DRIFT.x * shift + c.sx * gauss(rand), y: c.y + DRIFT.y * shift + c.sy * gauss(rand), unit, t });
    }
  };
  CLOUD_UNITS.forEach((c, u) => add(u, c, true));
  add(NOISE_UNIT, HASH, false);
  return out;
}

export interface Box {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export function inBox(p: SpikePoint, b: Box): boolean {
  return p.x >= Math.min(b.x0, b.x1) && p.x <= Math.max(b.x0, b.x1) && p.y >= Math.min(b.y0, b.y1) && p.y <= Math.max(b.y0, b.y1);
}

export interface GroupScore {
  count: number;
  /** The true source most of the group's spikes came from (−1 for an empty group). */
  unit: number;
  /** Share of the group's spikes that came from that source. */
  purity: number;
  /** Share of that source's spikes that the group caught. */
  completeness: number;
}

export function scoreGroup(points: SpikePoint[], member: (p: SpikePoint, i: number) => boolean): GroupScore {
  const counts = [0, 0, 0, 0];
  let count = 0;
  points.forEach((p, i) => {
    if (member(p, i)) {
      counts[p.unit]!++;
      count++;
    }
  });
  if (!count) return { count: 0, unit: -1, purity: 0, completeness: 0 };
  const unit = counts.indexOf(Math.max(...counts));
  const total = points.filter((p) => p.unit === unit).length;
  return { count, unit, purity: counts[unit]! / count, completeness: counts[unit]! / total };
}

/** k-means with k-means++ starts; deterministic for a given seed. Returns a label per point. */
export function kmeans(points: SpikePoint[], k: number, seed = 1, iterations = 40): number[] {
  const rand = rng(seed);
  const d2 = (p: SpikePoint, c: [number, number]) => (p.x - c[0]) ** 2 + (p.y - c[1]) ** 2;
  const first = points[Math.floor(rand() * points.length)]!;
  const centres: [number, number][] = [[first.x, first.y]];
  while (centres.length < k) {
    const dist = points.map((p) => Math.min(...centres.map((c) => d2(p, c))));
    let r = rand() * dist.reduce((a, b) => a + b, 0);
    let i = 0;
    while (i < points.length - 1 && (r -= dist[i]!) > 0) i++;
    centres.push([points[i]!.x, points[i]!.y]);
  }
  let labels = points.map(() => 0);
  for (let it = 0; it < iterations; it++) {
    labels = points.map((p) => {
      let best = 0;
      for (let c = 1; c < k; c++) if (d2(p, centres[c]!) < d2(p, centres[best]!)) best = c;
      return best;
    });
    for (let c = 0; c < k; c++) {
      const mine = points.filter((_, i) => labels[i] === c);
      if (mine.length) centres[c] = [mine.reduce((a, p) => a + p.x, 0) / mine.length, mine.reduce((a, p) => a + p.y, 0) / mine.length];
    }
  }
  return labels;
}

export type SortAnswers = Record<SortQuestion["id"], string>;

export const DEFAULT_ANSWERS: SortAnswers = { probe: "dense", goal: "cells", when: "offline", drift: "drifts", time: "hours" };

export interface MethodScore {
  id: SortMethodId;
  score: number;
  reasons: string[];
  cautions: string[];
}

/** Ranks the method families for a set of answers, best first, with the reasons behind each score. */
export function rankMethods(answers: SortAnswers): MethodScore[] {
  const valid = SORT_QUESTIONS.every((q) => q.options.some((o) => o.id === answers[q.id]));
  if (!valid) throw new Error("Unknown answer");
  return SORT_METHODS.map((m) => {
    const hits = SORT_RULES.filter((r) => r.method === m.id && answers[r.question] === r.answer);
    return {
      id: m.id,
      score: hits.reduce((a, r) => a + r.delta, 0),
      reasons: hits.filter((r) => r.delta > 0).sort((a, b) => b.delta - a.delta).map((r) => r.why),
      cautions: hits.filter((r) => r.delta < 0).sort((a, b) => a.delta - b.delta).map((r) => r.why),
    };
  }).sort((a, b) => b.score - a.score || SORT_METHODS.findIndex((m) => m.id === a.id) - SORT_METHODS.findIndex((m) => m.id === b.id));
}
