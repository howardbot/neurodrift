import Link from "next/link";
import { BrainMap } from "@/components/learn/BrainMap";
import { BrainSizes } from "@/components/learn/BrainSizes";
import { GuideHero, NextGuide } from "@/components/learn/GuideBits";
import { Callout, Figure, Section, Steps, Term } from "@/components/showcase/Story";
import { guideBySlug } from "@/content/learn";

const guide = guideBySlug("brain-map");
export const metadata = { title: "Brain map", description: guide.hook };

export default function BrainMapGuide() {
  return (
    <article className="mx-auto max-w-5xl py-6">
      <GuideHero guide={guide} />

      <Section eyebrow="A map, not a mess" title="Different jobs in different places">
        <p>
          The outer layer of the brain, the cortex, is a sheet a few millimetres thick, crumpled to fit inside the skull. It is not uniform:
          neighbouring patches of it do different jobs. Neuroscientists name these patches — V1, V3A, M1 — and find them using landmarks
          such as the grooves in the folded surface, each called a <Term id="sulcus">sulcus</Term>.
        </p>
        <p>
          Click an area on the map, or step along the route, to see what each one does and which of my projects record from it.
        </p>
      </Section>

      <Figure
        label="Interactive · brain map"
        caption="A schematic primate brain seen from the left, front to the left. Shapes and positions are approximate; several areas, including V3A and CIP, lie largely inside folds and would not be visible on the real surface. Marmoset brains have the same areas but almost no folds."
      >
        <BrainMap />
      </Figure>

      <Section eyebrow="From seeing to doing" title="Following one signal through the brain">
        <p>
          Imagine reaching for a tilted cup. Light from the cup reaches your eyes, and a chain of areas along the{" "}
          <Term id="dorsal-stream">dorsal stream</Term> turns it into a movement. The chain is a simplification — every area talks to many
          others, and signals flow back as well as forward — but it is a useful way to see where my projects sit.
        </p>
        <Steps
          items={[
            { title: "V1 · see edges", body: "The image is broken down into edges and contours, and the two eyes' views are compared for the first time." },
            { title: "V3A · build depth", body: <>Differences between the two eyes&apos; images (<Term id="binocular-disparity">binocular disparity</Term>) are turned into the 3D layout of the scene.</> },
            { title: "CIP · surface orientation", body: <>Depth cues are combined into how the surface tilts. My projects record from <Term id="v3a">V3A</Term> and <Term id="cip">CIP</Term> at the same time to ask how their activity is shared.</> },
            { title: "Premotor cortex · plan", body: "The movement is planned: which way to reach and how to shape the hand." },
            { title: "M1 · act", body: <>Commands go to the spinal cord and the arm moves. This is where a <Term id="brain-computer-interface">brain–computer interface</Term> can read the intended movement, as in my cross-day decoding project.</> },
          ]}
        />
      </Section>

      <Section eyebrow="Two routes" title="“Where and how” versus “what”">
        <p>
          In the 1980s and 1990s, researchers proposed that vision splits into two broad streams. One runs up into the parietal lobe and is
          about space and action — where things are and how to interact with them. The other runs down into the temporal lobe and is about
          recognising what things are. Switch on the &ldquo;what&rdquo; route on the map to compare them. Real brains blur the line, but the idea
          still organises much of vision research.
        </p>
      </Section>

      <Section eyebrow="Same plan, different sizes" title="Three brains, drawn to scale">
        <p>
          My projects use recordings from monkeys, and the cross-day decoding work uses marmosets. Their brains are much smaller than ours
          but are built on the same plan, with the same areas in roughly the same places — which is what lets recordings in animals teach
          us about human brains, and guide brain–computer interfaces for people.
        </p>
      </Section>

      <Figure label="Size comparison · width proportional to the cube root of brain mass" caption="Neuron counts: human from Azevedo et al. (2009); macaque and marmoset from Herculano-Houzel et al. (2007). Masses are typical adult values, rounded.">
        <BrainSizes />
      </Figure>

      <Section eyebrow="Aiming an electrode" title="How do researchers know where they are recording?">
        <p>
          Before an implant, brain scans show where the target area lies relative to the skull and to landmarks such as sulci. During
          recording, the neurons themselves confirm the location: in visual areas, for example, the patch of the visual field each neuron
          responds to shifts in a predictable way as the electrode moves. After an experiment, examining the tissue can confirm the
          electrode tracks.
        </p>
      </Section>

      <div className="mb-12 max-w-3xl">
        <Callout title="Where my recordings come from">
          <Link href="/research/shared-variability" className="font-medium text-accent-600 hover:underline dark:text-accent-300">Shared variability</Link>{" "}
          and{" "}
          <Link href="/research/3d-vision" className="font-medium text-accent-600 hover:underline dark:text-accent-300">seeing in 3D</Link>{" "}
          involve V3A and CIP;{" "}
          <Link href="/research/cross-day-decoding" className="font-medium text-accent-600 hover:underline dark:text-accent-300">decoding across days</Link>{" "}
          reads movement from marmoset motor cortex. The{" "}
          <Link href="/learn/electrodes" className="font-medium text-accent-600 hover:underline dark:text-accent-300">electrodes guide</Link>{" "}
          shows how such recordings are made.
        </Callout>
      </div>

      <NextGuide current={guide.slug} />
    </article>
  );
}
