"use client";

import { useMemo, useState } from "react";
import { automaton, lorenzTwins } from "@/lib/ideasMath";

// Gadgets for "If we had infinite computing power, could we simulate everything?"
// (/ideas#simulate-everything): chaos in the Lorenz system, and cellular automata with and
// without a known shortcut.

const seg = (on: boolean) =>
  `rounded px-2.5 py-1 text-xs font-medium ${on ? "bg-accent-600 text-white dark:bg-accent-300 dark:text-zinc-900" : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"}`;

// ---- Butterfly effect ------------------------------------------------------------------

const T = 40;

/** Two copies of Lorenz's weather model that start a tiny distance apart. */
export function ButterflyEffect() {
  const [digits, setDigits] = useState(6);
  const run = useMemo(() => lorenzTwins(10 ** -digits, T), [digits]);
  const W = 560;
  const tx = (t: number) => 40 + (t / T) * (W - 50);
  const xy = (v: number) => 70 - (v / 22) * 55;
  const sy = (d: number) => 240 - ((Math.log10(Math.max(d, 1e-13)) + 13) / 15) * 100;
  const path = (vals: Float64Array, y: (v: number) => number) =>
    Array.from(vals, (v, i) => `${i ? "L" : "M"}${tx(run.t[i]!).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");

  return (
    <div className="space-y-3">
      <label className="flex flex-wrap items-center gap-3 text-sm text-zinc-700 dark:text-zinc-300">
        <span>Starting difference</span>
        <input type="range" min={1} max={12} step={1} value={digits} onChange={(e) => setDigits(+e.target.value)} className="w-48 accent-accent-600" aria-label="Starting difference, as a power of ten" />
        <span className="font-mono text-xs">
          10<sup>−{digits}</sup> ({digits} digit{digits > 1 ? "s" : ""} of precision)
        </span>
      </label>
      <svg viewBox={`0 0 ${W} 260`} className="w-full" role="img" aria-label={`Two trajectories of the Lorenz system starting 10 to the minus ${digits} apart; they part ways at about t = ${run.partsAt.toFixed(1)}.`}>
        <text x={40} y={10} className="fill-zinc-500 text-[10px]">
          the two forecasts (x over time)
        </text>
        <path d={path(run.a, xy)} fill="none" className="stroke-accent-500" strokeWidth={1.4} />
        <path d={path(run.b, xy)} fill="none" className="stroke-amber-500" strokeWidth={1.4} strokeDasharray="4 2" />
        <line x1={tx(run.partsAt)} x2={tx(run.partsAt)} y1={14} y2={244} className="stroke-rose-500" strokeDasharray="3 3" />
        <text x={tx(run.partsAt) + 4} y={26} className="fill-rose-600 text-[10.5px] font-semibold dark:fill-rose-400">
          they part ways, t ≈ {run.partsAt.toFixed(1)}
        </text>
        <text x={40} y={142} className="fill-zinc-500 text-[10px]">
          distance between them (logarithmic)
        </text>
        <path d={path(run.dist, sy)} fill="none" className="stroke-zinc-700 dark:stroke-zinc-300" strokeWidth={1.2} />
        <line x1={40} x2={W - 10} y1={sy(1)} y2={sy(1)} className="stroke-zinc-300 dark:stroke-zinc-700" strokeDasharray="2 3" />
        <text x={44} y={sy(1) - 4} className="fill-zinc-500 text-[9.5px]">
          visibly different
        </text>
        {[0, 10, 20, 30, 40].map((t) => (
          <text key={t} x={tx(t)} y={256} textAnchor={t === 0 ? "start" : t === T ? "end" : "middle"} className="fill-zinc-400 font-mono text-[9px]">
            t = {t}
          </text>
        ))}
      </svg>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Each extra digit of precision in the starting point buys only about {run.perDigit.toFixed(1)} more units of time before the
        forecasts disagree. A million times better measurement adds a fixed amount of foresight, not a million times more.
      </p>
    </div>
  );
}

// ---- Cellular automata ---------------------------------------------------------------

const COLS = 101;
const ROWS = 60;

/** Rule 30 (no shortcut known) next to Rule 90 (a formula predicts any cell). Click the top row to edit it. */
export function CellularAutomaton() {
  const [rule, setRule] = useState<30 | 90>(30);
  const [top, setTop] = useState<boolean[]>(() => Array.from({ length: COLS }, (_, i) => i === 50));
  const grid = useMemo(() => automaton(rule, top, ROWS), [rule, top]);
  const cells = useMemo(() => {
    let d = "";
    grid.forEach((row, y) => row.forEach((on, x) => on && (d += `M${x} ${y}h1v1h-1z`)));
    return d;
  }, [grid]);
  const toggle = (i: number) => setTop((t) => t.map((v, j) => (j === i ? !v : v)));

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div role="group" aria-label="Rule" className="inline-flex rounded-md border border-zinc-300 p-0.5 dark:border-zinc-700">
          {([30, 90] as const).map((r) => (
            <button key={r} type="button" aria-pressed={rule === r} className={seg(rule === r)} onClick={() => setRule(r)}>
              Rule {r}
            </button>
          ))}
        </div>
        <button type="button" className="btn btn-outline px-2.5 py-1 text-xs" onClick={() => setTop(Array.from({ length: COLS }, (_, i) => i === 50))}>
          One cell
        </button>
        <button type="button" className="btn btn-outline px-2.5 py-1 text-xs" onClick={() => setTop(Array.from({ length: COLS }, () => Math.random() < 0.3))}>
          Random start
        </button>
      </div>
      <svg viewBox={`0 -1.5 ${COLS} ${ROWS + 1.5}`} className="w-full" shapeRendering="crispEdges" role="img" aria-label={`Rule ${rule} cellular automaton, ${ROWS} rows; each row is computed from the one above.`}>
        <rect x={0} y={0} width={COLS} height={ROWS} className="fill-white dark:fill-zinc-950" />
        <path d={cells} className={rule === 30 ? "fill-accent-600 dark:fill-accent-300" : "fill-violet-600 dark:fill-violet-300"} />
        {top.map((_, i) => (
          <rect key={i} x={i} y={-1.5} width={1} height={2.5} className="cursor-pointer fill-transparent hover:fill-accent-500/40" onClick={() => toggle(i)}>
            <title>Toggle this cell in the top row</title>
          </rect>
        ))}
      </svg>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        {rule === 30
          ? "Each cell follows a one-line rule from the three cells above it, yet no formula is known that gives row 1,000 without computing the 999 rows before it."
          : "Rule 90 is just as simple, but from one cell any cell can be predicted directly: it is Pascal's triangle with odd numbers coloured. This one has a shortcut."}{" "}
        Click the top row to change the start.
      </p>
    </div>
  );
}
