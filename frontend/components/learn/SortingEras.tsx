import { SORT_METHODS, type SortMethodId } from "@/content/learn";

// When each family of spike-sorting methods appeared, and the tools that marked it. Time is
// compressed before 2000, when change was slow.

const LANES: { id: SortMethodId; start: number; short: string }[] = [
  { id: "window", start: 1962, short: "Windows and boxes" },
  { id: "manual", start: 1983, short: "Clusters cut by hand" },
  { id: "clustering", start: 2000, short: "Automatic clustering" },
  { id: "threshold", start: 2009, short: "No sorting, for BCIs" },
  { id: "template", start: 2016, short: "Template matching" },
  { id: "ensemble", start: 2020, short: "Compare many sorters" },
];

const TOOLS: { lane: SortMethodId; year: number; label: string; below?: boolean }[] = [
  { lane: "manual", year: 1983, label: "stereotrode" },
  { lane: "manual", year: 1993, label: "tetrodes", below: true },
  { lane: "clustering", year: 2000, label: "KlustaKwik" },
  { lane: "clustering", year: 2004, label: "Wave_clus", below: true },
  { lane: "clustering", year: 2017, label: "MountainSort" },
  { lane: "threshold", year: 2009, label: "Fraser et al." },
  { lane: "threshold", year: 2019, label: "Trautmann et al." },
  { lane: "template", year: 2016, label: "Kilosort" },
  { lane: "template", year: 2018, label: "SpyKING CIRCUS", below: true },
  { lane: "template", year: 2021, label: "drift correction" },
  { lane: "template", year: 2024, label: "Kilosort4", below: true },
  { lane: "ensemble", year: 2020, label: "SpikeInterface" },
];

const W = 680;
const LEFT = 150;
const RIGHT = 16;
const LANE_H = 40;
const TOP = 8;
const END = 2026;

/** Piecewise time axis: 1960–2000 takes a third of the width, 2000–2026 the rest. */
function x(year: number): number {
  const span = W - LEFT - RIGHT;
  if (year <= 2000) return LEFT + ((year - 1960) / 40) * span * 0.33;
  return LEFT + span * 0.33 + ((year - 2000) / (END - 2000)) * span * 0.67;
}

export function SortingEras() {
  const H = TOP + LANES.length * LANE_H + 28;
  const names = new Map(SORT_METHODS.map((m) => [m.id, m.name]));
  return (
    <div className="relative overflow-hidden">
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[560px]" role="img" aria-label="Timeline of spike-sorting approaches from the 1960s to today. All six are still in use.">
          {[1960, 1980, 2000, 2010, 2020].map((yr) => (
            <g key={yr}>
              <line x1={x(yr)} x2={x(yr)} y1={TOP} y2={H - 24} className="stroke-zinc-200 dark:stroke-zinc-800" strokeDasharray={yr === 2000 ? "3 3" : undefined} />
              <text x={x(yr)} y={H - 8} textAnchor="middle" className="fill-zinc-500 text-[11px]">
                {yr}
              </text>
            </g>
          ))}
          <text x={x(END)} y={H - 8} textAnchor="end" className="fill-zinc-500 text-[11px]">
            today
          </text>
          {LANES.map((lane, i) => {
            const cy = TOP + i * LANE_H + LANE_H / 2;
            return (
              <g key={lane.id}>
                <title>{names.get(lane.id)}</title>
                <text x={0} y={cy + 4} className="fill-zinc-700 text-[12px] font-medium dark:fill-zinc-300">
                  {lane.short}
                </text>
                <defs>
                  <linearGradient id={`lane-${lane.id}`} x1="0" x2="1">
                    <stop offset="0" stopColor="currentColor" stopOpacity={0.15} className="text-accent-500" />
                    <stop offset="0.25" stopColor="currentColor" stopOpacity={0.75} className="text-accent-500" />
                    <stop offset="1" stopColor="currentColor" stopOpacity={0.9} className="text-violet-500" />
                  </linearGradient>
                </defs>
                <rect x={x(lane.start)} y={cy - 4} width={x(END) - x(lane.start)} height={8} rx={4} fill={`url(#lane-${lane.id})`} />
                {TOOLS.filter((t) => t.lane === lane.id).map((t) => (
                  <g key={t.label}>
                    <circle cx={x(t.year)} cy={cy} r={4.5} className="fill-white stroke-accent-600 dark:fill-zinc-900 dark:stroke-accent-300" strokeWidth={1.8}>
                      <title>{`${t.year}: ${t.label}`}</title>
                    </circle>
                    <text x={x(t.year)} y={t.below ? cy + 17 : cy - 9} textAnchor="middle" className="fill-zinc-500 text-[10px] dark:fill-zinc-400">
                      {t.label}
                    </text>
                  </g>
                ))}
              </g>
            );
          })}
        </svg>
      </div>
      <span aria-hidden="true" className="trace-cover pointer-events-none absolute inset-0 bg-white dark:bg-zinc-900" />
    </div>
  );
}
