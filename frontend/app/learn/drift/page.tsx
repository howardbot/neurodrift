import Link from "next/link";
import { DriftLab } from "@/components/learn/DriftLab";
import { GuideHero, NextGuide } from "@/components/learn/GuideBits";
import { Callout, Figure, Section, Steps, Term } from "@/components/showcase/Story";
import { guideBySlug } from "@/content/learn";

const guide = guideBySlug("drift");
export const metadata = { title: "Why decoders break", description: guide.hook };

const linkClass = "font-medium text-accent-600 hover:underline dark:text-accent-300";

export default function DriftGuide() {
  return (
    <article className="mx-auto max-w-5xl py-6">
      <GuideHero guide={guide} />

      <Section eyebrow="The problem" title="Monday's decoder, Tuesday's brain">
        <p>
          A <Term id="decoder">decoder</Term> learns which channels fire for which movements. But the brain is soft and the electrode is not.
          Every heartbeat and breath nudges the tissue by micrometres, scar tissue slowly forms around the implant, some neurons fall
          silent and others drift into range. This <Term id="electrode-drift">drift</Term> means a channel that heard neuron A last week may
          hear neuron B today.
        </p>
        <p>
          For a <Term id="brain-computer-interface">brain–computer interface</Term> user, that means a cursor that gets a little worse every day
          until the system is recalibrated, often with a practice session before each use.
        </p>
      </Section>

      <Figure
        label="Interactive · a month on one array"
        caption="A simulation: 64 channels record reaches in eight directions. Each channel's neuron is replaced after a random number of days (16 on average) and the others change strength. The underlying patterns change only slightly, so alignment works well here; in real recordings it helps a lot but not perfectly."
      >
        <DriftLab />
      </Figure>

      <Section eyebrow="The trick" title="The neurons change; the patterns don't">
        <p>
          Motor cortex has millions of neurons, but during a movement they act together in a handful of coordinated patterns, sometimes called
          a <Term id="neural-manifold">neural manifold</Term>. An electrode samples a few of those neurons; a different few still reveal the
          same patterns, just mixed differently. In 2020, Juan Gallego, Lee Miller and colleagues showed that these patterns stay stable for
          months to years, even as the recorded neurons turn over.
        </p>
        <Steps
          items={[
            { title: "Find each day's main patterns", body: <><Term id="pca">PCA</Term> compresses the 64 channels into the few patterns that capture most of the activity.</> },
            { title: "Line them up with day 0", body: <><Term id="cca">CCA</Term> finds the rotation and stretch that best matches today&apos;s patterns to the original ones, using the average activity for each reach direction.</> },
            { title: "Reuse the old decoder", body: "Once aligned, today's patterns go through the decoder trained on day 0. No new labelled practice session is needed." },
          ]}
        />
      </Section>

      <Section eyebrow="Other fixes" title="How labs keep BCIs working">
        <p>
          Alignment is one of several strategies. Some systems recalibrate quietly in the background, using what the person was evidently
          trying to do while they type. Others train on months of data so the decoder learns to ignore day-to-day changes, or align the
          patterns with more flexible, non-linear methods. In 2020, Alan Degenhart, Byron Yu and colleagues showed that aligning patterns could
          keep a BCI working in monkeys as the recorded neurons changed.
        </p>
      </Section>

      <div className="mb-12 max-w-3xl">
        <Callout title="In my research">
          The{" "}
          <Link href="/research/cross-day-decoding" className={linkClass}>
            cross-day decoding project
          </Link>{" "}
          tests this idea on marmoset motor cortex with PCA, CCA and a Kalman filter, and{" "}
          <Link href="/tool" className={linkClass}>
            NeuroDrift
          </Link>{" "}
          is the tool I built to measure how far decoders and patterns drift between sessions.
        </Callout>
      </div>

      <NextGuide current={guide.slug} />
    </article>
  );
}
