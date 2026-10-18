import Link from "next/link";
import { GuideHero, NextGuide } from "@/components/learn/GuideBits";
import { EyesDisparity, RandomDotStereogram } from "@/components/learn/StereoDemos";
import { Callout, Figure, Section, Steps, Term } from "@/components/showcase/Story";
import { guideBySlug } from "@/content/learn";

const guide = guideBySlug("seeing-3d");
export const metadata = { title: "Seeing in 3D", description: guide.hook };

const linkClass = "font-medium text-accent-600 hover:underline dark:text-accent-300";

export default function Seeing3dGuide() {
  return (
    <article className="mx-auto max-w-5xl py-6">
      <GuideHero guide={guide} />

      <Section eyebrow="Two eyes, two views" title="Each eye sees a slightly different picture">
        <p>
          Hold up a finger and close one eye, then the other: the finger jumps against the background. Your eyes are about 6 cm apart, so each
          sees the world from a slightly different place. The difference between the two images is called{" "}
          <Term id="binocular-disparity">binocular disparity</Term>, and the brain turns it into a sense of depth. In 1838 Charles Wheatstone
          showed this with the first stereoscope: two flat drawings, one per eye, that merged into one solid object.
        </p>
      </Section>

      <Figure
        label="Interactive · two eyes, one object"
        caption="Drag the dot. Dashed lines: both eyes look at the cross. Solid lines: where the object's image falls in each eye. Nearer than the cross gives crossed disparity; farther gives uncrossed."
      >
        <EyesDisparity />
      </Figure>

      <Section eyebrow="Depth without objects" title="A shape that exists only in the difference">
        <p>
          In 1960 Bela Julesz, an engineer at Bell Labs, made pairs of images out of random dots. Each image on its own is pure noise, but one
          patch is shifted slightly between the two. Viewed with both eyes, the patch floats in depth. Because there is no shape to recognise
          in either image, Julesz showed that the brain compares the eyes early, before it knows what it is looking at.
        </p>
      </Section>

      <Figure
        label="Interactive · random-dot stereogram"
        caption="About 7% of adults cannot see depth from disparity alone (Chopin et al., 2019), and many more find free viewing hard at first. The wiggle and one-eye views show what is going on without fusing the images."
      >
        <RandomDotStereogram />
      </Figure>

      <Section eyebrow="In the brain" title="Where disparity becomes depth">
        <Steps
          items={[
            {
              title: "V1: comparing the eyes",
              body: "Signals from the two eyes first meet in primary visual cortex. In 1967 Barlow, Blakemore and Pettigrew found neurons there, in cats, that fire most for a particular disparity; Poggio and Fischer found them in monkeys a decade later.",
            },
            {
              title: "V3A and CIP: from depth to surfaces",
              body: (
                <>
                  Further along the <Link href="/learn/brain-map" className={linkClass}>dorsal pathway</Link>, areas such as <Term id="v3a">V3A</Term> and{" "}
                  <Term id="cip">CIP</Term> combine many disparities into the 3D layout of surfaces: which way a tabletop tilts, or how a cup
                  curves. Try the tilted disc above: its disparity changes smoothly from one side to the other.
                </>
              ),
            },
            { title: "Action", body: "Those surface estimates guide the hand and eyes: reaching for the cup, or landing a step." },
          ]}
        />
      </Section>

      <Section eyebrow="Not just two eyes" title="The other depth cues">
        <p>
          Disparity is only one cue. Perspective, shading, texture getting finer with distance, objects hiding one another, and motion
          parallax (near things sliding past faster when you move) all work with one eye. 3D films and virtual-reality headsets add disparity
          back by showing each eye its own image, with polarised glasses or a separate screen per eye.
        </p>
      </Section>

      <div className="mb-12 max-w-3xl">
        <Callout title="In my research">
          The{" "}
          <Link href="/research/3d-vision" className={linkClass}>
            3D vision project
          </Link>{" "}
          builds stereoscopic stimuli for monkey experiments, and models how populations of neurons could recover a surface&apos;s tilt and
          distance from disparity.
        </Callout>
      </div>

      <NextGuide current={guide.slug} />
    </article>
  );
}
