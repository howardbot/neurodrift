"use client";

import { useState } from "react";

function Box({ x, y, w, h, title, sub, tone = "neutral" }: { x: number; y: number; w: number; h: number; title: string; sub?: string; tone?: "neutral" | "accent" | "out" }) {
  const cls = {
    neutral: "fill-zinc-50 stroke-zinc-300 dark:fill-zinc-800 dark:stroke-zinc-600",
    accent: "fill-accent-50 stroke-accent-500 dark:fill-accent-700/25",
    out: "fill-emerald-50 stroke-emerald-500 dark:fill-emerald-950 dark:stroke-emerald-700",
  }[tone];
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={7} className={cls} />
      <text x={x + w / 2} y={y + (sub ? h / 2 - 3 : h / 2 + 4)} textAnchor="middle" className="fill-zinc-800 text-[12px] font-semibold dark:fill-zinc-100">{title}</text>
      {sub && <text x={x + w / 2} y={y + h / 2 + 13} textAnchor="middle" className="fill-zinc-500 text-[10px]">{sub}</text>}
    </g>
  );
}

function Arrow({ x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number }) {
  return <line x1={x1} y1={y1} x2={x2} y2={y2} className="stroke-zinc-400" strokeWidth={1.5} markerEnd="url(#mf-arrow)" />;
}

/** CIP/V3A analysis pipeline: from spikes to three independent checks. */
export function NuisancePipeline() {
  return (
    <svg viewBox="0 0 720 300" className="w-full" role="img" aria-label="Analysis pipeline from spikes to residual analyses">
      <defs>
        <marker id="mf-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" className="fill-zinc-400" />
        </marker>
      </defs>
      <Box x={10} y={20} w={150} h={52} title="Spikes, both areas" sub="integrity-checked" />
      <Arrow x1={160} y1={46} x2={196} y2={46} />
      <Box x={198} y={20} w={150} h={52} title="Population rate" sub="per trial, 0–500 ms" />
      <Arrow x1={348} y1={46} x2={384} y2={46} />
      <rect x={386} y={6} width={190} height={80} rx={7} className="fill-accent-50 stroke-accent-500 dark:fill-accent-700/25" />
      <text x={481} y={26} textAnchor="middle" className="fill-zinc-800 text-[12px] font-semibold dark:fill-zinc-100">Subtract what is expected</text>
      <text x={481} y={45} textAnchor="middle" className="fill-zinc-600 text-[10px] dark:fill-zinc-400">96 stimulus conditions</text>
      <text x={481} y={59} textAnchor="middle" className="fill-zinc-600 text-[10px] dark:fill-zinc-400">+ slow trend over the session</text>
      <text x={481} y={73} textAnchor="middle" className="fill-zinc-600 text-[10px] dark:fill-zinc-400">+ activity just before the stimulus</text>
      <Arrow x1={576} y1={46} x2={612} y2={46} />
      <Box x={614} y={20} w={96} h={52} title="Residuals" sub="what's left" />
      <Arrow x1={662} y1={72} x2={662} y2={120} />
      <line x1={110} x2={662} y1={122} y2={122} className="stroke-zinc-400" strokeWidth={1.5} />
      <Arrow x1={110} y1={122} x2={110} y2={160} />
      <Arrow x1={360} y1={122} x2={360} y2={160} />
      <Arrow x1={610} y1={122} x2={610} y2={160} />
      <Box x={10} y={162} w={200} h={64} title="Do the areas co-vary?" sub="correlation of residuals" tone="out" />
      <Box x={260} y={162} w={200} h={64} title="Does one predict the other?" sub="held-out blocks of trials" tone="out" />
      <Box x={510} y={162} w={200} h={64} title="Could we even detect it?" sub="planted-signal simulations" tone="out" />
      <text x={110} y={250} textAnchor="middle" className="fill-zinc-500 text-[10px]">block bootstrap, refit every draw</text>
      <text x={110} y={264} textAnchor="middle" className="fill-zinc-500 text-[10px]">sign-flip and shift null tests</text>
      <text x={360} y={250} textAnchor="middle" className="fill-zinc-500 text-[10px]">5 folds of 25-trial blocks</text>
      <text x={360} y={264} textAnchor="middle" className="fill-zinc-500 text-[10px]">5 buffer trials on each side</text>
      <text x={610} y={250} textAnchor="middle" className="fill-zinc-500 text-[10px]">signals of 0.5–10% of variance</text>
      <text x={610} y={264} textAnchor="middle" className="fill-zinc-500 text-[10px]">calibrated false-alarm rate</text>
    </svg>
  );
}

/**
 * Blocked cross-validation: trials are assigned to folds in contiguous blocks, and a few
 * trials either side of each test block are left out of training so slowly varying
 * signals cannot leak from training into test.
 */
export function BlockedValidation() {
  const [fold, setFold] = useState(0);
  const nBlocks = 15;
  const blockTrials = 25;
  const buffer = 5;
  const total = nBlocks * blockTrials;
  const W = 680;
  const x = (t: number) => 10 + (t / total) * (W - 20);
  const trials = Array.from({ length: total }, (_, t) => {
    const block = Math.floor(t / blockTrials);
    const isTest = block % 5 === fold;
    const nearTest = Array.from({ length: nBlocks }, (_, b) => b).some((b) => {
      if (b % 5 !== fold) return false;
      const start = b * blockTrials;
      const end = start + blockTrials;
      return (t >= start - buffer && t < start) || (t >= end && t < end + buffer);
    });
    return isTest ? "test" : nearTest ? "buffer" : "train";
  });
  const colour = { train: "#8fb0da", test: "#c2410c", buffer: "#d4d4d8" } as const;
  return (
    <div className="space-y-3">
      <svg viewBox={`0 0 ${W} 60`} className="w-full" role="img" aria-label={`Fold ${fold + 1}: test blocks, buffer trials and training trials across the session`}>
        {trials.map((k, t) => (
          <rect key={t} x={x(t)} y={10} width={Math.max(1, (W - 20) / total)} height={30} fill={colour[k]} />
        ))}
        <text x={10} y={56} className="fill-zinc-500 text-[10px]">first trial</text>
        <text x={W - 10} y={56} textAnchor="end" className="fill-zinc-500 text-[10px]">trial {total}</text>
      </svg>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-zinc-600 dark:text-zinc-400">
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm" style={{ background: colour.train }} />used to fit the model</span>
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm" style={{ background: colour.test }} />held out for testing</span>
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm" style={{ background: colour.buffer }} />buffer, not used</span>
        <span className="ml-auto flex items-center gap-1">
          {[0, 1, 2, 3, 4].map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFold(f)}
              className={`rounded px-2 py-0.5 font-mono ${f === fold ? "bg-accent-600 text-white" : "border border-zinc-300 dark:border-zinc-700"}`}
              aria-pressed={f === fold}
            >
              fold {f + 1}
            </button>
          ))}
        </span>
      </div>
    </div>
  );
}

/** Stages of the disparity-gradient population model (methods only). */
export function DisparityModelPipeline() {
  const stages = [
    { title: "Disparity patterns", sub: "every pose × eye position" },
    { title: "Gradient detectors", sub: "match a preferred pattern" },
    { title: "Eye position", sub: "vergence tuning, pooled" },
    { title: "Normalisation", sub: "divisive, population-wide" },
    { title: "3D pose signal", sub: "weighted by distance" },
  ];
  const w = 128;
  const gap = 18;
  return (
    <svg viewBox={`0 0 ${stages.length * (w + gap) - gap + 20} 110`} className="w-full" role="img" aria-label="Five stages of the disparity model">
      <defs>
        <marker id="mf-arrow2" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" className="fill-zinc-400" />
        </marker>
      </defs>
      {stages.map((s, i) => {
        const x = 10 + i * (w + gap);
        return (
          <g key={s.title}>
            <Box x={x} y={18} w={w} h={64} title={s.title} sub=" " tone={i === stages.length - 1 ? "out" : i === 0 ? "neutral" : "accent"} />
            <text x={x + w / 2} y={64} textAnchor="middle" className="fill-zinc-500 text-[9px]">{s.sub}</text>
            {i < stages.length - 1 && <line x1={x + w} y1={50} x2={x + w + gap - 2} y2={50} className="stroke-zinc-400" strokeWidth={1.5} markerEnd="url(#mf-arrow2)" />}
          </g>
        );
      })}
      <text x={10} y={104} className="fill-zinc-500 text-[10px]">Each stage is a population of model neurons; gaze invariance is tested at the detector, relative-disparity and pose stages.</text>
    </svg>
  );
}
