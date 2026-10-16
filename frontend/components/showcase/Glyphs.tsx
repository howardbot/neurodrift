// Small decorative animations, CSS only (no client JavaScript). All are aria-hidden;
// the text next to them carries the meaning.

const W = 160;
const H = 64;

/** A periodic wobble over two glyph widths, so a -50% translate loops seamlessly. */
function wobble(y0: number, amp: number, phase: number): string {
  const pts: string[] = [];
  for (let x = 0; x <= 2 * W; x += 4) {
    const t = (2 * Math.PI * x) / W;
    const y = y0 + amp * (0.6 * Math.sin(2 * t + phase) + 0.3 * Math.sin(5 * t + 1.7 * phase) + 0.25 * Math.sin(3 * t + 0.4));
    pts.push(`${x},${y.toFixed(1)}`);
  }
  return `M${pts.join(" L")}`;
}

function waveform(x0: number, scale: number): string {
  const y = 34;
  return `M${x0 - 22},${y} L${x0 - 8},${y} C${x0 - 5},${y} ${x0 - 4},${y + 22 * scale} ${x0},${y + 22 * scale} C${x0 + 4},${y + 22 * scale} ${x0 + 5},${y - 12 * scale} ${x0 + 10},${y - 12 * scale} C${x0 + 15},${y - 12 * scale} ${x0 + 16},${y} ${x0 + 22},${y}`;
}

function DriftGlyph() {
  return (
    <>
      <path d="M12 40c22-26 44-32 66-14s38 18 70-12" className="stroke-accent-600 dark:stroke-accent-300" strokeWidth={2.2} fill="none" strokeLinecap="round" />
      <g className="transition-transform duration-700 ease-out group-hover:-translate-y-2">
        <path
          d="M12 52c22-26 44-32 66-14s38 18 70-12"
          className="animate-dash-flow stroke-zinc-400 dark:stroke-zinc-500"
          strokeWidth={2.2}
          fill="none"
          strokeLinecap="round"
          strokeDasharray="3 6"
        />
      </g>
      <circle cx={148} cy={14} r={3.5} className="animate-float fill-accent-600 dark:fill-accent-300" />
    </>
  );
}

function SharedGlyph() {
  return (
    <>
      <g className="animate-wave-x [transform-box:fill-box]">
        <path d={wobble(22, 9, 0)} className="stroke-accent-600 dark:stroke-accent-300" strokeWidth={2} fill="none" />
      </g>
      <g className="animate-wave-x [transform-box:fill-box]">
        <path d={wobble(44, 7, 0.35)} className="stroke-violet-500 dark:stroke-violet-300" strokeWidth={2} fill="none" />
      </g>
      <text x={4} y={12} className="fill-zinc-400 font-mono text-[8px]">V3A</text>
      <text x={4} y={62} className="fill-zinc-400 font-mono text-[8px]">CIP</text>
    </>
  );
}

function StereoGlyph() {
  return (
    <>
      {[20, 44].map((y) => (
        <g key={y}>
          <circle cx={18} cy={y} r={7} className="fill-white stroke-zinc-400 dark:fill-zinc-900" strokeWidth={1.4} />
          <circle cx={21} cy={y} r={3} className="fill-accent-600 dark:fill-accent-300" />
          <path d={`M26 ${y} L118 32`} className="animate-dash-flow stroke-accent-500/60" strokeWidth={1.2} strokeDasharray="2 4" />
        </g>
      ))}
      <g className="origin-center transition-transform duration-700 ease-out [transform-box:fill-box] group-hover:rotate-[18deg]">
        <path d="M106 10 L132 16 L132 54 L106 48 Z" className="fill-accent-100 stroke-accent-500 dark:fill-accent-700/40" strokeWidth={1.4} />
        <path d="M110 20 L128 24 M110 30 L128 34 M110 40 L128 44" className="stroke-accent-400/70" strokeWidth={1} />
      </g>
    </>
  );
}

function SortingGlyph() {
  const units = [
    { scale: 1, cls: "stroke-accent-600 dark:stroke-accent-300", shift: "group-hover:-translate-x-9" },
    { scale: 0.75, cls: "stroke-orange-600 dark:stroke-orange-300", shift: "" },
    { scale: 0.55, cls: "stroke-emerald-600 dark:stroke-emerald-300", shift: "group-hover:translate-x-9" },
  ];
  return (
    <>
      <path d={`M0 34 H${W}`} className="stroke-zinc-200 dark:stroke-zinc-800" strokeWidth={1} />
      {units.map((u) => (
        <g key={u.scale} className={`transition-transform duration-700 ease-out ${u.shift}`}>
          <path d={waveform(80, u.scale)} className={u.cls} strokeWidth={2} fill="none" strokeLinejoin="round" />
        </g>
      ))}
    </>
  );
}

const GLYPHS: Record<string, () => React.JSX.Element> = {
  "cross-day-decoding": DriftGlyph,
  "shared-variability": SharedGlyph,
  "3d-vision": StereoGlyph,
  "spike-sorting": SortingGlyph,
};

export function ProjectGlyph({ slug }: { slug: string }) {
  const Glyph = GLYPHS[slug];
  if (!Glyph) return null;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} className="mx-auto block overflow-hidden" aria-hidden="true">
      <Glyph />
    </svg>
  );
}

/**
 * A train-day × test-day decoder matrix: accuracy is high on the diagonal and falls
 * off with distance between days. A pulse sweeps across it.
 */
export function DriftMatrix({ n = 6 }: { n?: number }) {
  const cells = Array.from({ length: n * n }, (_, k) => {
    const i = Math.floor(k / n);
    const j = k % n;
    return { i, j, v: 0.12 + 0.86 * Math.exp(-Math.abs(i - j) / 1.4) };
  });
  return (
    <div aria-hidden="true" className="select-none">
      <div className="mb-1.5 pl-6 font-mono text-[10px] text-zinc-400">test day →</div>
      <div className="flex gap-1.5">
        <div className="w-4 pt-1 font-mono text-[10px] leading-none text-zinc-400 [writing-mode:vertical-rl]">train day →</div>
        <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
          {cells.map((c) => (
            <span
              key={`${c.i}-${c.j}`}
              className="block h-5 w-5 animate-cell-pulse rounded-[3px] sm:h-6 sm:w-6"
              style={{ backgroundColor: `rgba(59, 111, 182, ${c.v.toFixed(2)})`, animationDelay: `${(c.i + c.j) * 140}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
