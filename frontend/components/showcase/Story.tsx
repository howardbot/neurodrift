import Link from "next/link";
import type { ReactNode } from "react";
import { RESEARCH, type ResearchProject } from "@/content/research";

/** A word with a plain-language definition shown on hover or keyboard focus. */
export function Term({ children, def }: { children: ReactNode; def: string }) {
  return (
    <span className="group relative inline-block">
      <span tabIndex={0} className="cursor-help border-b border-dotted border-zinc-400 outline-none focus:border-accent-500">
        {children}
      </span>
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 hidden w-64 -translate-x-1/2 rounded-md border border-zinc-200 bg-white p-2.5 text-xs font-normal leading-relaxed text-zinc-700 shadow-lg group-focus-within:block group-hover:block dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
      >
        {def}
      </span>
    </span>
  );
}

export function ProjectHero({ project }: { project: ResearchProject }) {
  return (
    <header className="mb-10 max-w-3xl">
      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
        <Link href="/" className="hover:underline">Research</Link>
        <span>/</span>
        <span>{project.status}</span>
        {project.context && (
          <>
            <span>·</span>
            <span>{project.context}</span>
          </>
        )}
      </div>
      <h1 className="text-3xl font-semibold leading-tight tracking-tight md:text-4xl">{project.title}</h1>
      <p className="mt-4 text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">{project.hook}</p>
      <div className="mt-5 flex flex-wrap gap-1.5">
        {project.tags.map((t) => (
          <span key={t} className="rounded-full border border-zinc-200 px-2.5 py-0.5 text-xs text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
            {t}
          </span>
        ))}
      </div>
    </header>
  );
}

/** A titled block of explanatory prose, kept at a readable line length. */
export function Section({ eyebrow, title, children }: { eyebrow?: string; title: string; children: ReactNode }) {
  return (
    <section className="mb-12">
      {eyebrow && <div className="mb-1 text-xs font-medium uppercase tracking-wider text-accent-600">{eyebrow}</div>}
      <h2 className="mb-4 text-xl font-semibold tracking-tight">{title}</h2>
      <div className="max-w-3xl space-y-4 text-[15px] leading-relaxed text-zinc-700 dark:text-zinc-300">{children}</div>
    </section>
  );
}

/** Wide container for figures and interactive demos, with an optional caption. */
export function Figure({ children, caption, label }: { children: ReactNode; caption?: ReactNode; label?: string }) {
  return (
    <figure className="card my-6 overflow-hidden">
      {label && (
        <div className="border-b border-zinc-200 px-4 py-2 text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:border-zinc-800">
          {label}
        </div>
      )}
      <div className="p-4">{children}</div>
      {caption && <figcaption className="border-t border-zinc-200 px-4 py-2.5 text-xs leading-relaxed text-zinc-500 dark:border-zinc-800">{caption}</figcaption>}
    </figure>
  );
}

export function Steps({ items }: { items: { title: string; body: ReactNode }[] }) {
  return (
    <ol className="space-y-4">
      {items.map((item, i) => (
        <li key={item.title} className="flex gap-4">
          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-50 font-mono text-xs font-semibold text-accent-700 dark:bg-accent-700/30 dark:text-accent-100">
            {i + 1}
          </span>
          <div>
            <div className="font-medium text-zinc-900 dark:text-zinc-100">{item.title}</div>
            <div className="mt-0.5 text-zinc-600 dark:text-zinc-400">{item.body}</div>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function Callout({ title, children, tone = "neutral" }: { title: string; children: ReactNode; tone?: "neutral" | "caution" }) {
  const tones = {
    neutral: "border-accent-500/40 bg-accent-50/60 dark:bg-accent-700/10",
    caution: "border-amber-400/60 bg-amber-50/70 dark:bg-amber-950/30",
  };
  return (
    <aside className={`rounded-md border-l-4 px-4 py-3 ${tones[tone]}`}>
      <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{title}</div>
      <div className="mt-1 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">{children}</div>
    </aside>
  );
}

export function SkillList({ groups }: { groups: { label: string; items: string[] }[] }) {
  return (
    <dl className="grid gap-4 sm:grid-cols-2">
      {groups.map((g) => (
        <div key={g.label} className="card p-4">
          <dt className="text-xs font-medium uppercase tracking-wider text-zinc-500">{g.label}</dt>
          <dd className="mt-2">
            <ul className="space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
              {g.items.map((i) => (
                <li key={i} className="flex gap-2"><span className="text-accent-600">·</span>{i}</li>
              ))}
            </ul>
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function ProjectCard({ project, index }: { project: ResearchProject; index: number }) {
  return (
    <Link href={`/research/${project.slug}`} className="card group flex flex-col p-5 transition-colors hover:border-accent-500">
      <div className="font-mono text-xs text-zinc-400">0{index + 1}</div>
      <h3 className="mt-2 text-base font-semibold leading-snug group-hover:text-accent-600">{project.title}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{project.hook}</p>
      <div className="mt-4 text-xs text-zinc-500">{project.status}</div>
    </Link>
  );
}

export function NextProject({ current }: { current: string }) {
  const i = RESEARCH.findIndex((r) => r.slug === current);
  const next = RESEARCH[(i + 1) % RESEARCH.length]!;
  return (
    <div className="mt-16 flex flex-wrap items-center justify-between gap-4 border-t border-zinc-200 pt-6 dark:border-zinc-800">
      <Link href="/" className="text-sm text-zinc-500 hover:underline">← All research</Link>
      <Link href={`/research/${next.slug}`} className="text-right text-sm">
        <div className="text-xs text-zinc-500">Next project</div>
        <div className="font-medium text-accent-600 hover:underline">{next.title} →</div>
      </Link>
    </div>
  );
}
