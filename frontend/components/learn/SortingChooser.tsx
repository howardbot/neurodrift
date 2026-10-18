"use client";

import { useState } from "react";
import { SORT_METHODS, SORT_QUESTIONS } from "@/content/learn";
import { DEFAULT_ANSWERS, rankMethods, type SortAnswers } from "@/lib/sorting";

const PRESETS: { label: string; answers: SortAnswers }[] = [
  { label: "A BCI for a person with paralysis", answers: { probe: "array", goal: "population", when: "live", drift: "drifts", time: "minutes" } },
  { label: "Neuropixels in a mouse", answers: { probe: "dense", goal: "cells", when: "offline", drift: "drifts", time: "hours" } },
  { label: "Place cells on tetrodes", answers: { probe: "tetrode", goal: "cells", when: "offline", drift: "stable", time: "days" } },
];

const methodById = new Map(SORT_METHODS.map((m) => [m.id, m]));

export function SortingChooser() {
  const [answers, setAnswers] = useState<SortAnswers>(DEFAULT_ANSWERS);
  const ranked = rankMethods(answers);
  const best = ranked[0]!;
  const bestMethod = methodById.get(best.id)!;
  const hi = Math.max(...ranked.map((r) => r.score), 1);
  const lo = Math.min(...ranked.map((r) => r.score), 0);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-zinc-500">Try:</span>
          {PRESETS.map((p) => (
            <button key={p.label} type="button" className="btn btn-outline px-2.5 py-1 text-xs" onClick={() => setAnswers(p.answers)}>
              {p.label}
            </button>
          ))}
        </div>
        {SORT_QUESTIONS.map((q) => (
          <fieldset key={q.id}>
            <legend className="mb-1.5 text-sm font-medium text-zinc-800 dark:text-zinc-200">{q.question}</legend>
            <div className="flex flex-wrap gap-1.5">
              {q.options.map((o) => {
                const on = answers[q.id] === o.id;
                return (
                  <button
                    key={o.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setAnswers({ ...answers, [q.id]: o.id })}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      on
                        ? "bg-accent-600 text-white shadow-sm shadow-accent-600/30 dark:bg-accent-300 dark:text-zinc-900"
                        : "border border-zinc-300 bg-white/80 text-zinc-700 hover:border-accent-500/60 dark:border-zinc-700 dark:bg-zinc-900/80 dark:text-zinc-300"
                    }`}
                  >
                    {o.label}
                  </button>
                );
              })}
            </div>
          </fieldset>
        ))}
      </div>

      <div className="min-w-0 space-y-4" aria-live="polite">
        <div key={best.id} className="animate-fade-up rounded-md border border-accent-500/40 bg-accent-50/50 p-4 dark:bg-accent-700/10">
          <div className="text-[11px] uppercase tracking-wider text-accent-600 dark:text-accent-300">Most labs would reach for</div>
          <h3 className="mt-0.5 text-lg font-semibold tracking-tight">{bestMethod.name}</h3>
          <p className="text-xs text-zinc-500">
            Since {bestMethod.since} · {bestMethod.examples}
          </p>
          {best.reasons.length > 0 && (
            <ul className="mt-3 space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
              {best.reasons.slice(0, 3).map((r) => (
                <li key={r} className="flex gap-2">
                  <span className="mt-[0.45rem] h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                  {r}
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
            <span className="font-medium text-zinc-800 dark:text-zinc-200">Watch out: </span>
            {bestMethod.watchOut}
          </p>
        </div>

        <div>
          <div className="mb-2 text-[11px] uppercase tracking-wider text-zinc-500">How every approach fits</div>
          <ul className="space-y-2">
            {ranked.map((r) => {
              const m = methodById.get(r.id)!;
              const width = ((r.score - lo) / (hi - lo || 1)) * 100;
              return (
                <li key={r.id} className="text-sm">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className={r.id === best.id ? "font-medium" : "text-zinc-600 dark:text-zinc-400"}>{m.name}</span>
                    <span className="num shrink-0 font-mono text-xs text-zinc-500">
                      {r.score > 0 ? "+" : ""}
                      {r.score}
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-800">
                    <div
                      className={`h-1.5 rounded-full transition-[width] duration-500 ${r.id === best.id ? "bg-accent-500 dark:bg-accent-300" : "bg-zinc-400 dark:bg-zinc-600"}`}
                      style={{ width: `${Math.max(width, 3)}%` }}
                    />
                  </div>
                  {r.id !== best.id && r.cautions[0] && <div className="mt-0.5 text-xs text-zinc-500">{r.cautions[0]}</div>}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
