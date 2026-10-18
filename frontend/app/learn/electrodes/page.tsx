import Link from "next/link";
import { ElectrodeExplorer } from "@/components/learn/ElectrodeExplorer";
import { ChannelGrowthChart, GuideHero, NextGuide, Timeline } from "@/components/learn/GuideBits";
import { CountUp, Reveal } from "@/components/motion";
import { Callout, Figure, Section, Term } from "@/components/showcase/Story";
import { guideBySlug, TIMELINE } from "@/content/learn";

const guide = guideBySlug("electrodes");
export const metadata = { title: "Electrodes", description: guide.hook };

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <Reveal className="card p-4">
      <div className="font-mono text-2xl font-semibold tracking-tight">
        <CountUp value={value} />
      </div>
      <div className="mt-1 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">{label}</div>
    </Reveal>
  );
}

export default function ElectrodesGuide() {
  return (
    <article className="mx-auto max-w-5xl py-6">
      <GuideHero guide={guide} />

      <Section eyebrow="The problem" title="Whispers in salt water">
        <p>
          Neurons signal with tiny electrical pulses called <Term id="spikes">spikes</Term>. Measured from inside a cell, a spike is a swing
          of about a tenth of a volt. Measured from just outside, in the salty fluid around the cell, it shrinks to a few hundred
          millionths of a volt — and every neighbouring cell is whispering at the same time.
        </p>
        <p>
          An electrode is simply a conductor placed somewhere in that fluid, wired to an amplifier. Where you put it decides what you hear:
          far away, you hear the crowd; close up, you hear individuals; inside a cell, you hear one voice in perfect detail. Every design
          below is a different answer to the same trade-off between <em>how much detail</em> and <em>how invasive</em>.
        </p>
      </Section>

      <div className="mb-12 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat value="86" label="billion neurons in a human brain — and every one of them signals electrically" />
        <Stat value="100" label="needles on a Utah array, the sensor in most human brain–computer interface trials" />
        <Stat value="5,120" label="recording sites on one Neuropixels 2.0 probe, four shanks thinner than a hair" />
        <Stat value="7" label="years for the number of neurons we can record at once to double, roughly" />
      </div>

      <Section eyebrow="Seven ways to listen" title="From the scalp to the inside of a single cell">
        <p>
          Pick an electrode below, or click one in the drawing. The dashed outline shows roughly which neurons it hears, and the trace shows
          a simulated example of what it records. From the outside in: <Term id="eeg">EEG</Term>, <Term id="ecog">ECoG</Term>, a stent in a
          blood vessel, the <Term id="utah-array">Utah array</Term>, <Term id="tetrodes">tetrodes</Term>,{" "}
          <Term id="neuropixels">Neuropixels</Term> probes and the <Term id="patch-clamp">patch pipette</Term>.
        </p>
      </Section>

      <Figure
        label="Interactive · electrode explorer"
        caption="Schematic, not to scale: in reality the skull is opened for every electrode below the dura, and the cortex is only about 2.5 mm thick. Traces are simulated to show the character of each signal, not recorded data."
      >
        <ElectrodeExplorer />
      </Figure>

      <Section eyebrow="Two signals in one wire" title="Spikes and the field potential">
        <p>
          An electrode inside the brain picks up two things at once. Fast, sharp spikes come from the few neurons closest to its tip. Under
          them runs a slower wave, the <Term id="local-field-potential">local field potential</Term>, which mostly reflects the inputs
          arriving at thousands of neurons nearby. Researchers separate the two with filters — the{" "}
          <Link href="/learn/signal-chain" className="font-medium text-accent-600 underline-offset-2 hover:underline dark:text-accent-300">next guide</Link>{" "}
          walks through that step by step.
        </p>
      </Section>

      <Section eyebrow="History" title="Two centuries of listening in">
        <p>Each step moved the electrode closer to individual neurons, or let it hear more of them at once.</p>
      </Section>
      <div className="-mt-6 mb-12 max-w-3xl">
        <Timeline events={TIMELINE} />
      </div>

      <Section eyebrow="More channels" title="A Moore's law for neuroscience">
        <p>
          In 2011, Ian Stevenson and Konrad Kording counted how many neurons studies had recorded at the same time since the 1950s and found
          the number doubling roughly every seven years. The number of contacts on a single device has grown even faster. More channels do
          not automatically mean more neurons, though: a Neuropixels probe has thousands of sites but can switch only 384 of them on at once.
        </p>
      </Section>

      <Figure
        label="Recording sites per device · log scale"
        caption="Filled dots: recording sites on one device. Hollow dots: channels recorded at the same time, where fewer than the sites. Dashed line: the seven-year doubling that Stevenson & Kording (2011) reported for simultaneously recorded neurons, drawn from a single electrode in 1957. Neuralink's figure is from its 2019 report in rats."
      >
        <ChannelGrowthChart />
      </Figure>

      <Section eyebrow="Not wires at all" title="Other ways to watch the brain">
        <p>
          Electrodes are not the only option. Functional MRI tracks blood flow that follows neural activity, seconds behind it. MEG
          measures the tiny magnetic fields of large neuron populations from outside the head. Calcium imaging makes neurons glow when they
          fire, so a microscope can watch thousands at once in animals. Each trades speed, detail and reach differently, which is why most
          discoveries combine several.
        </p>
      </Section>

      <div className="mb-12 max-w-3xl">
        <Callout title="Where my work fits">
          My projects use several of these. The CIP and V3A recordings and the{" "}
          <Link href="/research/spike-sorting" className="font-medium text-accent-600 hover:underline dark:text-accent-300">spike-sorting comparison</Link>{" "}
          use tetrodes; the{" "}
          <Link href="/research/cross-day-decoding" className="font-medium text-accent-600 hover:underline dark:text-accent-300">cross-day decoding</Link>{" "}
          project reads movement from electrodes implanted in marmoset motor cortex — the same idea behind a{" "}
          <Term id="brain-computer-interface">brain–computer interface</Term>. In the Hai Lab I characterise miniature neural devices with
          automated radio-frequency measurements.
        </Callout>
      </div>

      <NextGuide current={guide.slug} />
    </article>
  );
}
