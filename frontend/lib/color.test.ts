import { describe, expect, it } from "vitest";
import { contrast, readableInk } from "@/lib/color";

describe("readableInk", () => {
  it("picks the ink with more contrast and always reaches WCAG AA", () => {
    expect(readableInk([255, 255, 255])).toBe("#000000");
    expect(readableInk([31, 63, 115])).toBe("#ffffff");
    expect(contrast([0, 0, 0], [255, 255, 255])).toBeCloseTo(21);
    // Sweep every grey and the figure's sand → red scale: the chosen ink is always ≥ 4.5:1.
    const fills: [number, number, number][] = [];
    for (let v = 0; v <= 255; v++) fills.push([v, v, v]);
    for (let t = 0; t <= 1.0001; t += 0.01) fills.push([254 - t * 120, 240 - t * 205, 200 - t * 170].map(Math.round) as [number, number, number]);
    for (const fill of fills) {
      const ink = readableInk(fill) === "#000000" ? ([0, 0, 0] as [number, number, number]) : ([255, 255, 255] as [number, number, number]);
      expect(contrast(fill, ink)).toBeGreaterThanOrEqual(4.5);
    }
  });
});
