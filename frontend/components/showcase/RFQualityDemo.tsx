"use client";

import { useMemo, useState } from "react";
import { gauss, rng } from "@/lib/random";

const GRID = 12;
// Criteria used in the lab's receptive-field quality control (phase 2):
const A_MIN = 8; // minimum number of suprathreshold grid bins
const S_MIN = 2; // minimum peak / mean response ("not flat")
const S_MAX = 8; // maximum peak / mean response ("not a single noisy spike")

/**
 * Toy receptive-field map: a neuron responds to flashes at a patch of the screen.
 * Poor isolation (spikes from several neurons, or few spikes) blurs or scatters the map.
 */
export function RFQualityDemo() {
  const [isolation, setIsolation] = useState(0.8);
  const [seed, setSeed] = useState(5);

  const { map, area, sparsity, verdict } = useMemo(() => {
    const rand = rng(seed);
    const cx = 4 + rand() * 4;
    const cy = 4 + rand() * 4;
    const sigma = 1.4;
    const signal = 3 + 25 * isolation ** 2;
    const values = Array.from({ length: GRID * GRID }, (_, k) => {
      const x = k % GRID;
      const y = Math.floor(k / GRID);
      const rf = signal * Math.exp(-((x - cx) ** 2 + (y - cy) ** 2) / (2 * sigma ** 2));
      return Math.max(0, 4 + rf + (1.5 + 3 * (1 - isolation)) * gauss(rand));
    });
    const max = Math.max(...values);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const thr = mean + 0.5 * (max - mean);
    const a = values.filter((v) => v >= thr).length;
    const s = max / mean;
    const good = a >= A_MIN && s >= S_MIN && s <= S_MAX;
    return { map: values.map((v) => v / max), area: a, sparsity: s, verdict: good };
  }, [isolation, seed]);

  const cell = 18;
  return (
    <div className="grid gap-6 md:grid-cols-[auto_1fr] md:items-center">
      <svg viewBox={`0 0 ${GRID * cell} ${GRID * cell}`} className="mx-auto w-full max-w-[240px]" role="img" aria-label="Toy receptive-field map">
        {map.map((v, k) => (
          <rect key={k} x={(k % GRID) * cell} y={Math.floor(k / GRID) * cell} width={cell - 1} height={cell - 1} fill={`rgba(47,93,158,${(0.08 + 0.92 * v).toFixed(3)})`} />
        ))}
      </svg>
      <div className="space-y-4 text-sm">
        <div className="grid grid-cols-3 gap-3">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-zinc-500">Responsive area</div>
            <div className="num font-mono text-xl">{area} bins</div>
            <div className="text-[11px] text-zinc-500">needs ≥ {A_MIN}</div>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wider text-zinc-500">Peak / mean</div>
            <div className="num font-mono text-xl">{sparsity.toFixed(1)}</div>
            <div className="text-[11px] text-zinc-500">needs {S_MIN}–{S_MAX}</div>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wider text-zinc-500">Verdict</div>
            <div className={`text-xl font-semibold ${verdict ? "text-emerald-600" : "text-amber-600"}`}>{verdict ? "clear" : "weak"}</div>
          </div>
        </div>
        <label className="block">
          <span className="label">How well the neuron is isolated: {isolation < 0.4 ? "poor" : isolation < 0.75 ? "fair" : "good"}</span>
          <input type="range" min={0} max={1} step={0.05} value={isolation} onChange={(e) => setIsolation(Number(e.target.value))} className="w-full accent-[#2f5d9e]" />
        </label>
        <button type="button" onClick={() => setSeed((s) => s + 1)} className="rounded border border-zinc-300 px-3 py-1 text-xs hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800">
          Map another neuron
        </button>
        <p className="text-xs leading-relaxed text-zinc-500">
          Darker squares are screen positions where flashes made the neuron fire more. A well-isolated neuron gives a compact, clear
          patch; mixing in spikes from other cells or recording noise flattens it. The two limits are the ones used in the analysis;
          in this toy, the responsive area counts squares above half of the peak response.
        </p>
      </div>
    </div>
  );
}
