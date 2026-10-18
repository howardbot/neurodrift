"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { prefersReducedMotion } from "@/components/motion";
import { ELECTRODES, type ElectrodeId, type ElectrodeType } from "@/content/learn";
import { rng } from "@/lib/random";
import { exampleTrace } from "@/lib/signal";

// ---------------------------------------------------------------------------------------
// Schematic cross-section (viewBox 360 × 440). Not to scale.
// ---------------------------------------------------------------------------------------

const LAYERS = [
  { y: 40, h: 40, label: "scalp", cls: "fill-rose-100 dark:fill-rose-950/50" },
  { y: 80, h: 56, label: "skull", cls: "fill-stone-200 dark:fill-stone-800" },
  { y: 136, h: 10, label: "dura", cls: "fill-amber-100 dark:fill-amber-900/40" },
  { y: 146, h: 10, label: "fluid", cls: "fill-sky-100 dark:fill-sky-950/60" },
  { y: 156, h: 176, label: "cortex · ~2.5 mm", cls: "fill-zinc-200/80 dark:fill-zinc-700/60" },
  { y: 332, h: 108, label: "white matter", cls: "fill-zinc-100 dark:fill-zinc-800/70" },
];

// Where each electrode "listens": an ellipse (cx, cy, rx, ry) in SVG units.
const ZONES: Record<ElectrodeId, [number, number, number, number]> = {
  eeg: [292, 210, 120, 90],
  ecog: [228, 190, 62, 38],
  stentrode: [62, 190, 58, 40],
  utah: [145, 232, 44, 52],
  tetrode: [100, 268, 15, 15],
  neuropixels: [236, 248, 14, 86],
  patch: [324, 250, 7, 7],
};

interface Neuron {
  x: number;
  y: number;
  s: number;
}

function useNeurons(): Neuron[] {
  return useMemo(() => {
    const rand = rng(11);
    return Array.from({ length: 70 }, () => ({ x: 14 + rand() * 332, y: 170 + rand() * 150, s: 2.6 + rand() * 1.8 }));
  }, []);
}

function inside([cx, cy, rx, ry]: [number, number, number, number], n: Neuron): boolean {
  return ((n.x - cx) / rx) ** 2 + ((n.y - cy) / ry) ** 2 <= 1;
}

function ElectrodeShape({ id }: { id: ElectrodeId }) {
  switch (id) {
    case "eeg":
      return (
        <g>
          <path d="M292 0 C 300 14, 284 22, 292 34" fill="none" strokeWidth={1.5} />
          <ellipse cx={292} cy={38} rx={13} ry={4} />
        </g>
      );
    case "ecog":
      return (
        <g>
          <rect x={192} y={150} width={74} height={5} rx={2} />
          {[202, 220, 238, 256].map((x) => (
            <circle key={x} cx={x} cy={152.5} r={2.6} className="fill-white dark:fill-zinc-900" />
          ))}
          <path d="M266 152 C 300 146, 296 60, 316 0" fill="none" strokeWidth={1.4} />
        </g>
      );
    case "stentrode":
      return (
        <g>
          <circle cx={62} cy={150} r={11} fill="none" strokeWidth={2} strokeDasharray="3 2" />
          <circle cx={62} cy={150} r={6} fill="none" strokeWidth={1} />
          <path d="M51 150 C 30 150, 20 120, 18 0" fill="none" strokeWidth={1.3} />
        </g>
      );
    case "utah":
      return (
        <g>
          <rect x={118} y={146} width={54} height={6} rx={1.5} />
          {[122, 131, 140, 149, 158, 167].map((x) => (
            <path key={x} d={`M${x} 152 L${x} 252 L${x + 1} 258 L${x + 2} 252 L${x + 2} 152 Z`} />
          ))}
          <path d="M145 146 C 145 110, 150 50, 160 0" fill="none" strokeWidth={1.4} />
        </g>
      );
    case "tetrode":
      return (
        <g>
          <path d="M98 0 L98 268" fill="none" strokeWidth={2.4} />
          <path d="M101 0 C 95 40, 103 80, 97 120 S 103 200, 98 268" fill="none" strokeWidth={0.8} className="opacity-70" />
          <circle cx={98} cy={268} r={2.4} />
        </g>
      );
    case "neuropixels":
      return (
        <g>
          <path d="M233 0 L233 404 L236 412 L239 404 L239 0 Z" />
          {Array.from({ length: 22 }, (_, i) => (
            <rect key={i} x={234.6} y={168 + i * 10} width={2.8} height={2.4} className="fill-white dark:fill-zinc-900" />
          ))}
        </g>
      );
    case "patch":
      return (
        <g>
          <path d="M306 0 L318 214 L322 246 L326 214 L338 0 Z" fillOpacity={0.35} strokeWidth={1.2} />
          <path d="M322 0 L322 240" fill="none" strokeWidth={0.8} className="opacity-60" />
        </g>
      );
  }
}

function CrossSection({ selected, onSelect }: { selected: ElectrodeId; onSelect: (id: ElectrodeId) => void }) {
  const neurons = useNeurons();
  const zone = ZONES[selected];
  return (
    <svg viewBox="0 0 360 440" className="w-full max-w-[360px]" aria-hidden="true">
      {LAYERS.map((l) => (
        <g key={l.label}>
          <rect x={0} y={l.y} width={360} height={l.h} className={l.cls} />
        </g>
      ))}
      {/* Cortical layers */}
      {[1, 2, 3, 4, 5].map((k) => (
        <line key={k} x1={0} x2={360} y1={156 + k * 29} y2={156 + k * 29} className="stroke-zinc-300/60 dark:stroke-zinc-600/40" strokeDasharray="2 5" />
      ))}
      {/* Blood vessel (venous sinus) for the stentrode */}
      <circle cx={62} cy={150} r={15} className="fill-red-200 stroke-red-300 dark:fill-red-950 dark:stroke-red-900" />
      {/* Listening zone */}
      <ellipse
        key={selected}
        cx={zone[0]}
        cy={zone[1]}
        rx={zone[2]}
        ry={zone[3]}
        className="fill-accent-500/15 stroke-accent-500/60 transition-all duration-500 dark:fill-accent-300/15 dark:stroke-accent-300/60"
        strokeDasharray="4 3"
      />
      {/* Neurons: the ones the selected electrode hears light up */}
      {neurons.map((n, i) => {
        const heard = inside(zone, n);
        return (
          <path
            key={i}
            d={`M${n.x} ${n.y - n.s * 1.3} L${n.x + n.s} ${n.y + n.s * 0.8} L${n.x - n.s} ${n.y + n.s * 0.8} Z`}
            className={`transition-colors duration-500 ${heard ? "fill-accent-600 dark:fill-accent-300" : "fill-zinc-400/70 dark:fill-zinc-500/60"}`}
          />
        );
      })}
      {/* Electrodes: every one is clickable; the selected one is in full colour */}
      {ELECTRODES.map((e) => {
        const on = e.id === selected;
        return (
          <g
            key={e.id}
            onClick={() => onSelect(e.id)}
            className={`cursor-pointer transition-opacity duration-300 ${
              on
                ? "fill-accent-600 stroke-accent-700 opacity-100 dark:fill-accent-300 dark:stroke-accent-200"
                : "fill-zinc-500 stroke-zinc-500 opacity-30 hover:opacity-70 dark:fill-zinc-400 dark:stroke-zinc-400"
            }`}
          >
            <ElectrodeShape id={e.id} />
          </g>
        );
      })}
      {/* Layer labels */}
      {LAYERS.filter((l) => l.label !== "fluid").map((l) => (
        <text key={l.label} x={354} y={l.y + Math.min(l.h, 30) / 2 + 4} textAnchor="end" className="fill-zinc-500 text-[10px] dark:fill-zinc-400">
          {l.label}
        </text>
      ))}
      <text x={6} y={432} className="fill-zinc-400 text-[9px]">schematic · not to scale</text>
    </svg>
  );
}

// ---------------------------------------------------------------------------------------
// Example signal
// ---------------------------------------------------------------------------------------

function TracePlot({ electrode }: { electrode: ElectrodeType }) {
  const trace = useMemo(() => exampleTrace(electrode.trace, 3), [electrode.trace]);
  const W = 560;
  const n = trace.channels.length;
  const rowH = n === 1 ? 110 : n <= 4 ? 44 : 17;
  const H = rowH * n + 8;
  const [lo, hi] = trace.range;
  const paths = trace.channels.map((ch, c) => {
    const y0 = 4 + c * rowH;
    return ch
      .map((v, i) => {
        const x = (i / (ch.length - 1)) * W;
        const y = y0 + rowH - ((Math.min(hi, Math.max(lo, v)) - lo) / (hi - lo)) * rowH;
        return `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join("");
  });
  return (
    <div>
      <div className="relative overflow-hidden">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`Example ${electrode.name} signal: ${electrode.traceLabel}`}>
          {paths.map((d, i) => (
            <path key={i} d={d} fill="none" className="stroke-accent-600 dark:stroke-accent-300" strokeWidth={n > 4 ? 1 : 1.3} strokeLinejoin="round" />
          ))}
        </svg>
        <span key={electrode.id} aria-hidden="true" className="trace-redraw pointer-events-none absolute inset-0 bg-white dark:bg-zinc-900" />
      </div>
      <div className="mt-1 flex justify-between text-[11px] text-zinc-500">
        <span>{electrode.traceLabel}</span>
        <span className="num shrink-0 pl-3">
          {trace.seconds < 1 ? `${Math.round(trace.seconds * 1000)} ms` : `${trace.seconds} s`} · {trace.unit}
          {n > 1 ? ` · ${n} channels` : ""}
        </span>
      </div>
    </div>
  );
}

function CrowdMeter({ value }: { value: number }) {
  return (
    <div>
      <div className="relative h-2 rounded-full bg-gradient-to-r from-accent-100 via-sky-200 to-violet-200 dark:from-accent-900 dark:via-sky-900 dark:to-violet-900">
        <span
          className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-accent-600 shadow transition-[left] duration-500 dark:border-zinc-900 dark:bg-accent-300"
          style={{ left: `${4 + value * 92}%` }}
        />
      </div>
      <div className="mt-1 flex justify-between text-[10px] uppercase tracking-wider text-zinc-500">
        <span>one cell</span>
        <span>millions</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------------------
// The explorer
// ---------------------------------------------------------------------------------------

const TOUR_MS = 4200;

export function ElectrodeExplorer() {
  const [selected, setSelected] = useState<ElectrodeId>("utah");
  const [touring, setTouring] = useState(false);
  const [canTour, setCanTour] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  // The automatic tour is offered only after hydration, and never with reduced motion.
  useEffect(() => setCanTour(!prefersReducedMotion()), []);
  const e = ELECTRODES.find((x) => x.id === selected)!;

  useEffect(() => {
    if (!touring) return;
    timer.current = window.setInterval(() => {
      setSelected((cur) => {
        const i = ELECTRODES.findIndex((x) => x.id === cur);
        return ELECTRODES[(i + 1) % ELECTRODES.length]!.id;
      });
    }, TOUR_MS);
    return () => window.clearInterval(timer.current);
  }, [touring]);

  const pick = (id: ElectrodeId) => {
    setTouring(false);
    setSelected(id);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Electrode type">
        {ELECTRODES.map((x) => (
          <button
            key={x.id}
            type="button"
            onClick={() => pick(x.id)}
            aria-pressed={x.id === selected}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              x.id === selected
                ? "bg-accent-600 text-white shadow-sm shadow-accent-600/30 dark:bg-accent-300 dark:text-zinc-900"
                : "border border-zinc-300 bg-white/80 text-zinc-700 hover:border-accent-500/60 dark:border-zinc-700 dark:bg-zinc-900/80 dark:text-zinc-300"
            }`}
          >
            {x.name}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setTouring((t) => !t)}
          className="ml-auto rounded-full px-3 py-1 text-xs font-medium text-accent-700 hover:bg-accent-50 dark:text-accent-200 dark:hover:bg-accent-500/10"
          aria-pressed={touring}
          hidden={!canTour}
        >
          {touring ? "Stop the tour" : "Take the tour, outside in →"}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
        <div className="mx-auto w-full max-w-[320px]">
          <CrossSection selected={selected} onSelect={pick} />
        </div>
        <div className="min-w-0 space-y-4" aria-live="polite">
          <div key={e.id} className="animate-fade-up">
            <div className="flex flex-wrap items-baseline gap-x-3">
              <h3 className="text-lg font-semibold tracking-tight">{e.name}</h3>
              <span className="text-xs text-zinc-500">since {e.since}</span>
            </div>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{e.where}</p>
            <p className="mt-2 text-[15px] leading-relaxed text-zinc-700 dark:text-zinc-300">{e.hears}</p>
          </div>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-3">
            {[
              ["Neurons per channel", e.neurons],
              ["Detail", e.resolution],
              ["Channels", e.channels],
              ["Goes", e.invasiveness],
              ["Used for", e.uses],
            ].map(([k, v]) => (
              <div key={k} className={k === "Used for" ? "col-span-2 sm:col-span-2" : ""}>
                <dt className="text-[11px] uppercase tracking-wider text-zinc-500">{k}</dt>
                <dd className="mt-0.5 text-zinc-800 dark:text-zinc-200">{v}</dd>
              </div>
            ))}
          </dl>
          <div>
            <div className="mb-1.5 text-[11px] uppercase tracking-wider text-zinc-500">How many neurons one channel hears</div>
            <CrowdMeter value={e.crowd} />
          </div>
          <div className="rounded-md border border-zinc-200 p-3 dark:border-zinc-800">
            <div className="mb-2 text-[11px] uppercase tracking-wider text-zinc-500">What it records · simulated</div>
            <TracePlot electrode={e} />
          </div>
        </div>
      </div>
    </div>
  );
}
