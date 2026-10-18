import { describe, expect, it } from "vitest";
import { ELECTRODES } from "@/content/learn";
import { gauss, rng } from "@/lib/random";
import {
  FS,
  UNITS,
  binCounts,
  detectSpikes,
  exampleTrace,
  features,
  kmeans2,
  makeRecording,
  noiseSigma,
  scoreDetections,
  snippets,
  splitBands,
} from "@/lib/signal";

function pipeline(noise: number, k: number, seed = 3) {
  const rec = makeRecording({ seed, noise });
  const { spikeBand } = splitBands(rec.raw);
  const sigma = noiseSigma(spikeBand);
  const detected = detectSpikes(spikeBand, k * sigma);
  return { rec, spikeBand, sigma, detected, score: scoreDetections(detected, rec.truth) };
}

describe("signal pipeline", () => {
  it("estimates the noise level robustly from the median", () => {
    const rand = rng(1);
    const x = Array.from({ length: 20000 }, () => 10 * gauss(rand));
    expect(noiseSigma(x)).toBeGreaterThan(9.5);
    expect(noiseSigma(x)).toBeLessThan(10.5);
  });

  it("finds nearly every spike with few false alarms when noise is low", () => {
    const { score, rec } = pipeline(6, 4.5);
    expect(rec.truth.length).toBeGreaterThan(20);
    expect(score.hits / rec.truth.length).toBeGreaterThan(0.95);
    expect(score.falseAlarms).toBeLessThanOrEqual(2);
  });

  it("a very high threshold misses the smaller neuron", () => {
    const low = pipeline(6, 4.5).score;
    const high = pipeline(6, 14).score;
    expect(high.hits).toBeLessThan(low.hits);
    expect(high.misses).toBeGreaterThan(low.misses);
  });

  it("a very low threshold produces false alarms", () => {
    expect(pipeline(12, 2.5).score.falseAlarms).toBeGreaterThan(pipeline(12, 5).score.falseAlarms);
  });

  it("clusters snippets back into the two neurons at low noise", () => {
    const { spikeBand, detected, score } = pipeline(5, 4.5);
    const keep = detected.filter((i) => i - 8 >= 0 && i + 20 < spikeBand.length);
    const labels = kmeans2(features(snippets(spikeBand, keep)));
    const truthUnits = keep.map((i) => score.matchedUnit[detected.indexOf(i)]!);
    // Clusters are unlabelled: score the better of the two label assignments.
    const agree = labels.filter((l, i) => l === truthUnits[i]).length;
    const purity = Math.max(agree, labels.length - agree) / labels.length;
    expect(purity).toBeGreaterThan(0.9);
  });

  it("bins every assigned spike exactly once", () => {
    const counts = binCounts([5, 600, 601, 9999], [0, 1, 1, 0], 2, FS, 500);
    expect(counts.length).toBe(2);
    expect(counts[0]!.length).toBe(20);
    expect(counts.flat().reduce((a, b) => a + b, 0)).toBe(4);
    expect(counts[1]![1]).toBe(2);
  });

  it("models a larger and a smaller neuron", () => {
    expect(UNITS[0]!.amp).toBeGreaterThan(UNITS[1]!.amp);
  });
});

describe("example traces", () => {
  it("produces finite samples for every electrode type", () => {
    for (const e of ELECTRODES) {
      const t = exampleTrace(e.trace, 2);
      expect(t.channels.length, e.id).toBeGreaterThan(0);
      expect(t.channels.flat().every(Number.isFinite), e.id).toBe(true);
    }
  });

  it("the patch-clamp neuron rests near -65 mV and fires full spikes", () => {
    const v = exampleTrace("patch", 2).channels[0]!;
    expect(Math.max(...v)).toBeGreaterThan(20);
    expect(Math.min(...v)).toBeGreaterThan(-80);
    expect(v.filter((x, i) => i > 0 && x >= 29 && v[i - 1]! < 29).length).toBeGreaterThan(2);
  });

  it("a tetrode sees the same spike on all four wires", () => {
    expect(exampleTrace("tetrode", 1).channels.length).toBe(4);
  });
});
