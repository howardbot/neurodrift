import { DisparityDemo } from "@/components/showcase/DisparityDemo";
import { DisparityModelPipeline } from "@/components/showcase/MethodFigures";
import { StereoRendererDemo } from "@/components/showcase/StereoRendererDemo";
import { Callout, Figure, NextProject, ProjectHero, Section, SkillList, Steps, Term } from "@/components/showcase/Story";
import { projectBySlug } from "@/content/research";

const project = projectBySlug("3d-vision");
export const metadata = { title: project.title };

export default function ThreeDVision() {
  return (
    <article className="mx-auto max-w-5xl py-6">
      <ProjectHero project={project} />

      <Section eyebrow="The basics" title="Two eyes, two pictures">
        <p>
          Hold up a finger and close each eye in turn: the finger jumps against the background. Because your eyes are a few centimetres
          apart, each sees the world from a slightly different place. The brain measures those small offsets —{" "}
          <Term def="The difference in where a point lands on the left and right retinas. Points nearer or farther than where you are looking produce disparities of opposite sign.">binocular disparity</Term>{" "}
          — and turns them into depth. 3D films use the same trick by showing each eye a different image.
        </p>
        <p>
          Across a tilted surface, disparity changes smoothly from one edge to the other. The demo below computes that pattern from simple
          geometry. Notice three things: tilting the surface changes the <em>slope</em> of the curve; moving the surface nearer or
          farther than where you look shifts it up or down; and changing where you look moves the whole curve without changing its shape.
        </p>
      </Section>

      <Figure
        label="Interactive · geometry illustration"
        caption="Disparity across a 20 cm-wide surface patch for a typical human eye separation (6.3 cm), using the standard small-angle approximation. The curve is clipped at ±2°. The shape of the curve carries the tilt; its overall level depends on where the eyes are pointing."
      >
        <DisparityDemo />
      </Figure>

      <Section eyebrow="Part 1" title="Building 3D stimuli for neural recordings">
        <p>
          To study how neurons respond to 3D shape, the lab needs stimuli that are exactly controlled for each eye. I built a renderer in
          MATLAB with Psychtoolbox and OpenGL that:
        </p>
        <Steps
          items={[
            { title: "Loads and normalises 3D models", body: "Reads standard mesh files (a jet, an engine, a hinge, a lattice) and rescales each to a common size so objects can be compared fairly." },
            { title: "Renders a separate image for each eye", body: "Positions two virtual cameras with an eye separation and viewing distance scaled to the object, in several stereo and flat display modes." },
            { title: "Controls shading", body: <>Switches between flat shading (one <Term def="A vector pointing straight out of a surface. Lighting calculations use it to decide how bright each part of the surface should be.">surface normal</Term> per triangle, crisp edges) and smooth shading (normals averaged at each vertex) to control which depth cues are present.</> },
            { title: "Helps the eyes stay aligned", body: "Adds fixation and fusion markers so the viewer keeps both eyes pointed at the right place." },
            { title: "Captures and presents stimulus sets", body: "Batch-renders every rotation and display mode, then presents them in random order with timing synchronised to the neural recording system." },
          ]}
        />
        <p>
          The demo below re-creates the same ideas in your browser on a stand-in shape. If you have red–cyan glasses, the 3D mode pops out
          of the screen; without them, compare the left- and right-eye views to see how little the two images differ.
        </p>
      </Section>

      <Figure
        label="Interactive · browser version of the renderer"
        caption="Drag to rotate. Like the lab renderer, the model is scaled to a unit sphere, the virtual eyes converge on its centre at twice its size, and eye separation defaults to 1/30 of the viewing distance. Turning off smooth shading switches from averaged vertex normals to one normal per face. The lab's own 3D models are not reproduced here."
      >
        <StereoRendererDemo />
      </Figure>

      <Section eyebrow="Part 2" title="A model of how neurons could read 3D pose">
        <p>
          I also worked on a computational model built from{" "}
          <Term def="Model neurons that each prefer a particular pattern of disparity across a strip of the visual field, such as the gradient produced by a surface tilted by a given amount.">disparity-gradient detectors</Term>.
          Their responses are combined with information about where the eyes are pointing and then normalised against one another —
          a common operation in the brain — to produce model neurons that signal a surface&apos;s tilt and distance.
        </p>
      </Section>

      <Figure label="Model design" caption="Each model neuron compares the disparity pattern a surface produces across a 20 cm strip with its own preferred pattern; responses are then weighted by where the eyes point, normalised against the rest of the population, and weighted by preferred distance.">
        <DisparityModelPipeline />
      </Figure>

      <Section eyebrow="Model details" title="What the model covers, and how it is tested">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            A grid of 21 surface distances (44–84 cm) × 61 slants (−60° to +60°) × 16 fixation distances (50–80 cm), with disparity
            sampled at 81 positions across the surface — about 20,000 disparity profiles.
          </li>
          <li>
            How sharply detectors are tuned shrinks with viewing distance, because disparities get smaller for far surfaces; the bandwidths
            are interpolated from measured values.
          </li>
          <li>
            A vectorised implementation replaces the original nested loops for speed, and is validated against the reference version before
            being used.
          </li>
          <li>
            <strong>Gaze invariance test:</strong> for each model neuron, its tuning to surface orientation is measured at several fixation
            distances, and two numbers summarise the result — how similar the tuning shapes are, and how much the overall response gain
            changes. Absolute-disparity detectors should fail this test (a built-in control); relative-disparity and pose detectors should
            pass. The same test is repeated with added response noise.
          </li>
          <li>
            <strong>Object or eyes?</strong> A related analysis searches for pairs of situations — moving the object versus changing where
            the eyes look — that produce matching disparity patterns, and checks the numerical matches against an analytic prediction.
          </li>
        </ul>
      </Section>

      <Section eyebrow="Part 3" title="When does a decision appear in the brain?">
        <p>
          In the surface-orientation task the animal reports a tilt by moving its eyes. With recordings from V3A and CIP, I built a
          three-script procedure to estimate when choice-related activity emerges in each area, without fixing the analysis window in
          advance:
        </p>
        <Steps
          items={[
            { title: "Precompute", body: "Store each neuron's spike counts for every possible window start at 1 ms resolution, so later steps never reload the raw data." },
            { title: "Re-label trials", body: "Within the current window, find each neuron's preferred tilt and express every trial's reported tilt relative to it, keeping all eight direction categories." },
            { title: "Pool fairly", body: "Normalise each neuron's activity within each fixation distance so depth-related gain changes do not dominate, then pool neurons by area." },
            { title: "Find the onset", body: "Test at every millisecond whether the eight categories differ, and take the earliest sustained difference as the new window start." },
            { title: "Repeat until stable", body: "Iterate until the onset stops moving, then write the converged window back into the data files for later analyses." },
          ]}
        />
      </Section>

      <div className="mb-12 max-w-3xl">
        <Callout title="Status">
          Lab work in progress. The page describes tools and approaches; model and recording results are not shown.
        </Callout>
      </div>

      <Section eyebrow="What I built" title="Skills behind the project">
        <SkillList
          groups={[
            { label: "Graphics and experiments", items: ["OpenGL rendering through Psychtoolbox", "Stereo display modes and per-eye image control", "Mesh normals, lighting and camera geometry", "Stimulus presentation synchronised with recording hardware"] },
            { label: "Modelling and analysis", items: ["Population model of disparity processing with divisive normalisation", "Gaze-invariance tests at several model stages, with and without noise", "Vectorised MATLAB validated against a reference implementation", "Iterative, data-driven onset estimation for choice signals"] },
          ]}
        />
      </Section>

      <NextProject current={project.slug} />
    </article>
  );
}
