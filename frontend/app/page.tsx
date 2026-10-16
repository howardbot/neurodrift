import Link from "next/link";
import { DemoButton } from "@/components/DemoButton";
import { PopulationDecodingDemo } from "@/components/showcase/PopulationDecodingDemo";
import { Figure, ProjectCard, SkillList, Term } from "@/components/showcase/Story";
import { RESEARCH } from "@/content/research";

function SpikeTrain() {
  // A short, fixed spike train drawn as a voltage trace.
  const spikes = [18, 41, 47, 90, 132, 139, 145, 190, 236, 262, 300, 309, 352, 398, 441, 447, 488, 530];
  const d = spikes.reduce((acc, x) => `${acc} L${x - 2},40 L${x},6 L${x + 2},52 L${x + 5},40`, "M0,40") + " L560,40";
  return (
    <svg viewBox="0 0 560 60" className="w-full" role="img" aria-label="A neuron's electrical activity showing brief spikes">
      <path d={d} fill="none" stroke="#2f5d9e" strokeWidth={1.6} strokeLinejoin="round" />
    </svg>
  );
}

function PrimerStep({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <div className="font-mono text-sm text-accent-600">{String(n).padStart(2, "0")}</div>
      <div className="max-w-3xl">
        <h3 className="font-semibold">{title}</h3>
        <div className="mt-1 space-y-3 text-[15px] leading-relaxed text-zinc-700 dark:text-zinc-300">{children}</div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="mx-auto max-w-5xl py-6">
      {/* Hero */}
      <section className="mb-16 max-w-3xl">
        <div className="mb-3 text-sm font-medium text-accent-600">Qin Liu · Neuroscience research</div>
        <h1 className="text-3xl font-semibold leading-tight tracking-tight md:text-[2.6rem] md:leading-[1.15]">
          How does the brain turn what we see into what we do — and can we read those signals reliably?
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
          I analyse recordings from individual neurons in monkeys and marmosets. My projects ask how brain areas share
          information, how two eyes create a sense of depth, how stable &ldquo;brain-reading&rdquo; decoders are from day to day,
          and how far we can trust the tools that pick single neurons out of noisy recordings. This site explains that work for
          people outside neuroscience — no background needed.
        </p>
        <div className="mt-6 flex flex-wrap gap-3 text-sm">
          <a href="#primer" className="rounded bg-accent-600 px-4 py-2 font-medium text-white hover:bg-accent-700">Start with the 2-minute primer</a>
          <a href="#projects" className="rounded border border-zinc-300 px-4 py-2 font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800">Jump to the projects</a>
        </div>
      </section>

      {/* Primer */}
      <section id="primer" className="mb-16 scroll-mt-6">
        <h2 className="mb-6 text-2xl font-semibold tracking-tight">Neuroscience in two minutes</h2>
        <div className="space-y-8">
          <PrimerStep n={1} title="Neurons talk in spikes">
            <p>
              Your brain has about 86 billion neurons. They communicate with brief electrical pulses called{" "}
              <Term def="Also called action potentials: a neuron's voltage jumps up and back down in about a millisecond, and the pulse travels to other neurons.">spikes</Term>.
              A fine electrode placed next to a neuron picks these up; played through a speaker they sound like clicks.
            </p>
            <div className="card px-4 py-3"><SpikeTrain /><div className="mt-1 text-xs text-zinc-500">One second of a neuron&apos;s activity: each upward flick is a spike.</div></div>
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
          </PrimerStep>
        </div>
        <Figure
          label="Interactive · toy simulation"
          caption="Each neuron fires most for its preferred direction (its position on the ring) and adds random noise. The decoder sums every neuron's preferred direction, weighted by how strongly it fired (a 'population vector'). More neurons make the estimate steadier even when each one is noisy."
        >
          <PopulationDecodingDemo />
        </Figure>
        <div className="mt-8">
          <PrimerStep n={4} title="The catch">
            <p>
              Real recordings are messier than this toy. The neurons an electrode hears change from day to day, signals drift as
              an animal learns or gets tired, and separating genuine effects from coincidence takes careful statistics. Each of
              my projects tackles one of these problems.
            </p>
          </PrimerStep>
        </div>
      </section>

      {/* Projects */}
      <section id="projects" className="mb-16 scroll-mt-6">
        <h2 className="mb-2 text-2xl font-semibold tracking-tight">Projects</h2>
        <p className="mb-6 max-w-3xl text-[15px] text-zinc-600 dark:text-zinc-400">
          Each page explains the question in plain language, shows an interactive illustration, and describes what I built.
          Unpublished projects show methods, not results.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {RESEARCH.map((p, i) => (
            <ProjectCard key={p.slug} project={p} index={i} />
          ))}
        </div>
      </section>

      {/* NeuroDrift */}
      <section className="mb-16">
        <div className="card grid gap-6 p-6 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <div className="text-xs font-medium uppercase tracking-wider text-accent-600">Software I built</div>
            <h2 className="mt-1 text-xl font-semibold">NeuroDrift: measuring how decoders hold up across days</h2>
            <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-zinc-600 dark:text-zinc-400">
              Inspired by the cross-day decoding project, NeuroDrift lets a researcher upload several recording sessions, train a
              decoder on each day and test it on every other day, and compare that with how the neural activity patterns
              themselves changed. It runs on a small server: Python analysis workers behind a web interface.
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5 text-xs text-zinc-500">
              {["Next.js", "FastAPI", "PostgreSQL", "Redis job queue", "scikit-learn", "Docker"].map((t) => (
                <span key={t} className="rounded-full border border-zinc-200 px-2 py-0.5 dark:border-zinc-700">{t}</span>
              ))}
            </div>
          </div>
          <div className="flex flex-col items-start gap-2">
            <DemoButton label="Try it with demo data" />
            <Link href="/tool" className="text-sm text-accent-600 hover:underline">About the tool →</Link>
          </div>
        </div>
      </section>

      {/* Toolbox */}
      <section className="mb-8">
        <h2 className="mb-4 text-2xl font-semibold tracking-tight">Toolbox</h2>
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
