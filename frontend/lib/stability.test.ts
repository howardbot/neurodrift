import { describe, expect, it } from "vitest";
import { meanByDistance, stabilityProfile } from "@/lib/stability";

const r = [
  [0.9, 0.7, null],
  [0.6, 0.8, 0.5],
  [0.4, 0.6, 0.85],
];
const angle = [
  [10, 20, 30],
  [22, 12, 18],
  [35, 19, 11],
];

describe("stabilityProfile", () => {
  it("reads one training row with distances and directions", () => {
    const p = stabilityProfile(r, 1, angle);
    expect(p.map((x) => x.distance)).toEqual([1, 0, 1]);
    expect(p.map((x) => x.direction)).toEqual(["before", "same", "after"]);
    expect(p.map((x) => x.r)).toEqual([0.6, 0.8, 0.5]);
    expect(p.map((x) => x.angle)).toEqual([22, 12, 18]);
    expect(p[0]!.chance).toBeNull();
  });

  it("keeps missing cells and experiments without subspace results as null", () => {
    const p = stabilityProfile(r, 0);
    expect(p[2]).toMatchObject({ distance: 2, r: null, angle: null });
  });
});

describe("meanByDistance", () => {
  it("averages available cells at each |i − j|", () => {
    const m = meanByDistance(r);
    expect(m.map((d) => d.n)).toEqual([3, 4, 1]);
    expect(m[0]!.mean).toBeCloseTo(0.85);
    expect(m[1]!.mean).toBeCloseTo((0.7 + 0.6 + 0.5 + 0.6) / 4);
    expect(m[2]!.mean).toBeCloseTo(0.4);
    expect(meanByDistance([[null]])).toEqual([{ distance: 0, mean: null, n: 0 }]);
  });
});
