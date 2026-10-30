import Link from "next/link";
import { BciSitesByArea, BrainMap } from "@/components/learn/BrainMap";
import { BrainSizes } from "@/components/learn/BrainSizes";
import { GuideHero, NextGuide } from "@/components/learn/GuideBits";
import { Callout, Figure, Section, Steps, Term } from "@/components/showcase/Story";
import { BCI_SITES, BCI_SITES_CHECKED } from "@/content/bciToday";
import { guideBySlug } from "@/content/learn";

const guide = guideBySlug("brain-map");
export const metadata = { title: "Brain map", description: guide.hook };

const checked = new Date(`${BCI_SITES_CHECKED}T12:00:00Z`).toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
const link = "font-medium text-accent-600 hover:underline dark:text-accent-300";

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
          The map below shows twenty-one of them, from the areas my projects record from to the ones brain–computer interfaces (BCIs) are
          implanted in. Click an area or its button to see what it does; switch on the body map, the structures hidden beneath the surface,
          or a route a signal takes through the brain. The dots mark where BCI programs place their electrodes.
        </p>
      </Section>

      <Figure
        label="Interactive · brain map"
        caption="A schematic primate brain seen from the left, front to the left. Shapes and positions are approximate; several areas, including V3A, CIP and A1, lie largely inside folds and would not be visible on the real surface, and deep structures are drawn where they would sit beneath it. BCI dots are approximate implant sites from the sources listed below. Marmoset brains have the same areas but almost no folds."
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
          recognising what things are. Switch on &ldquo;Seeing → knowing what&rdquo; on the map to compare them. Real brains blur the line, but the idea
          still organises much of vision research.
        </p>
      </Section>

      <Section eyebrow="A body on the brain" title="The map inside the motor strip">
        <p>
          Switch on the body map. Along the motor strip (M1) and the touch strip just behind it (S1), the body is laid out in order: legs at
          the top, then arm, hand, face and, lowest of all, mouth and throat. In the 1930s and 1940s the neurosurgeon Wilder Penfield charted
          this map by gently stimulating the exposed cortex of awake patients during epilepsy surgery. Drawn to scale, it becomes the
          homunculus, a little figure with huge hands and lips, because the parts we control most finely get the most cortex.
        </p>
        <p>
          The map largely survives paralysis. Years after a spinal cord injury, or with ALS, trying to move a hand still activates the hand
          area. That is why most BCIs record here: the hand area for cursors and robotic arms, the leg area for walking, and the face and
          mouth area for speech.
        </p>
      </Section>

      <Section eyebrow="From hearing to speaking" title="Two famous areas, and a messier truth">
        <p>
          In the 1860s and 1870s Paul Broca and Carl Wernicke linked producing language and understanding it to two areas, usually in the
          left hemisphere, joined by a bundle of fibres, the arcuate fasciculus. Switch on &ldquo;Hearing → speaking&rdquo; to follow the
          classic route: sound reaches the auditory cortex, is understood around Wernicke&apos;s area, and is turned into speech through
          Broca&apos;s area and the speech motor cortex.
        </p>
        <p>
          The modern picture is a wider network, with two streams for speech much like the two for vision. BCIs have added evidence of their
          own: in 2023 a Stanford team found that arrays in area 44, part of Broca&apos;s area, carried little information about the
          movements of speaking, while arrays in the neighbouring speech motor cortex carried a lot. Speech BCIs now record mainly
          there, with <Term id="utah-array">Utah arrays</Term> or <Term id="ecog">ECoG</Term> sheets, and a Caltech team has found signals of
          imagined words in the supramarginal gyrus.
        </p>
      </Section>

      <Section eyebrow="Beneath the surface" title="Deep structures, and the first implants that listened">
        <p>
          Some of the most important parts of the brain cannot be seen from the outside. The thalamus relays the senses to the cortex, the
          basal ganglia help choose which movements to make, the hippocampus forms new memories and the amygdala flags what matters
          emotionally. Switch on &ldquo;Deep structures&rdquo; to see roughly where they lie.
        </p>
        <p>
          Implants were reaching these regions long before BCIs moved cursors. <Term id="deep-brain-stimulation">Deep brain stimulation</Term>{" "}
          has treated Parkinson&apos;s disease and tremor since the 1990s, but for most of that time it only stimulated. Newer devices also
          listen: a responsive neurostimulator watches for the start of a seizure and answers it, and since 2025 an adaptive DBS system
          adjusts its own stimulation from the brain&apos;s signals. These are brain–computer interfaces in a broad sense: they read the brain
          and act on what they read.
        </p>
      </Section>

      <Section eyebrow="Where BCIs listen" title={`${BCI_SITES.length} programs, area by area`}>
        <p>
          Most implanted BCIs sit in a few places: the hand, leg and speech parts of the motor strip, where intended movements are still
          clear after paralysis; the touch strip, to send sensation back; the visual cortex, to give blind people some sight; and deep
          structures, for therapy. A few programs record from planning areas in the parietal lobe instead, which carry the goal of a
          movement rather than its details.
        </p>
        <p className="text-sm text-zinc-500">
          Results as reported in each source; checked {checked}. The{" "}
          <Link href="/learn/bcis-today" className={link}>
            BCIs today
          </Link>{" "}
          guide follows the companies in more detail.
        </p>
      </Section>

      <div className="mb-12">
        <BciSitesByArea />
      </div>

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
