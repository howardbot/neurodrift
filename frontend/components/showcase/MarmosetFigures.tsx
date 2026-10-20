import { PAIRED_FORGET, PAIRED_INTERFERENCE } from "@/content/marmosetPairs";
import { readableInk } from "@/lib/color";

/** Experimental design: recording block 1 → in-between experience → recording block 2. */
export function CrossDayDesign() {
  return (
    <svg viewBox="0 0 640 200" className="w-full" role="img" aria-label="Design: recordings before, an in-between period, and recordings after; decoders are tested in both directions">
      <defs>
        <marker id="arrow-fwd" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill="#c2410c" />
        </marker>
        <marker id="arrow-rev" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill="#2f5d9e" />
        </marker>
      </defs>
      {/* Blocks */}
      <rect x={20} y={80} width={190} height={56} rx={8} className="fill-accent-50 stroke-accent-500 dark:fill-accent-700/20" />
      <text x={115} y={104} textAnchor="middle" className="fill-zinc-800 text-[13px] font-semibold dark:fill-zinc-100">Before (R1)</text>
      <text x={115} y={122} textAnchor="middle" className="fill-zinc-500 text-[11px]">many recording days, reaching</text>

      <rect x={240} y={80} width={160} height={56} rx={8} className="fill-zinc-100 stroke-zinc-300 dark:fill-zinc-800 dark:stroke-zinc-600" />
      <text x={320} y={100} textAnchor="middle" className="fill-zinc-800 text-[12px] font-semibold dark:fill-zinc-100">In between</text>
      <text x={320} y={116} textAnchor="middle" className="fill-zinc-500 text-[10.5px]">training on a second task</text>
      <text x={320} y={129} textAnchor="middle" className="fill-zinc-500 text-[10.5px]">— or no task (control)</text>

      <rect x={430} y={80} width={190} height={56} rx={8} className="fill-accent-50 stroke-accent-500 dark:fill-accent-700/20" />
      <text x={525} y={104} textAnchor="middle" className="fill-zinc-800 text-[13px] font-semibold dark:fill-zinc-100">After (R2)</text>
      <text x={525} y={122} textAnchor="middle" className="fill-zinc-500 text-[11px]">same reaching task again</text>

      {/* Forward and reverse transfer */}
      <path d="M115,76 C 200,34 440,34 520,76" fill="none" stroke="#c2410c" strokeWidth={2.5} markerEnd="url(#arrow-fwd)" />
      <text x={320} y={22} textAnchor="middle" className="fill-[#c2410c] text-[12px] font-medium">forward: learn the decoder before, test it after</text>
      <path d="M530,140 C 440,176 200,176 120,140" fill="none" stroke="#2f5d9e" strokeWidth={2.5} markerEnd="url(#arrow-rev)" />
      <text x={320} y={192} textAnchor="middle" className="fill-[#2f5d9e] text-[12px] font-medium">reverse: learn it after, test it before</text>
    </svg>
  );
}

// Correlation gap G = r(reverse) − r(forward), with 95% crossed-date intervals.
// Source: Marmoset_Decoding_Public, HANDOFF.md, matched28 protocol (published snapshot).
const GAP_ROWS = [
  { label: "Marmoset A — new training in between", g: 0.1085, lo: 0.0442, hi: 0.1711, colour: "#c2410c" },
  { label: "Marmoset B — new training (replication)", g: 0.1248, lo: 0.0583, hi: 0.1871, colour: "#c2410c" },
  { label: "Marmoset A — no task in between (control)", g: -0.0503, lo: -0.1789, hi: 0.0736, colour: "#71717a" },
];

export function GapChart() {
  const W = 640;
  const rowH = 46;
  const left = 250;
  const right = W - 30;
  const min = -0.2;
  const max = 0.25;
  const x = (v: number) => left + ((v - min) / (max - min)) * (right - left);
  const H = GAP_ROWS.length * rowH + 50;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Direction gap in decoding accuracy for three conditions">
      <line x1={x(0)} x2={x(0)} y1={8} y2={H - 34} className="stroke-zinc-400" strokeDasharray="4 3" />
      {[-0.2, -0.1, 0, 0.1, 0.2].map((t) => (
        <text key={t} x={x(t)} y={H - 18} textAnchor="middle" className="fill-zinc-500 text-[10px]">{t > 0 ? `+${t.toFixed(1)}` : t.toFixed(1)}</text>
      ))}
      <text x={x(0) - 6} y={H - 3} textAnchor="end" className="fill-zinc-500 text-[10px]">← forward transfer better</text>
      <text x={x(0) + 6} y={H - 3} className="fill-zinc-500 text-[10px]">reverse transfer better →</text>
      {GAP_ROWS.map((r, i) => {
        const y = 28 + i * rowH;
        return (
          <g key={r.label}>
            <text x={left - 12} y={y + 4} textAnchor="end" className="fill-zinc-700 text-[11.5px] dark:fill-zinc-300">{r.label}</text>
            <line x1={x(r.lo)} x2={x(r.hi)} y1={y} y2={y} stroke={r.colour} strokeWidth={2.5} />
            <line x1={x(r.lo)} x2={x(r.lo)} y1={y - 6} y2={y + 6} stroke={r.colour} strokeWidth={2} />
            <line x1={x(r.hi)} x2={x(r.hi)} y1={y - 6} y2={y + 6} stroke={r.colour} strokeWidth={2} />
            <circle cx={x(r.g)} cy={y} r={6} fill={r.colour} />
            <text x={x(r.g)} y={y - 11} textAnchor="middle" className="fill-zinc-600 text-[10px] dark:fill-zinc-400">{r.g > 0 ? "+" : ""}{r.g.toFixed(2)}</text>
          </g>
        );
      })}
    </svg>
  );
}


function SlopePanel({ pairs, title, colour, x0 }: { pairs: [number, number, number][]; title: string; colour: string; x0: number }) {
  const top = 40;
  const bottom = 250;
  const lo = 0.15;
  const hi = 0.65;
  const y = (r: number) => bottom - ((r - lo) / (hi - lo)) * (bottom - top);
  const xa = x0 + 40;
  const xb = x0 + 220;
  const up = pairs.filter(([f, r]) => r > f).length;
  const meanF = pairs.reduce((s, p) => s + p[0], 0) / pairs.length;
  const meanR = pairs.reduce((s, p) => s + p[1], 0) / pairs.length;
  return (
    <g>
      <text x={(xa + xb) / 2} y={16} textAnchor="middle" className="fill-zinc-800 text-[13px] font-semibold dark:fill-zinc-100">{title}</text>
      <text x={(xa + xb) / 2} y={32} textAnchor="middle" className="fill-zinc-500 text-[11px]">reverse better in {up} of {pairs.length} day pairs</text>
      {pairs.map(([f, r], i) => (
        <line key={i} x1={xa} y1={y(f)} x2={xb} y2={y(r)} stroke={r > f ? colour : "#a1a1aa"} strokeWidth={1} opacity={0.45} />
      ))}
      <line x1={xa} y1={y(meanF)} x2={xb} y2={y(meanR)} className="stroke-zinc-900 dark:stroke-zinc-100" strokeWidth={3} />
      <circle cx={xa} cy={y(meanF)} r={4.5} className="fill-zinc-900 dark:fill-zinc-100" />
      <circle cx={xb} cy={y(meanR)} r={4.5} className="fill-zinc-900 dark:fill-zinc-100" />
      <text x={xa - 8} y={y(meanF) + 4} textAnchor="end" className="fill-zinc-700 text-[11px] dark:fill-zinc-300">{meanF.toFixed(2)}</text>
      <text x={xb + 8} y={y(meanR) + 4} className="fill-zinc-700 text-[11px] dark:fill-zinc-300">{meanR.toFixed(2)}</text>
      <text x={xa} y={bottom + 20} textAnchor="middle" className="fill-[#c2410c] text-[11px] font-medium">forward</text>
      <text x={xb} y={bottom + 20} textAnchor="middle" className="fill-[#2f5d9e] text-[11px] font-medium">reverse</text>
    </g>
  );
}

/** Slope chart: each line is one pair of recording days; left = forward, right = reverse accuracy. */
export function PairSlopes() {
  return (
    <svg viewBox="0 0 600 280" className="w-full" role="img" aria-label="Decoding accuracy forward and reverse for every pair of recording days">
      {[0.2, 0.3, 0.4, 0.5, 0.6].map((t) => {
        const yy = 250 - ((t - 0.15) / 0.5) * 210;
        return (
          <g key={t}>
            <line x1={30} x2={590} y1={yy} y2={yy} className="stroke-zinc-100 dark:stroke-zinc-800" />
            <text x={26} y={yy + 4} textAnchor="end" className="fill-zinc-400 text-[10px]">{t.toFixed(1)}</text>
          </g>
        );
      })}
      <text x={10} y={145} textAnchor="middle" transform="rotate(-90 10 145)" className="fill-zinc-500 text-[10px]">accuracy (r)</text>
      <SlopePanel pairs={PAIRED_INTERFERENCE} title="New training in between (marmoset A)" colour="#2f5d9e" x0={30} />
      <SlopePanel pairs={PAIRED_FORGET} title="No task in between (marmoset A, control)" colour="#2f5d9e" x0={310} />
    </svg>
  );
}

// Output perturbation energy (matched28 protocol): how strongly real neural input pushes the
// decoder's prediction away from a calibrated reference. Rows: decoder learned on; columns: activity from.
// Source: Results/current/mechanism/directional_input_readout_replication/absolute_summary.csv
const ENERGY = [
  { title: "Marmoset A · new training", cells: { R1_R1: 0.76, R1_R2: 3.367, R2_R1: 1.612, R2_R2: 0.604 } },
  { title: "Marmoset B · new training", cells: { R1_R1: 0.683, R1_R2: 3.792, R2_R1: 2.149, R2_R2: 0.812 } },
  { title: "Marmoset A · no task (control)", cells: { R1_R1: 0.52, R1_R2: 1.803, R2_R1: 4.847, R2_R2: 1.541 } },
];

function shadeRgb(v: number): [number, number, number] {
  const t = Math.min(1, v / 5);
  // light sand → deep red
  return [Math.round(254 - t * 120), Math.round(240 - t * 205), Math.round(200 - t * 170)];
}

function shade(v: number): string {
  return `rgb(${shadeRgb(v).join(",")})`;
}

export function InputReadoutGrids() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
      {ENERGY.map((e) => (
        <div key={e.title}>
          <div className="mb-2 text-center text-xs font-semibold text-zinc-700 dark:text-zinc-300">{e.title}</div>
          <div className="grid grid-cols-[auto_1fr_1fr] gap-1 text-[11px]">
            <div />
            <div className="text-center text-zinc-500">activity before</div>
            <div className="text-center text-zinc-500">activity after</div>
            {(["R1", "R2"] as const).map((readout) => (
              <div key={readout} className="contents">
                <div className="flex items-center pr-1 text-right text-zinc-500">decoder learned {readout === "R1" ? "before" : "after"}</div>
                {(["R1", "R2"] as const).map((input) => {
                  const v = e.cells[`${readout}_${input}` as keyof typeof e.cells];
                  return (
                    <div key={input} className="flex h-14 items-center justify-center rounded font-mono text-sm font-semibold" style={{ background: shade(v), color: readableInk(shadeRgb(v)) }}>
                      {v.toFixed(2)}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

const TESTED: { idea: string; test: string; verdict: "ruled out" | "partial" | "sensitive" }[] = [
  { idea: "After-training days are just noisier", test: "Matched trial-to-trial variability and trial counts between days", verdict: "ruled out" },
  { idea: "The arm started in different postures", test: "Matched starting posture across day pairs", verdict: "ruled out" },
  { idea: "Different neurons were recorded", test: "Matched electrodes, unit quality and firing rates", verdict: "ruled out" },
  { idea: "Neurons fluctuate together differently", test: "Shuffled trials independently per unit during training", verdict: "ruled out" },
  { idea: "It depends on the reach time window", test: "Restricted and refitted the evaluation window", verdict: "ruled out" },
  { idea: "The behaviour itself changed", test: "Matched training behaviour using calibration data only", verdict: "partial" },
  { idea: "Activity drifts slowly within a day", test: "Corrected for chronological drift", verdict: "partial" },
  { idea: "The decoding algorithm is responsible", test: "Varied decoder and alignment training data, regularisation and noise models", verdict: "partial" },
  { idea: "It depends on which 'before' days are used", test: "Used only the last three days before the training", verdict: "sensitive" },
];

const VERDICT_STYLE = {
  "ruled out": { label: "didn't explain it", cls: "bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" },
  partial: { label: "explains part, or unclear", cls: "bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300" },
  sensitive: { label: "result changes", cls: "bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-300" },
};

export function ExplanationsTested() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {TESTED.map((t) => (
        <div key={t.idea} className="card card-hover p-4">
          <div className="text-sm font-semibold leading-snug">{t.idea}?</div>
          <div className="mt-1.5 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">{t.test}</div>
          <span className={`mt-3 inline-block rounded px-2 py-0.5 text-[11px] font-medium ${VERDICT_STYLE[t.verdict].cls}`}>{VERDICT_STYLE[t.verdict].label}</span>
        </div>
      ))}
    </div>
  );
}
