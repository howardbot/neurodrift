"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { BINS, CHANNELS, DIRECTIONS, analyseDay, handVelocity, setUpLab, unitOn, type DayResult } from "@/lib/drift";
import type { Mat } from "@/lib/linalg";

const MAX_DAY = 30;
const hue = (c: number) => `hsl(${Math.round((360 * c) / DIRECTIONS)} 70% 55%)`;
const f1 = (v: number) => v.toFixed(1);

/** Integrates condition-averaged velocities (DIRECTIONS × BINS rows) into reach paths. */
function paths(vel: Mat, scale: number): [number, number][][] {
  return Array.from({ length: DIRECTIONS }, (_, c) => {
    let x = 0;
    let y = 0;
    const pts: [number, number][] = [[0, 0]];
    for (let t = 0; t < BINS; t++) {
      const v = vel[c * BINS + t]!;
      x += v[0]! * scale;
      y += v[1]! * scale;
      pts.push([x, y]);
    }
    return pts;
  });
}

const TRUE_VEL: Mat = Array.from({ length: DIRECTIONS * BINS }, (_, i) => handVelocity(Math.floor(i / BINS), i % BINS));
const REACH = (() => {
  let s = 0;
  for (let t = 0; t < BINS; t++) s += Math.hypot(...handVelocity(0, t));
  return 1 / s;
})();

function Panel({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <div className="min-w-0 rounded-md border border-zinc-200 p-3 dark:border-zinc-800">
      <div className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">{title}</div>
      <div className="mt-2">{children}</div>
      {note && <p className="mt-2 text-xs leading-relaxed text-zinc-500">{note}</p>}
    </div>
  );
}

export function DriftLab() {
  const lab = useMemo(() => setUpLab(), []);
  const [day, setDay] = useState(0);
  const [align, setAlign] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [curve, setCurve] = useState<DayResult[]>([]);
  const detail = useMemo(() => analyseDay(lab, day), [lab, day]);

  // Accuracy over the month, computed a few days per frame after the page loads.
  useEffect(() => {
    let d = 0;
    let raf = 0;
    const out: DayResult[] = [];
    const next = () => {
      for (let k = 0; k < 2 && d <= MAX_DAY; k++, d += 2) {
        const r = analyseDay(lab, d);
        out.push({ day: r.day, fixed: r.fixed, aligned: r.aligned, retrained: r.retrained });
      }
      setCurve([...out]);
      if (d <= MAX_DAY) raf = requestAnimationFrame(next);
    };
    raf = requestAnimationFrame(next);
    return () => cancelAnimationFrame(raf);
  }, [lab]);

  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      setDay((d) => {
        if (d >= MAX_DAY) {
          setPlaying(false);
          return d;
        }
        return d + 1;
      });
    }, 260);
    return () => window.clearInterval(id);
  }, [playing]);

  const units = lab.array.map((ch) => unitOn(ch, day));
  const replaced = units.filter((u) => u.isNew).length;
  const decoded = paths(align ? detail.alignedVel : detail.fixedVel, REACH);
  const truth = paths(TRUE_VEL, REACH);
  const score = align ? detail.aligned : detail.fixed;

  const today = align ? detail.alignedAvg : detail.raw;
  // One scale for both days, so neither is clipped.
  const span = Math.max(...[...lab.avg0, ...today].flatMap((r) => [Math.abs(r[0]!), Math.abs(r[1]!)])) * 1.1;
  const lx = (v: number) => 100 + (v / span) * 90;
  const ly = (v: number) => 100 - (v / span) * 90;
  const latentPath = (rows: Mat, c: number) =>
    rows
      .slice(c * BINS, (c + 1) * BINS)
      .map((r, i) => `${i ? "L" : "M"}${f1(lx(r[0]!))},${f1(ly(r[1]!))}`)
      .join("");

  const cx = (d: number) => 30 + (d / MAX_DAY) * 260;
  const cy = (v: number) => 12 + (1 - Math.max(0, v)) * 150;
  const line = (key: "fixed" | "aligned" | "retrained") => curve.map((r, i) => `${i ? "L" : "M"}${f1(cx(r.day))},${f1(cy(r[key]))}`).join("");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        <label className="flex min-w-[240px] flex-1 items-center gap-3 text-sm">
          <span className="shrink-0 text-zinc-600 dark:text-zinc-400">Day</span>
          <input type="range" min={0} max={MAX_DAY} value={day} onChange={(e) => setDay(Number(e.target.value))} className="w-full accent-accent-600" aria-label="Days since the decoder was trained" />
          <span className="num w-8 shrink-0 font-mono font-semibold">{day}</span>
        </label>
        <button
          type="button"
          className="btn btn-outline px-3 py-1 text-xs"
          onClick={() => {
            if (playing) return setPlaying(false);
            if (day >= MAX_DAY) setDay(0);
            setPlaying(true);
          }}
        >
          {playing ? "Pause" : "Play the month"}
        </button>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={align} onChange={(e) => setAlign(e.target.checked)} />
          <span className="font-medium">Align today&apos;s patterns to day 0</span>
        </label>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Panel title={`The array on day ${day}`} note={`${replaced} of ${CHANNELS} channels now record a different neuron from day 0 (amber); the rest have drifted in strength.`}>
          <svg viewBox="0 0 200 200" className="mx-auto w-full max-w-[220px]" aria-label={`${replaced} of ${CHANNELS} channels have changed neuron`} role="img">
            {units.map((u, i) => {
              const x = 8 + (i % 8) * 23.5;
              const y = 8 + Math.floor(i / 8) * 23.5;
              const strength = Math.max(0.25, Math.min(1, u.gain / 40));
              return (
                <rect
                  key={i}
                  x={x}
                  y={y}
                  width={19}
                  height={19}
                  rx={4}
                  className={`transition-[fill,opacity] duration-300 ${u.isNew ? "fill-amber-500" : "fill-accent-500 dark:fill-accent-300"}`}
                  opacity={strength}
                />
              );
            })}
          </svg>
        </Panel>

        <Panel
          title={align ? "Reaches decoded after alignment" : "Reaches decoded by the day-0 decoder"}
          note={`Grey: the true reaches. Colour: what the decoder reconstructs. It explains ${Math.round(Math.max(0, score) * 100)}% of the hand's movement today.`}
        >
          <svg viewBox="-1.3 -1.3 2.6 2.6" className="mx-auto w-full max-w-[220px]" role="img" aria-label="Eight reaches: true paths and decoded paths">
            {truth.map((p, c) => (
              <polyline key={`t${c}`} points={p.map(([x, y]) => `${x.toFixed(3)},${(-y).toFixed(3)}`).join(" ")} fill="none" className="stroke-zinc-300 dark:stroke-zinc-700" strokeWidth={0.07} strokeLinecap="round" />
            ))}
            {decoded.map((p, c) => (
              <polyline key={`d${c}`} points={p.map(([x, y]) => `${x.toFixed(3)},${(-y).toFixed(3)}`).join(" ")} fill="none" stroke={hue(c)} strokeWidth={0.045} strokeLinecap="round" />
            ))}
            <circle r={0.05} className="fill-zinc-500" />
          </svg>
        </Panel>

        <Panel
          title={align ? "Today's patterns, aligned to day 0" : "Today's patterns, as recorded"}
          note="Each line is the population's average path during reaches in one direction, in its two main patterns (PCA). Dashed: day 0."
        >
          <svg viewBox="0 0 200 200" className="mx-auto w-full max-w-[220px]" role="img" aria-label="Population activity trajectories for eight reach directions">
            <line x1={10} x2={190} y1={100} y2={100} className="stroke-zinc-200 dark:stroke-zinc-800" />
            <line y1={10} y2={190} x1={100} x2={100} className="stroke-zinc-200 dark:stroke-zinc-800" />
            {Array.from({ length: DIRECTIONS }, (_, c) => (
              <g key={c}>
                <path d={latentPath(lab.avg0, c)} fill="none" stroke={hue(c)} strokeOpacity={0.45} strokeWidth={1.2} strokeDasharray="3 3" />
                <path d={latentPath(today, c)} fill="none" stroke={hue(c)} strokeWidth={2} strokeLinecap="round" />
              </g>
            ))}
          </svg>
        </Panel>

        <Panel title="Accuracy over the month" note="Retraining every day works but needs new, labelled practice sessions; alignment reuses the day-0 decoder with no labels.">
          <svg viewBox="0 0 300 190" className="w-full" role="img" aria-label="Share of movement explained over 30 days by three approaches">
            {[0, 0.5, 1].map((v) => (
              <g key={v}>
                <line x1={30} x2={290} y1={cy(v)} y2={cy(v)} className="stroke-zinc-200 dark:stroke-zinc-800" />
                <text x={24} y={cy(v) + 3} textAnchor="end" className="fill-zinc-500 text-[9px]">
                  {v * 100}%
                </text>
              </g>
            ))}
            {[0, 10, 20, 30].map((d) => (
              <text key={d} x={cx(d)} y={182} textAnchor={d === 0 ? "start" : d === MAX_DAY ? "end" : "middle"} className="fill-zinc-500 text-[9px]">
                day {d}
              </text>
            ))}
            <line x1={cx(day)} x2={cx(day)} y1={8} y2={164} className="stroke-zinc-400 dark:stroke-zinc-600" strokeDasharray="2 3" />
            <path d={line("retrained")} fill="none" className="stroke-emerald-500" strokeWidth={1.6} strokeDasharray="4 3" />
            <path d={line("fixed")} fill="none" className="stroke-rose-500" strokeWidth={2} />
            <path d={line("aligned")} fill="none" className="stroke-accent-600 dark:stroke-accent-300" strokeWidth={2} />
          </svg>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-600 dark:text-zinc-400">
            <span className="flex items-center gap-1.5">
              <span className="h-0.5 w-4 bg-rose-500" /> Day-0 decoder, unchanged
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-0.5 w-4 bg-accent-600 dark:bg-accent-300" /> Same decoder, aligned
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-0.5 w-4 border-t-2 border-dashed border-emerald-500" /> Retrained daily
            </span>
          </div>
        </Panel>
      </div>
    </div>
  );
}
