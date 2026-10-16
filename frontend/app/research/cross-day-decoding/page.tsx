import Link from "next/link";
import { CrossDayDesign, ExplanationsTested, GapChart, InputReadoutGrids, PairSlopes } from "@/components/showcase/MarmosetFigures";
import { Callout, Figure, NextProject, ProjectHero, Section, SkillList, Steps, Term } from "@/components/showcase/Story";
import { projectBySlug } from "@/content/research";

const project = projectBySlug("cross-day-decoding");
export const metadata = { title: project.title };

const REPO = "https://github.com/howardbot/Marmoset_Decoding_Public";

function Numbers() {
  const items = [
    { value: "146", label: "Python files in the maintained analysis pipeline" },
    { value: "30", label: "hypothesis-test scripts, so each candidate explanation is checked in code" },
    { value: "103,680", label: "individual trial scores in the latest replication alone" },
    { value: "485", label: "data splits rebuilt by an independent audit to check for leaks and mistakes" },
  ];
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((i) => (
        <div key={i.label} className="card p-4">
          <div className="num font-mono text-2xl font-semibold">{i.value}</div>
          <div className="mt-1 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">{i.label}</div>
        </div>
      ))}
    </div>
  );
}

export default function CrossDayDecoding() {
  return (
    <article className="mx-auto max-w-5xl py-6">
      <ProjectHero project={project} />

      <Section eyebrow="The question" title="Brain-reading has a shelf life">
        <p>
          A <Term def="A mathematical model that maps recorded neural activity to a quantity of interest — here, the position of the wrist during a reach.">decoder</Term>{" "}
          learns which patterns of brain activity go with which hand positions. It is the core of a{" "}
          <Term def="A system that records brain activity and translates it into commands for a computer cursor, robotic arm or other device.">brain–computer interface</Term>.
          The problem is that recordings change: from one day to the next, electrodes pick up slightly different neurons, and the
          brain itself adapts as an animal learns. A decoder trained on Monday often works worse on Tuesday and has to be recalibrated.
        </p>
        <p>
          I studied this with marmosets — small monkeys — performing a reaching task while electrodes recorded from brain areas that control
          movement. Between two blocks of recording days, the animal either trained on a <em>second</em> reaching task, or (as a
          control) had no task at all. The question: does that intervening learning change how well decoders carry over, and does
          it matter which way you carry them?
        </p>
      </Section>

      <Figure label="Experimental design" caption="Two animals (TS and TY) trained on a second task between the recording blocks; one animal (TS) also repeated the design later with no task in between, as a control.">
        <CrossDayDesign />
      </Figure>

      <Section eyebrow="The idea" title="Why test both directions?">
        <p>
          If the brain&apos;s signals simply wandered at random between the two blocks, learning a decoder on the first block and testing it
          on the second (<span className="font-medium text-[#c2410c]">forward</span>) should be about as hard as the reverse (
          <span className="font-medium text-[#2f5d9e]">reverse</span>). A consistent difference between the two directions would mean the
          change has some structure — for example, that activity after the new learning contains patterns the earlier activity did not.
        </p>
      </Section>

      <Section eyebrow="How it works" title="From electrical signals to predicted hand position">
        <Steps
          items={[
            { title: "Record", body: "Electrodes record neural activity while video tracking measures the wrist and shoulder during each reach." },
            { title: "Simplify", body: <>Activity is counted in 30-millisecond windows and compressed with <Term def="Principal component analysis: finds the few combined activity patterns that capture most of the variation across many channels.">PCA</Term> into a dozen main patterns.</> },
            { title: "Line up the days", body: <>Because each day&apos;s recording is slightly different, the main patterns of two days are aligned with <Term def="Canonical correlation analysis: rotates two sets of signals so that their shared structure lines up as closely as possible.">CCA</Term> before decoding.</> },
            { title: "Decode", body: <>A <Term def="A decoder that combines what the neural activity says right now with a prediction of where the hand should be, given where it just was. It is widely used in brain–computer interfaces.">Kalman filter</Term> predicts the wrist position moment by moment.</> },
            { title: "Score both directions", body: "Accuracy is the correlation between predicted and real position (1 = perfect, 0 = no relationship). The key number is the gap: reverse accuracy minus forward accuracy." },
          ]}
        />
      </Section>

      <Section eyebrow="What I found" title="Every pair of days points the same way">
        <p>
          The first analysis compared every &ldquo;before&rdquo; day with every &ldquo;after&rdquo; day. After the new training, the decoder
          learned on the later day almost always worked better on the earlier day than the other way round — in 38 of 42 day pairs. In the
          control without a task in between, the two directions were mixed: 5 of 9 pairs, with no reliable difference.
        </p>
      </Section>

      <Figure
        label="Result · original analysis, public data"
        caption={
          <>
            Each thin line is one pair of recording days; the thick line is the average. Original full-reach analysis with a fixed number of trials
            per day (40 in the training condition, 31 in the control). In this analysis the difference between the two conditions was itself still
            uncertain, which motivated the stricter replication below. Data:{" "}
            <a className="underline" href={`${REPO}/blob/main/Results/current/comparisons/interference_vs_forget/tables/paired_directional_cells.csv`}>paired_directional_cells.csv</a>.
          </>
        }
      >
        <PairSlopes />
      </Figure>

      <Section eyebrow="Replication" title="A second animal, a stricter protocol">
        <p>
          I then rebuilt the analysis with a fixed time window and the same small number of trials for every day, so all three groups could
          be compared fairly, and added a second animal. Both trained animals show the same direction; the control does not.
        </p>
      </Section>

      <Figure
        label="Result · published snapshot"
        caption={
          <>
            Gap = accuracy (reverse) − accuracy (forward); dots are estimates and bars are 95% intervals across pairs of recording days,
            using a common 28-trial-per-day protocol. Day pairs: TS 14 × 3, TY 11 × 3, control 3 × 3. Source:{" "}
            <a className="underline" href={`${REPO}/blob/main/HANDOFF.md`}>public results handoff</a>.
          </>
        }
      >
        <GapChart />
      </Figure>

      <Section eyebrow="Digging deeper" title="Not just “the brain got noisier”">
        <p>
          A tempting explanation is that activity after the new training is simply messier. To test that, I separated the two ingredients of
          every transfer: the <em>decoder</em> (learned before or after) and the <em>activity</em> it reads (from before or after). For every
          combination I measured how strongly the real neural activity pushes the decoder&apos;s output away from a calibrated reference —
          larger numbers mean the decoder is thrown around more.
        </p>
        <p>
          In both trained animals the big number sits in the same place: a decoder learned <em>before</em> reading activity from{" "}
          <em>after</em>. The after-training activity is not harmful in general — the decoder learned after reads it calmly. It is the
          specific combination that clashes. In the control without training, the clash moves to the opposite corner.
        </p>
      </Section>

      <Figure
        label="Result · input × readout"
        caption="Normalised output perturbation energy (common 28-trial protocol). This measures how much the prediction moves, not prediction error itself. Source: directional_input_readout_replication in the public results."
      >
        <InputReadoutGrids />
      </Figure>

      <Section eyebrow="Being my own critic" title="Explanations I tested">
        <p>
          Before believing an effect, I tried hard to explain it away. Each card is a separate analysis with its own controls.
        </p>
      </Section>
      <div className="-mt-6 mb-12"><ExplanationsTested /></div>

      <div className="mb-12 max-w-3xl">
        <Callout title="Why I call this a lead, not a discovery" tone="caution">
          Each animal has only three recording days after the in-between period, and day pairs share days, so they are not independent
          replicates. The control was recorded in a different year from the main experiment. One alternative, error-based analysis in
          animal TY points the other way, and in animal TS the gap disappears when only the last three &ldquo;before&rdquo; days are used. Many analyses were
          run on the same data. The honest summary is a reproducible pattern worth testing on new recordings with a pre-registered
          analysis — not an established mechanism.
        </Callout>
      </div>

      <Section eyebrow="Latest lead" title="What changes after training?">
        <p>
          The newest exploratory work looks at how activity on different electrodes moves together within a reach. In both trained animals,
          that shared structure appears stronger after the training than before, and it survives removing overall activity levels and the
          measured wrist movement. It is still exploratory: one normalisation choice leaves the first animal uncertain, and recording
          limitations in the second animal remain.
        </p>
      </Section>

      <Section eyebrow="Scale" title="The work behind the result">
        <Numbers />
        <p>
          The latest replication also reproduced earlier numbers to within about 10⁻¹⁵ — floating-point precision — which is how I check
          that refactoring the code did not change the science.
        </p>
      </Section>

      <Section eyebrow="What I built" title="Skills behind the project">
        <SkillList
          groups={[
            { label: "Analysis", items: ["Cross-day Kalman decoding with PCA/CCA alignment", "Input × readout decomposition of transfer error", "Bootstrap intervals over crossed recording-day pairs", "Matching of neural and movement variability between days"] },
            { label: "Reproducibility", items: ["One command-line runner for every analysis", "Curated public results with source maps and SHA-256 checksums", "Integrity checks that run on a fresh clone without the raw data", "Written handoff documenting conclusions, caveats and open questions"] },
          ]}
        />
      </Section>

      <details className="card mb-10 p-4">
        <summary className="cursor-pointer text-sm font-semibold">For specialists: the original figures</summary>
        <div className="mt-4 space-y-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/research/marmoset/paired_directional.png" alt="Paired cross-epoch decoding directions for every R1/R2 session pair" className="w-full rounded bg-white" loading="lazy" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/research/marmoset/directional_replication_main.png" alt="Input × readout replication under a common trial budget" className="w-full rounded bg-white" loading="lazy" />
          <p className="text-xs text-zinc-500">
            From the public repository, unmodified. Definitions, protocols and every caveat are in the{" "}
            <a className="underline" href={`${REPO}/blob/main/Reports/current/mechanism_handoff.md`}>scientific handoff</a>.
          </p>
        </div>
      </details>

      <div className="flex flex-wrap gap-3 text-sm">
        <a href={project.repo} className="rounded border border-zinc-300 px-4 py-2 font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800">Code and results on GitHub →</a>
        <Link href="/tool" className="rounded border border-zinc-300 px-4 py-2 font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800">Explore the idea in NeuroDrift →</Link>
      </div>

      <NextProject current={project.slug} />
    </article>
  );
}
