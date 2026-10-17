import Link from "next/link";
import { Reveal } from "@/components/motion";
import { Chips, ContactButtons, GitHubIcon, LabTimeline, MailIcon, SectionHeading, WorkGrid } from "@/components/profile/ProfileBlocks";
import { HeroGlow, SkillList } from "@/components/showcase/Story";
import { EDUCATION, PROFILE, RECOGNITION, TOOLKIT } from "@/content/profile";
import { projectBySlug } from "@/content/research";

export const metadata = {
  title: "About",
  description: `${PROFILE.name} — ${PROFILE.affiliation}. Research experience, selected work, education and contact.`,
};

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">{label}</dt>
      <dd className="mt-0.5 text-sm text-zinc-800 dark:text-zinc-200">{children}</dd>
    </div>
  );
}

export default function About() {
  return (
    <div className="mx-auto max-w-5xl py-6">
      {/* Intro */}
      <section className="relative mb-20 pt-2">
        <HeroGlow />
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_17rem] lg:items-start">
          <div className="min-w-0">
            <div className="mb-3 flex animate-fade-up items-center gap-2 text-xs font-medium uppercase tracking-wider text-accent-600 dark:text-accent-300">
              <span className="h-px w-5 bg-gradient-to-r from-accent-500 to-transparent" />
              About
            </div>
            <h1 className="animate-fade-up text-[2rem] font-semibold leading-[1.15] tracking-tight [animation-delay:60ms] md:text-[2.6rem]">
              {PROFILE.about.headline}
            </h1>
            <div className="mt-6 max-w-3xl animate-fade-up space-y-4 text-lg leading-relaxed text-zinc-700 [animation-delay:140ms] dark:text-zinc-300">
              {PROFILE.about.paragraphs.map((p) => (
                <p key={p.slice(0, 24)}>{p}</p>
              ))}
            </div>
            <div className="mt-7 flex animate-fade-up flex-wrap gap-3 [animation-delay:220ms]">
              <ContactButtons />
            </div>
          </div>
          <aside className="card animate-fade-up p-5 [animation-delay:200ms]">
            <dl className="space-y-4">
              <Fact label="Field">{PROFILE.field}</Fact>
              <Fact label="Studying">{PROFILE.affiliation}</Fact>
              <Fact label="Based in">{PROFILE.location}</Fact>
              <Fact label="Interests">
                <Chips items={PROFILE.interests} className="mt-1" />
              </Fact>
            </dl>
          </aside>
        </div>
      </section>

      {/* Experience */}
      <section id="experience" className="mb-20 scroll-mt-20">
        <SectionHeading eyebrow="Research experience" title="Listening to populations of neurons.">
          Four labs, from reinforcement-learning control to primate electrophysiology. Where a project has a plain-language story
          on this site, it is linked.
        </SectionHeading>
        <LabTimeline detailed />
      </section>

      {/* Selected work */}
      <section id="work" className="mb-20 scroll-mt-20">
        <SectionHeading eyebrow="Selected work" title="Things I've built.">
          Pipelines, validation and instrumentation from the labs above — and{" "}
          <Link href="/tool" className="font-medium text-accent-600 underline-offset-2 hover:underline dark:text-accent-300">
            NeuroDrift
          </Link>
          , the decoder-stability tool that runs on this site.
        </SectionHeading>
        <WorkGrid />
      </section>

      {/* Education + recognition */}
      <section id="education" className="mb-20 scroll-mt-20">
        <SectionHeading eyebrow="Background" title="Education and recognition" />
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <Reveal className="card p-5">
            <h3 className="text-xs font-medium uppercase tracking-wider text-zinc-500">Education</h3>
            <ul className="mt-3 divide-y divide-zinc-100 dark:divide-zinc-800">
              {EDUCATION.map((e) => (
                <li key={e.school} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 py-2.5 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <div className="font-medium">{e.school}</div>
                    <div className="text-sm text-zinc-600 dark:text-zinc-400">{e.detail}</div>
                  </div>
                  <div className="font-mono text-xs text-zinc-500">{e.years}</div>
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={100} className="card p-5">
            <h3 className="text-xs font-medium uppercase tracking-wider text-zinc-500">Recognition</h3>
            <ul className="mt-3 divide-y divide-zinc-100 dark:divide-zinc-800">
              {RECOGNITION.map((r) => (
                <li key={r.title} className="py-2.5 first:pt-0 last:pb-0">
                  <div className="font-medium">{r.title}</div>
                  <div className="text-sm text-zinc-600 dark:text-zinc-400">{r.detail}</div>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      {/* Toolbox */}
      <section id="toolbox" className="mb-20 scroll-mt-20">
        <SectionHeading eyebrow="Skills" title="Toolbox" />
        <SkillList groups={TOOLKIT} />
      </section>

      {/* Publications */}
      <section id="publications" className="mb-20 scroll-mt-20">
        <SectionHeading eyebrow="Publications" title="In preparation.">
          Manuscripts are in progress; they will be listed here once submitted. Public code and results for the cross-day
          decoding project are on{" "}
          <a href={projectBySlug("cross-day-decoding").repo} rel="noopener" target="_blank" className="font-medium text-accent-600 underline-offset-2 hover:underline dark:text-accent-300">
            GitHub
          </a>
          .
        </SectionHeading>
      </section>

      {/* Contact */}
      <Reveal as="section" className="mb-8">
        <div id="contact" className="card scroll-mt-20 p-6 md:p-8">
          <div className="text-xs font-medium uppercase tracking-wider text-accent-600 dark:text-accent-300">Contact</div>
          <h2 className="mt-1 text-xl font-semibold md:text-2xl">Let&apos;s talk brains and machines.</h2>
          <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-zinc-600 dark:text-zinc-400">
            Reach out about research, collaborations, or a lab position — I&apos;m always glad to compare notes on decoding and neural
            data.
          </p>
          <ul className="mt-5 space-y-2 text-sm">
            <li>
              <a href={`mailto:${PROFILE.email}`} className="inline-flex min-h-8 items-center gap-2 font-medium text-accent-600 hover:underline dark:text-accent-300">
                <MailIcon />
                {PROFILE.email}
              </a>
            </li>
            <li>
              <a href={PROFILE.github} rel="me noopener" target="_blank" className="inline-flex min-h-8 items-center gap-2 font-medium text-accent-600 hover:underline dark:text-accent-300">
                <GitHubIcon />
                github.com/howardbot
              </a>
            </li>
            <li className="text-zinc-600 dark:text-zinc-400">{PROFILE.location}</li>
          </ul>
        </div>
      </Reveal>
    </div>
  );
}
