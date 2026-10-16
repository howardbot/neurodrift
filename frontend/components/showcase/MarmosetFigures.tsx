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
  { label: "Animal TS — new training in between", g: 0.1085, lo: 0.0442, hi: 0.1711, colour: "#c2410c" },
  { label: "Animal TY — new training (replication)", g: 0.1248, lo: 0.0583, hi: 0.1871, colour: "#c2410c" },
  { label: "Animal TS — no task in between (control)", g: -0.0503, lo: -0.1789, hi: 0.0736, colour: "#71717a" },
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
