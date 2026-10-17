import Link from "next/link";
import { DemoButton } from "@/components/DemoButton";
import { Reveal } from "@/components/motion";
import { DriftMatrix } from "@/components/showcase/Glyphs";
import { HeroGlow } from "@/components/showcase/Story";
import { ButtonLink } from "@/components/ui";

const icon = "h-5 w-5 stroke-current";

const topics = [
  {
    title: "Cross-session decoding",
    body: "Train a linear decoder on one session and evaluate it on every other session. The train × test matrix shows how quickly a fixed decoder stops generalising.",
    icon: (
      <svg viewBox="0 0 20 20" fill="none" className={icon} strokeWidth={1.6} aria-hidden="true">
        <rect x={2.5} y={2.5} width={6} height={6} rx={1} />
        <rect x={11.5} y={2.5} width={6} height={6} rx={1} opacity={0.5} />
        <rect x={2.5} y={11.5} width={6} height={6} rx={1} opacity={0.5} />
        <rect x={11.5} y={11.5} width={6} height={6} rx={1} />
      </svg>
    ),
  },
  {
    title: "Neural representation drift",
    body: "Fit PCA independently per session and compare the resulting subspaces with principal angles, on the neurons the two sessions actually share.",
    icon: (
      <svg viewBox="0 0 20 20" fill="none" className={icon} strokeWidth={1.6} strokeLinecap="round" aria-hidden="true">
        <path d="M3 16 L3 4 M3 16 L16 16" />
        <path d="M3 16 L14 7" />
        <path d="M3 16 L11 4.5" strokeDasharray="2 2" />
      </svg>
    ),
  },
  {
    title: "Behavioural comparison",
    body: "Compare target distributions across sessions, so that poor decoder transfer is not mistaken for neural change when the behaviour itself differs.",
    icon: (
      <svg viewBox="0 0 20 20" fill="none" className={icon} strokeWidth={1.6} strokeLinecap="round" aria-hidden="true">
        <path d="M2 16 C5 16 5 5 8 5 S11 16 14 16" />
        <path d="M6 16 C9 16 9 8 12 8 S15 16 18 16" strokeDasharray="2 2" />
      </svg>
    ),
  },
];

export const metadata = { title: "NeuroDrift tool" };

export default function ToolLanding() {
  return (
    <div className="mx-auto max-w-4xl py-10">
      <section className="relative grid grid-cols-1 gap-10 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
        <HeroGlow />
        <div>
          <div className="mb-1.5 animate-fade-up text-xs font-medium uppercase tracking-wider text-accent-600 dark:text-accent-300">The tool</div>
          <h1 className="animate-fade-up text-4xl font-semibold tracking-tight [animation-delay:80ms]">
            Neuro<span className="text-gradient animate-gradient-x">Drift</span>
          </h1>
          <p className="mt-3 max-w-xl animate-fade-up text-lg text-zinc-600 [animation-delay:160ms] dark:text-zinc-400">
            Understand how neural representations and decoders change across recording sessions.
          </p>
          <div className="mt-6 flex animate-fade-up flex-wrap items-start gap-3 [animation-delay:240ms]">
            <DemoButton />
            <ButtonLink href="/projects">Create Project</ButtonLink>
          </div>
        </div>
        <div className="hidden animate-fade-up [animation-delay:320ms] md:block">
          <DriftMatrix />
        </div>
      </section>

      <div className="mt-14 grid grid-cols-1 gap-4 md:grid-cols-3">
        {topics.map((t, i) => (
          <Reveal key={t.title} delay={i * 100} className="card card-hover group p-5">
            <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-accent-50 text-accent-600 transition-transform duration-300 group-hover:scale-110 dark:bg-accent-500/10 dark:text-accent-300">
              {t.icon}
            </div>
            <h2 className="text-sm font-semibold">{t.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{t.body}</p>
          </Reveal>
        ))}
      </div>

      <Reveal className="card mt-8 border-l-4 border-l-accent-500/60 p-5 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
        <p>
          Population activity recorded from the same region changes across days — through biological variability,
          learning, electrode instability, neuron turnover and behavioural differences — and decoders trained on earlier
          sessions degrade. NeuroDrift reports <em>decoder generalisation</em>, <em>representation similarity</em>,{" "}
          <em>activity changes</em> and <em>behavioural differences</em> separately. It does not treat decoder degradation
          as evidence of representational drift, and it makes no causal claims.
        </p>
        <p className="mt-3">
          Input is one <code className="font-mono text-xs">.npz</code> file per session with arrays{" "}
          <code className="font-mono text-xs">X</code> (time bins × neurons) and{" "}
          <code className="font-mono text-xs">Y</code> (time bins × behavioural outputs). See the{" "}
          <Link href="/documentation" className="text-accent-600 underline-offset-2 hover:underline">documentation</Link>.
        </p>
      </Reveal>
    </div>
  );
}
