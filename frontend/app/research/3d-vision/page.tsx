import { DisparityDemo } from "@/components/showcase/DisparityDemo";
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
      </Section>

      <Section eyebrow="Part 2" title="A model of how neurons could read 3D pose">
        <p>
          I also worked on a computational model built from{" "}
          <Term def="Model neurons that each prefer a particular pattern of disparity across a strip of the visual field, such as the gradient produced by a surface tilted by a given amount.">disparity-gradient detectors</Term>.
          Their responses are combined with information about where the eyes are pointing and then normalised against one another —
          a common operation in the brain — to produce model neurons that signal a surface&apos;s tilt and distance.
        </p>
        <p>
          A key test is whether model neurons keep their preferences when the eyes look at different distances. Detectors that see raw,
          absolute disparity should not (a built-in control), while detectors further along the model should. A related analysis asks when
          moving an object and moving the eyes produce matching disparity patterns, comparing a numerical search with an analytic
          prediction.
        </p>
      </Section>

      <Section eyebrow="Part 3" title="When does a decision appear in the brain?">
        <p>
          With recordings from V3A and CIP, I developed an iterative procedure to estimate when choice-related activity emerges in each
          area: it repeatedly re-estimates each neuron&apos;s preferred tilt from a time window, pools neurons, and tests across time until
          the estimated onset stops changing.
        </p>
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
            { label: "Modelling and analysis", items: ["Population model of disparity processing with divisive normalisation", "Gaze-invariance tests at several model stages", "Vectorised MATLAB for large parameter sweeps", "Iterative onset estimation for choice signals"] },
          ]}
        />
      </Section>

      <NextProject current={project.slug} />
    </article>
  );
}
