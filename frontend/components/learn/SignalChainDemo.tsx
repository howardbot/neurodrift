"use client";

import { useEffect, useMemo, useState } from "react";
import { prefersReducedMotion } from "@/components/motion";
import {
  FS,
  SNIPPET_PRE,
  binCounts,
  detectSpikes,
  envelope,
  features,
  kmeans2,
  makeRecording,
  noiseSigma,
  scoreDetections,
  snippets,
  splitBands,
} from "@/lib/signal";

const STAGES = [
  { id: "raw", title: "Raw voltage", caption: "What the amplifier sees at one electrode: slow waves, spikes and noise, all mixed together." },
  { id: "filter", title: "Split the bands", caption: "A low-pass filter keeps the slow local field potential; a high-pass filter keeps the fast spike band." },
  { id: "detect", title: "Detect", caption: "Mark every dip below a threshold set from the noise level. Because this is a simulation, we can check each mark against the truth." },
  { id: "snippets", title: "Cut out waveforms", caption: "Copy a short window around each detection and stack them. Two shapes are already visible." },
  { id: "sort", title: "Sort", caption: "Describe each waveform by its depth and width, then let a clustering algorithm group similar ones: one group per neuron, ideally." },
  { id: "trains", title: "Spike trains", caption: "Each group becomes a list of spike times: one row per neuron." },
  { id: "bin", title: "Count in bins", caption: "Count spikes in 50 ms windows. This neurons × time table is the X a decoder reads." },
] as const;

const W = 640;
const H = 170;
const CLUSTER_CLASSES = ["fill-accent-600 stroke-accent-600 dark:fill-accent-300 dark:stroke-accent-300", "fill-orange-600 stroke-orange-600 dark:fill-orange-400 dark:stroke-orange-400"];

function scaleY(v: number, lo: number, hi: number, top = 6, height = H - 12) {
  return top + height - ((v - lo) / (hi - lo)) * height;
}

function EnvelopePath({ x, lo, hi, top, height, className }: { x: number[]; lo: number; hi: number; top?: number; height?: number; className: string }) {
  const env = envelope(x, 640);
  const d = env
    .map(([a, b], i) => {
      const px = (i / (env.length - 1)) * W;
      return `M${px.toFixed(1)},${scaleY(b, lo, hi, top, height).toFixed(1)}L${px.toFixed(1)},${scaleY(a, lo, hi, top, height).toFixed(1)}`;
    })
    .join("");
  return <path d={d} fill="none" className={className} strokeWidth={1} />;
}

export function SignalChainDemo() {
  const [stage, setStage] = useState(0);
  const [noise, setNoise] = useState(10);
  const [k, setK] = useState(4.5);
  const [seed, setSeed] = useState(7);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!playing) return;
    if (prefersReducedMotion()) {
      setPlaying(false);
      return;
    }
    const t = window.setInterval(() => setStage((s) => (s + 1) % STAGES.length), 3800);
    return () => window.clearInterval(t);
  }, [playing]);

  const rec = useMemo(() => makeRecording({ seed, noise }), [seed, noise]);
  const bands = useMemo(() => splitBands(rec.raw), [rec]);
  const sigma = useMemo(() => noiseSigma(bands.spikeBand), [bands]);
  const threshold = k * sigma;
  const detected = useMemo(() => detectSpikes(bands.spikeBand, threshold), [bands, threshold]);
  const score = useMemo(() => scoreDetections(detected, rec.truth), [detected, rec]);
  const usable = useMemo(() => detected.filter((i) => i - SNIPPET_PRE >= 0 && i + 20 < bands.spikeBand.length), [detected, bands]);
  const snips = useMemo(() => snippets(bands.spikeBand, usable), [bands, usable]);
  const feats = useMemo(() => features(snips), [snips]);
  const labels = useMemo(() => {
    const raw = kmeans2(feats);
    // Name clusters consistently: cluster 0 is the one with the deeper average trough.
    const depth = [0, 1].map((c) => {
      const f = feats.filter((_, i) => raw[i] === c);
      return f.length ? f.reduce((s, p) => s + p[0], 0) / f.length : -Infinity;
    });
    return depth[0]! >= depth[1]! ? raw : raw.map((l) => 1 - l);
  }, [feats]);
  const counts = useMemo(() => binCounts(usable, labels, 2, rec.raw.length, FS / 20), [usable, labels, rec]);

  const current = STAGES[stage]!;

  function plot() {
    switch (current.id) {
      case "raw":
        return (
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="One second of raw broadband voltage">
            <EnvelopePath x={rec.raw} lo={-320} hi={260} className="stroke-zinc-700 dark:stroke-zinc-300" />
          </svg>
        );
      case "filter":
        return (
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Low-frequency field potential above, high-frequency spike band below">
            <EnvelopePath x={bands.lfp} lo={-220} hi={220} top={4} height={70} className="stroke-violet-500 dark:stroke-violet-300" />
            <text x={4} y={14} className="fill-violet-600 text-[11px] dark:fill-violet-300">local field potential (slow)</text>
            <EnvelopePath x={bands.spikeBand} lo={-140} hi={80} top={88} height={78} className="stroke-accent-600 dark:stroke-accent-300" />
            <text x={4} y={98} className="fill-accent-600 text-[11px] dark:fill-accent-300">spike band (fast)</text>
          </svg>
        );
      case "detect": {
        const lo = -140;
        const hi = 80;
        const missed = rec.truth.filter((t) => !detected.some((d) => Math.abs(d - t.index) <= 8));
        return (
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`Spike band with threshold: ${score.hits} hits, ${score.misses} misses, ${score.falseAlarms} false alarms`}>
            <EnvelopePath x={bands.spikeBand} lo={lo} hi={hi} className="stroke-zinc-500 dark:stroke-zinc-400" />
            <line x1={0} x2={W} y1={scaleY(-threshold, lo, hi)} y2={scaleY(-threshold, lo, hi)} className="stroke-rose-500" strokeDasharray="5 4" />
            <text x={W - 4} y={scaleY(-threshold, lo, hi) - 4} textAnchor="end" className="fill-rose-600 text-[10px] dark:fill-rose-400">threshold = −{k.toFixed(1)} × noise</text>
            {detected.map((d, i) => {
              const px = (d / rec.raw.length) * W;
              const hit = score.matchedUnit[i]! >= 0;
              return hit ? (
                <circle key={i} cx={px} cy={10} r={3.2} className="fill-emerald-500" />
              ) : (
                <path key={i} d={`M${px - 3.5},6.5 L${px + 3.5},13.5 M${px + 3.5},6.5 L${px - 3.5},13.5`} className="stroke-rose-500" strokeWidth={1.8} />
              );
            })}
            {missed.map((m) => (
              <circle key={m.index} cx={(m.index / rec.raw.length) * W} cy={H - 8} r={3.5} className="fill-none stroke-amber-500" strokeWidth={1.6} />
            ))}
          </svg>
        );
      }
      case "snippets":
      case "sort": {
        const sw = current.id === "sort" ? 300 : W;
        const lo = -150;
        const hi = 70;
        const len = snips[0]?.length ?? 28;
        const wave = (s: number[]) => s.map((v, j) => `${j ? "L" : "M"}${((j / (len - 1)) * sw).toFixed(1)},${scaleY(v, lo, hi).toFixed(1)}`).join("");
        const sorted = current.id === "sort";
        const maxDepth = 160;
        return (
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={sorted ? "Waveforms coloured by cluster, and their features" : "All detected waveforms overlaid"}>
            {snips.map((s, i) => (
              <path
                key={i}
                d={wave(s)}
                fill="none"
                strokeWidth={1}
                className={sorted ? CLUSTER_CLASSES[labels[i] ?? 0]!.split(" ").filter((c) => c.includes("stroke")).join(" ") : "stroke-zinc-500 dark:stroke-zinc-400"}
                opacity={0.25}
              />
            ))}
            {sorted && (
              <g>
                <line x1={340} x2={340} y1={6} y2={H - 22} className="stroke-zinc-300 dark:stroke-zinc-700" />
                <line x1={340} x2={W - 6} y1={H - 22} y2={H - 22} className="stroke-zinc-300 dark:stroke-zinc-700" />
                {feats.map(([depth, width], i) => (
                  <circle
                    key={i}
                    cx={340 + Math.min(1, width / 1.6) * (W - 350)}
                    cy={H - 22 - Math.min(1, depth / maxDepth) * (H - 32)}
                    r={3}
                    className={CLUSTER_CLASSES[labels[i] ?? 0]!.split(" ").filter((c) => c.includes("fill")).join(" ")}
                    opacity={0.7}
                  />
                ))}
                <text x={(340 + W) / 2} y={H - 6} textAnchor="middle" className="fill-zinc-500 text-[10px]">width (trough to peak)</text>
                <text x={348} y={16} className="fill-zinc-500 text-[10px]">depth</text>
              </g>
            )}
          </svg>
        );
      }
      case "trains":
        return (
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Spike trains of the two sorted neurons">
            {[0, 1].map((c) => (
              <g key={c}>
                <text x={0} y={46 + c * 64} className="fill-zinc-500 text-[11px]">neuron {c + 1}</text>
                {usable.map((idx, i) =>
                  labels[i] === c ? (
                    <line key={i} x1={70 + (idx / rec.raw.length) * (W - 76)} x2={70 + (idx / rec.raw.length) * (W - 76)} y1={26 + c * 64} y2={60 + c * 64} className={CLUSTER_CLASSES[c]!.split(" ").filter((x) => x.includes("stroke")).join(" ")} strokeWidth={1.6} />
                  ) : null,
                )}
              </g>
            ))}
            <text x={W - 4} y={H - 4} textAnchor="end" className="fill-zinc-500 text-[10px]">1 second</text>
          </svg>
        );
      case "bin": {
        const max = Math.max(1, ...counts.flat());
        const cw = (W - 76) / counts[0]!.length;
        return (
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Spike counts in 50 millisecond bins for the two neurons">
            {counts.map((row, c) => (
              <g key={c}>
                <text x={0} y={52 + c * 56} className="fill-zinc-500 text-[11px]">neuron {c + 1}</text>
                {row.map((v, b) => (
                  <g key={b}>
                    <rect x={70 + b * cw + 1} y={28 + c * 56} width={cw - 2} height={44} rx={3} className={CLUSTER_CLASSES[c]!.split(" ").filter((x) => x.includes("fill")).join(" ")} opacity={0.12 + 0.88 * (v / max)} />
                    <text x={70 + b * cw + cw / 2} y={55 + c * 56} textAnchor="middle" className={`num text-[11px] ${v / max > 0.55 ? "fill-white dark:fill-zinc-900" : "fill-zinc-700 dark:fill-zinc-300"}`}>{v}</text>
                  </g>
                ))}
              </g>
            ))}
            <text x={70} y={H - 4} className="fill-zinc-500 text-[10px]">each column = 50 ms</text>
          </svg>
        );
      }
    }
  }

  const clusterSizes = [0, 1].map((c) => labels.filter((l) => l === c).length);

  return (
    <div className="space-y-4">
      <ol className="flex flex-wrap gap-1.5" aria-label="Pipeline stage">
        {STAGES.map((s, i) => (
          <li key={s.id}>
            <button
              type="button"
              onClick={() => {
                setPlaying(false);
                setStage(i);
              }}
              aria-current={i === stage ? "step" : undefined}
              className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                i === stage
                  ? "bg-accent-600 text-white shadow-sm shadow-accent-600/30 dark:bg-accent-300 dark:text-zinc-900"
                  : i < stage
                    ? "bg-accent-50 text-accent-800 dark:bg-accent-500/10 dark:text-accent-100"
                    : "border border-zinc-300 text-zinc-600 hover:border-accent-500/60 dark:border-zinc-700 dark:text-zinc-400"
              }`}
            >
              <span className="font-mono opacity-70">{i + 1}</span>
              {s.title}
            </button>
          </li>
        ))}
      </ol>

      <div className="rounded-md border border-zinc-200 p-3 dark:border-zinc-800">
        <div className="relative overflow-hidden">
          {plot()}
          <span key={`${stage}-${seed}`} aria-hidden="true" className="trace-redraw pointer-events-none absolute inset-0 bg-white dark:bg-zinc-900" />
        </div>
        <p key={stage} className="mt-2 animate-fade-up text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          <span className="font-semibold">{current.title}.</span> {current.caption}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-5">
        {[
          ["Noise estimate", `${sigma.toFixed(1)} µV`],
          ["Detected", String(detected.length)],
          ["Real spikes found", `${score.hits} of ${rec.truth.length}`],
          ["False alarms", String(score.falseAlarms)],
          ["Cluster sizes", `${clusterSizes[0]} · ${clusterSizes[1]}`],
        ].map(([label, value]) => (
          <div key={label}>
            <div className="text-[11px] uppercase tracking-wider text-zinc-500">{label}</div>
            <div className="num font-mono text-base">{value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <label className="block text-sm">
          <span className="label">Recording noise: {noise} µV</span>
          <input type="range" min={4} max={30} value={noise} onChange={(e) => setNoise(Number(e.target.value))} className="w-full accent-[#2f5d9e]" />
        </label>
        <label className="block text-sm">
          <span className="label">Threshold: {k.toFixed(1)} × noise</span>
          <input type="range" min={2.5} max={9} step={0.5} value={k} onChange={(e) => setK(Number(e.target.value))} className="w-full accent-[#2f5d9e]" />
        </label>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setStage((s) => Math.max(0, s - 1))} disabled={stage === 0} className="btn btn-outline px-3 py-1.5 text-xs disabled:opacity-40">
            ← Back
          </button>
          <button
            type="button"
            onClick={() => {
              setPlaying(false);
              setStage((s) => Math.min(STAGES.length - 1, s + 1));
            }}
            disabled={stage === STAGES.length - 1}
            className="btn btn-primary px-3 py-1.5 text-xs disabled:opacity-40"
          >
            Next step →
          </button>
          <button type="button" onClick={() => setPlaying((p) => !p)} aria-pressed={playing} className="btn btn-outline px-3 py-1.5 text-xs">
            {playing ? "Pause" : "Play all"}
          </button>
          <button type="button" onClick={() => setSeed((s) => s + 1)} className="btn btn-outline px-3 py-1.5 text-xs">
            New recording
          </button>
        </div>
      </div>
    </div>
  );
}
