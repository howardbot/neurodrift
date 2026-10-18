import Link from "next/link";
import type { ReactNode } from "react";
import { Reveal, ScrollProgress } from "@/components/motion";
import { OUTLINE, SULCI } from "@/components/learn/brainShapes";
import { ScrollSteps } from "@/components/ScrollSteps";
import { HeroGlow } from "@/components/showcase/Story";
import { DEVICE_POINTS, DOUBLING_YEARS, GUIDES, type Guide, type TimelineEvent } from "@/content/learn";

export function GuideHero({ guide, children }: { guide: Guide; children?: ReactNode }) {
  return (
    <header className="relative mb-12 max-w-3xl pt-2">
      <ScrollProgress />
      <HeroGlow />
      <div className="mb-4 flex animate-fade-up flex-wrap items-center gap-2 text-xs text-zinc-500">
        <Link href="/learn" className="hover:text-accent-600">Field guide</Link>
        <span aria-hidden="true" className="text-zinc-300 dark:text-zinc-700">/</span>
        <span>{guide.minutes}-minute read</span>
        <span aria-hidden="true" className="text-zinc-300 dark:text-zinc-700">·</span>
        <span>No background needed</span>
      </div>
      <h1 className="animate-fade-up text-3xl font-semibold leading-tight tracking-tight [animation-delay:80ms] md:text-[2.6rem] md:leading-[1.15]">
        {guide.title}
      </h1>
      <p className="mt-4 animate-fade-up text-lg leading-relaxed text-zinc-600 [animation-delay:160ms] dark:text-zinc-400">{guide.hook}</p>
      {children && <div className="mt-5 animate-fade-up [animation-delay:240ms]">{children}</div>}
    </header>
  );
}

/** Small decorative illustration for a guide card. */
function GuideGlyph({ slug }: { slug: string }) {
  if (slug === "electrodes") {
    return (
      <svg viewBox="0 0 200 64" className="h-16 w-full" aria-hidden="true">
        <rect x={0} y={8} width={200} height={10} className="fill-rose-100 dark:fill-rose-950/50" />
        <rect x={0} y={18} width={200} height={12} className="fill-stone-200 dark:fill-stone-800" />
        <rect x={0} y={30} width={200} height={34} className="fill-zinc-200/80 dark:fill-zinc-700/60" />
        <ellipse cx={30} cy={7} rx={9} ry={3} className="fill-accent-600 dark:fill-accent-300" />
        {[70, 76, 82, 88, 94].map((x) => (
          <rect key={x} x={x} y={28} width={2} height={22} className="fill-accent-600/80 dark:fill-accent-300/80" />
        ))}
        <rect x={130} y={0} width={4} height={62} className="fill-accent-600 dark:fill-accent-300" />
        <path d="M164 0 L170 52 L176 0 Z" className="fill-accent-500/40 stroke-accent-600 dark:stroke-accent-300" />
        {[[110, 46], [150, 40], [186, 52], [52, 50]].map(([x, y]) => (
          <path key={x} d={`M${x} ${y! - 4} L${x! + 3} ${y! + 2} L${x! - 3} ${y! + 2} Z`} className="fill-zinc-400 dark:fill-zinc-500" />
        ))}
      </svg>
    );
  }
  if (slug === "brain-map") {
    return (
      <svg viewBox="40 20 560 320" className="h-16 w-full" aria-hidden="true">
        <path d={OUTLINE} className="fill-zinc-100 stroke-zinc-400 dark:fill-zinc-800 dark:stroke-zinc-500" strokeWidth={6} />
        {SULCI.slice(0, 3).map((s) => (
          <path key={s.d} d={s.d} fill="none" className="stroke-zinc-400 dark:stroke-zinc-500" strokeWidth={5} strokeLinecap="round" />
        ))}
        <path d="M552 182 C532 162, 512 150, 499 140 C490 124, 478 106, 466 100 C430 90, 360 82, 300 82 C270 84, 252 90, 248 96 C256 112, 266 124, 284 140" fill="none" className="stroke-accent-600 dark:stroke-accent-300" strokeWidth={9} strokeLinecap="round" />
        {[[550, 178], [499, 140], [466, 100], [248, 96], [284, 140]].map(([x, y]) => (
          <circle key={x} cx={x} cy={y} r={16} className="fill-accent-500 dark:fill-accent-300" />
        ))}
      </svg>
    );
  }
  const pts = Array.from({ length: 80 }, (_, i) => {
    const spike = [12, 31, 47, 63].includes(i) ? -22 : 0;
    return `${i ? "L" : "M"}${(i / 79) * 120},${32 + Math.sin(i / 6) * 6 + spike}`;
  }).join("");
  return (
    <svg viewBox="0 0 200 64" className="h-16 w-full" aria-hidden="true">
      <path d={pts} fill="none" className="stroke-accent-600 dark:stroke-accent-300" strokeWidth={1.4} />
      <path d="M126 32 L140 32" className="stroke-zinc-400" strokeWidth={1.2} markerEnd="" />
      {[0, 1].map((r) =>
        [0, 1, 2, 3, 4].map((c) => (
          <rect key={`${r}${c}`} x={146 + c * 10} y={18 + r * 14} width={9} height={12} rx={1.5} className="fill-accent-600 dark:fill-accent-300" opacity={[0.25, 0.8, 0.45, 0.1, 0.6, 0.55, 0.15, 0.9, 0.3, 0.7][r * 5 + c]} />
        )),
      )}
    </svg>
  );
}

export function GuideCard({ guide, index }: { guide: Guide; index: number }) {
  return (
    <Reveal delay={(index % 2) * 110} className="h-full">
      <Link href={`/learn/${guide.slug}`} className="card card-hover group flex h-full flex-col">
        <div className="rounded-t-lg border-b border-zinc-100 bg-gradient-to-br from-sky-50/80 via-white to-accent-50/60 px-5 py-3 dark:border-zinc-800 dark:from-sky-500/5 dark:via-zinc-900 dark:to-accent-700/10">
          <GuideGlyph slug={guide.slug} />
        </div>
        <div className="flex flex-1 flex-col p-5">
          <h3 className="text-base font-semibold leading-snug group-hover:text-accent-600 dark:group-hover:text-accent-300">{guide.title}</h3>
          <p className="mt-2 flex-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{guide.hook}</p>
          <div className="mt-4 flex items-center justify-between gap-3 text-xs text-zinc-500">
            <span>{guide.minutes}-minute read · interactive</span>
            <span className="arrow shrink-0 text-accent-600 opacity-0 transition-[opacity,transform] group-hover:opacity-100 dark:text-accent-300">Read →</span>
          </div>
        </div>
      </Link>
    </Reveal>
  );
}

export function NextGuide({ current }: { current: string }) {
  const i = GUIDES.findIndex((g) => g.slug === current);
  const next = GUIDES[(i + 1) % GUIDES.length]!;
  return (
    <div className="mt-16 flex flex-wrap items-center justify-between gap-4 border-t border-zinc-200 pt-6 dark:border-zinc-800">
      <Link href="/learn" className="group text-sm text-zinc-500 hover:text-accent-600">
        <span className="inline-block transition-transform duration-200 group-hover:-translate-x-1">←</span> Field guide
      </Link>
      <Link href={`/learn/${next.slug}`} className="card card-hover group px-4 py-3 text-right text-sm">
        <div className="text-xs text-zinc-500">Next guide</div>
        <div className="font-medium text-accent-600 dark:text-accent-300">
          {next.title} <span className="arrow">→</span>
        </div>
      </Link>
    </div>
  );
}

/** Vertical timeline that follows the reader (same scroll behaviour as Steps). */
export function Timeline({ events }: { events: TimelineEvent[] }) {
  return (
    <ScrollSteps>
      <ol className="space-y-6">
        {events.map((e, i) => (
          <Reveal as="li" key={e.year + e.title} delay={(i % 3) * 70} className="relative flex gap-4">
            <span data-step="" className="step-badge relative mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white shadow-sm ring-4 ring-zinc-50 dark:bg-zinc-900 dark:ring-zinc-950">
              <span className="h-2.5 w-2.5 rounded-full bg-gradient-to-br from-accent-500 to-violet-500" />
            </span>
            <div className="min-w-0">
              <div className="font-mono text-xs font-semibold text-accent-600 dark:text-accent-300">{e.year}</div>
              <div className="font-medium text-zinc-900 dark:text-zinc-100">{e.title}</div>
              <p className="mt-0.5 text-[15px] leading-relaxed text-zinc-600 dark:text-zinc-400">{e.body}</p>
            </div>
          </Reveal>
        ))}
      </ol>
    </ScrollSteps>
  );
}

/** Recording sites per device over time, on a log scale, with the doubling trend. */
export function ChannelGrowthChart() {
  const W = 640;
  const H = 300;
  const L = 52;
  const R = 20;
  const T = 16;
  const B = 40;
  const x = (year: number) => L + ((year - 1950) / (2030 - 1950)) * (W - L - R);
  const y = (v: number) => T + (1 - Math.log10(v) / 4) * (H - T - B);
  const trend = Array.from({ length: 74 }, (_, i) => 1957 + i)
    .map((yr, i) => `${i ? "L" : "M"}${x(yr).toFixed(1)},${y(2 ** ((yr - 1957) / DOUBLING_YEARS)).toFixed(1)}`)
    .join("");
  const labelSide: Record<string, "left" | "right"> = { "Utah array": "left", Tetrode: "right", "Neuropixels 1.0": "left", "Neuralink threads": "left", "Neuropixels 2.0": "left" };
  return (
    <div className="relative overflow-hidden">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Recording sites on a single device, 1957 to 2021, on a logarithmic scale: from one to more than five thousand.">
        {[1, 10, 100, 1000, 10000].map((v) => (
          <g key={v}>
            <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} className="stroke-zinc-200 dark:stroke-zinc-800" />
            <text x={L - 8} y={y(v) + 4} textAnchor="end" className="fill-zinc-500 text-[11px]">{v.toLocaleString("en-US")}</text>
          </g>
        ))}
        {[1950, 1970, 1990, 2010, 2030].map((yr) => (
          <text key={yr} x={x(yr)} y={H - 16} textAnchor="middle" className="fill-zinc-500 text-[11px]">{yr}</text>
        ))}
        <path d={trend} fill="none" className="stroke-violet-500/70 dark:stroke-violet-300/70" strokeWidth={2} strokeDasharray="6 5" />
        {(() => {
          // Label written along the trend line, just above it, where no device sits.
          const x0 = x(1964);
          const y0 = y(2 ** ((1964 - 1957) / DOUBLING_YEARS));
          const x1 = x(1984);
          const y1 = y(2 ** ((1984 - 1957) / DOUBLING_YEARS));
          const angle = (Math.atan2(y1 - y0, x1 - x0) * 180) / Math.PI;
          return (
            <text x={x0} y={y0 - 7} transform={`rotate(${angle.toFixed(1)} ${x0} ${y0 - 7})`} className="fill-violet-600 text-[11px] dark:fill-violet-300">
              doubling every ~{DOUBLING_YEARS} years
            </text>
          );
        })()}
        {DEVICE_POINTS.map((p) => {
          const side = labelSide[p.label] ?? "right";
          return (
            <g key={p.label}>
              {p.simultaneous && (
                <>
                  <line x1={x(p.year)} x2={x(p.year)} y1={y(p.sites)} y2={y(p.simultaneous)} className="stroke-accent-500/50" strokeDasharray="2 3" />
                  <circle cx={x(p.year)} cy={y(p.simultaneous)} r={4.5} className="fill-white stroke-accent-600 dark:fill-zinc-900 dark:stroke-accent-300" strokeWidth={1.8}>
                    <title>{`${p.label}: ${p.simultaneous} channels recorded at the same time`}</title>
                  </circle>
                </>
              )}
              <circle cx={x(p.year)} cy={y(p.sites)} r={5.5} className="fill-accent-600 dark:fill-accent-300">
                <title>{`${p.label} (${p.year}): ${p.sites.toLocaleString("en-US")} recording sites`}</title>
              </circle>
              <text
                x={x(p.year) + (side === "right" ? 9 : -9)}
                y={y(p.sites) + 4}
                textAnchor={side === "right" ? "start" : "end"}
                className="fill-zinc-700 text-[11px] dark:fill-zinc-300"
              >
                {p.label} · {p.sites.toLocaleString("en-US")}
              </text>
            </g>
          );
        })}
        <text x={14} y={T + (H - T - B) / 2} textAnchor="middle" transform={`rotate(-90 14 ${T + (H - T - B) / 2})`} className="fill-zinc-500 text-[11px]">
          recording sites per device
        </text>
      </svg>
      <span aria-hidden="true" className="trace-cover pointer-events-none absolute inset-0 bg-white dark:bg-zinc-900" />
    </div>
  );
}
