import { TREE_LINKS, TREE_PEOPLE, TREE_TIES, type TreeLink, type TreePerson } from "@/content/learn";

// Geometry and graph helpers for the academic family tree (/learn/family-tree).

export const NODE_W = 92;
export const NODE_H = 30;
export const ROW_H = 78;
export const TOP = 26;

export const personById = new Map(TREE_PEOPLE.map((p) => [p.id, p]));

export function nodeY(row: number): number {
  return TOP + row * ROW_H + ROW_H / 2;
}

export const TREE_WIDTH = Math.max(...TREE_PEOPLE.map((p) => p.x)) + NODE_W / 2 + 14;

/** Mentor (top) to trainee (bottom): leaves and arrives vertically, straight in between. */
export function linkPath(link: Pick<TreeLink, "from" | "to">): string {
  const a = personById.get(link.from)!;
  const b = personById.get(link.to)!;
  const x0 = a.x;
  const y0 = nodeY(a.row) + NODE_H / 2;
  const x1 = b.x;
  const y1 = nodeY(b.row) - NODE_H / 2;
  const k = Math.min((y1 - y0) / 2, 30);
  return `M${x0} ${y0} C${x0} ${y0 + k}, ${x1} ${y1 - k}, ${x1} ${y1}`;
}

/** Partnerships: a shallow arc between the two people's sides or tops. */
export function tiePath(aId: string, bId: string): string {
  const [a, b] = [personById.get(aId)!, personById.get(bId)!].sort((p, q) => p.x - q.x) as [TreePerson, TreePerson];
  const ya = nodeY(a.row);
  const yb = nodeY(b.row);
  if (a.row === b.row) {
    const y = ya - NODE_H / 2;
    const mid = (a.x + b.x) / 2;
    return `M${a.x} ${y} Q${mid} ${y - 30}, ${b.x} ${y}`;
  }
  const x0 = a.x + NODE_W / 2;
  const x1 = b.x - NODE_W / 2;
  const bow = Math.min(60, Math.abs(x1 - x0) / 3);
  return `M${x0} ${ya} C${x0 + bow} ${ya}, ${x1 - bow} ${yb}, ${x1} ${yb}`;
}

/** Points along a cubic Bézier path "M x y C x y, x y, x y" (as built above). */
export function sampleCubic(d: string, n = 60): [number, number][] {
  const v = d.match(/-?\d+(\.\d+)?/g)!.map(Number);
  const [x0, y0, x1, y1, x2, y2, x3, y3] = v as [number, number, number, number, number, number, number, number];
  return Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n;
    const u = 1 - t;
    return [
      u * u * u * x0 + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x3,
      u * u * u * y0 + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * y3,
    ];
  });
}

/** People whose box a mentorship line passes through (other than its two ends). */
export function linkCollisions(pad = 4): { link: string; person: string }[] {
  const out: { link: string; person: string }[] = [];
  for (const l of TREE_LINKS) {
    const pts = sampleCubic(linkPath(l));
    for (const p of TREE_PEOPLE) {
      if (p.id === l.from || p.id === l.to) continue;
      const cy = nodeY(p.row);
      const hit = pts.some(([x, y]) => Math.abs(x - p.x) < NODE_W / 2 + pad && Math.abs(y - cy) < NODE_H / 2 + pad);
      if (hit) out.push({ link: `${l.from}→${l.to}`, person: p.id });
    }
  }
  return out;
}

/** Pairs of people in the same row whose boxes are closer than `gap`. */
export function crowdedPairs(gap = 8): string[] {
  const out: string[] = [];
  for (const a of TREE_PEOPLE)
    for (const b of TREE_PEOPLE)
      if (a.id < b.id && a.row === b.row && Math.abs(a.x - b.x) < NODE_W + gap) out.push(`${a.id}/${b.id}`);
  return out;
}

export function mentorsOf(id: string): TreeLink[] {
  return TREE_LINKS.filter((l) => l.to === id);
}

export function traineesOf(id: string): TreeLink[] {
  return TREE_LINKS.filter((l) => l.from === id);
}

function walk(start: string, next: (id: string) => string[]): Set<string> {
  const seen = new Set<string>();
  const stack = [start];
  while (stack.length) {
    for (const n of next(stack.pop()!)) {
      if (!seen.has(n)) {
        seen.add(n);
        stack.push(n);
      }
    }
  }
  return seen;
}

/** Everyone above a person in the tree (their mentors, their mentors' mentors, …). */
export function ancestors(id: string): Set<string> {
  return walk(id, (n) => mentorsOf(n).map((l) => l.from));
}

/** Everyone below a person in the tree. */
export function descendants(id: string): Set<string> {
  return walk(id, (n) => traineesOf(n).map((l) => l.to));
}

/** Number of mentor generations from a person up to their furthest ancestor on the map. */
export function generationsUp(id: string): number {
  const ms = mentorsOf(id);
  return ms.length ? 1 + Math.max(...ms.map((l) => generationsUp(l.from))) : 0;
}

export interface PathStep {
  from: string;
  to: string;
  /** How the two are connected, phrased from `from` to `to`. */
  how: string;
  kind: "mentor" | "trainee" | "tie";
}

/**
 * Shortest chain between two people, through mentorships and (slightly less preferred)
 * famous partnerships. Returns null when this slice of the tree does not connect them.
 */
export function connection(a: string, b: string): PathStep[] | null {
  if (a === b) return [];
  type Edge = { to: string; w: number; step: PathStep };
  const adj = new Map<string, Edge[]>();
  const add = (x: string, e: Edge) => adj.set(x, [...(adj.get(x) ?? []), e]);
  for (const l of TREE_LINKS) {
    add(l.from, { to: l.to, w: 1, step: { from: l.from, to: l.to, kind: "trainee", how: "mentored" } });
    add(l.to, { to: l.from, w: 1, step: { from: l.to, to: l.from, kind: "mentor", how: "trained with" } });
  }
  for (const t of TREE_TIES) {
    add(t.a, { to: t.b, w: 1.25, step: { from: t.a, to: t.b, kind: "tie", how: t.what } });
    add(t.b, { to: t.a, w: 1.25, step: { from: t.b, to: t.a, kind: "tie", how: t.what } });
  }
  // Dijkstra on a few dozen nodes: a linear scan for the closest is plenty.
  const dist = new Map<string, number>([[a, 0]]);
  const prev = new Map<string, PathStep>();
  const done = new Set<string>();
  while (true) {
    let cur: string | null = null;
    for (const [n, d] of dist) if (!done.has(n) && (cur === null || d < dist.get(cur)!)) cur = n;
    if (cur === null) return null;
    if (cur === b) break;
    done.add(cur);
    for (const e of adj.get(cur) ?? []) {
      const d = dist.get(cur)! + e.w;
      if (d < (dist.get(e.to) ?? Infinity)) {
        dist.set(e.to, d);
        prev.set(e.to, e.step);
      }
    }
  }
  const steps: PathStep[] = [];
  for (let n = b; n !== a; ) {
    const s = prev.get(n)!;
    steps.unshift(s);
    n = s.from;
  }
  return steps;
}
