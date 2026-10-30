import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { BCI_SITES } from "@/content/bciToday";
import { BRAIN_AREAS, BRAIN_ROUTES } from "@/content/learn";
import { areaAnchor, nearestVertex, parseBrain3D, type Brain3DMesh } from "@/lib/brain3d";

const file = readFileSync(path.join(__dirname, "../public/brain3d/brain-v1.bin"));
const brain = parseBrain3D(file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength));
const mesh = (name: string) => brain.meshes.find((m) => m.info.name === name)!;
const left = mesh("cortex-left");
const right = mesh("cortex-right");
const idx = (id: string) => brain.header.areas.indexOf(id) + 1;
const count = (m: Brain3DMesh, id: string) => m.area!.filter((a) => a === idx(id)).length;
const dist = (m: Brain3DMesh, i: number, p: number[]) => Math.hypot(m.positions[3 * i]! - p[0]!, m.positions[3 * i + 1]! - p[1]!, m.positions[3 * i + 2]! - p[2]!);

describe("3D brain model", () => {
  it("uses the brain map's areas, in order", () => {
    expect(brain.header.areas).toEqual(BRAIN_AREAS.map((a) => a.id));
  });

  it("has valid meshes in MNI space", () => {
    const range = (m: Brain3DMesh, axis: number) => {
      let lo = Infinity;
      let hi = -Infinity;
      for (let i = axis; i < m.positions.length; i += 3) {
        lo = Math.min(lo, m.positions[i]!);
        hi = Math.max(hi, m.positions[i]!);
      }
      return [lo, hi];
    };
    for (const m of brain.meshes) {
      expect(m.indices.length, m.info.name).toBe(m.info.triangles * 3);
      expect(m.indices.reduce((a, b) => Math.max(a, b), 0), m.info.name).toBeLessThan(m.info.vertices);
      const [x0, x1] = range(m, 0);
      const [y0, y1] = range(m, 1);
      const [z0, z1] = range(m, 2);
      expect(Math.max(-x0!, x1!), m.info.name).toBeLessThan(80);
      expect(y0, m.info.name).toBeGreaterThan(-125);
      expect(y1, m.info.name).toBeLessThan(80);
      expect(z0, m.info.name).toBeGreaterThan(-80);
      expect(z1, m.info.name).toBeLessThan(90);
    }
    // Left hemisphere on the left (negative x), right on the right.
    expect(range(left, 0)[1]).toBeLessThan(0);
    expect(range(right, 0)[0]).toBeGreaterThan(0);
  });

  it("gives every area a place: a patch of cortex or a structure of its own", () => {
    for (const a of BRAIN_AREAS) {
      if (a.group === "Deep structures" || a.id === "cerebellum") {
        expect(brain.meshes.some((m) => m.info.region === a.id), a.id).toBe(true);
      } else {
        expect(count(left, a.id), a.id).toBeGreaterThan(40);
      }
    }
    // Broca's and Wernicke's areas are drawn on the left only, as they usually are in the brain.
    expect(count(right, "broca")).toBe(0);
    expect(count(right, "wernicke")).toBe(0);
  });

  it("puts each BCI program close to its area", () => {
    for (const s of BCI_SITES) {
      if (s.how === "deep") {
        const region = brain.meshes.find((m) => m.info.region === s.area && m.info.side === (s.mni[0] < 0 ? "left" : "right"))!;
        expect(dist(region, nearestVertex(region.positions, s.mni), s.mni), s.id).toBeLessThan(12);
      } else {
        const cortex = s.mni[0] < 0 ? left : right;
        const v = nearestVertex(cortex.positions, s.mni);
        expect(dist(cortex, v, s.mni), s.id).toBeLessThan(15);
        const near = nearestVertex(cortex.positions, s.mni, (i) => cortex.area![i] === idx(s.area));
        expect(dist(cortex, near, s.mni), s.id).toBeLessThan(20);
      }
    }
  });

  it("has a place on the left cortex for every stop on every route", () => {
    for (const r of BRAIN_ROUTES) for (const id of r.steps) expect(areaAnchor(left, idx(id)), `${r.id} ${id}`).toBeGreaterThanOrEqual(0);
  });
});
