import Link from "next/link";
import { DecoderPlayground } from "@/components/learn/DecoderPlayground";
import { GuideHero, NextGuide } from "@/components/learn/GuideBits";
import { Callout, Figure, Section, Steps, Term } from "@/components/showcase/Story";
import { guideBySlug } from "@/content/learn";

const guide = guideBySlug("decoders");
export const metadata = { title: "Decoders 101", description: guide.hook };

const linkClass = "font-medium text-accent-600 hover:underline dark:text-accent-300";

export default function DecodersGuide() {
  return (
    <article className="mx-auto max-w-5xl py-6">
      <GuideHero guide={guide} />

      <Section eyebrow="The job" title="From spikes to a moving cursor">
        <p>
          When you move your arm, neurons in motor cortex fire in a pattern that depends on the movement. Many have a favourite direction: a
          neuron might fire hardest when the hand moves up and to the left, and less for other directions. Scientists call this{" "}
          <Term id="tuning">tuning</Term>.
        </p>
        <p>
          A <Term id="decoder">decoder</Term> runs this in reverse. It takes the spike counts from the last fraction of a second and estimates
          the movement the person intended. In a <Term id="brain-computer-interface">brain–computer interface</Term>, that estimate moves a
          cursor or a robotic arm, many times a second.
        </p>
      </Section>

      <Figure
        label="Interactive · three decoders, one brain"
        caption="Simulated motor-cortex neurons with direction tuning and random, Poisson-like spiking. The simulated person always aims at the target from wherever their cursor is, as in a real closed-loop BCI. All three decoders were fitted to the same recorded training data."
      >
        <DecoderPlayground />
      </Figure>

      <Section eyebrow="Three ideas" title="How each decoder thinks">
        <Steps
          items={[
            {
              title: "Population vector (1986): let every neuron vote",
              body: "Each neuron votes for its favourite direction, more loudly the harder it fires, and the votes are added up. It needs no training beyond finding each neuron's favourite direction, but it assumes those favourites are spread evenly, and with few neurons they rarely are.",
            },
            {
              title: "Kalman filter (2000s): combine evidence with expectation",
              body: (
                <>
                  A <Term id="kalman-filter">Kalman filter</Term> keeps a running guess of the movement. Each moment it predicts how the hand
                  should be moving, given that real movements are smooth, then corrects that prediction by however much the spikes disagree. It
                  is the workhorse of clinical BCIs.
                </>
              ),
            },
            {
              title: "Neural network: learn the mapping from examples",
              body: "A small artificial network looks at the last few bins of spikes and outputs a velocity. It can learn mappings the others cannot, such as neurons that only fire above a threshold, but it needs more data. Recurrent networks now decode handwriting and speech.",
            },
          ]}
        />
      </Section>

      <Section eyebrow="Try this" title="Experiments with the playground">
        <Steps
          items={[
            { title: "Record only 10 neurons", body: "The population vector falls apart: with so few voters, some directions have nobody to speak for them. The Kalman filter copes better because it also relies on smooth movement." },
            { title: "Train on 30 seconds of data", body: "The network has too few examples to learn from and wobbles, while the simpler decoders, with far fewer numbers to fit, barely change." },
            { title: "Switch to target practice", body: "A target jumps every three seconds. Count how many each decoder reaches: small differences in accuracy add up to very different experiences for the person using them." },
          ]}
        />
      </Section>

      <Section eyebrow="The bigger picture" title="Real BCIs are a conversation">
        <p>
          In the playground the simulated person aims perfectly. Real people see the cursor and correct it, and over days their brains adapt to
          the decoder while engineers adapt the decoder to them. Researchers such as Jose Carmena and Amy Orsborn, both on the{" "}
          <Link href="/learn/family-tree" className={linkClass}>
            family tree
          </Link>
          , study this two-way learning.
        </p>
        <p>
          The other catch is time. A decoder fitted on Monday is often worse by Tuesday, because the recorded neurons change. The{" "}
          <Link href="/learn/drift" className={linkClass}>
            next guide
          </Link>{" "}
          shows why, and how it can be fixed.
        </p>
      </Section>

      <div className="mb-12 max-w-3xl">
        <Callout title="In my research">
          The{" "}
          <Link href="/research/cross-day-decoding" className={linkClass}>
            cross-day decoding project
          </Link>{" "}
          uses a Kalman filter to predict wrist position from marmoset motor cortex, and tests how well it carries over from one day to the next.
        </Callout>
      </div>

      <NextGuide current={guide.slug} />
    </article>
  );
}
