import { SharedDriftDemo } from "@/components/showcase/SharedDriftDemo";
import { Callout, Figure, NextProject, ProjectHero, Section, SkillList, Steps, Term } from "@/components/showcase/Story";
import { projectBySlug } from "@/content/research";

const project = projectBySlug("shared-variability");
export const metadata = { title: project.title };

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
          In these experiments a monkey looked at a plane made of dots, shown at different tilts and distances, and reported its
          orientation by moving its eyes to a target. Neurons in both areas were recorded at the same time, trial after trial.
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

      <Section eyebrow="What I did" title="Building an analysis that is hard to fool">
        <Steps
          items={[
            { title: "Extract spikes carefully", body: "Converted the raw recordings into spike counts per trial with integrity checks for out-of-order, duplicated or out-of-range timestamps and for trials that were cut short." },
            { title: "Model what is expected", body: "Accounted for every stimulus condition, slow trends across the session and pre-stimulus activity in both areas, then studied what was left over." },
            { title: "Measure uncertainty honestly", body: <>Used a <Term def="A resampling method that redraws whole blocks of consecutive trials, so the slow structure in the data is preserved when estimating how uncertain a result is.">block bootstrap</Term> that refits the entire model each time, plus several null tests and corrections for testing multiple recordings.</> },
            { title: "Test prediction on unseen trials", body: "Checked whether one area's activity improves prediction of the other's on held-out blocks of trials, leaving buffer trials between training and test data so neighbouring trials cannot leak information." },
            { title: "Ask what the data could detect", body: "Ran simulations with known, planted effects to see how large a coupling would need to be before this dataset could reliably reveal it." },
          ]}
        />
        <p>
          Earlier parts of the project included decoding the stimulus and the recorded area from population activity with support
          vector machines, time-lagged correlations between the areas, response-latency analyses and visualisations of single-neuron
          activity (rasters, firing-rate curves and animated response surfaces).
        </p>
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
            { label: "Statistics", items: ["Nuisance-controlled correlation analysis", "Moving-block bootstrap with full model refitting", "Sign-flip and circular-shift null tests, Benjamini–Hochberg correction", "Cross-validated prediction with temporal buffers"] },
            { label: "Data and code", items: ["Python pipeline from MATLAB exports to figures", "Unit tests for the numerical methods", "Reproducibility metadata and file fingerprints for every run", "SVM decoding, latency and connectivity analyses"] },
          ]}
        />
      </Section>

      <NextProject current={project.slug} />
    </article>
  );
}
