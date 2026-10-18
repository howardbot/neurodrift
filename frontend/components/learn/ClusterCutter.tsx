"use client";

import { useMemo, useRef, useState, type PointerEvent } from "react";
import { NOISE_UNIT, inBox, kmeans, makeSpikeCloud, scoreGroup, type Box, type GroupScore } from "@/lib/sorting";

// Scatter of spike heights on two wires, in µV. Drag to draw boxes, as in 1990s hand sorting.
const W = 460;
const H = 330;
const L = 46;
const R = 12;
const T = 12;
const B = 40;
const MIN = 30;
const MAX = 200;
const sx = (v: number) => L + ((v - MIN) / (MAX - MIN)) * (W - L - R);
const sy = (v: number) => H - B - ((v - MIN) / (MAX - MIN)) * (H - T - B);
const fromSx = (px: number) => MIN + ((px - L) / (W - L - R)) * (MAX - MIN);
const fromSy = (py: number) => MIN + ((H - B - py) / (H - T - B)) * (MAX - MIN);

const BOX_COLOURS = ["stroke-accent-600 fill-accent-500/10 dark:stroke-accent-300", "stroke-emerald-600 fill-emerald-500/10 dark:stroke-emerald-300", "stroke-amber-600 fill-amber-500/10 dark:stroke-amber-300"];
const BOX_TEXT = ["text-accent-600 dark:text-accent-300", "text-emerald-600 dark:text-emerald-300", "text-amber-600 dark:text-amber-300"];
const UNIT_FILL = ["fill-sky-500", "fill-violet-500", "fill-rose-500", "fill-zinc-400 dark:fill-zinc-500"];
const UNIT_NAME = ["neuron A", "neuron B", "neuron C", "background hash"];
const CLUSTER_FILL = ["fill-accent-500", "fill-emerald-500", "fill-amber-500", "fill-fuchsia-500"];
const SAMPLE_BOX: Box = { x0: 130, y0: 54, x1: 172, y1: 90 };

const pct = (v: number) => `${Math.round(v * 100)}%`;

function ScoreLine({ s, label, tone }: { s: GroupScore; label: string; tone: string }) {
  if (!s.count) return <li className="text-zinc-500">{label}: empty</li>;
  return (
    <li>
      <span className={`font-semibold ${tone}`}>{label}</span>: {s.count} spikes, mostly {UNIT_NAME[s.unit]}.{" "}
      <span className="whitespace-nowrap">
        Purity <span className="num font-mono font-semibold">{pct(s.purity)}</span>
      </span>
      {s.unit !== NOISE_UNIT && (
        <>
          ,{" "}
          <span className="whitespace-nowrap">
            caught <span className="num font-mono font-semibold">{pct(s.completeness)}</span> of its spikes
          </span>
        </>
      )}
    </li>
  );
}

export function ClusterCutter() {
  const [drift, setDrift] = useState(false);
  const [truth, setTruth] = useState(false);
  const [auto, setAuto] = useState(false);
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [draft, setDraft] = useState<Box | null>(null);
  const svg = useRef<SVGSVGElement>(null);

  const points = useMemo(() => makeSpikeCloud(7, drift), [drift]);
  const labels = useMemo(() => (auto ? kmeans(points, 4, 3) : null), [auto, points]);
  const boxScores = boxes.map((b) => scoreGroup(points, (p) => inBox(p, b)));
  const clusterScores = labels ? [0, 1, 2, 3].map((c) => scoreGroup(points, (_, i) => labels[i] === c)) : [];

  const toData = (e: PointerEvent<SVGSVGElement>): [number, number] => {
    const ctm = svg.current!.getScreenCTM();
    if (!ctm) return [MIN, MIN];
    const pt = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse());
    const clamp = (v: number) => Math.max(MIN, Math.min(MAX, v));
    return [clamp(fromSx(pt.x)), clamp(fromSy(pt.y))];
  };
  const onDown = (e: PointerEvent<SVGSVGElement>) => {
    if (boxes.length >= 3) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const [x, y] = toData(e);
    setDraft({ x0: x, y0: y, x1: x, y1: y });
  };
  const onMove = (e: PointerEvent<SVGSVGElement>) => {
    if (!draft) return;
    const [x, y] = toData(e);
    setDraft({ ...draft, x1: x, y1: y });
  };
  const onUp = () => {
    if (draft && Math.abs(draft.x1 - draft.x0) > 4 && Math.abs(draft.y1 - draft.y0) > 4) setBoxes((b) => [...b, draft]);
    setDraft(null);
  };

  const colourOf = (i: number) => {
    const p = points[i]!;
    if (labels) return CLUSTER_FILL[labels[i]!]!;
    if (truth) return UNIT_FILL[p.unit]!;
    return "fill-zinc-500 dark:fill-zinc-400";
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
      <div>
        <svg
          ref={svg}
          viewBox={`0 0 ${W} ${H}`}
          className={`w-full touch-none select-none ${boxes.length < 3 ? "cursor-crosshair" : ""}`}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={() => setDraft(null)}
          role="img"
          aria-label="Scatter plot of spikes: height on wire 1 against height on wire 2. Drag to draw a box around a cluster."
        >
          {[50, 100, 150, 200].map((v) => (
            <g key={v} aria-hidden="true">
              <line x1={sx(v)} x2={sx(v)} y1={T} y2={H - B} className="stroke-zinc-200 dark:stroke-zinc-800" />
              <line x1={L} x2={W - R} y1={sy(v)} y2={sy(v)} className="stroke-zinc-200 dark:stroke-zinc-800" />
              <text x={sx(v)} y={H - B + 16} textAnchor="middle" className="fill-zinc-500 text-[11px]">
                {v}
              </text>
              <text x={L - 6} y={sy(v) + 4} textAnchor="end" className="fill-zinc-500 text-[11px]">
                {v}
              </text>
            </g>
          ))}
          <text x={(L + W - R) / 2} y={H - 6} textAnchor="middle" className="fill-zinc-500 text-[11px]">
            spike height on wire 1 (µV)
          </text>
          <text x={12} y={(T + H - B) / 2} textAnchor="middle" transform={`rotate(-90 12 ${(T + H - B) / 2})`} className="fill-zinc-500 text-[11px]">
            spike height on wire 2 (µV)
          </text>
          <g key={`${drift}-${auto}-${truth}`} className="animate-fade-up">
            {points.map((p, i) => (
              <circle key={i} cx={sx(p.x)} cy={sy(p.y)} r={2.3} className={colourOf(i)} opacity={drift && !labels && !truth ? 0.25 + 0.75 * p.t : 0.75} />
            ))}
          </g>
          {[...boxes, ...(draft ? [draft] : [])].map((b, i) => (
            <g key={i}>
              <rect
                x={sx(Math.min(b.x0, b.x1))}
                y={sy(Math.max(b.y0, b.y1))}
                width={Math.abs(sx(b.x1) - sx(b.x0))}
                height={Math.abs(sy(b.y1) - sy(b.y0))}
                className={BOX_COLOURS[i % 3]}
                strokeWidth={1.8}
                strokeDasharray={i === boxes.length && draft ? "4 3" : undefined}
              />
              <text x={sx(Math.min(b.x0, b.x1)) + 4} y={sy(Math.max(b.y0, b.y1)) + 13} className={`fill-current text-[11px] font-semibold ${BOX_TEXT[i % 3]}`}>
                {i + 1}
              </text>
            </g>
          ))}
        </svg>
        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-xs text-zinc-600 dark:text-zinc-400">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={drift} onChange={(e) => setDrift(e.target.checked)} /> The electrode drifts during the recording
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={truth} onChange={(e) => setTruth(e.target.checked)} disabled={auto} /> Reveal the true neurons
          </label>
        </div>
      </div>

      <div className="min-w-0 space-y-4 text-sm">
        <p className="leading-relaxed text-zinc-700 dark:text-zinc-300">
          Each dot is one spike, placed by how big it looked on two neighbouring wires. Spikes from the same neuron land close together.{" "}
          <span className="font-medium">Drag on the plot to draw a box around a cluster</span>, up to three, as researchers did by hand for
          decades.
        </p>
        <div className="flex flex-wrap gap-2">
          {boxes.length === 0 && (
            <button type="button" className="btn btn-outline px-2.5 py-1 text-xs" onClick={() => setBoxes([SAMPLE_BOX])}>
              Draw one for me
            </button>
          )}
          <button type="button" className="btn btn-outline px-2.5 py-1 text-xs disabled:opacity-40" disabled={!boxes.length} onClick={() => setBoxes([])}>
            Clear boxes
          </button>
          <button type="button" className="btn btn-primary px-2.5 py-1 text-xs" onClick={() => setAuto((a) => !a)} aria-pressed={auto}>
            {auto ? "Back to my boxes" : "Let the computer sort"}
          </button>
        </div>

        <div aria-live="polite" className="space-y-2">
          {auto ? (
            <>
              <div className="text-[11px] uppercase tracking-wider text-zinc-500">The computer (k-means, 4 groups)</div>
              <ul className="space-y-1.5 text-zinc-700 dark:text-zinc-300">
                {clusterScores.map((s, c) => (
                  <ScoreLine key={c} s={s} label={`Group ${c + 1}`} tone={["text-accent-600 dark:text-accent-300", "text-emerald-600 dark:text-emerald-300", "text-amber-600 dark:text-amber-300", "text-fuchsia-600 dark:text-fuchsia-300"][c]!} />
                ))}
              </ul>
              <p className="text-xs leading-relaxed text-zinc-500">
                k-means has to be told how many groups to find, and assumes each one is round. Real sorters relax both, but the idea is the
                same: group spikes by shape without a person drawing lines.
              </p>
            </>
          ) : boxes.length ? (
            <>
              <div className="text-[11px] uppercase tracking-wider text-zinc-500">Your boxes</div>
              <ul className="space-y-1.5 text-zinc-700 dark:text-zinc-300">
                {boxScores.map((s, i) => (
                  <ScoreLine key={i} s={s} label={`Box ${i + 1}`} tone={BOX_TEXT[i % 3]!} />
                ))}
              </ul>
              <p className="text-xs leading-relaxed text-zinc-500">
                Purity: how many spikes in the box really came from that neuron. Caught: how many of that neuron&apos;s spikes made it into the
                box. A tight box is pure but misses spikes; a loose one catches more but lets in neighbours.
              </p>
            </>
          ) : (
            <p className="text-zinc-500">Draw a box to see how well it isolates a neuron.</p>
          )}
          {drift && (
            <p className="rounded-md border-l-4 border-amber-400/60 bg-amber-50/70 px-3 py-2 text-xs leading-relaxed text-zinc-700 dark:bg-amber-950/30 dark:text-zinc-300">
              Faint dots are early spikes, dark ones late. As the electrode slides, each neuron&apos;s cluster smears into a streak, so a box
              drawn early in the recording misses its spikes later. This is why modern sorters correct for drift first.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
