import Link from "next/link";
import { CrossDayDesign, GapChart } from "@/components/showcase/MarmosetFigures";
import { Callout, Figure, NextProject, ProjectHero, Section, SkillList, Steps, Term } from "@/components/showcase/Story";
import { projectBySlug } from "@/content/research";

const project = projectBySlug("cross-day-decoding");
export const metadata = { title: project.title };

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
            { title: "Simplify", body: <>Activity is counted in short time windows and compressed with <Term def="Principal component analysis: finds the few combined activity patterns that capture most of the variation across many channels.">PCA</Term> into a dozen main patterns.</> },
            { title: "Line up the days", body: <>Because each day&apos;s recording is slightly different, the main patterns of two days are aligned with <Term def="Canonical correlation analysis: rotates two sets of signals so that their shared structure lines up as closely as possible.">CCA</Term> before decoding.</> },
            { title: "Decode", body: <>A <Term def="A decoder that combines what the neural activity says right now with a prediction of where the hand should be, given where it just was. It is widely used in brain–computer interfaces.">Kalman filter</Term> predicts the wrist position moment by moment.</> },
            { title: "Score both directions", body: "Accuracy is the correlation between predicted and real position. The key number is the gap: reverse accuracy minus forward accuracy." },
          ]}
        />
      </Section>

      <Section eyebrow="What I found" title="An asymmetry that follows the new training">
        <p>
          In both animals that trained on a second task, decoders transferred better in reverse than forward. In the control without a
          task in between, the gap pointed the other way, and its uncertainty range includes zero.
        </p>
      </Section>

      <Figure
        label="Result · published snapshot"
        caption={
          <>
            Gap = Pearson correlation (reverse) − Pearson correlation (forward); dots are estimates and bars are 95% intervals across
            pairs of recording days, using a common 28-trial-per-day protocol. Day pairs: TS 14 × 3, TY 11 × 3, control 3 × 3. Source:{" "}
            <a className="underline" href="https://github.com/howardbot/Marmoset_Decoding_Public/blob/main/HANDOFF.md">public results handoff</a>.
          </>
        }
      >
        <GapChart />
      </Figure>

      <div className="mb-12 max-w-3xl">
        <Callout title="Why I call this a lead, not a discovery" tone="caution">
          Each animal has only three recording days after the in-between period, and day pairs share days, so they are not independent
          replicates. The control was recorded in a different year from the main experiment. One alternative, error-based analysis in
          animal TY points the other way. Many analyses were run on the same data. The honest summary is a reproducible pattern worth
          testing on new recordings with a pre-registered analysis — not an established mechanism.
        </Callout>
      </div>

      <Section eyebrow="What I built" title="Skills behind the project">
        <SkillList
          groups={[
            { label: "Analysis", items: ["Cross-day Kalman decoding with PCA/CCA alignment", "Matching of neural and movement variability between days", "Bootstrap intervals over crossed recording-day pairs", "More than twenty control analyses: posture, trial count, regularisation, slow drift, alignment, population composition"] },
            { label: "Reproducibility", items: ["One command-line runner for every analysis", "Curated public results with source maps and SHA-256 checksums", "Integrity checks that run on a fresh clone without the raw data", "Written handoff documenting conclusions, caveats and open questions"] },
          ]}
        />
      </Section>

      <div className="flex flex-wrap gap-3 text-sm">
        <a href={project.repo} className="rounded border border-zinc-300 px-4 py-2 font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800">Code and results on GitHub →</a>
        <Link href="/tool" className="rounded border border-zinc-300 px-4 py-2 font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800">Explore the idea in NeuroDrift →</Link>
      </div>

      <NextProject current={project.slug} />
    </article>
  );
}
