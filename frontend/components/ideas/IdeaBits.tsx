import type { ReactNode } from "react";
import { Reveal } from "@/components/motion";
import { IDEA_PARTS, IDEAS, type Idea, type Source } from "@/content/ideas";

// Building blocks for /ideas. The page keeps evidence, interpretation and speculation apart:
// every passage that makes a claim sits in a <Claim> with a visible label, and unmarked text only
// frames the questions.

export type ClaimKind = "evidence" | "interpretation" | "speculation";

const KINDS: Record<ClaimKind, { label: string; blurb: string; rule: string; text: string; dot: string }> = {
  evidence: {
    label: "Evidence",
    blurb: "What experiments, observations or proofs establish.",
    rule: "border-emerald-500/70",
    text: "text-emerald-700 dark:text-emerald-300",
    dot: "bg-emerald-500",
  },
  interpretation: {
    label: "Interpretation",
    blurb: "A theoretical reading of the evidence; others are possible.",
    rule: "border-accent-500/70",
    text: "text-accent-600 dark:text-accent-300",
    dot: "bg-accent-500",
  },
  speculation: {
    label: "Speculation",
    blurb: "A philosophical possibility that current evidence cannot decide.",
    rule: "border-violet-500/70",
    text: "text-violet-600 dark:text-violet-300",
    dot: "bg-violet-500",
  },
};

const pad = (n: number) => String(n).padStart(2, "0");

/** The three labels, explained once at the top of the page. */
export function Legend() {
  return (
    <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {(Object.keys(KINDS) as ClaimKind[]).map((kind) => (
        <div key={kind} className={`border-l-2 pl-3 ${KINDS[kind].rule}`}>
          <dt className={`text-[11px] font-medium uppercase tracking-wider ${KINDS[kind].text}`}>{KINDS[kind].label}</dt>
          <dd className="mt-0.5 text-sm leading-snug text-zinc-600 dark:text-zinc-400">{KINDS[kind].blurb}</dd>
        </div>
      ))}
    </dl>
  );
}

/** A passage that makes a claim, labelled with what kind of claim it is. */
export function Claim({ kind, children }: { kind: ClaimKind; children: ReactNode }) {
  const k = KINDS[kind];
  return (
    <div className={`border-l-2 pl-4 ${k.rule}`}>
      <div className={`mb-1 text-[11px] font-medium uppercase tracking-wider ${k.text}`}>{k.label}</div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

/** A one-line relation such as "conscious self ≠ whole brain". */
export function Relation({ children }: { children: ReactNode }) {
  return (
    <p>
      <span className="inline-block rounded-md bg-zinc-100 px-3 py-1.5 font-mono text-[13px] text-zinc-900 dark:bg-zinc-800/80 dark:text-zinc-100">{children}</span>
    </p>
  );
}

/** A sequence of stages, read top to bottom (or left to right when `across`). */
export function Chain({ steps, across = false }: { steps: string[]; across?: boolean }) {
  const box = "rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200";
  if (across) {
    return (
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-2">
        {steps.map((s, i) => (
          <li key={s} className="flex items-center gap-2">
            <span className={box}>{s}</span>
            {i < steps.length - 1 && <span aria-hidden="true" className="text-zinc-400">→</span>}
          </li>
        ))}
      </ol>
    );
  }
  return (
    <ol>
      {steps.map((s, i) => (
        <li key={s} className="flex flex-col items-start">
          <span className={box}>{s}</span>
          {i < steps.length - 1 && (
            <span aria-hidden="true" className="py-0.5 pl-4 text-xs leading-none text-zinc-400">
              ↓
            </span>
          )}
        </li>
      ))}
    </ol>
  );
}

/** The question a note is really asking. */
export function OpenQuestion({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-lg bg-gradient-to-br from-accent-50 to-violet-50/70 px-4 py-3 text-[17px] font-medium leading-snug tracking-tight text-zinc-900 dark:from-accent-500/10 dark:to-violet-500/5 dark:text-zinc-50">
      {children}
    </p>
  );
}

/** A small heading inside a note. */
export function Sub({ children }: { children: ReactNode }) {
  return <h3 className="pt-2 text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">{children}</h3>;
}

function Reading({ items }: { items: Source[] }) {
  return (
    <div className="mt-6 max-w-3xl border-t border-zinc-200 pt-3 dark:border-zinc-800">
      <div className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">Further reading</div>
      <ul className="mt-1.5 space-y-1 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
        {items.map((s) => (
          <li key={s.title}>
            {s.who} ({s.year}). {s.book ? <i>{s.title}</i> : s.title}. {s.book ? s.where : <i>{s.where}</i>}.
          </li>
        ))}
      </ul>
    </div>
  );
}

/** One numbered note, linkable at /ideas#slug. */
export function Note({ idea, children }: { idea: Idea; children: ReactNode }) {
  return (
    <Reveal as="section" id={idea.slug} className="mb-16 scroll-mt-16">
      <div className="mb-1.5 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-accent-600 dark:text-accent-300">
        <span className="font-mono">{pad(idea.n)}</span>
        <span className="h-px w-5 bg-gradient-to-r from-accent-500 to-transparent" />
        {idea.part}
      </div>
      <h2 className="mb-5 max-w-3xl text-xl font-semibold tracking-tight md:text-2xl">
        <a href={`#${idea.slug}`} className="hover:text-accent-600 dark:hover:text-accent-300">
          {idea.title}
        </a>
      </h2>
      <div className="max-w-3xl space-y-4 text-[15px] leading-relaxed text-zinc-700 dark:text-zinc-300">{children}</div>
      <Reading items={idea.reading} />
    </Reveal>
  );
}

/** Every note, grouped by part. */
export function Contents() {
  return (
    <nav aria-label="Contents" className="card p-5">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {IDEA_PARTS.map((part) => (
          <div key={part.id}>
            <div className="text-xs font-medium uppercase tracking-wider text-accent-600 dark:text-accent-300">{part.id}</div>
            <p className="mt-0.5 text-xs text-zinc-500">{part.blurb}</p>
            <ol className="mt-3 space-y-1.5 text-sm">
              {IDEAS.filter((i) => i.part === part.id).map((i) => (
                <li key={i.slug} className="flex gap-2.5">
                  <span className="mt-0.5 font-mono text-xs text-zinc-400">{pad(i.n)}</span>
                  <a href={`#${i.slug}`} className="text-zinc-700 hover:text-accent-600 dark:text-zinc-300 dark:hover:text-accent-300">
                    {i.short}
                  </a>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>
    </nav>
  );
}
