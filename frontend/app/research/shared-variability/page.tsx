import { BlockedValidation, NuisancePipeline } from "@/components/showcase/MethodFigures";
import { SharedDriftDemo } from "@/components/showcase/SharedDriftDemo";
import { Callout, Figure, NextProject, ProjectHero, Section, SkillList, Steps, Term } from "@/components/showcase/Story";
import { projectBySlug } from "@/content/research";

const project = projectBySlug("shared-variability");
export const metadata = { title: project.title };

const TOOLKIT = [
  { title: "Decoding with support vector machines", body: "Early in the project I trained linear classifiers to tell the stimulus, and even the recorded area, apart from population firing rates — a first check of what information the recordings carry." },
  { title: "Who fires first?", body: "Estimated each neuron's response latency after the stimulus and built directed graphs from earlier- to later-responding neurons, scanning analysis parameters systematically rather than picking one." },
  { title: "Noise-correlation maps", body: "For every pair of neurons, removed the average response to each stimulus condition and correlated what was left, producing neuron-by-neuron matrices for different task phases." },
  { title: "Correlation across time lags", body: "Computed how pairs of neurons co-vary at different time offsets, rendered as 3D surfaces (neuron pair × lag) and stitched into side-by-side videos across recordings and task phases." },
  { title: "Rasters and firing-rate curves", body: "Spike rasters and coverage-aware firing-rate curves for the periods before, during and after the stimulus, correcting for trials that end early instead of silently biasing the average downwards." },
  { title: "Slow-component forensics", body: "Audited event codes, export order and per-unit quality to understand where slow changes in activity come from, separating recording artefacts from task history where the data allow." },
];

export default function SharedVariability() {
  return (
    <article className="mx-auto max-w-5xl py-6">
      <ProjectHero project={project} />

      <Section eyebrow="The setting" title="Two areas looking at the same surface">
        <p>
          When you judge which way a table top or a hillside is tilted, several brain areas work together. Two of them are{" "}
          <Term def="A visual area in the back of the brain that helps process three-dimensional structure, such as depth and surface orientation.">V3A</Term>{" "}
          and the{" "}
          <Term def="Caudal intraparietal area: a region in parietal cortex, further along the visual pathway, involved in perceiving the 3D orientation of surfaces and linking vision to action.">CIP</Term>.
          In these experiments a monkey looked at a plane made of dots, shown at different tilts, slants and distances, and reported its
          orientation by moving its eyes to a target. Neurons in both areas were recorded at the same time with{" "}
          <Term def="An electrode bundle of four closely spaced wires; each neuron's spike looks slightly different on each wire, which helps tell neurons apart.">tetrodes</Term>,
          trial after trial.
        </p>
      </Section>

      <Section eyebrow="The question" title="Do the wobbles travel together?">
        <p>
          Show the same surface twice and a neuron will not respond identically. Part of that trial-to-trial variation is private noise,
          but part may be shared across many neurons — so-called{" "}
          <Term def="Trial-to-trial fluctuations that are correlated across neurons: when one fires a bit more than usual, the other tends to as well, beyond what the stimulus explains. Often called noise correlations.">shared variability</Term>.
          If V3A and CIP fluctuate together, that could hint at how the two areas exchange information. If one area&apos;s activity helps
          predict the other&apos;s, even better.
        </p>
        <p>
          The difficulty is that many things can make two areas rise and fall together without any communication between them: the animal
          becoming more or less alert over a session, a recording slowly changing, or simply the stimulus itself. The toy simulation below
          shows how easily a slow, shared drift can masquerade as a link.
        </p>
      </Section>

      <Figure
        label="Interactive · toy simulation, not real data"
        caption="Two simulated areas share a slow drift across a session plus, optionally, genuine trial-by-trial coupling; each also has its own noise. Correlating raw responses mixes the two sources. Removing the slow trend before correlating isolates the trial-by-trial part."
      >
        <SharedDriftDemo />
      </Figure>

      <Section eyebrow="The approach" title="Subtract everything that is expected, then look at what is left">
        <p>
          The core analysis summarises each area by its average firing rate on every trial, then removes three things that could link the
          areas without any communication: the response to each of the 96 stimulus combinations, slow trends over the session, and activity
          just before the stimulus appeared. Only the leftovers — the{" "}
          <Term def="What remains of a measurement after subtracting everything a model predicts. If two areas' residuals still move together, something beyond the modelled factors links them.">residuals</Term>{" "}
          — are compared, in three independent ways.
        </p>
      </Section>

      <Figure label="Analysis design" caption="Every model is fitted only on the data it is allowed to see; uncertainty estimates refit the whole model rather than reusing a single fit.">
        <NuisancePipeline />
      </Figure>

      <Section eyebrow="A detail that matters" title="Why you can't shuffle trials">
        <p>
          A common way to test a model is to hide some trials, fit on the rest and predict the hidden ones. But neighbouring trials are
          similar, so hiding random single trials lets the model &ldquo;peek&rdquo; at the answer through their neighbours. Instead I hid whole
          blocks of 25 consecutive trials, and also left out five trials on each side of every hidden block. Click through the folds to see
          how every block gets its turn as test data.
        </p>
      </Section>

      <Figure label="Interactive · blocked cross-validation (illustration)">
        <BlockedValidation />
      </Figure>

      <Section eyebrow="Knowing the limits" title="Could this dataset even see a small effect?">
        <p>
          A negative result only means something if the analysis could have detected the effect. So I took the real recordings, planted
          artificial shared signals of known size — from 0.5% to 10% of the leftover variability — and ran the full pipeline on them,
          100 times per size and direction. A separate set of 1,000 calibration and 500 validation runs without any planted signal checked
          how often the method raises a false alarm.
        </p>
        <Steps
          items={[
            { title: "Keep the real data's structure", body: "Resample whole blocks of real leftover activity so slow structure and noise stay realistic." },
            { title: "Plant a signal of known size", body: "Add a shared component at a chosen fraction of the variability." },
            { title: "Run the identical pipeline", body: "Refit every model exactly as for the real data, including all nuisance terms." },
            { title: "Count how often it is found", body: "The detection rate at each size shows what the data can and cannot reveal." },
          ]}
        />
      </Section>

      <Section eyebrow="Exploration" title="The wider toolkit">
        <div className="grid gap-3 sm:grid-cols-2">
          {TOOLKIT.map((t) => (
            <div key={t.title} className="card card-hover p-4">
              <div className="text-sm font-semibold">{t.title}</div>
              <p className="mt-1.5 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{t.body}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section eyebrow="Ground rules" title="How I kept the analysis honest">
        <ul className="list-disc space-y-2 pl-5">
          <li>The main measurement and time window were written down in an analysis plan before the publication-stage analysis (after early exploration, so it is not a preregistration), and every recording is reported — including ones that disagree.</li>
          <li>No exclusion threshold is chosen to improve a p-value; quality-control decisions are run as labelled sensitivity analyses with the original estimates kept.</li>
          <li>Earlier, less favourable results are kept alongside newer ones rather than replaced.</li>
          <li>Every run records SHA-256 fingerprints of the raw files and the software environment, and the numerical methods have their own unit tests.</li>
        </ul>
      </Section>

      <div className="mb-12 max-w-3xl">
        <Callout title="Status">
          This is an ongoing, exploratory analysis of recordings from one animal. Results are being written up and are deliberately
          not shown here; the page describes the questions and methods only.
        </Callout>
      </div>

      <Section eyebrow="What I built" title="Skills behind the project">
        <SkillList
          groups={[
            { label: "Statistics", items: ["Nuisance-controlled correlation analysis", "Moving-block bootstrap with full model refitting", "Sign-flip and circular-shift null tests, Benjamini–Hochberg correction", "Cross-validated prediction with temporal buffers", "Semi-synthetic detectability simulations"] },
            { label: "Data and code", items: ["Python pipeline from MATLAB exports to figures", "Unit tests for the numerical methods", "Reproducibility metadata and file fingerprints for every run", "SVM decoding, latency, connectivity and lag-correlation analyses", "3D surface plots and video rendering of time-resolved results"] },
          ]}
        />
      </Section>

      <NextProject current={project.slug} />
    </article>
  );
}
