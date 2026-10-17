"use client";

import { useMemo, useState } from "react";
import { gauss, pearsonR, rng } from "@/lib/random";

const N_TRIALS = 240;
const SMOOTH = 41; // trials in the moving average used to estimate slow drift
const W = 560;
const H = 120;

function movingAverage(x: number[], w: number): number[] {
  const half = Math.floor(w / 2);
  return x.map((_, i) => {
    let s = 0;
    let n = 0;
    for (let j = Math.max(0, i - half); j <= Math.min(x.length - 1, i + half); j++) {
      s += x[j]!;
      n++;
    }
    return s / n;
  });
}

function path(values: number[], lo: number, hi: number, height: number): string {
  return values
    .map((v, i) => `${i ? "L" : "M"}${((i / (values.length - 1)) * W).toFixed(1)},${(height - ((v - lo) / (hi - lo || 1)) * height).toFixed(1)}`)
    .join("");
}

function Scatter({ a, b, label, r }: { a: number[]; b: number[]; label: string; r: number }) {
  const size = 150;
  const lo = Math.min(...a, ...b);
  const hi = Math.max(...a, ...b);
  // Rounded: trig in the noise generator can differ in the last bit between server and browser.
  const s = (v: number) => Math.round((((v - lo) / (hi - lo || 1)) * (size - 10) + 5) * 100) / 100;
  return (
    <div className="text-center">
      <svg viewBox={`0 0 ${size} ${size}`} className="mx-auto w-full max-w-[170px]" role="img" aria-label={`${label}: correlation ${r.toFixed(2)}`}>
        <rect width={size} height={size} fill="none" className="stroke-zinc-200 dark:stroke-zinc-800" />
        {a.map((v, i) => (
          <circle key={i} cx={s(v)} cy={size - s(b[i]!)} r={2.2} fill="#2f5d9e" opacity={0.45} />
        ))}
      </svg>
      <div className="mt-1 text-xs text-zinc-500">{label}</div>
      <div className="num font-mono text-xl">r = {r.toFixed(2)}</div>
    </div>
  );
}

/**
 * Toy simulation (not real data): two areas share a slow drift (e.g. arousal or a
 * slowly changing recording) and, optionally, genuine trial-by-trial coupling.
 */
export function SharedDriftDemo() {
  const [drift, setDrift] = useState(1.5);
  const [coupling, setCoupling] = useState(0);
  const [seed, setSeed] = useState(3);

  const sim = useMemo(() => {
    const rand = rng(seed);
    // Slow drift: smoothed random walk, normalised to unit SD.
    let walk = 0;
    const raw = Array.from({ length: N_TRIALS }, () => (walk += gauss(rand)));
    const smooth = movingAverage(raw, 25);
    const m = smooth.reduce((x, y) => x + y, 0) / N_TRIALS;
    const sd = Math.sqrt(smooth.reduce((x, y) => x + (y - m) ** 2, 0) / N_TRIALS) || 1;
    const slow = smooth.map((v) => (v - m) / sd);
    const shared = Array.from({ length: N_TRIALS }, () => gauss(rand));
    const a = slow.map((v, i) => drift * v + coupling * shared[i]! + gauss(rand));
    const b = slow.map((v, i) => drift * v + coupling * shared[i]! + gauss(rand));
    const aTrend = movingAverage(a, SMOOTH);
    const aRes = a.map((v, i) => v - aTrend[i]!);
    const bTrend = movingAverage(b, SMOOTH);
    const bRes = b.map((v, i) => v - bTrend[i]!);
    return { a, b, aRes, bRes, rRaw: pearsonR(a, b), rRes: pearsonR(aRes, bRes) };
  }, [drift, coupling, seed]);

  const lo = Math.min(...sim.a, ...sim.b);
  const hi = Math.max(...sim.a, ...sim.b);

  return (
    <div className="space-y-5">
      <div>
        <div className="mb-1 flex flex-wrap gap-x-5 text-xs text-zinc-500">
          <span className="flex items-center gap-1.5"><span className="h-0.5 w-5 bg-[#2f5d9e]" /> area A response, trial by trial</span>
          <span className="flex items-center gap-1.5"><span className="h-0.5 w-5 bg-[#c2410c]" /> area B response</span>
        </div>
        <svg viewBox={`0 -4 ${W} ${H + 8}`} className="w-full" role="img" aria-label="Responses of two areas across trials">
          <path d={path(sim.a, lo, hi, H)} fill="none" stroke="#2f5d9e" strokeWidth={1.2} opacity={0.85} />
          <path d={path(sim.b, lo, hi, H)} fill="none" stroke="#c2410c" strokeWidth={1.2} opacity={0.75} />
        </svg>
        <div className="flex justify-between text-[11px] text-zinc-400"><span>first trial</span><span>trial {N_TRIALS}</span></div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.3fr)]">
        <Scatter a={sim.a} b={sim.b} label="Raw responses" r={sim.rRaw} />
        <Scatter a={sim.aRes} b={sim.bRes} label="After removing slow drift" r={sim.rRes} />
        <div className="space-y-4 text-sm">
          <label className="block">
            <span className="label">Shared slow drift: {drift.toFixed(1)}</span>
            <input type="range" min={0} max={3} step={0.1} value={drift} onChange={(e) => setDrift(Number(e.target.value))} className="w-full accent-[#2f5d9e]" />
          </label>
          <label className="block">
            <span className="label">Real moment-to-moment coupling: {coupling.toFixed(1)}</span>
            <input type="range" min={0} max={1.5} step={0.1} value={coupling} onChange={(e) => setCoupling(Number(e.target.value))} className="w-full accent-[#2f5d9e]" />
          </label>
          <button type="button" onClick={() => setSeed((s) => s + 1)} className="rounded border border-zinc-300 px-3 py-1 text-xs hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800">
            Simulate a new session
          </button>
          <p className="text-xs leading-relaxed text-zinc-500">
            Set coupling to 0 and drift high: the raw responses look strongly linked even though nothing is shared trial-to-trial.
            Removing the slow trend (a {SMOOTH}-trial moving average) exposes that. Then raise the coupling to see a link that survives.
          </p>
        </div>
      </div>
    </div>
  );
}
