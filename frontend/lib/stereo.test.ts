import { describe, expect, it } from "vitest";
import { RDS_SIZE, disparityAt, eyeGeometry, makeStereogram } from "@/lib/stereo";

describe("random-dot stereogram", () => {
  it("left and right images differ only where the hidden shape is", () => {
    const { left, right } = makeStereogram("square", 4, 1);
    for (let y = 0; y < RDS_SIZE; y++)
      for (let x = 0; x < RDS_SIZE; x++)
        if (disparityAt("square", 4, x, y) === 0) expect(right[y * RDS_SIZE + x]).toBe(left[y * RDS_SIZE + x]);
  });

  it("shifts the shape left in the right eye's image for a near (crossed) shape", () => {
    const { left, right } = makeStereogram("square", 4, 1);
    const y = RDS_SIZE / 2;
    for (let x = 50; x < 70; x++) expect(right[y * RDS_SIZE + x]).toBe(left[y * RDS_SIZE + x + 4]);
  });

  it("looks like noise to one eye: about half the dots on", () => {
    const { left } = makeStereogram("letters", 3, 2);
    const on = left.reduce((s, v) => s + v, 0) / left.length;
    expect(on).toBeGreaterThan(0.45);
    expect(on).toBeLessThan(0.55);
  });

  it("gives the tilted disc a smooth gradient of disparity", () => {
    expect(disparityAt("slant", 6, 30, 60)).toBeLessThan(0);
    expect(disparityAt("slant", 6, 90, 60)).toBeGreaterThan(0);
  });
});

describe("binocular geometry", () => {
  const eyes = { lx: 130, rx: 190, y: 236 };
  const fix = { x: 160, y: 78 };
  it("is crossed for nearer objects and uncrossed for farther ones", () => {
    expect(eyeGeometry(eyes, fix, { x: 160, y: 150 }).disparity).toBeGreaterThan(0);
    expect(eyeGeometry(eyes, fix, { x: 160, y: 30 }).disparity).toBeLessThan(0);
    expect(Math.abs(eyeGeometry(eyes, fix, fix).disparity)).toBeLessThan(1e-9);
  });
});
