import Link from "next/link";
import type { ReactNode } from "react";
import { Reveal } from "@/components/motion";
import { LABS, PROFILE, WORK } from "@/content/profile";
import { RESEARCH } from "@/content/research";
import { anchorOf } from "@/lib/timeline";

/** Eyebrow + title (+ optional lead) used to open every section of the home and About pages. */
export function SectionHeading({ eyebrow, title, children }: { eyebrow: string; title: string; children?: ReactNode }) {
  return (
    <Reveal className="mb-8">
      <div className="mb-1.5 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-accent-600 dark:text-accent-300">
        <span className="h-px w-5 bg-gradient-to-r from-accent-500 to-transparent" />
        {eyebrow}
      </div>
      <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">{title}</h2>
      {children && <p className="mt-2 max-w-3xl text-[15px] leading-relaxed text-zinc-600 dark:text-zinc-400">{children}</p>}
    </Reveal>
  );
}

export function MailIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect x="2.5" y="4.5" width="15" height="11" rx="2" />
      <path d="M3 5.5l7 5.5 7-5.5" />
    </svg>
  );
}

export function GitHubIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className={className} aria-hidden="true">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}

/** Email + GitHub, the two contact routes the owner chose to publish. */
export function ContactButtons({ primary = true }: { primary?: boolean }) {
  return (
    <>
      <a href={`mailto:${PROFILE.email}`} className={`btn ${primary ? "btn-primary" : "btn-outline"} group`}>
        <MailIcon />
        Email me
      </a>
      <a href={PROFILE.github} className="btn btn-outline group" rel="me noopener" target="_blank">
        <GitHubIcon />
        GitHub
      </a>
    </>
  );
}

export function Chips({ items, className = "" }: { items: string[]; className?: string }) {
  return (
    <ul className={`flex flex-wrap gap-1.5 ${className}`}>
      {items.map((t) => (
        <li
          key={t}
          className="rounded-full border border-zinc-200 bg-white/70 px-2.5 py-0.5 text-xs text-zinc-600 transition-colors hover:border-accent-500/60 hover:text-accent-700 dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-400 dark:hover:text-accent-200"
        >
          {t}
        </li>
      ))}
    </ul>
  );
}

function storyTitle(slug: string): string {
  return RESEARCH.find((r) => r.slug === slug)?.title ?? slug;
}

/**
 * The four labs as a vertical timeline. `detailed` adds each lab's summary and tags (About
 * page); the compact form (home page) shows when, where and with whom.
 */
export function LabTimeline({ detailed = false }: { detailed?: boolean }) {
  return (
    <ol>
      {LABS.map((lab, i) => {
        const last = i === LABS.length - 1;
        return (
          <Reveal
            as="li"
            key={lab.name}
            id={detailed ? anchorOf(lab.name) : undefined}
            delay={detailed ? 0 : i * 60}
            className="grid scroll-mt-20 grid-cols-[1.25rem_minmax(0,1fr)] gap-x-4"
          >
            <div className="flex flex-col items-center pt-1.5">
              <span
                aria-hidden="true"
                className={`z-10 h-3 w-3 rounded-full border-2 ring-4 ring-zinc-50 dark:ring-zinc-950 ${
                  lab.years.includes("Present") ? "border-accent-500 bg-accent-500/30" : "border-zinc-300 bg-white dark:border-zinc-600 dark:bg-zinc-900"
                }`}
              />
              {!last && <span aria-hidden="true" className="mt-1 w-px flex-1 bg-gradient-to-b from-accent-500/40 to-zinc-200 dark:to-zinc-800" />}
            </div>
            <div className={last ? "" : detailed ? "pb-10" : "pb-7"}>
              <div className="font-mono text-xs text-zinc-500">{lab.years}</div>
              <h3 className="mt-0.5 text-base font-semibold tracking-tight">
                {lab.name} <span className="font-normal text-zinc-500">· {lab.institution}</span>
              </h3>
              <div className="text-sm text-zinc-600 dark:text-zinc-400">{lab.pi}</div>
              {detailed && (
                <>
                  <p className="mt-2 max-w-3xl text-[15px] leading-relaxed text-zinc-700 dark:text-zinc-300">{lab.summary}</p>
                  <Chips items={lab.tags} className="mt-3" />
                </>
              )}
              {lab.stories.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                  {lab.stories.map((slug) => (
                    <Link key={slug} href={`/research/${slug}`} className="group font-medium text-accent-600 dark:text-accent-300">
                      {storyTitle(slug)} <span className="arrow">→</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </Reveal>
        );
      })}
    </ol>
  );
}

/** Selected work as cards; work with a page on this site links to it. */
export function WorkGrid() {
  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {WORK.map((w, i) => {
        const body = (
          <>
            <h3 className="text-base font-semibold leading-snug group-hover:text-accent-600 dark:group-hover:text-accent-300">{w.title}</h3>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{w.summary}</p>
            <div className="mt-4 flex items-end justify-between gap-3">
              <Chips items={w.tags} />
              {w.href && <span className="arrow shrink-0 text-xs text-accent-600 opacity-0 transition-[opacity,transform] group-hover:opacity-100 dark:text-accent-300">Read →</span>}
            </div>
          </>
        );
        return (
          <Reveal as="li" key={w.title} delay={(i % 2) * 100} className="h-full">
            {w.href ? (
              <Link href={w.href} className="card card-hover group flex h-full flex-col p-5">{body}</Link>
            ) : (
              <div className="card flex h-full flex-col p-5">{body}</div>
            )}
          </Reveal>
        );
      })}
    </ul>
  );
}

/** Slim footer on every page: who this is and how to reach them. */
export function SiteFooter() {
  return (
    <footer className="mt-10 border-t border-zinc-200 px-4 py-6 text-sm text-zinc-500 dark:border-zinc-800 md:px-8">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <div>
          <span className="font-medium text-zinc-700 dark:text-zinc-300">{PROFILE.name}</span> · {PROFILE.field} · {PROFILE.location}
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <a href={`mailto:${PROFILE.email}`} className="inline-flex min-h-8 items-center gap-1.5 hover:text-accent-600 dark:hover:text-accent-300">
            <MailIcon className="h-3.5 w-3.5" />
            {PROFILE.email}
          </a>
          <a href={PROFILE.github} rel="me noopener" target="_blank" className="inline-flex min-h-8 items-center gap-1.5 hover:text-accent-600 dark:hover:text-accent-300">
            <GitHubIcon className="h-3.5 w-3.5" />
            GitHub
          </a>
          <Link href="/about" className="inline-flex min-h-8 items-center hover:text-accent-600 dark:hover:text-accent-300">About</Link>
        </div>
      </div>
    </footer>
  );
}
