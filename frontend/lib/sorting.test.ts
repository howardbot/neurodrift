import { describe, expect, it } from "vitest";
import { SORT_METHODS, SORT_QUESTIONS, SORT_RULES } from "@/content/learn";
import { DEFAULT_ANSWERS, NOISE_UNIT, inBox, kmeans, makeSpikeCloud, rankMethods, scoreGroup, type SortAnswers } from "@/lib/sorting";

const top = (a: Partial<SortAnswers>) => rankMethods({ ...DEFAULT_ANSWERS, ...a })[0]!.id;

describe("spike cloud", () => {
  it("is reproducible and has every source", () => {
    const a = makeSpikeCloud(3, false);
    expect(a).toEqual(makeSpikeCloud(3, false));
    expect(new Set(a.map((p) => p.unit))).toEqual(new Set([0, 1, 2, NOISE_UNIT]));
  });

  it("drift moves the neurons but not the background", () => {
    const still = makeSpikeCloud(3, false);
    const moving = makeSpikeCloud(3, true);
    const late = (pts: typeof still, u: number) => pts.filter((p) => p.unit === u && p.t > 0.8);
    const meanX = (pts: typeof still) => pts.reduce((s, p) => s + p.x, 0) / pts.length;
    expect(meanX(late(moving, 0))).toBeGreaterThan(meanX(late(still, 0)) + 8);
    expect(meanX(late(moving, NOISE_UNIT))).toBeCloseTo(meanX(late(still, NOISE_UNIT)), 6);
  });

  it("scores a box drawn around one neuron as mostly that neuron", () => {
    const pts = makeSpikeCloud(3, false);
    const s = scoreGroup(pts, (p) => inBox(p, { x0: 128, y0: 52, x1: 175, y1: 92 }));
    expect(s.unit).toBe(0);
    expect(s.purity).toBeGreaterThan(0.9);
    expect(s.completeness).toBeGreaterThan(0.8);
  });

  it("k-means finds the three neurons without drift", () => {
    const pts = makeSpikeCloud(3, false);
    const labels = kmeans(pts, 4, 2);
    const scores = [0, 1, 2, 3].map((c) => scoreGroup(pts, (_, i) => labels[i] === c));
    for (const u of [0, 1, 2]) expect(scores.some((s) => s.unit === u && s.purity > 0.85), `unit ${u}`).toBe(true);
  });
});

describe("method chooser", () => {
  it("has rules only for real methods, questions and answers", () => {
    const methods = new Set(SORT_METHODS.map((m) => m.id));
    for (const r of SORT_RULES) {
      expect(methods.has(r.method)).toBe(true);
      const q = SORT_QUESTIONS.find((x) => x.id === r.question);
      expect(q?.options.some((o) => o.id === r.answer), `${r.method} ${r.question}=${r.answer}`).toBe(true);
    }
  });

  it("matches common practice for typical set-ups", () => {
    // A clinical BCI: Utah array, decoding live.
    expect(top({ probe: "array", goal: "population", when: "live", time: "minutes" })).toBe("threshold");
    // Neuropixels, single neurons, offline, with drift.
    expect(top({ probe: "dense", goal: "cells", when: "offline", drift: "drifts", time: "hours" })).toBe("template");
    // Following one neuron on a single wire during the experiment.
    expect(top({ probe: "wire", goal: "cells", when: "live", drift: "stable", time: "minutes" })).toBe("window");
    // Tetrodes, offline, lots of time: the traditional hand sort.
    expect(top({ probe: "tetrode", goal: "cells", when: "offline", drift: "stable", time: "days" })).toBe("manual");
    // Tetrodes, offline, a few hours: automatic clustering.
    expect(top({ probe: "tetrode", goal: "cells", when: "offline", drift: "stable", time: "hours" })).toBe("clustering");
  });

  it("explains every score it gives", () => {
    for (const m of rankMethods(DEFAULT_ANSWERS)) if (m.score !== 0) expect(m.reasons.length + m.cautions.length).toBeGreaterThan(0);
  });
});
