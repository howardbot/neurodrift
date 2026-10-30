"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Reveal } from "@/components/motion";
import { CITIES, monthLabel, monthOf, timeline, type Award, type City, type Month, type Span } from "@/lib/timeline";

// Study, labs and awards on one time axis, coloured by city (/about). Every entry links to its
// fuller description further down the page; hovering or focusing it shows the details.

const CITY_COLOR: Record<City, string> = {
  Qingdao: "bg-amber-400 dark:bg-amber-400/85",
  Edinburgh: "bg-violet-400 dark:bg-violet-400/85",
  Madison: "bg-accent-500 dark:bg-accent-400",
  Chicago: "bg-emerald-500 dark:bg-emerald-400/85",
};
const CITY_TAIL: Record<City, string> = {
  Qingdao: "from-amber-400/70",
  Edinburgh: "from-violet-400/70",
  Madison: "from-accent-500/70 dark:from-accent-400/70",
  Chicago: "from-emerald-500/70 dark:from-emerald-400/70",
};

const span = (s: Span) => `${monthLabel(s.start)} – ${s.end === null ? "now" : s.expected ? `${monthLabel(s.end)} (expected)` : monthLabel(s.end)}`;

function Popover({ title, lines, right }: { title: string; lines: string[]; right: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute bottom-full z-20 mb-2 hidden w-64 rounded-md border border-zinc-200 bg-white p-2.5 text-left shadow-lg group-hover:block group-focus-visible:block dark:border-zinc-700 dark:bg-zinc-900 ${
        right ? "right-0" : "left-0"
      }`}
    >
      <span className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100">{title}</span>
      {lines.map((l) => (
        <span key={l} className="mt-0.5 block text-xs leading-snug text-zinc-600 dark:text-zinc-400">
          {l}
        </span>
      ))}
    </span>
  );
}

export function PathTimeline({ initialNow }: { initialNow: Month }) {
  // The page is built ahead of time; "now" moves to the reader's own date once it loads.
  const [now, setNow] = useState(initialNow);
  useEffect(() => setNow(monthOf(new Date())), []);

  const { spans, awards } = timeline(now);
  const first = Math.floor(Math.min(...spans.map((s) => s.start), ...awards.map((a) => a.at)) / 12) * 12;
  const last = Math.ceil((Math.max(now, ...spans.map((s) => s.end ?? now)) + 1) / 12) * 12;
  const pct = (m: Month) => `${((m - first) / (last - first)) * 100}%`;
  const years = Array.from({ length: (last - first) / 12 + 1 }, (_, i) => first / 12 + i);

  const grid = (
    <>
      {years.map((y) => (
        <span key={y} aria-hidden="true" className="absolute inset-y-0 w-px bg-zinc-200/80 dark:bg-zinc-800" style={{ left: pct(y * 12) }} />
      ))}
      <span aria-hidden="true" className="absolute inset-y-0 border-l border-dashed border-accent-600/60 dark:border-accent-300/60" style={{ left: pct(now) }} />
    </>
  );

  const row = (label: string, sub: string, track: ReactNode, key: string) => (
    <div key={key} className="contents">
      <div className="pr-3 pt-2 sm:py-2">
        <div className="text-sm font-medium leading-tight text-zinc-900 dark:text-zinc-100">{label}</div>
        <div className="font-mono text-[11px] text-zinc-500">{sub}</div>
      </div>
      <div className="relative h-8 sm:h-auto sm:min-h-12">
        {grid}
        {track}
      </div>
    </div>
  );

  const bar = (s: Span) => {
    const end = s.end === null || s.expected ? now : s.end;
    const right = (s.start - first) / (last - first) > 0.55;
    return (
      <>
        <a
          href={s.href}
          aria-label={`${s.name}, ${s.detail}, ${span(s)}`}
          className={`group absolute top-1/2 h-3.5 -translate-y-1/2 rounded-full shadow-sm ring-offset-2 transition-[filter] hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 ${CITY_COLOR[s.city]} ${
            s.end === null || s.expected ? "rounded-r-none" : ""
          }`}
          style={{ left: pct(s.start), width: `calc(${pct(end)} - ${pct(s.start)})` }}
        >
          <Popover title={s.name} right={right} lines={[s.detail, `${span(s)} · ${s.city}`]} />
        </a>
        {s.end === null && (
          // Still going: the bar fades out past today.
          <span aria-hidden="true" className={`absolute top-1/2 h-3.5 w-8 -translate-y-1/2 rounded-r-full bg-gradient-to-r to-transparent ${CITY_TAIL[s.city]}`} style={{ left: pct(now) }} />
        )}
        {s.expected && s.end !== null && (
          // Still to come: an outline up to the expected end.
          <span
            aria-hidden="true"
            className="absolute top-1/2 h-3.5 -translate-y-1/2 rounded-r-full border border-l-0 border-dashed border-zinc-400 dark:border-zinc-500"
            style={{ left: pct(now), width: `calc(${pct(s.end)} - ${pct(now)})` }}
          />
        )}
      </>
    );
  };

  const marker = (a: Award) => (
    <a
      key={a.id}
      href={a.href}
      aria-label={`${a.name}, ${a.detail}`}
      className="group absolute top-1/2 flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
      style={{ left: pct(a.at) }}
    >
      <span aria-hidden="true" className="h-3.5 w-3.5 rotate-45 rounded-[3px] border-2 border-white bg-rose-500 shadow-sm group-hover:brightness-110 dark:border-zinc-900 dark:bg-rose-400" />
      <Popover title={a.name} right={(a.at - first) / (last - first) > 0.55} lines={[a.detail]} />
    </a>
  );

  const lanes: { name: string; rows: ReactNode[] }[] = [
    { name: "Study", rows: spans.filter((s) => s.lane === "Study").map((s) => row(s.name, span(s), bar(s), s.id)) },
    { name: "Research", rows: spans.filter((s) => s.lane === "Research").map((s) => row(s.name, span(s), bar(s), s.id)) },
    { name: "Recognition", rows: [row("Awards", `${awards.length} since ${Math.floor(awards[0]!.at / 12)}`, awards.map(marker), "awards")] },
  ];

  return (
    <Reveal className="card p-4 md:p-6">
      <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,13rem)_minmax(0,1fr)]">
        <div className="hidden sm:block" />
        {/* "now" sits on its own line above the years, so it never covers one. */}
        <div className="relative mb-1 h-9 text-[11px] text-zinc-500" aria-hidden="true">
          {years.slice(0, -1).map((y) => (
            <span key={y} className="absolute bottom-0 font-mono" style={{ left: `calc(${pct(y * 12)} + 4px)` }}>
              {y}
            </span>
          ))}
          <span className="absolute top-0 -translate-x-1/2 rounded-full bg-accent-600 px-1.5 text-[10px] font-semibold text-white dark:bg-accent-300 dark:text-zinc-900" style={{ left: pct(now) }}>
            now
          </span>
        </div>
        {lanes.map((lane) => (
          <div key={lane.name} className="contents">
            <div className="col-span-full mt-3 border-b border-zinc-200 pb-1 text-[11px] font-medium uppercase tracking-wider text-accent-600 dark:border-zinc-800 dark:text-accent-300">
              {lane.name}
            </div>
            {lane.rows}
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-zinc-200 pt-3 text-[11px] text-zinc-500 dark:border-zinc-800">
        {CITIES.map((c) => (
          <span key={c} className="flex items-center gap-1.5">
            <span aria-hidden="true" className={`h-2.5 w-2.5 rounded-full ${CITY_COLOR[c]}`} />
            {c}
          </span>
        ))}
        <span className="flex items-center gap-1.5">
          <span aria-hidden="true" className="h-2.5 w-2.5 rotate-45 rounded-[2px] bg-rose-500 dark:bg-rose-400" />
          Award
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden="true" className="h-2.5 w-4 rounded-r-full border border-l-0 border-dashed border-zinc-400" />
          Expected
        </span>
      </div>
    </Reveal>
  );
}
