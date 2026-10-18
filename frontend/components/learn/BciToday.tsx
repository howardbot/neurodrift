"use client";

import { useEffect, useState } from "react";
import { BCI_CHECKED, BCI_CHECKED_LABEL as CHECKED_LABEL, BCI_DEPTHS, BCI_DILEMMAS, BCI_GOALS, BCI_LANDSCAPE, BCI_STAGES, type BciGoal } from "@/content/bciToday";

function chip(on: boolean) {
  return `rounded-full px-3 py-1 text-xs font-medium transition-colors ${
    on
      ? "bg-accent-600 text-white shadow-sm shadow-accent-600/30 dark:bg-accent-300 dark:text-zinc-900"
      : "border border-zinc-300 bg-white/80 text-zinc-700 hover:border-accent-500/60 dark:border-zinc-700 dark:bg-zinc-900/80 dark:text-zinc-300"
  }`;
}

const checkedDate = new Date(`${BCI_CHECKED}T12:00:00Z`);

/** "Last checked" with a warning once the page is a few months old (worked out in the reader's browser). */
export function CheckedBadge() {
  const [months, setMonths] = useState<number | null>(null);
  useEffect(() => setMonths((Date.now() - checkedDate.getTime()) / (30.44 * 864e5)), []);
  const stale = months !== null && months >= 4;
  return (
    <div
      className={`inline-flex flex-wrap items-center gap-2 rounded-full border px-3 py-1 text-xs ${
        stale ? "border-amber-400/60 bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300" : "border-zinc-200 text-zinc-600 dark:border-zinc-700 dark:text-zinc-400"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${stale ? "bg-amber-500" : "bg-emerald-500"}`} />
      Last checked {CHECKED_LABEL}
      {stale && <span>· about {Math.floor(months!)} months ago, so some details have probably changed</span>}
    </div>
  );
}

export function BciLandscape() {
  const [goal, setGoal] = useState<BciGoal | "all">("all");
  const [selected, setSelected] = useState("neuracle");
  const entry = BCI_LANDSCAPE.find((e) => e.id === selected)!;
  const matches = (id: string) => goal === "all" || BCI_LANDSCAPE.find((e) => e.id === id)!.goals.includes(goal);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="What it restores">
        <span className="mr-1 text-xs text-zinc-500">Helps people</span>
        {[{ id: "all" as const, label: "All" }, ...BCI_GOALS].map((g) => (
          <button key={g.id} type="button" className={chip(goal === g.id)} aria-pressed={goal === g.id} onClick={() => setGoal(g.id)}>
            {g.label}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <div className="grid min-w-[620px] grid-cols-[150px_repeat(3,minmax(0,1fr))] gap-px overflow-hidden rounded-md border border-zinc-200 bg-zinc-200 text-sm dark:border-zinc-800 dark:bg-zinc-800">
          <div className="bg-zinc-50 p-2 text-[11px] uppercase tracking-wider text-zinc-500 dark:bg-zinc-900">Where it sits ↓ · how far along →</div>
          {BCI_STAGES.map((s, i) => (
            <div key={s.id} className="bg-zinc-50 p-2 text-[11px] font-medium uppercase tracking-wider text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
              <span className="mr-1 text-accent-600 dark:text-accent-300">{"›".repeat(i + 1)}</span>
              {s.label}
            </div>
          ))}
          {BCI_DEPTHS.map((d) => (
            <div key={d.id} className="contents">
              <div className="bg-white p-2 dark:bg-zinc-950" title={d.note}>
                <div className="font-medium text-zinc-800 dark:text-zinc-200">{d.label}</div>
                <div className="mt-0.5 text-[11px] leading-snug text-zinc-500">{d.note}</div>
              </div>
              {BCI_STAGES.map((s) => (
                <div key={s.id} className="flex flex-wrap content-start gap-1.5 bg-white p-2 dark:bg-zinc-950">
                  {BCI_LANDSCAPE.filter((e) => e.depth === d.id && e.stage === s.id).map((e) => {
                    const on = e.id === selected;
                    return (
                      <button
                        key={e.id}
                        type="button"
                        onClick={() => setSelected(e.id)}
                        aria-pressed={on}
                        className={`rounded-md border px-2 py-1 text-left text-xs font-medium transition-[opacity,colors] duration-300 ${
                          on
                            ? "border-accent-500 bg-accent-50 text-accent-700 dark:bg-accent-700/20 dark:text-accent-200"
                            : "border-zinc-300 bg-white text-zinc-700 hover:border-accent-500/60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
                        } ${matches(e.id) ? "" : "opacity-30"}`}
                      >
                        {e.name}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div key={entry.id} className="animate-fade-up rounded-md border border-zinc-200 p-4 dark:border-zinc-800" aria-live="polite">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-lg font-semibold tracking-tight">{entry.name}</h3>
          <span className="text-xs text-zinc-500">{entry.where}</span>
        </div>
        <p className="mt-0.5 text-sm text-zinc-500">{entry.who}</p>
        <p className="mt-3 text-[15px] leading-relaxed text-zinc-700 dark:text-zinc-300">{entry.status}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {entry.goals.map((g) => (
            <span key={g} className="rounded-full border border-zinc-200 px-2 py-0.5 text-[11px] text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
              {BCI_GOALS.find((x) => x.id === g)!.label}
            </span>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs">
          {entry.sources.map((s) => (
            <a key={s.url} href={s.url} target="_blank" rel="noreferrer" className="text-accent-600 hover:underline dark:text-accent-300">
              {s.label} ↗
            </a>
          ))}
          <span className="text-zinc-500">As reported by {CHECKED_LABEL}</span>
        </div>
      </div>
    </div>
  );
}

export function Dilemmas() {
  const [picks, setPicks] = useState<Record<string, number>>({});
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {BCI_DILEMMAS.map((d, i) => {
        const pick = picks[d.id];
        return (
          <div key={d.id} className={`card p-4 ${i === BCI_DILEMMAS.length - 1 && BCI_DILEMMAS.length % 2 ? "md:col-span-2" : ""}`}>
            <div className="font-mono text-xs text-zinc-400">0{i + 1}</div>
            <p className="mt-1 font-medium leading-snug text-zinc-900 dark:text-zinc-100">{d.question}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {d.options.map((o, k) => (
                <button key={o} type="button" className={chip(pick === k)} aria-pressed={pick === k} onClick={() => setPicks({ ...picks, [d.id]: k })}>
                  {o}
                </button>
              ))}
            </div>
            {pick === undefined ? (
              <p className="mt-3 text-xs text-zinc-500">Choose an answer to see where things stand. There is no wrong one.</p>
            ) : (
              <div className="mt-3 animate-fade-up rounded-md border-l-4 border-accent-500/50 bg-accent-50/60 px-3 py-2 text-sm leading-relaxed text-zinc-700 dark:bg-accent-700/10 dark:text-zinc-300">
                {d.context}
                {d.sources.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-x-3 text-xs">
                    {d.sources.map((s) => (
                      <a key={s.url} href={s.url} target="_blank" rel="noreferrer" className="text-accent-600 hover:underline dark:text-accent-300">
                        {s.label} ↗
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
