import Link from "next/link";
import type { ReactNode } from "react";
import { DemoButton } from "@/components/DemoButton";
import { GuideCard } from "@/components/learn/GuideBits";
import { Reveal } from "@/components/motion";
import { Chips, ContactButtons, GitHubIcon, LabTimeline, MailIcon, SectionHeading } from "@/components/profile/ProfileBlocks";
import { DriftMatrix } from "@/components/showcase/Glyphs";
import { HeroRaster } from "@/components/showcase/HeroRaster";
import { PopulationDecodingDemo } from "@/components/showcase/PopulationDecodingDemo";
import { Figure, HeroGlow, ProjectCard, Term } from "@/components/showcase/Story";
import { PROFILE } from "@/content/profile";
import { GUIDES } from "@/content/learn";
import { RESEARCH } from "@/content/research";

function LiveDot({ tone = "emerald" }: { tone?: "emerald" | "accent" }) {
  const colour = tone === "emerald" ? "bg-emerald-500" : "bg-accent-500";
  return (
    <span className="relative flex h-2 w-2" data-pause-offscreen="">
      <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 motion-reduce:hidden ${colour}`} />
      <span className={`relative inline-flex h-2 w-2 rounded-full ${colour}`} />
    </span>
  );
}

function SpikeTrain() {
  // A short, fixed spike train drawn as a voltage trace.
  const spikes = [18, 41, 47, 90, 132, 139, 145, 190, 236, 262, 300, 309, 352, 398, 441, 447, 488, 530];
  const d = spikes.reduce((acc, x) => `${acc} L${x - 2},40 L${x},6 L${x + 2},52 L${x + 5},40`, "M0,40") + " L560,40";
  return (
    <div className="relative overflow-hidden" data-pause-offscreen="">
      <svg viewBox="0 0 560 60" className="w-full" role="img" aria-label="A neuron's electrical activity showing brief spikes">
        <path d={d} fill="none" className="stroke-accent-600 dark:stroke-accent-300" strokeWidth={1.6} strokeLinejoin="round" />
      </svg>
      <span aria-hidden="true" className="trace-cover pointer-events-none absolute inset-0 bg-white dark:bg-zinc-900" />
      {/* Oscilloscope-style scan line. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 animate-sweep motion-reduce:hidden">
        <div className="h-full w-20 -translate-x-full border-r border-accent-500/50 bg-gradient-to-r from-transparent to-accent-500/15" />
      </div>
    </div>
  );
}

function PrimerStep({ n, title, last, children }: { n: number; title: string; last?: boolean; children: ReactNode }) {
  return (
    <Reveal className="grid grid-cols-[2.25rem_minmax(0,1fr)] gap-x-4">
      <div className="flex flex-col items-center">
        <span className="z-10 flex h-9 w-9 items-center justify-center rounded-full border border-accent-500/30 bg-white font-mono text-xs font-semibold text-accent-700 shadow-sm ring-4 ring-zinc-50 dark:bg-zinc-900 dark:text-accent-200 dark:ring-zinc-950">
          {String(n).padStart(2, "0")}
        </span>
        {!last && <span aria-hidden="true" className="mt-1 w-px flex-1 bg-gradient-to-b from-accent-500/40 to-zinc-200 dark:to-zinc-800" />}
      </div>
      <div className={`pt-1.5 ${last ? "" : "pb-10"}`}>
        <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
        <div className="mt-1.5 max-w-3xl space-y-3 text-[15px] leading-relaxed text-zinc-700 dark:text-zinc-300">{children}</div>
      </div>
    </Reveal>
  );
}

export default function Home() {
  return (
    <div className="mx-auto max-w-5xl py-6">
      {/* Hero */}
      <section className="relative mb-20 pt-2">
        <HeroGlow />
        <div className="max-w-3xl">
          <div className="mb-5 inline-flex animate-fade-up items-center gap-2 rounded-full border border-accent-500/20 bg-white/80 px-3 py-1 text-xs font-medium text-accent-700 shadow-sm dark:bg-zinc-900/60 dark:text-accent-200">
            <LiveDot tone="accent" />
            {PROFILE.field} · UW–Madison
          </div>
          <h1 className="animate-fade-up text-[2.75rem] font-semibold leading-none tracking-tight md:text-[4rem]">{PROFILE.name}</h1>
          <p className="mt-2 animate-fade-up text-sm font-medium text-zinc-600 [animation-delay:60ms] dark:text-zinc-400">{PROFILE.affiliation}</p>
          <p className="mt-6 animate-fade-up text-[1.4rem] font-semibold leading-snug tracking-tight [animation-delay:120ms] md:text-[1.9rem] md:leading-[1.2]">
            How does the brain turn what we see into what we do —{" "}
            <span className="text-gradient">and can we read those signals reliably?</span>
          </p>
          <p className="mt-5 animate-fade-up text-lg leading-relaxed text-zinc-600 [animation-delay:180ms] dark:text-zinc-400">{PROFILE.tagline}</p>
          <Chips items={PROFILE.interests} className="mt-5 animate-fade-up [animation-delay:220ms]" />
          <div className="mt-7 flex animate-fade-up flex-wrap gap-3 [animation-delay:260ms]">
            <a href="#projects" className="btn btn-primary group">
              Explore the research
              <span className="inline-block transition-transform duration-200 group-hover:translate-y-0.5">↓</span>
            </a>
            <Link href="/about" className="btn btn-outline group">
              About me <span className="arrow">→</span>
            </Link>
            <a href={`mailto:${PROFILE.email}`} className="btn btn-outline">
              <MailIcon />
              Email
            </a>
            <a href={PROFILE.github} className="btn btn-outline px-3" rel="me noopener" target="_blank" aria-label="GitHub">
              <GitHubIcon />
            </a>
          </div>
        </div>

        <div className="card mt-12 animate-fade-up overflow-hidden [animation-delay:360ms]">
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1.5 border-b border-zinc-200 bg-zinc-50/60 px-4 py-2 text-[11px] text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/60">
            <span className="flex items-center gap-2 font-medium uppercase tracking-wider">
              <LiveDot />
              Live · simulated recording of 28 neurons
            </span>
            <span className="flex flex-wrap gap-x-4 gap-y-1">
              <span className="flex items-center gap-1.5"><span className="h-2 w-5 rounded-full bg-emerald-600/20 dark:bg-emerald-400/25" /> actual direction</span>
              <span className="flex items-center gap-1.5"><span className="h-0.5 w-5 rounded bg-orange-600 dark:bg-orange-400" /> decoded from the spikes</span>
            </span>
          </div>
          <div className="relative h-[150px] md:h-[190px]" role="img" aria-label="Animated spike raster: each row is a neuron, each tick a spike. A wave of activity moves across the neurons as the movement direction changes, and a line decoded from the spikes follows it.">
            <HeroRaster />
          </div>
        </div>
      </section>

      {/* Projects */}
      {/* The anchor sits on the untransformed section, not on the Reveal inside it. */}
      <section id="projects" className="mb-20">
        <SectionHeading eyebrow="Research" title="Four questions about reading the brain">
          I analyse recordings from individual neurons in monkeys and marmosets: how brain areas share information, how two
          eyes create a sense of depth, how stable &ldquo;brain-reading&rdquo; decoders are from day to day, and how far we can
          trust the tools that pick single neurons out of noisy recordings. Each page explains the question in plain language
          with an interactive illustration. Unpublished projects show methods, not results.
        </SectionHeading>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {RESEARCH.map((p, i) => (
            <ProjectCard key={p.slug} project={p} index={i} />
          ))}
        </div>
        <Reveal className="mt-6 text-sm text-zinc-600 dark:text-zinc-400">
          New to neuroscience?{" "}
          <a href="#primer" className="group font-medium text-accent-600 dark:text-accent-300">
            Start with the two-minute primer <span className="inline-block transition-transform duration-200 group-hover:translate-y-0.5">↓</span>
          </a>
        </Reveal>
      </section>

      {/* Primer */}
      <section id="primer" className="mb-20">
        <SectionHeading eyebrow="Primer" title="Neuroscience in two minutes">No background needed: the four ideas behind every project above.</SectionHeading>
        <PrimerStep n={1} title="Neurons talk in spikes">
          <p>
            Your brain has about 86 billion neurons. They communicate with brief electrical pulses called{" "}
            <Term id="spikes">spikes</Term>.
            A fine electrode placed next to a neuron picks these up; played through a speaker they sound like clicks.
          </p>
          <div className="card px-4 py-3">
            <SpikeTrain />
            <div className="mt-1 text-xs text-zinc-500">One second of a neuron&apos;s activity: each upward flick is a spike.</div>
          </div>
        </PrimerStep>
        <PrimerStep n={2} title="Each neuron has favourites">
          <p>
            Many neurons fire faster for some things than others — a particular direction of arm movement, the tilt of a surface,
            a colour. This preference is called <Term id="tuning">tuning</Term>.
            But even for the same thing, a neuron never fires exactly the same way twice: its output is noisy.
          </p>
        </PrimerStep>
        <PrimerStep n={3} title="A crowd is more reliable than one voice">
          <p>
            Because each neuron prefers something different, the pattern across many neurons carries the information. A{" "}
            <Term id="decoder">decoder</Term>{" "}
            combines them into one estimate. Brain–computer interfaces use exactly this idea to let people with paralysis move a
            cursor or robotic arm. Try it: each dot below is a simulated neuron around a dial of movement directions.
          </p>
          <div className="-ml-[3.25rem] sm:ml-0">
            <Figure
              label="Interactive · toy simulation"
              caption="Each neuron fires most for its preferred direction (its position on the ring) and adds random noise. The decoder sums every neuron's preferred direction, weighted by how strongly it fired (a 'population vector'). More neurons make the estimate steadier even when each one is noisy."
            >
              <PopulationDecodingDemo />
            </Figure>
          </div>
        </PrimerStep>
        <PrimerStep n={4} title="The catch" last>
          <p>
            Real recordings are messier than this toy. The neurons an electrode hears change from day to day, signals drift as
            an animal learns or gets tired, and separating genuine effects from coincidence takes careful statistics. Each of
            my projects tackles one of these problems.
          </p>
        </PrimerStep>
      </section>

      {/* Field guide */}
      <section id="field-guide" className="mb-20">
        <SectionHeading eyebrow="Field guide" title="How do you listen to a brain?">
          Three short, interactive explainers behind everything above: the electrodes neuroscientists use, from the scalp to the inside of
          a single cell; how a raw recording becomes the numbers a decoder reads; and where in the brain my recordings come from.
        </SectionHeading>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {GUIDES.map((g, i) => (
            <GuideCard key={g.slug} guide={g} index={i} />
          ))}
        </div>
      </section>

      {/* Experience */}
      <section id="experience" className="mb-20">
        <SectionHeading eyebrow="Experience" title="Where I work">
          Four labs across neural decoding, recording hardware, 3D vision and control. Projects with a story on this site link to it.
        </SectionHeading>
        <LabTimeline />
        <Reveal className="mt-6">
          <Link href="/about#experience" className="group text-sm font-medium text-accent-600 dark:text-accent-300">
            What I do in each lab, education and toolbox <span className="arrow">→</span>
          </Link>
        </Reveal>
      </section>

      {/* NeuroDrift */}
      <Reveal as="section" className="mb-20">
        <div className="card relative isolate overflow-hidden p-6 md:p-8">
          <div aria-hidden="true" data-pause-offscreen="" className="pointer-events-none absolute inset-0 -z-10">
            <div className="glow absolute -right-36 -top-40 h-[26rem] w-[26rem] animate-drift [--glow-alpha:0.2] [--glow:90_141_205] dark:[--glow-alpha:0.15] dark:[--glow:59_111_182]" />
            <div className="glow absolute -bottom-40 left-[calc(33.333%-4rem)] h-[22rem] w-[22rem] animate-drift-slow [--glow-alpha:0.15] [--glow:167_139_250] dark:[--glow-alpha:0.1] dark:[--glow:139_92_246]" />
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
            <div>
              <div className="text-xs font-medium uppercase tracking-wider text-accent-600 dark:text-accent-300">Software I built</div>
              <h2 className="mt-1 text-xl font-semibold md:text-2xl">NeuroDrift: measuring how decoders hold up across days</h2>
              <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-zinc-600 dark:text-zinc-400">
                Inspired by the cross-day decoding project, NeuroDrift lets a researcher upload several recording sessions, train a
                decoder on each day and test it on every other day, and compare that with how the neural activity patterns
                themselves changed. It runs on a small server: Python analysis workers behind a web interface.
              </p>
              <div className="mt-4 flex flex-wrap gap-1.5 text-xs text-zinc-500">
                {["Next.js", "FastAPI", "PostgreSQL", "Redis job queue", "scikit-learn", "Docker"].map((t) => (
                  <span key={t} className="rounded-full border border-zinc-200 bg-white/60 px-2 py-0.5 hover:border-accent-500/60 hover:text-accent-700 dark:border-zinc-700 dark:bg-zinc-900/60 dark:hover:text-accent-200">
                    {t}
                  </span>
                ))}
              </div>
              <div className="mt-6 flex flex-wrap items-start gap-x-5 gap-y-3">
                <DemoButton label="Try it with demo data" />
                <Link href="/tool" className="group py-1.5 text-sm font-medium text-accent-600 dark:text-accent-300">
                  About the tool <span className="arrow">→</span>
                </Link>
              </div>
            </div>
            <DriftMatrix />
          </div>
        </div>
      </Reveal>

      {/* Contact */}
      <Reveal as="section" className="mb-8">
        <div id="contact" className="card relative isolate overflow-hidden p-6 md:p-8">
          <div aria-hidden="true" data-pause-offscreen="" className="pointer-events-none absolute inset-0 -z-10">
            <div className="glow absolute -left-32 -top-40 h-[24rem] w-[24rem] animate-drift-slow [--glow-alpha:0.16] [--glow:90_141_205] dark:[--glow-alpha:0.12] dark:[--glow:59_111_182]" />
          </div>
          <div className="text-xs font-medium uppercase tracking-wider text-accent-600 dark:text-accent-300">Contact</div>
          <h2 className="mt-1 text-xl font-semibold md:text-2xl">Let&apos;s talk brains and machines.</h2>
          <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-zinc-600 dark:text-zinc-400">
            Reach out about research, collaborations, or a lab position — I&apos;m always glad to compare notes on decoding and neural
            data.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <ContactButtons />
          </div>
        </div>
      </Reveal>
    </div>
  );
}
