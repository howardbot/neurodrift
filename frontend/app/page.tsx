import { DemoButton } from "@/components/DemoButton";
import { ButtonLink } from "@/components/ui";

const topics = [
  {
    title: "Cross-session decoding",
    body: "Train a linear decoder on one session and evaluate it on every other session. The train × test matrix shows how quickly a fixed decoder stops generalising.",
  },
  {
    title: "Neural representation drift",
    body: "Fit PCA independently per session and compare the resulting subspaces with principal angles, on the neurons the two sessions actually share.",
  },
  {
    title: "Behavioural comparison",
    body: "Compare target distributions across sessions, so that poor decoder transfer is not mistaken for neural change when the behaviour itself differs.",
  },
];

export default function Landing() {
  return (
    <div className="mx-auto max-w-4xl py-10">
      <h1 className="text-3xl font-semibold tracking-tight">NeuroDrift</h1>
      <p className="mt-2 max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">
        Understand how neural representations and decoders change across recording sessions.
      </p>
      <div className="mt-6 flex flex-wrap items-start gap-3">
        <DemoButton />
        <ButtonLink href="/projects">Create Project</ButtonLink>
      </div>

      <div className="mt-12 grid gap-4 md:grid-cols-3">
        {topics.map((t) => (
          <div key={t.title} className="card p-4">
            <h2 className="text-sm font-semibold">{t.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{t.body}</p>
          </div>
        ))}
      </div>

      <div className="card mt-8 p-4 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
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
          <a href="/documentation" className="text-accent-600 underline-offset-2 hover:underline">documentation</a>.
        </p>
      </div>
    </div>
  );
}
