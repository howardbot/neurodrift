import Link from "next/link";
import { GuideHero, NextGuide } from "@/components/learn/GuideBits";
import { SignalChainDemo } from "@/components/learn/SignalChainDemo";
import { Callout, Figure, Section, Steps, Term } from "@/components/showcase/Story";
import { guideBySlug } from "@/content/learn";

const guide = guideBySlug("signal-chain");
export const metadata = { title: "Spike to dataset", description: guide.hook };

export default function SignalChainGuide() {
  return (
    <article className="mx-auto max-w-5xl py-6">
      <GuideHero guide={guide} />

      <Section eyebrow="The starting point" title="One wire, many voices">
        <p>
          An electrode in the brain reports a single number many thousands of times per second: the voltage at its tip. That one wiggly
          line mixes the slow <Term id="local-field-potential">local field potential</Term>, the sharp{" "}
          <Term id="spikes">spikes</Term> of a few nearby neurons, and electrical noise. Before any science can happen, it has to be turned
          into something cleaner: which neuron fired, and when.
        </p>
        <p>
          The demo below runs that whole process on a simulated recording of two neurons. Because it is a simulation, we know the truth, so
          you can see exactly what each choice costs. Try raising the noise, or moving the threshold, and watch the hits, misses and false
          alarms change.
        </p>
      </Section>

      <Figure
        label="Interactive · simulated recording, two neurons"
        caption="One second of synthetic data sampled 10,000 times per second. Filters here are simple moving averages and the noise threshold uses the median-based estimate of Quiroga, Nadasdy & Ben-Shaul (2004); real pipelines use sharper filters and more features, but the logic is the same."
      >
        <SignalChainDemo />
      </Figure>

      <Section eyebrow="In plain words" title="What each step does">
        <Steps
          items={[
            { title: "Filter", body: "Split the recording into a slow band (below a few hundred hertz) and a fast band (spikes). The slow band is useful in its own right; the fast band goes on to spike detection." },
            { title: "Estimate the noise", body: "Measure how big the background wobble is, using the median so that the spikes themselves do not inflate the estimate." },
            { title: "Detect", body: "Mark every dip deeper than a few times the noise level. A lower threshold catches more real spikes but also more noise; a higher one is cleaner but misses small neurons." },
            { title: "Cut and describe", body: "Copy a couple of milliseconds around each detection and summarise its shape with a few numbers, such as how deep and how wide it is." },
            { title: "Sort", body: <><Term id="spike-sorting">Spike sorting</Term> groups similar shapes, ideally one group per neuron. Real sorters such as Kilosort use every recording channel and learned waveform templates instead of two numbers.</> },
            { title: "Count", body: <>Count each neuron&apos;s spikes in short time bins. The resulting table — neurons by time — is what a <Term id="decoder">decoder</Term> reads.</> },
          ]}
        />
      </Section>

      <div className="mb-12 max-w-3xl">
        <Callout title="Where the judgement calls hide" tone="caution">
          Every step involves a choice, and errors flow downstream: a threshold set too high silently removes quiet neurons, and two
          neurons merged into one cluster look like a single cell with odd tuning. That is why I compared manual and automated sorting in
          the{" "}
          <Link href="/research/spike-sorting" className="font-medium text-accent-600 hover:underline dark:text-accent-300">spike-sorting project</Link>.
        </Callout>
      </div>

      <Section eyebrow="What comes next" title="From a table of counts to a decoder">
        <p>
          The binned table at the end of the demo is exactly the kind of data NeuroDrift works with (stored with time bins as rows and neurons as columns). Paired
          with what the animal was doing in each bin, it is enough to train a decoder — and to ask, as the{" "}
          <Link href="/research/cross-day-decoding" className="font-medium text-accent-600 hover:underline dark:text-accent-300">cross-day decoding</Link>{" "}
          project does, whether that decoder still works tomorrow. You can try that yourself with the{" "}
          <Link href="/tool" className="font-medium text-accent-600 hover:underline dark:text-accent-300">NeuroDrift tool</Link>.
        </p>
      </Section>

      <NextGuide current={guide.slug} />
    </article>
  );
}
