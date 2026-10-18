import Link from "next/link";
import { ClusterCutter } from "@/components/learn/ClusterCutter";
import { GuideHero, NextGuide, Timeline } from "@/components/learn/GuideBits";
import { SortingChooser } from "@/components/learn/SortingChooser";
import { SortingEras } from "@/components/learn/SortingEras";
import { Callout, Figure, Section, Steps, Term } from "@/components/showcase/Story";
import { SORTING_TIMELINE, guideBySlug } from "@/content/learn";

const guide = guideBySlug("sorting-methods");
export const metadata = { title: "Spike sorting", description: guide.hook };

const linkClass = "font-medium text-accent-600 hover:underline dark:text-accent-300";

export default function SortingMethodsGuide() {
  return (
    <article className="mx-auto max-w-5xl py-6">
      <GuideHero guide={guide} />

      <Section eyebrow="The problem" title="Several voices on one microphone">
        <p>
          An electrode in the brain picks up spikes from every neuron near its tip. Each neuron&apos;s spikes have their own size and shape,
          because the neuron sits at its own distance and angle from each recording site. <Term id="spike-sorting">Spike sorting</Term> uses
          those differences to work out which neuron fired each spike.
        </p>
        <p>
          The{" "}
          <Link href="/learn/signal-chain" className={linkClass}>
            spike-to-dataset guide
          </Link>{" "}
          shows where sorting fits in a recording pipeline. This one is about how it is done. Start the way researchers did for decades: by
          hand.
        </p>
      </Section>

      <Figure
        label="Interactive · sort like it's 1995"
        caption="Simulated spikes from three neurons plus background activity from distant cells, recorded on two neighbouring wires of a tetrode. Real sorters use the full waveform on every channel, not just two heights."
      >
        <ClusterCutter />
      </Figure>

      <Section eyebrow="Sixty years in one chart" title="Six approaches, all still in use">
        <p>
          New methods did not replace old ones; they added options. A lab recording one neuron on one wire may still set a window by eye, while
          a lab with a <Term id="neuropixels">Neuropixels</Term> probe runs software overnight on a graphics card. What changed most was the
          number of channels, which grew from one to thousands.
        </p>
      </Section>

      <Figure label="Timeline · when each approach appeared" caption="Each bar starts when an approach appeared or became common and runs to today. Time before 2000 is compressed.">
        <SortingEras />
      </Figure>

      <div className="mb-12 max-w-3xl">
        <Timeline events={SORTING_TIMELINE} />
      </div>

      <Section eyebrow="Choosing" title="How do people pick a method?">
        <p>Mostly by answering five questions.</p>
        <Steps
          items={[
            {
              title: "What is the electrode?",
              body: (
                <>
                  A single wire or <Term id="tetrodes">tetrode</Term> sees a handful of neurons, so hand sorting or clustering works. A{" "}
                  <Term id="utah-array">Utah array</Term> has one site per needle, so neighbours are hard to separate. Dense probes spread
                  each spike over many sites, which suits <Term id="template-matching">template matching</Term>.
                </>
              ),
            },
            { title: "What is the question?", body: "Claims about single neurons, such as what one cell responds to, need careful sorting. Questions about the population as a whole often do not." },
            { title: "Live or afterwards?", body: "During an experiment there is only time for simple rules. Afterwards, software can look at the whole recording at once." },
            {
              title: "Does the electrode move?",
              body: (
                <>
                  <Term id="electrode-drift">Drift</Term> slowly changes how each neuron&apos;s spikes look. Recent sorters such as{" "}
                  <Term id="kilosort-4">Kilosort 4</Term> estimate and undo it first.
                </>
              ),
            },
            { title: "How much checking is affordable?", body: "Every method makes mistakes. Hand sorting takes hours per recording; automated sorting takes minutes, plus time to review its output." },
          ]}
        />
      </Section>

      <Figure label="Interactive · method chooser" caption="A summary of common practice, not a rulebook: labs often combine approaches, for example decoding threshold crossings live and sorting the same recording carefully afterwards.">
        <SortingChooser />
      </Figure>

      <Section eyebrow="A shortcut" title="Do brain–computer interfaces even sort?">
        <p>
          Usually not. A <Term id="brain-computer-interface">brain–computer interface</Term> has to work in real time, every day, while the
          neurons near each needle slowly change. So most clinical systems feed <Term id="threshold-crossings">threshold crossings</Term>{" "}
          straight into the <Term id="decoder">decoder</Term>.
        </p>
        <p>
          It costs surprisingly little. In 2009, Fraser and colleagues in Andrew Schwartz&apos;s lab showed good BCI control without sorting;
          later studies found only small differences in decoding, and in 2019 Krishna Shenoy&apos;s lab showed that the population&apos;s
          patterns come out almost the same. Both labs are on the{" "}
          <Link href="/learn/family-tree" className={linkClass}>
            family tree
          </Link>
          .
        </p>
      </Section>

      <Section eyebrow="Checking the answer" title="How do you know sorting worked?">
        <Steps
          items={[
            { title: "Ground truth", body: "Record a neuron from inside (so every spike is known) and outside at the same time, then see whether the sorter finds the same spikes. Harris and colleagues did this for tetrodes in 2000." },
            { title: "Known answers", body: "Add simulated spikes to a real recording, or simulate the whole thing, and score sorters against the answer. SpikeForest publishes such scores for many sorters." },
            { title: "Sanity checks", body: "A neuron cannot fire twice within about a millisecond, so too many very short gaps mean two neurons were merged. Clusters should also stay well separated from their neighbours." },
            { title: "Does it behave like a neuron?", body: "A real visual neuron responds to one patch of the visual field. A unit whose responses look scattered may be a mixture." },
          ]}
        />
      </Section>

      <div className="mb-12 max-w-3xl">
        <Callout title="From my own work">
          In the{" "}
          <Link href="/research/spike-sorting" className={linkClass}>
            spike-sorting project
          </Link>{" "}
          I compared careful manual sorting with Kilosort 4 on the same recordings, judging each unit by its receptive field and spike shape.
        </Callout>
      </div>

      <NextGuide current={guide.slug} />
    </article>
  );
}
