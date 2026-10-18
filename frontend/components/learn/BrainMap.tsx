"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { prefersReducedMotion } from "@/components/motion";
import { BRAIN_AREAS, type AreaId } from "@/content/learn";
import { RESEARCH } from "@/content/research";
import { OUTLINE, SULCI } from "@/components/learn/brainShapes";

// Schematic left hemisphere, front to the left (viewBox 600 × 380). Shapes and positions
// are approximate and drawn for a generic primate brain; several areas lie inside folds.

const LOBES = [
  { name: "frontal", d: "M0 0 L332 0 L330 36 C318 90, 300 150, 278 228 L212 258 L0 380 Z", cls: "fill-sky-300/25 dark:fill-sky-400/10", at: [120, 196] },
  { name: "parietal", d: "M332 0 L520 0 L512 70 C524 120, 522 180, 508 236 L368 206 L278 228 C300 150, 318 90, 330 36 Z", cls: "fill-violet-300/25 dark:fill-violet-400/10", at: [424, 168] },
  { name: "occipital", d: "M520 0 L600 0 L600 380 L508 380 L508 236 C522 180, 524 120, 512 70 Z", cls: "fill-emerald-300/25 dark:fill-emerald-400/10", at: [546, 292] },
  { name: "temporal", d: "M212 258 L278 228 L368 206 L508 236 L508 380 L0 380 Z", cls: "fill-amber-300/25 dark:fill-amber-400/10", at: [252, 288] },
];

// Area hotspots: centre and shape.
const SHAPES: Record<AreaId, { cx: number; cy: number; d: string }> = {
  v1: { cx: 550, cy: 178, d: "M528 112 C552 104, 574 130, 576 178 C576 214, 562 240, 540 246 C526 220, 520 160, 528 112 Z" },
  v3a: { cx: 499, cy: 140, d: "M488 112 C500 106, 510 116, 512 140 C512 160, 506 172, 496 170 C486 160, 484 128, 488 112 Z" },
  cip: { cx: 466, cy: 100, d: "M444 96 C452 84, 478 82, 488 92 C492 104, 480 114, 462 114 C448 112, 440 106, 444 96 Z" },
  pmd: { cx: 248, cy: 96, d: "M222 72 C240 60, 268 62, 282 74 C286 96, 276 120, 258 126 C238 124, 222 108, 222 72 Z" },
  m1: { cx: 288, cy: 140, d: "M312 40 C300 92, 284 150, 262 222 L242 214 C262 148, 276 92, 292 42 Z" },
};

// The route from seeing to doing (dorsal stream), and the "what" route through temporal cortex.
const DORSAL = "M552 182 C532 162, 512 150, 499 140 C490 124, 478 106, 466 100 C430 90, 360 82, 300 82 C270 84, 252 90, 248 96 C256 112, 266 124, 284 140";
const VENTRAL = "M548 196 C522 232, 470 252, 420 268 C370 282, 320 292, 280 292";
const ROUTE: AreaId[] = ["v1", "v3a", "cip", "pmd", "m1"];

const projectTitle = (slug: string) => RESEARCH.find((r) => r.slug === slug)?.title ?? slug;

export function BrainMap() {
  const [selected, setSelected] = useState<AreaId>("v1");
  const [showRoute, setShowRoute] = useState(true);
  const [showWhat, setShowWhat] = useState(false);
  const [showLobes, setShowLobes] = useState(true);
  const [animate, setAnimate] = useState(false);
  const area = BRAIN_AREAS.find((a) => a.id === selected)!;
  const step = ROUTE.indexOf(selected);

  // Travelling pulses only after hydration and never with reduced motion.
  useEffect(() => setAnimate(!prefersReducedMotion()), []);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Brain area">
        {BRAIN_AREAS.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => setSelected(a.id)}
            aria-pressed={a.id === selected}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              a.id === selected
                ? "bg-accent-600 text-white shadow-sm shadow-accent-600/30 dark:bg-accent-300 dark:text-zinc-900"
                : "border border-zinc-300 bg-white/80 text-zinc-700 hover:border-accent-500/60 dark:border-zinc-700 dark:bg-zinc-900/80 dark:text-zinc-300"
            }`}
          >
            {a.short}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <div>
          <svg viewBox="0 0 600 340" className="w-full" aria-hidden="true">
            <defs>
              <clipPath id="brain-clip">
                <path d={OUTLINE} />
              </clipPath>
            </defs>
            <path d={OUTLINE} className="fill-zinc-100 dark:fill-zinc-800/80" />
            {showLobes && (
              <g clipPath="url(#brain-clip)">
                {LOBES.map((l) => (
                  <path key={l.name} d={l.d} className={l.cls} />
                ))}
              </g>
            )}
            {SULCI.map((s, i) => (
              <path key={i} d={s.d} fill="none" className="stroke-zinc-400/80 dark:stroke-zinc-500/70" strokeWidth={2} strokeLinecap="round" />
            ))}
            <path d={OUTLINE} fill="none" className="stroke-zinc-400 dark:stroke-zinc-500" strokeWidth={2} />
            {showLobes &&
              LOBES.map((l) => (
                <text key={l.name} x={l.at[0]} y={l.at[1]} textAnchor="middle" className="fill-zinc-500/80 text-[11px] uppercase tracking-widest dark:fill-zinc-400/70">
                  {l.name}
                </text>
              ))}
            {SULCI.filter((s) => s.label).map((s) => (
              <text key={s.label} x={s.at[0]} y={s.at[1]} className="fill-zinc-500 text-[9.5px] italic dark:fill-zinc-400">
                {s.label}
              </text>
            ))}

            {showWhat && (
              <g>
                <path d={VENTRAL} fill="none" className="stroke-amber-500/70" strokeWidth={3} strokeDasharray="6 5" strokeLinecap="round" />
                <text x={296} y={312} className="fill-amber-600 text-[10.5px] font-medium dark:fill-amber-400">“what” route: recognising objects</text>
                {animate && (
                  <circle r={4} className="fill-amber-500 motion-reduce:hidden">
                    <animateMotion dur="3.4s" repeatCount="indefinite" path={VENTRAL} />
                  </circle>
                )}
              </g>
            )}
            {showRoute && (
              <g>
                <path d={DORSAL} fill="none" className="stroke-accent-500/70 dark:stroke-accent-300/70" strokeWidth={3} strokeLinecap="round" />
                {animate &&
                  [0, 1.2, 2.4].map((delay) => (
                    <circle key={delay} r={4.2} className="fill-accent-600 motion-reduce:hidden dark:fill-accent-200">
                      <animateMotion dur="3.6s" begin={`${delay}s`} repeatCount="indefinite" path={DORSAL} />
                    </circle>
                  ))}
              </g>
            )}

            {BRAIN_AREAS.map((a) => {
              const s = SHAPES[a.id];
              const on = a.id === selected;
              return (
                <g key={a.id} onClick={() => setSelected(a.id)} className="cursor-pointer">
                  <path
                    d={s.d}
                    className={`transition-[fill-opacity,stroke-width] duration-300 ${
                      on
                        ? "fill-accent-500/70 stroke-accent-700 dark:fill-accent-300/60 dark:stroke-accent-100"
                        : "fill-accent-500/30 stroke-accent-600/60 hover:fill-accent-500/50 dark:fill-accent-300/25 dark:stroke-accent-300/50"
                    }`}
                    strokeWidth={on ? 2.5 : 1.2}
                  />
                  {on && <circle cx={s.cx} cy={s.cy} r={14} className="animate-ping fill-none stroke-accent-500/60 motion-reduce:hidden" style={{ transformOrigin: `${s.cx}px ${s.cy}px` }} />}
                  <line x1={s.cx} y1={s.cy} x2={a.label[0]} y2={a.label[1] - 4} className="stroke-zinc-400/70" strokeWidth={0.8} />
                  <text
                    x={a.label[0]}
                    y={a.label[1]}
                    textAnchor="middle"
                    className={`text-[13px] font-semibold ${on ? "fill-accent-700 dark:fill-accent-200" : "fill-zinc-700 dark:fill-zinc-300"}`}
                  >
                    {a.short}
                  </text>
                </g>
              );
            })}
            <text x={8} y={334} className="fill-zinc-400 text-[9.5px]">left side of the brain, front to the left · schematic, not to scale</text>
          </svg>
          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-xs text-zinc-600 dark:text-zinc-400">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={showRoute} onChange={(e) => setShowRoute(e.target.checked)} /> Vision-to-action route
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={showWhat} onChange={(e) => setShowWhat(e.target.checked)} /> “What” route
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={showLobes} onChange={(e) => setShowLobes(e.target.checked)} /> Lobes
            </label>
          </div>
        </div>

        <div className="min-w-0 space-y-4" aria-live="polite">
          <div key={area.id} className="animate-fade-up space-y-3">
            <div>
              <div className="font-mono text-xs font-semibold text-accent-600 dark:text-accent-300">{area.short}</div>
              <h3 className="text-lg font-semibold tracking-tight">{area.name}</h3>
              <p className="mt-0.5 text-sm text-zinc-500">{area.where}</p>
            </div>
            <p className="text-[15px] leading-relaxed text-zinc-700 dark:text-zinc-300">{area.does}</p>
            <div className="rounded-md border-l-4 border-violet-400/60 bg-violet-50/60 px-3 py-2 text-sm leading-relaxed text-zinc-700 dark:bg-violet-500/10 dark:text-zinc-300">
              <span className="font-semibold">Did you know? </span>
              {area.fact}
            </div>
            <div>
              <div className="mb-1.5 text-[11px] uppercase tracking-wider text-zinc-500">In my research</div>
              {area.projects.length ? (
                <div className="flex flex-col gap-1.5">
                  {area.projects.map((slug) => (
                    <Link key={slug} href={`/research/${slug}`} className="group text-sm font-medium text-accent-600 dark:text-accent-300">
                      {projectTitle(slug)} <span className="arrow">→</span>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-zinc-500">Not recorded in my projects; shown because the route passes through it.</p>
              )}
            </div>
          </div>

          {step >= 0 && (
            <div className="rounded-md border border-zinc-200 p-3 dark:border-zinc-800">
              <div className="flex items-center justify-between gap-3 text-xs text-zinc-500">
                <span>
                  Vision-to-action route · step <span className="num font-mono">{step + 1}</span> of {ROUTE.length}
                </span>
                <span className="flex gap-1.5">
                  <button type="button" className="btn btn-outline px-2.5 py-1 text-xs disabled:opacity-40" disabled={step === 0} onClick={() => setSelected(ROUTE[step - 1]!)}>
                    ← Back
                  </button>
                  <button type="button" className="btn btn-primary px-2.5 py-1 text-xs disabled:opacity-40" disabled={step === ROUTE.length - 1} onClick={() => setSelected(ROUTE[step + 1]!)}>
                    Follow the signal →
                  </button>
                </span>
              </div>
              <div className="mt-2 flex gap-1" aria-hidden="true">
                {ROUTE.map((id, i) => (
                  <span key={id} className={`h-1 flex-1 rounded-full transition-colors duration-300 ${i <= step ? "bg-accent-500 dark:bg-accent-300" : "bg-zinc-200 dark:bg-zinc-800"}`} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
