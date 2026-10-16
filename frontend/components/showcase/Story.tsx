import Link from "next/link";
import type { ReactNode } from "react";
import { Reveal, ScrollProgress } from "@/components/motion";
import { ProjectGlyph } from "@/components/showcase/Glyphs";
import { RESEARCH, type ResearchProject } from "@/content/research";

// Glossary terms are a client component; re-exported so pages keep importing from here.
export { Term } from "@/components/Term";

/** Soft, slowly drifting colour behind a page's opening. Decorative. */
export function HeroGlow() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 -top-16 -z-10 h-[440px]">
      <div className="absolute -left-[10%] top-0 h-80 w-[60%] animate-drift rounded-full bg-accent-400/20 blur-3xl dark:bg-accent-500/15" />
      <div className="absolute right-0 top-10 h-72 w-[45%] animate-drift-slow rounded-full bg-violet-400/15 blur-3xl dark:bg-violet-500/10" />
      <div className="absolute left-[30%] top-40 h-56 w-[40%] animate-drift rounded-full bg-sky-300/20 blur-3xl [animation-delay:-9s] dark:bg-sky-500/10" />
    </div>
  );
}

export function ProjectHero({ project }: { project: ResearchProject }) {
  return (
    <header className="relative mb-12 max-w-3xl pt-2">
      <ScrollProgress />
      <HeroGlow />
      <div className="mb-4 flex animate-fade-up flex-wrap items-center gap-2 text-xs text-zinc-500">
        <Link href="/" className="transition-colors hover:text-accent-600">Research</Link>
        <span className="text-zinc-300 dark:text-zinc-700">/</span>
        <span>{project.status}</span>
        {project.context && (
          <>
            <span className="text-zinc-300 dark:text-zinc-700">·</span>
            <span>{project.context}</span>
          </>
        )}
      </div>
      <h1 className="animate-fade-up text-3xl font-semibold leading-tight tracking-tight [animation-delay:80ms] md:text-[2.6rem] md:leading-[1.15]">
        {project.title}
      </h1>
      <p className="mt-4 animate-fade-up text-lg leading-relaxed text-zinc-600 [animation-delay:160ms] dark:text-zinc-400">{project.hook}</p>
      <div className="mt-5 flex animate-fade-up flex-wrap gap-1.5 [animation-delay:240ms]">
        {project.tags.map((t) => (
          <span
            key={t}
            className="rounded-full border border-zinc-200 bg-white/70 px-2.5 py-0.5 text-xs text-zinc-600 backdrop-blur transition-colors hover:border-accent-500/60 hover:text-accent-700 dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-400 dark:hover:text-accent-200"
          >
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
    <Reveal as="section" className="mb-12">
      {eyebrow && (
        <div className="mb-1.5 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-accent-600 dark:text-accent-300">
          <span className="h-px w-5 bg-gradient-to-r from-accent-500 to-transparent" />
          {eyebrow}
        </div>
      )}
      <h2 className="mb-4 text-xl font-semibold tracking-tight md:text-2xl">{title}</h2>
      <div className="max-w-3xl space-y-4 text-[15px] leading-relaxed text-zinc-700 dark:text-zinc-300">{children}</div>
    </Reveal>
  );
}

/** Wide container for figures and interactive demos, with an optional caption. */
export function Figure({ children, caption, label }: { children: ReactNode; caption?: ReactNode; label?: string }) {
  const interactive = label?.toLowerCase().startsWith("interactive");
  return (
    <Reveal as="figure" className="card my-6 overflow-hidden">
      {label && (
        <div className="flex items-center gap-2 border-b border-zinc-200 bg-zinc-50/60 px-4 py-2 text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/60">
          {interactive && (
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60 motion-reduce:hidden" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
          )}
          {label}
        </div>
      )}
      <div className="p-4">{children}</div>
      {caption && <figcaption className="border-t border-zinc-200 px-4 py-2.5 text-xs leading-relaxed text-zinc-500 dark:border-zinc-800">{caption}</figcaption>}
    </Reveal>
  );
}

export function Steps({ items }: { items: { title: string; body: ReactNode }[] }) {
  return (
    <div className="relative">
      <span aria-hidden="true" className="absolute bottom-3 left-3 top-3 w-px -translate-x-1/2 bg-gradient-to-b from-accent-500/50 via-zinc-200 to-transparent dark:via-zinc-800" />
      <ol className="space-y-5">
        {items.map((item, i) => (
          <Reveal as="li" key={item.title} delay={i * 90} className="relative flex gap-4">
            <span className="relative mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent-500 to-accent-700 font-mono text-xs font-semibold text-white shadow-sm shadow-accent-600/30 ring-4 ring-zinc-50 dark:ring-zinc-950">
              {i + 1}
            </span>
            <div>
              <div className="font-medium text-zinc-900 dark:text-zinc-100">{item.title}</div>
              <div className="mt-0.5 text-zinc-600 dark:text-zinc-400">{item.body}</div>
            </div>
          </Reveal>
        ))}
      </ol>
    </div>
  );
}

export function Callout({ title, children, tone = "neutral" }: { title: string; children: ReactNode; tone?: "neutral" | "caution" }) {
  const tones = {
    neutral: "border-accent-500/40 bg-accent-50/60 dark:bg-accent-700/10",
    caution: "border-amber-400/60 bg-amber-50/70 dark:bg-amber-950/30",
  };
  return (
    <Reveal as="aside" className={`rounded-md border-l-4 px-4 py-3 ${tones[tone]}`}>
      <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{title}</div>
      <div className="mt-1 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">{children}</div>
    </Reveal>
  );
}

export function SkillList({ groups }: { groups: { label: string; items: string[] }[] }) {
  return (
    <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {groups.map((g, i) => (
        <Reveal key={g.label} delay={(i % 2) * 100} className="card card-hover p-4">
          <dt className="text-xs font-medium uppercase tracking-wider text-zinc-500">{g.label}</dt>
          <dd className="mt-2">
            <ul className="space-y-1.5 text-sm text-zinc-700 dark:text-zinc-300">
              {g.items.map((item) => (
                <li key={item} className="flex gap-2.5">
                  <span className="mt-[0.45rem] h-1.5 w-1.5 shrink-0 rounded-full bg-accent-500/70" />
                  {item}
                </li>
              ))}
            </ul>
          </dd>
        </Reveal>
      ))}
    </dl>
  );
}

export function ProjectCard({ project, index }: { project: ResearchProject; index: number }) {
  return (
    <Reveal delay={(index % 2) * 110} className="h-full">
      <Link href={`/research/${project.slug}`} className="card card-hover group flex h-full flex-col overflow-hidden">
        <div className="relative border-b border-zinc-100 bg-gradient-to-br from-accent-50/80 via-white to-violet-50/50 px-5 py-3 dark:border-zinc-800 dark:from-accent-700/10 dark:via-zinc-900 dark:to-violet-500/5">
          <ProjectGlyph slug={project.slug} />
          <span className="absolute left-5 top-3 font-mono text-xs text-zinc-400">0{index + 1}</span>
        </div>
        <div className="flex flex-1 flex-col p-5">
          <h3 className="text-base font-semibold leading-snug transition-colors group-hover:text-accent-600 dark:group-hover:text-accent-300">{project.title}</h3>
          <p className="mt-2 flex-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{project.hook}</p>
          <div className="mt-4 flex items-center justify-between gap-3 text-xs text-zinc-500">
            <span>{project.status}</span>
            <span className="arrow shrink-0 text-accent-600 opacity-0 transition-all group-hover:opacity-100 dark:text-accent-300">Read →</span>
          </div>
        </div>
      </Link>
    </Reveal>
  );
}

export function NextProject({ current }: { current: string }) {
  const i = RESEARCH.findIndex((r) => r.slug === current);
  const next = RESEARCH[(i + 1) % RESEARCH.length]!;
  return (
    <div className="mt-16 flex flex-wrap items-center justify-between gap-4 border-t border-zinc-200 pt-6 dark:border-zinc-800">
      <Link href="/" className="group text-sm text-zinc-500 transition-colors hover:text-accent-600">
        <span className="inline-block transition-transform duration-200 group-hover:-translate-x-1">←</span> All research
      </Link>
      <Link href={`/research/${next.slug}`} className="card card-hover group px-4 py-3 text-right text-sm">
        <div className="text-xs text-zinc-500">Next project</div>
        <div className="font-medium text-accent-600 dark:text-accent-300">
          {next.title} <span className="arrow">→</span>
        </div>
      </Link>
    </div>
  );
}
