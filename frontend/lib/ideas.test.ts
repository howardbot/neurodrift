import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { IDEA_PARTS, IDEAS, ideaBySlug } from "@/content/ideas";

const page = readFileSync(path.join(__dirname, "../app/ideas/page.tsx"), "utf8");

describe("ideas", () => {
  it("are numbered in order with unique slugs, parts in contents order", () => {
    expect(IDEAS.map((i) => i.n)).toEqual(IDEAS.map((_, k) => k + 1));
    expect(new Set(IDEAS.map((i) => i.slug)).size).toBe(IDEAS.length);
    const partOrder = IDEA_PARTS.map((p) => p.id);
    const parts = IDEAS.map((i) => partOrder.indexOf(i.part));
    expect(parts.every((p) => p >= 0)).toBe(true);
    expect(parts).toEqual([...parts].sort((a, b) => a - b));
  });

  it("each have further reading", () => {
    for (const i of IDEAS) {
      expect(i.reading.length, i.slug).toBeGreaterThan(0);
      for (const s of i.reading) expect(s.year, s.title).toBeLessThanOrEqual(2026);
    }
  });

  it("each appear on the page exactly once, in order", () => {
    const used = [...page.matchAll(/ideaBySlug\("([^"]+)"\)/g)].map((m) => m[1]);
    expect(used).toEqual(IDEAS.map((i) => i.slug));
    expect(() => ideaBySlug("nope")).toThrow();
  });
});
