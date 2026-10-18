"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { TREE_ERAS, TREE_LINK_LABEL, TREE_LINKS, TREE_PEOPLE, TREE_THEMES, TREE_TIES, type TreeLink, type TreePerson, type TreeTheme } from "@/content/learn";
import {
  NODE_H,
  NODE_W,
  ROW_H,
  TOP,
  TREE_WIDTH,
  ancestors,
  connection,
  descendants,
  generationsUp,
  linkPath,
  mentorsOf,
  nodeY,
  personById,
  tiePath,
  traineesOf,
  type PathStep,
} from "@/lib/tree";

const HEIGHT = TOP + TREE_ERAS.length * ROW_H + 8;

const THEME_NODE: Record<TreePerson["theme"], string> = {
  movement: "fill-emerald-50 stroke-emerald-500/70 dark:fill-emerald-400/10 dark:stroke-emerald-400/60",
  computation: "fill-violet-50 stroke-violet-500/70 dark:fill-violet-400/10 dark:stroke-violet-400/60",
  senses: "fill-sky-50 stroke-sky-500/70 dark:fill-sky-400/10 dark:stroke-sky-400/60",
  cells: "fill-amber-50 stroke-amber-500/70 dark:fill-amber-400/10 dark:stroke-amber-400/60",
  you: "fill-accent-600 stroke-accent-700 dark:fill-accent-300 dark:stroke-accent-100",
};

const NEUTRAL_NODE = "fill-zinc-50 stroke-zinc-300 dark:fill-zinc-900 dark:stroke-zinc-700";

const THEME_DOT: Record<TreePerson["theme"], string> = {
  movement: "bg-emerald-500",
  computation: "bg-violet-500",
  senses: "bg-sky-500",
  cells: "bg-amber-500",
  you: "bg-accent-600 dark:bg-accent-300",
};

const DASH: Record<TreeLink["kind"], string | undefined> = {
  phd: undefined,
  postdoc: "6 4",
  research: "1.5 3.5",
};

const byName = [...TREE_PEOPLE].sort((a, b) => (a.id === "qin" ? -1 : b.id === "qin" ? 1 : a.short.localeCompare(b.short)));
const nameOf = (id: string) => personById.get(id)!.name;

function linkBetween(a: string, b: string): TreeLink | undefined {
  return TREE_LINKS.find((l) => (l.from === a && l.to === b) || (l.from === b && l.to === a));
}

/** Edges on the selected person's lineage, each with how many generations it is from them. */
function lineage(id: string): {
  nodes: Set<string>;
  edges: Map<TreeLink, number>;
} {
  const up = ancestors(id);
  const down = descendants(id);
  const nodes = new Set([id, ...up, ...down]);
  const edges = new Map<TreeLink, number>();
  const spread = (start: string, next: (n: string) => TreeLink[], end: (l: TreeLink) => string) => {
    let frontier = [start];
    for (let depth = 0; frontier.length; depth++) {
      const nextFrontier: string[] = [];
      for (const n of frontier)
        for (const l of next(n)) {
          if (edges.has(l)) continue;
          edges.set(l, depth);
          nextFrontier.push(end(l));
        }
      frontier = nextFrontier;
    }
  };
  spread(id, mentorsOf, (l) => l.from);
  spread(id, traineesOf, (l) => l.to);
  return { nodes, edges };
}

export function FamilyTree() {
  const [selected, setSelected] = useState("qin");
  const [theme, setTheme] = useState<TreeTheme | "all">("all");
  const [showTies, setShowTies] = useState(false);
  const [pair, setPair] = useState<[string, string]>(["qin", "hubel"]);
  const [mode, setMode] = useState<"lineage" | "path">("lineage");
  const [replay, setReplay] = useState(0);

  // On narrow screens the tree scrolls sideways: keep the selected person in view.
  const scroller = useRef<HTMLDivElement>(null);
  const first = useRef(true);
  useEffect(() => {
    const el = scroller.current;
    if (!el || el.scrollWidth <= el.clientWidth) return;
    const x = (personById.get(selected)!.x / TREE_WIDTH) * el.scrollWidth;
    el.scrollTo({ left: x - el.clientWidth / 2, behavior: first.current ? "auto" : "smooth" });
    first.current = false;
  }, [selected]);

  const person = personById.get(selected)!;
  const family = useMemo(() => lineage(selected), [selected]);
  const path = useMemo(() => connection(pair[0], pair[1]), [pair]);

  const pathNodes = new Set(path ? [pair[0], ...path.map((s) => s.to)] : []);
  const lit = mode === "path" ? pathNodes : family.nodes;

  const select = (id: string) => {
    setSelected(id);
    setMode("lineage");
    setReplay((r) => r + 1);
  };
  const choosePair = (next: [string, string]) => {
    setPair(next);
    setMode("path");
    setReplay((r) => r + 1);
  };
  const surprise = () => {
    // A random pair that this slice of the tree connects, at least three steps apart.
    for (let tries = 0; tries < 200; tries++) {
      const a = TREE_PEOPLE[Math.floor(Math.random() * TREE_PEOPLE.length)]!.id;
      const b = TREE_PEOPLE[Math.floor(Math.random() * TREE_PEOPLE.length)]!.id;
      const p = connection(a, b);
      if (p && p.length >= 3) return choosePair([a, b]);
    }
  };

  // Overlay: the path, or the lineage drawn outward from the selected person.
  const overlay: { key: string; d: string; delay: number }[] =
    mode === "path" && path
      ? path.map((s, i) => {
          const l = linkBetween(s.from, s.to);
          return {
            key: `${s.from}-${s.to}`,
            d: s.kind === "tie" || !l ? tiePath(s.from, s.to) : linkPath(l),
            delay: i * 260,
          };
        })
      : [...family.edges].map(([l, depth]) => ({
          key: `${l.from}-${l.to}`,
          d: linkPath(l),
          delay: depth * 320,
        }));

  const myRoots = ancestors("qin");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Colour by field">
          {[{ id: "all" as const, label: "All fields" }, ...TREE_THEMES].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTheme(t.id)}
              aria-pressed={theme === t.id}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                theme === t.id
                  ? "bg-accent-600 text-white shadow-sm shadow-accent-600/30 dark:bg-accent-300 dark:text-zinc-900"
                  : "border border-zinc-300 bg-white/80 text-zinc-700 hover:border-accent-500/60 dark:border-zinc-700 dark:bg-zinc-900/80 dark:text-zinc-300"
              }`}
            >
              {t.id !== "all" && <span className={`h-2 w-2 rounded-full ${THEME_DOT[t.id]}`} />}
              {t.label}
            </button>
          ))}
        </div>
        <button type="button" className="btn btn-primary px-3 py-1.5 text-xs" onClick={() => select("qin")}>
          Trace my roots ↑
        </button>
      </div>

      <div ref={scroller} className="-mx-4 overflow-x-auto px-4 pb-1">
        <svg viewBox={`0 0 ${TREE_WIDTH} ${HEIGHT}`} className="w-full min-w-[860px]" role="group" aria-label="Academic family tree">
          {TREE_ERAS.map((era, r) => (
            <g key={era} aria-hidden="true">
              {r % 2 === 0 && <rect x={0} y={TOP + r * ROW_H} width={TREE_WIDTH} height={ROW_H} className="fill-zinc-100/60 dark:fill-zinc-800/30" />}
              <text x={6} y={TOP + r * ROW_H + 13} className="fill-zinc-400 text-[10px] uppercase tracking-wider dark:fill-zinc-500">
                {era}
              </text>
            </g>
          ))}
          <text x={TREE_WIDTH - 6} y={14} textAnchor="end" className="fill-zinc-400 text-[10px] dark:fill-zinc-500" aria-hidden="true">
            rows: roughly when each person trained
          </text>

          <g aria-hidden="true">
            {TREE_LINKS.map((l) => {
              const on = lit.has(l.from) && lit.has(l.to);
              return (
                <path
                  key={`${l.from}-${l.to}`}
                  d={linkPath(l)}
                  fill="none"
                  strokeDasharray={DASH[l.kind]}
                  strokeLinecap="round"
                  className={`transition-opacity duration-300 ${on ? "stroke-zinc-400 dark:stroke-zinc-500" : "stroke-zinc-300 opacity-80 dark:stroke-zinc-600"}`}
                  strokeWidth={1.4}
                />
              );
            })}
            {showTies &&
              TREE_TIES.map((t) => (
                <path
                  key={`${t.a}-${t.b}`}
                  d={tiePath(t.a, t.b)}
                  fill="none"
                  strokeDasharray="2 4"
                  strokeLinecap="round"
                  strokeWidth={2}
                  className="stroke-rose-400/80 dark:stroke-rose-300/70"
                >
                  <title>{`${nameOf(t.a)} & ${nameOf(t.b)}: ${t.what}`}</title>
                </path>
              ))}
            <g key={`${mode}-${selected}-${pair.join()}-${replay}`}>
              {overlay.map((o) => (
                <path
                  key={o.key}
                  d={o.d}
                  pathLength={1}
                  fill="none"
                  strokeLinecap="round"
                  strokeWidth={2.6}
                  className="path-draw stroke-accent-500 dark:stroke-accent-300"
                  style={{ ["--d" as string]: `${o.delay}ms` }}
                />
              ))}
            </g>
          </g>

          {TREE_PEOPLE.map((p) => {
            const y = nodeY(p.row);
            const on = p.id === selected && mode === "lineage";
            const faded = !lit.has(p.id);
            const you = p.theme === "you";
            return (
              <g key={p.id} className="tree-pop" style={{ ["--row" as string]: p.row }}>
                <g
                  role="button"
                  tabIndex={0}
                  aria-pressed={on}
                  aria-label={`${p.name}. ${p.knownFor}`}
                  onClick={() => select(p.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      select(p.id);
                    }
                  }}
                  className={`cursor-pointer outline-none transition-opacity duration-300 [&:focus-visible>rect:last-of-type]:stroke-[3px] ${faded ? "opacity-60" : ""}`}
                >
                  <title>{p.name}</title>
                  <rect x={p.x - NODE_W / 2} y={y - NODE_H / 2} width={NODE_W} height={NODE_H} rx={NODE_H / 2} className="fill-white dark:fill-zinc-900" />
                  {on && (
                    <rect
                      x={p.x - NODE_W / 2 - 4}
                      y={y - NODE_H / 2 - 4}
                      width={NODE_W + 8}
                      height={NODE_H + 8}
                      rx={NODE_H / 2 + 4}
                      className="fill-accent-500/15 stroke-accent-500/60 dark:fill-accent-300/10"
                      strokeWidth={1}
                    />
                  )}
                  <rect
                    x={p.x - NODE_W / 2}
                    y={y - NODE_H / 2}
                    width={NODE_W}
                    height={NODE_H}
                    rx={NODE_H / 2}
                    className={`${theme === "all" || p.theme === theme || you ? THEME_NODE[p.theme] : NEUTRAL_NODE} transition-[stroke-width] hover:stroke-[2.5px]`}
                    strokeWidth={on ? 2.4 : 1.3}
                  />
                  <text
                    x={p.x}
                    y={y + 4}
                    textAnchor="middle"
                    className={`pointer-events-none text-[12px] font-medium ${you ? "fill-white font-semibold dark:fill-zinc-900" : "fill-zinc-800 dark:fill-zinc-100"}`}
                  >
                    {p.short}
                  </text>
                  {p.honour && (
                    <g transform={`translate(${p.x + NODE_W / 2 - 7} ${y - NODE_H / 2 + 1})`}>
                      <circle r={6} className="fill-amber-400 stroke-white dark:stroke-zinc-900" strokeWidth={1.5} />
                      <path d="M0 -3.4 L1 -1 L3.4 -1 L1.5 0.6 L2.2 3 L0 1.6 L-2.2 3 L-1.5 0.6 L-3.4 -1 L-1 -1 Z" className="fill-white" />
                    </g>
                  )}
                </g>
              </g>
            );
          })}
        </svg>
      </div>
      <p className="-mt-2 text-xs text-zinc-500 sm:hidden">Scroll sideways to see the whole tree.</p>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-zinc-600 dark:text-zinc-400">
        <Legend dash={undefined} label="PhD" />
        <Legend dash="6 4" label="Postdoc" />
        <Legend dash="1.5 3.5" label="Research training" />
        <span className="flex items-center gap-1.5">
          <span className="relative inline-block h-3 w-3 rounded-full bg-amber-400" /> Nobel or major prize
        </span>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={showTies} onChange={(e) => setShowTies(e.target.checked)} />
          <span className="flex items-center gap-1.5">
            Famous partnerships
            <svg width="26" height="8" aria-hidden="true">
              <path d="M1 4 H25" strokeDasharray="2 4" strokeLinecap="round" strokeWidth={2} className="stroke-rose-400" />
            </svg>
          </span>
        </label>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <PersonCard person={person} onSelect={select} rootsCount={myRoots.size} />
        <ConnectionFinder pair={pair} path={path} onPair={choosePair} onSurprise={surprise} onSelect={select} active={mode === "path"} />
      </div>
    </div>
  );
}

function Legend({ dash, label }: { dash: string | undefined; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <svg width="26" height="8" aria-hidden="true">
        <path d="M1 4 H25" strokeDasharray={dash} strokeLinecap="round" strokeWidth={1.6} className="stroke-zinc-500" />
      </svg>
      {label}
    </span>
  );
}

function PersonLink({ id, onSelect }: { id: string; onSelect: (id: string) => void }) {
  return (
    <button type="button" onClick={() => onSelect(id)} className="font-medium text-accent-600 hover:underline dark:text-accent-300">
      {nameOf(id)}
    </button>
  );
}

function PersonCard({ person, onSelect, rootsCount }: { person: TreePerson; onSelect: (id: string) => void; rootsCount: number }) {
  const mentors = mentorsOf(person.id);
  const trainees = traineesOf(person.id);
  const ties = TREE_TIES.filter((t) => t.a === person.id || t.b === person.id);
  const themeLabel = TREE_THEMES.find((t) => t.id === person.theme)?.label;
  return (
    <div className="rounded-md border border-zinc-200 p-4 dark:border-zinc-800" aria-live="polite">
      <div key={person.id} className="animate-fade-up space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h3 className="text-lg font-semibold tracking-tight">{person.name}</h3>
            <p className="text-sm text-zinc-500">
              {person.where}
              {person.life && <> · {person.life}</>}
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {themeLabel && (
              <span className="flex items-center gap-1.5 rounded-full border border-zinc-200 px-2 py-0.5 text-[11px] text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
                <span className={`h-2 w-2 rounded-full ${THEME_DOT[person.theme]}`} />
                {themeLabel}
              </span>
            )}
            {person.honour && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800 dark:bg-amber-400/15 dark:text-amber-300">
                {person.honour}
              </span>
            )}
          </div>
        </div>
        <p className="text-[15px] leading-relaxed text-zinc-700 dark:text-zinc-300">{person.knownFor}</p>
        {person.id === "qin" && (
          <p className="rounded-md border-l-4 border-accent-500/50 bg-accent-50/60 px-3 py-2 text-sm leading-relaxed text-zinc-700 dark:bg-accent-700/10 dark:text-zinc-300">
            On this map I have {rootsCount} academic ancestors across three labs, going back {generationsUp("qin")} generations. Turn on famous partnerships, or use the
            finder, to see how far the branches reach.
          </p>
        )}
        <dl className="space-y-2 text-sm">
          {mentors.length > 0 && (
            <div>
              <dt className="text-[11px] uppercase tracking-wider text-zinc-500">Trained with</dt>
              <dd className="mt-1 space-y-0.5">
                {mentors.map((l) => (
                  <div key={l.from}>
                    <PersonLink id={l.from} onSelect={onSelect} />{" "}
                    <span className="text-zinc-500">
                      · {TREE_LINK_LABEL[l.kind]}, {l.when}
                    </span>
                  </div>
                ))}
              </dd>
            </div>
          )}
          {trainees.length > 0 && (
            <div>
              <dt className="text-[11px] uppercase tracking-wider text-zinc-500">Trained, on this map</dt>
              <dd className="mt-1 space-y-0.5">
                {trainees.map((l) => (
                  <div key={l.to}>
                    <PersonLink id={l.to} onSelect={onSelect} />{" "}
                    <span className="text-zinc-500">
                      · {TREE_LINK_LABEL[l.kind]}, {l.when}
                    </span>
                  </div>
                ))}
              </dd>
            </div>
          )}
          {ties.length > 0 && (
            <div>
              <dt className="text-[11px] uppercase tracking-wider text-zinc-500">Famous partnerships</dt>
              <dd className="mt-1 space-y-0.5">
                {ties.map((t) => (
                  <div key={t.a + t.b}>
                    <PersonLink id={t.a === person.id ? t.b : t.a} onSelect={onSelect} /> <span className="text-zinc-500">· {t.what}</span>
                  </div>
                ))}
              </dd>
            </div>
          )}
          {mentors.length === 0 && person.id !== "qin" && <p className="text-xs text-zinc-500">Their own mentors are off this map.</p>}
        </dl>
      </div>
    </div>
  );
}

function stepText(s: PathStep): { verb: string; detail?: string } {
  if (s.kind === "tie") return { verb: "worked with", detail: s.how };
  const l = linkBetween(s.from, s.to)!;
  const detail = `${TREE_LINK_LABEL[l.kind]}, ${l.when}`;
  return s.kind === "mentor" ? { verb: "trained with", detail } : { verb: "mentored", detail };
}

function ConnectionFinder({
  pair,
  path,
  onPair,
  onSurprise,
  onSelect,
  active,
}: {
  pair: [string, string];
  path: PathStep[] | null;
  onPair: (p: [string, string]) => void;
  onSurprise: () => void;
  onSelect: (id: string) => void;
  active: boolean;
}) {
  const select = (i: 0 | 1, id: string) => onPair(i === 0 ? [id, pair[1]] : [pair[0], id]);
  return (
    <div className="rounded-md border border-zinc-200 p-4 dark:border-zinc-800">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold tracking-tight">How are they connected?</h3>
        <button type="button" className="btn btn-outline px-2.5 py-1 text-xs" onClick={onSurprise}>
          Surprise me
        </button>
      </div>
      <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 text-sm">
        {[0, 1].map((i) => (
          <select
            key={i}
            aria-label={i === 0 ? "First person" : "Second person"}
            value={pair[i]}
            onChange={(e) => select(i as 0 | 1, e.target.value)}
            className={`min-w-0 rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900 ${i === 1 ? "order-3" : ""}`}
          >
            {byName.map((p) => (
              <option key={p.id} value={p.id}>
                {p.id === "qin" ? "Me (Qin Liu)" : p.name}
              </option>
            ))}
          </select>
        ))}
        <span className="order-2 text-zinc-400" aria-hidden="true">
          ↔
        </span>
      </div>
      <div className="mt-3" aria-live="polite">
        {!active ? (
          <button type="button" className="text-sm font-medium text-accent-600 hover:underline dark:text-accent-300" onClick={() => onPair(pair)}>
            Show the connection on the tree →
          </button>
        ) : path === null ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            This slice of the tree does not connect them. In the full family tree almost everyone is linked; this map shows only a few dozen people.
          </p>
        ) : path.length === 0 ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Pick two different people.</p>
        ) : (
          <div key={pair.join()} className="animate-fade-up">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              <span className="num font-mono font-semibold text-accent-600 dark:text-accent-300">{path.length}</span> {path.length === 1 ? "step" : "steps"} apart
            </p>
            <ol className="mt-2 space-y-1.5 border-l-2 border-accent-500/30 pl-3 text-sm">
              {path.map((s, i) => {
                const t = stepText(s);
                return (
                  <li key={i}>
                    <PersonLink id={s.from} onSelect={onSelect} /> <span className="text-zinc-600 dark:text-zinc-400">{t.verb}</span>{" "}
                    <PersonLink id={s.to} onSelect={onSelect} />
                    {t.detail && <div className="text-xs text-zinc-500">{t.detail}</div>}
                  </li>
                );
              })}
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}
