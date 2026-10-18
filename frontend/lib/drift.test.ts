import { describe, expect, it } from "vitest";
import { analyseDay, ccaMap, makeArray, setUpLab, unitOn } from "@/lib/drift";
import { matmul, inverse } from "@/lib/linalg";
import { gauss, rng } from "@/lib/random";

describe("a month on one array", () => {
  const lab = setUpLab();

  it("replaces more neurons as days pass", () => {
    const array = makeArray(3);
    const changed = (d: number) => array.filter((ch) => unitOn(ch, d).isNew).length;
    expect(changed(0)).toBe(0);
    expect(changed(30)).toBeGreaterThan(changed(10));
  });

  it("a fixed decoder degrades; aligning the patterns rescues it", () => {
    const d0 = analyseDay(lab, 0);
    const d20 = analyseDay(lab, 20);
    expect(d0.fixed).toBeGreaterThan(0.85);
    expect(d20.fixed).toBeLessThan(d0.fixed - 0.3);
    expect(d20.aligned).toBeGreaterThan(0.8);
    expect(d20.retrained).toBeGreaterThan(0.85);
  });

  it("CCA recovers a known linear mixing of the patterns", () => {
    const rand = rng(2);
    const A = Array.from({ length: 200 }, () => [gauss(rand), gauss(rand), gauss(rand)]);
    const T = [
      [1.2, 0.3, -0.4],
      [-0.2, 0.9, 0.5],
      [0.4, -0.6, 1.1],
    ];
    const B = matmul(A, inverse(T)); // so that A = B T
    const M = ccaMap(A, B);
    M.forEach((row, i) => row.forEach((v, j) => expect(v).toBeCloseTo(T[i]![j]!, 4)));
  });
});
