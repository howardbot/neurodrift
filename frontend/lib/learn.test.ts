import { describe, expect, it } from "vitest";
import { BRAIN_AREAS, ELECTRODES, GUIDES, SPECIES } from "@/content/learn";
import { RESEARCH } from "@/content/research";

describe("field guide content", () => {
  it("has unique guide slugs", () => {
    expect(new Set(GUIDES.map((g) => g.slug)).size).toBe(GUIDES.length);
  });

  it("links brain areas only to research pages that exist", () => {
    const slugs = new Set(RESEARCH.map((r) => r.slug));
    for (const a of BRAIN_AREAS) for (const p of a.projects) expect(slugs.has(p), `${a.id} → ${p}`).toBe(true);
  });

  it("keeps area labels inside the map", () => {
    for (const a of BRAIN_AREAS) {
      expect(a.label[0], a.id).toBeGreaterThan(0);
      expect(a.label[0], a.id).toBeLessThan(600);
      expect(a.label[1], a.id).toBeGreaterThan(0);
      expect(a.label[1], a.id).toBeLessThan(340);
    }
  });

  it("orders species from largest to smallest brain", () => {
    const grams = SPECIES.map((s) => s.grams);
    expect(grams).toEqual([...grams].sort((a, b) => b - a));
  });

  it("orders electrodes from outside the head to inside a cell", () => {
    const crowd = ELECTRODES.map((e) => e.crowd);
    expect(crowd[0]).toBe(1);
    expect(crowd[crowd.length - 1]).toBe(0);
  });
});
