"use client";

import { useMemo, useState } from "react";
import { gauss, rng } from "@/lib/random";

// Three toy neurons: (trough amplitude µV, trough-to-peak ms). The narrow one mimics a
// "fast-spiking" (often inhibitory) cell, the broad ones "regular-spiking" cells.
const NEURONS = [
  { amp: 95, t2p: 0.32, colour: "#c2410c", label: "narrow spikes (fast-spiking type)" },
  { amp: 60, t2p: 0.62, colour: "#2f5d9e", label: "broad spikes, large" },
  { amp: 38, t2p: 0.58, colour: "#15803d", label: "broad spikes, small" },
];
const N_SPIKES = 120;

function waveform(amp: number, t2p: number, t: number): number {
  const trough = -amp * Math.exp(-((t - 0.3) ** 2) / (2 * 0.07 ** 2));
  const peak = 0.35 * amp * Math.exp(-((t - 0.3 - t2p) ** 2) / (2 * (0.12 + t2p * 0.25) ** 2));
  return trough + peak;
}

export function SpikeSortingDemo() {
  const [noise, setNoise] = useState(0.5);
  const [reveal, setReveal] = useState(false);

  const spikes = useMemo(() => {
    const rand = rng(42);
    return NEURONS.flatMap((n, k) =>
      Array.from({ length: N_SPIKES }, () => ({
        k,
        amp: n.amp * (1 + 0.06 * gauss(rand)) + noise * 18 * gauss(rand),
        t2p: n.t2p + 0.03 * gauss(rand) + noise * 0.09 * gauss(rand),
      })),
    );
  }, [noise]);

  const W = 300;
  const H = 220;
  const sx = (t: number) => 34 + ((t - 0.1) / 0.8) * (W - 44);
  const sy = (a: number) => H - 26 - ((a - 10) / 120) * (H - 40);

  const ts = Array.from({ length: 60 }, (_, i) => i * 0.025);
  const wf = (n: (typeof NEURONS)[number]) =>
    ts.map((t, i) => `${i ? "L" : "M"}${(10 + t * 170).toFixed(1)},${(70 - waveform(n.amp, n.t2p, t) * 0.55).toFixed(1)}`).join("");

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_1.2fr]">
      <div className="space-y-4">
        <div>
          <div className="mb-1 text-xs font-medium text-zinc-500">Average spike shape of each neuron</div>
          <svg viewBox="0 0 170 130" className="w-full max-w-[260px]" role="img" aria-label="Spike waveforms of three neurons">
            <line x1={10} x2={160} y1={70} y2={70} className="stroke-zinc-200 dark:stroke-zinc-800" />
            {NEURONS.map((n) => (
              <path key={n.label} d={wf(n)} fill="none" stroke={n.colour} strokeWidth={2} />
            ))}
            <text x={160} y={125} textAnchor="end" className="fill-zinc-500 text-[8px]">1.5 ms</text>
          </svg>
          <ul className="mt-2 space-y-1 text-xs text-zinc-600 dark:text-zinc-400">
            {NEURONS.map((n) => (
              <li key={n.label} className="flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{ background: n.colour }} />{n.label}</li>
            ))}
          </ul>
        </div>
        <label className="block text-sm">
          <span className="label">Recording noise: {noise < 0.35 ? "low" : noise < 0.8 ? "medium" : "high"}</span>
          <input type="range" min={0} max={1.4} step={0.05} value={noise} onChange={(e) => setNoise(Number(e.target.value))} className="w-full accent-[#2f5d9e]" />
        </label>
        <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
          <input type="checkbox" checked={reveal} onChange={(e) => setReveal(e.target.checked)} />
          Reveal which neuron fired each spike
        </label>
      </div>
      <div>
        <div className="mb-1 text-xs font-medium text-zinc-500">Every detected spike, described by two features ({NEURONS.length * N_SPIKES} spikes)</div>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Scatter of spike features">
          <line x1={34} x2={W - 10} y1={H - 26} y2={H - 26} className="stroke-zinc-300 dark:stroke-zinc-700" />
          <line x1={34} x2={34} y1={10} y2={H - 26} className="stroke-zinc-300 dark:stroke-zinc-700" />
          {spikes.map((s, i) => (
            <circle
              key={i}
              cx={sx(Math.min(0.9, Math.max(0.1, s.t2p)))}
              cy={sy(Math.min(130, Math.max(10, s.amp)))}
              r={2.2}
              fill={reveal ? NEURONS[s.k]!.colour : "#71717a"}
              opacity={0.55}
            />
          ))}
          <text x={(W + 24) / 2} y={H - 6} textAnchor="middle" className="fill-zinc-500 text-[9px]">spike width (trough-to-peak)</text>
          <text x={12} y={H / 2} textAnchor="middle" transform={`rotate(-90 12 ${H / 2})`} className="fill-zinc-500 text-[9px]">spike size</text>
        </svg>
        <p className="mt-2 text-xs leading-relaxed text-zinc-500">
          Spike sorting has to find these groups without the colours. At low noise the clouds are easy to separate; as noise
          rises they merge, and a human or an algorithm has to decide where one neuron ends and the next begins.
        </p>
      </div>
    </div>
  );
}
