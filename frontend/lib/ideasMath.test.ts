import { describe, expect, it } from "vitest";
import { automaton, LORENZ_LYAPUNOV, lorenzTwins } from "@/lib/ideasMath";

describe("butterfly effect", () => {
  it("starts the twins the given distance apart", () => {
    const run = lorenzTwins(1e-6, 10);
    expect(run.dist[0]).toBeCloseTo(1e-6, 12);
    expect(run.a[0]! - run.b[0]!).toBeCloseTo(-1e-6, 12);
  });

  it("buys about the same extra time for each extra digit of precision", () => {
    const parts = [3, 6, 9, 12].map((d) => lorenzTwins(10 ** -d, 60).partsAt);
    for (let i = 1; i < parts.length; i++) expect(parts[i]!).toBeGreaterThan(parts[i - 1]!);
    // Three digits at a time: roughly 3 × ln(10) / λ ≈ 7.6 time units, give or take chaos.
    const perThree = (parts[3]! - parts[0]!) / 3;
    expect(perThree).toBeGreaterThan(4);
    expect(perThree).toBeLessThan(12);
    expect(Math.LN10 / LORENZ_LYAPUNOV).toBeCloseTo(2.54, 1);
  });
});

describe("cellular automata", () => {
  const one = (n: number) => Array.from({ length: n }, (_, i) => i === Math.floor(n / 2));

  it("Rule 30 grows the classic pattern from one cell", () => {
    const g = automaton(30, one(11), 3);
    expect(g[1]!.map(Number).join("")).toBe("00001110000");
    expect(g[2]!.map(Number).join("")).toBe("00011001000");
  });

  it("Rule 90 from one cell is Pascal's triangle with the odd numbers marked", () => {
    const n = 41;
    const g = automaton(90, one(n), 16);
    const binomial = (a: number, b: number): number => (b < 0 || b > a ? 0 : b === 0 || b === a ? 1 : binomial(a - 1, b - 1) + binomial(a - 1, b));
    for (let row = 0; row < 16; row++) {
      for (let k = -row; k <= row; k += 2) expect(g[row]![20 + k], `row ${row}, offset ${k}`).toBe(binomial(row, (row + k) / 2) % 2 === 1);
    }
  });
});
