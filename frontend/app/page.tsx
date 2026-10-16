import Link from "next/link";
import type { ReactNode } from "react";
import { DemoButton } from "@/components/DemoButton";
import { Reveal } from "@/components/motion";
import { DriftMatrix } from "@/components/showcase/Glyphs";
import { HeroRaster } from "@/components/showcase/HeroRaster";
import { PopulationDecodingDemo } from "@/components/showcase/PopulationDecodingDemo";
import { Figure, HeroGlow, ProjectCard, SkillList, Term } from "@/components/showcase/Story";
import { RESEARCH } from "@/content/research";

function LiveDot({ tone = "emerald" }: { tone?: "emerald" | "accent" }) {
  const colour = tone === "emerald" ? "bg-emerald-500" : "bg-accent-500";
  return (
    <span className="relative flex h-2 w-2">
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
    <div className="relative overflow-hidden">
      <svg viewBox="0 0 560 60" className="w-full" role="img" aria-label="A neuron's electrical activity showing brief spikes">
        <path d={d} pathLength={1} fill="none" className="draw-path stroke-accent-600 dark:stroke-accent-300" strokeWidth={1.6} strokeLinejoin="round" />
      </svg>
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

function SectionHeading({ id, eyebrow, title, children }: { id?: string; eyebrow: string; title: string; children?: ReactNode }) {
  return (
    <Reveal id={id} className="mb-8 scroll-mt-6">
      <div className="mb-1.5 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-accent-600 dark:text-accent-300">
        <span className="h-px w-5 bg-gradient-to-r from-accent-500 to-transparent" />
        {eyebrow}
      </div>
      <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">{title}</h2>
      {children && <p className="mt-2 max-w-3xl text-[15px] leading-relaxed text-zinc-600 dark:text-zinc-400">{children}</p>}
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
          <div className="mb-5 inline-flex animate-fade-up items-center gap-2 rounded-full border border-accent-500/20 bg-white/70 px-3 py-1 text-xs font-medium text-accent-700 shadow-sm backdrop-blur dark:bg-zinc-900/60 dark:text-accent-200">
            <LiveDot tone="accent" />
            Qin Liu · Neuroscience research
          </div>
          <h1 className="animate-fade-up text-[2rem] font-semibold leading-[1.15] tracking-tight [animation-delay:80ms] md:text-[2.9rem] md:leading-[1.1]">
            How does the brain turn what we see into what we do —{" "}
            <span className="text-gradient animate-gradient-x">and can we read those signals reliably?</span>
          </h1>
          <p className="mt-6 animate-fade-up text-lg leading-relaxed text-zinc-600 [animation-delay:160ms] dark:text-zinc-400">
            I analyse recordings from individual neurons in monkeys and marmosets. My projects ask how brain areas share
            information, how two eyes create a sense of depth, how stable &ldquo;brain-reading&rdquo; decoders are from day to day,
            and how far we can trust the tools that pick single neurons out of noisy recordings. This site explains that work for
            people outside neuroscience — no background needed.
          </p>
          <div className="mt-7 flex animate-fade-up flex-wrap gap-3 [animation-delay:240ms]">
            <a href="#primer" className="btn btn-primary group">
              Start with the 2-minute primer
              <span className="inline-block transition-transform duration-200 group-hover:translate-y-0.5">↓</span>
            </a>
            <a href="#projects" className="btn btn-outline group">
              Jump to the projects <span className="arrow">→</span>
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

      {/* Primer */}
      <section id="primer" className="mb-20 scroll-mt-6">
        <SectionHeading eyebrow="Primer" title="Neuroscience in two minutes" />
        <PrimerStep n={1} title="Neurons talk in spikes">
          <p>
            Your brain has about 86 billion neurons. They communicate with brief electrical pulses called{" "}
            <Term def="Also called action potentials: a neuron's voltage jumps up and back down in about a millisecond, and the pulse travels to other neurons.">spikes</Term>.
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
            a colour. This preference is called <Term def="How a neuron's firing rate changes with some property of the world or the body. A neuron 'tuned' to rightward reaches fires most when the arm moves right.">tuning</Term>.
            But even for the same thing, a neuron never fires exactly the same way twice: its output is noisy.
          </p>
        </PrimerStep>
        <PrimerStep n={3} title="A crowd is more reliable than one voice">
          <p>
            Because each neuron prefers something different, the pattern across many neurons carries the information. A{" "}
            <Term def="A mathematical model that maps recorded neural activity to a quantity of interest, such as arm position or what the animal is looking at.">decoder</Term>{" "}
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

      {/* Projects */}
      <section className="mb-20">
        <SectionHeading id="projects" eyebrow="Research" title="Projects">
          Each page explains the question in plain language, shows an interactive illustration, and describes what I built.
          Unpublished projects show methods, not results.
        </SectionHeading>
        <div className="grid gap-5 sm:grid-cols-2">
          {RESEARCH.map((p, i) => (
            <ProjectCard key={p.slug} project={p} index={i} />
          ))}
        </div>
      </section>

      {/* NeuroDrift */}
      <Reveal as="section" className="mb-20">
        <div className="card relative isolate overflow-hidden p-6 md:p-8">
          <div aria-hidden="true" className="absolute -right-20 -top-24 -z-10 h-72 w-72 animate-drift rounded-full bg-accent-400/20 blur-3xl dark:bg-accent-500/15" />
          <div aria-hidden="true" className="absolute -bottom-24 left-1/3 -z-10 h-56 w-56 animate-drift-slow rounded-full bg-violet-400/15 blur-3xl dark:bg-violet-500/10" />
          <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
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
                  <span key={t} className="rounded-full border border-zinc-200 bg-white/60 px-2 py-0.5 transition-colors hover:border-accent-500/60 hover:text-accent-700 dark:border-zinc-700 dark:bg-zinc-900/60 dark:hover:text-accent-200">
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

      {/* Toolbox */}
      <section className="mb-8">
        <SectionHeading eyebrow="Skills" title="Toolbox" />
        <SkillList
          groups={[
            { label: "Neural data analysis", items: ["Decoding: Kalman filters, ridge regression, support vector machines", "Dimensionality reduction and alignment: PCA, CCA, subspace angles", "Statistics: block bootstrap, permutation and sign-flip tests, multiple-comparison control"] },
            { label: "Electrophysiology", items: ["Single- and multi-unit recordings from tetrodes and multi-electrode implants", "Spike sorting with Kilosort 4 and Plexon Offline Sorter", "Receptive-field mapping and waveform classification"] },
            { label: "Experiments and modelling", items: ["Stereo 3D stimulus rendering with OpenGL / Psychtoolbox", "Population models of binocular disparity processing", "Synthetic data and simulations to test analyses"] },
            { label: "Engineering", items: ["Python (NumPy, SciPy, scikit-learn), MATLAB", "Reproducible pipelines with integrity checks and checksummed result snapshots", "Full-stack web apps: this site (Next.js, FastAPI, Docker)"] },
          ]}
        />
      </section>
    </div>
  );
}
