import { describe, expect, it } from "vitest";
import { BCI_CHECKED, BCI_DEPTHS, BCI_LANDSCAPE, BCI_STAGES } from "@/content/bciToday";
import { BRAIN_AREAS, ELECTRODES, GUIDE_GROUPS, GUIDES, SPECIES, TREE_ERAS, TREE_LINKS, TREE_PEOPLE, TREE_TIES } from "@/content/learn";
import { RESEARCH } from "@/content/research";
import { ancestors, connection, crowdedPairs, linkCollisions, mentorsOf } from "@/lib/tree";

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

describe("family tree", () => {
  it("links only people who are on the tree, mentor above trainee", () => {
    const people = new Map(TREE_PEOPLE.map((p) => [p.id, p]));
    expect(people.size).toBe(TREE_PEOPLE.length);
    for (const l of TREE_LINKS) {
      expect(people.has(l.from), l.from).toBe(true);
      expect(people.has(l.to), l.to).toBe(true);
      expect(people.get(l.to)!.row, `${l.from}→${l.to}`).toBeGreaterThan(people.get(l.from)!.row);
    }
    for (const t of TREE_TIES) expect(people.has(t.a) && people.has(t.b), `${t.a}–${t.b}`).toBe(true);
  });

  it("draws no line through anyone's name, and no two names overlap", () => {
    expect(linkCollisions()).toEqual([]);
    expect(crowdedPairs()).toEqual([]);
  });

  it("gives every person a link to someone, and keeps rows within the eras", () => {
    for (const p of TREE_PEOPLE) {
      expect(TREE_LINKS.some((l) => l.from === p.id || l.to === p.id), p.id).toBe(true);
      expect(p.row).toBeLessThan(TREE_ERAS.length);
    }
  });

  it("connects me to my three labs and finds chains between branches", () => {
    expect(mentorsOf("qin").map((l) => l.from).sort()).toEqual(["hai", "hatsopoulos", "rosenberg"]);
    expect(ancestors("qin").has("donoghue")).toBe(true);
    const path = connection("qin", "hubel")!;
    expect(path[0]!.from).toBe("qin");
    expect(path.at(-1)!.to).toBe("hubel");
    for (let i = 1; i < path.length; i++) expect(path[i]!.from).toBe(path[i - 1]!.to);
    expect(connection("qin", "qin")).toEqual([]);
    expect(connection("qin", "nicolelis")).toBeNull();
  });
});

describe("field guide index", () => {
  it("puts every guide in a known group and features three on the home page", () => {
    const groups = new Set(GUIDE_GROUPS.map((g) => g.id));
    for (const g of GUIDES) expect(groups.has(g.group), g.slug).toBe(true);
    expect(GUIDES.filter((g) => g.featured).length).toBe(3);
  });
});

describe("BCIs today", () => {
  it("dates the page and sources every entry", () => {
    expect(Number.isNaN(Date.parse(BCI_CHECKED))).toBe(false);
    const depths = new Set(BCI_DEPTHS.map((d) => d.id));
    const stages = new Set(BCI_STAGES.map((s) => s.id));
    for (const e of BCI_LANDSCAPE) {
      expect(depths.has(e.depth) && stages.has(e.stage), e.id).toBe(true);
      expect(e.sources.length, e.id).toBeGreaterThan(0);
      for (const s of e.sources) expect(s.url.startsWith("https://"), s.url).toBe(true);
    }
    expect(new Set(BCI_LANDSCAPE.map((e) => e.id)).size).toBe(BCI_LANDSCAPE.length);
  });
});
