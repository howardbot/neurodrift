import { RFQualityDemo } from "@/components/showcase/RFQualityDemo";
import { SpikeSortingDemo } from "@/components/showcase/SpikeSortingDemo";
import { Callout, Figure, NextProject, ProjectHero, Section, SkillList, Steps, Term } from "@/components/showcase/Story";
import { projectBySlug } from "@/content/research";

const project = projectBySlug("spike-sorting");
export const metadata = { title: project.title };

export default function SpikeSorting() {
  return (
    <article className="mx-auto max-w-5xl py-6">
      <ProjectHero project={project} />

      <Section eyebrow="The problem" title="A microphone at a party">
        <p>
          An electrode in the brain does not record one neuron. Like a microphone in a crowded room, it picks up several nearby neurons
          at once, plus background noise. Each neuron&apos;s spike has a slightly different size and shape at the electrode, depending on
          the cell type and how far away it is.{" "}
          <Term id="spike-sorting">Spike sorting</Term>{" "}
          uses those differences to work out which spike came from which neuron.
        </p>
        <p>
          The recordings in this project used{" "}
          <Term id="tetrodes">tetrodes</Term>.
          Traditionally a person sorts them by eye in software such as Plexon Offline Sorter, drawing boundaries around clusters. Newer
          algorithms such as <Term id="kilosort-4">Kilosort 4</Term>{" "}
          do it automatically. Automation is faster and repeatable, but are the neurons it finds the same, and as good?
        </p>
      </Section>

      <Figure
        label="Interactive · toy simulation"
        caption="Simulated spikes from three neurons, each described by two features: how big the spike is and how wide it is. Real sorting uses many more features across all four tetrode channels, but the challenge is the same."
      >
        <SpikeSortingDemo />
      </Figure>

      <Section eyebrow="What I compared" title="Judging sorting by what the neurons do">
        <p>
          There is no answer key for which spikes truly belong together, so I compared the two approaches on properties that matter for
          the science.
        </p>
        <Steps
          items={[
            { title: "Phase 1 · Line up the automated output", body: "Built a neuron-level master table from the Kilosort results: trial quality, firing statistics, recording channel and position, joined with each unit's receptive-field data." },
            { title: "Phase 2 · Check receptive fields", body: <>Mapped each neuron&apos;s <Term id="receptive-field">receptive field</Term> from responses to briefly flashed patterns and labelled it clear or weak with explicit, interpretable rules: a large enough responsive area, a peak that stands out from the average without being a single noisy spike, and enough stimulus exposure.</> },
            { title: "Phase 3 · Line up the manual output", body: "Built the same table from the traditional sort, robustly matching per-tetrode, per-unit files so no neuron is silently overwritten." },
            { title: "Phase 4 · Compare head to head", body: "Neuron counts per tetrode, how often each method yields a clear receptive field, the distributions of receptive-field properties, waveform features, and task tuning where available." },
            { title: "Phase 5 · Fit the receptive fields", body: "Fitted a 2D Gaussian to every map to compare receptive-field centre, size and fit quality between the two methods." },
            { title: "Spike shapes", body: "Measured trough-to-peak time and half-width, and split neurons into narrow-spiking (often inhibitory) and broad-spiking types at 350 µs, comparing the proportions each method finds." },
            { title: "Audit channel by channel", body: "Flagged tetrodes where one method reports many neurons with poor receptive fields, a sign of over-splitting or noise." },
          ]}
        />
        <p>
          Every later analysis — tuning curves, correlations between neurons, decoding — inherits whatever sorting decided, so this kind
          of check decides how much those results can be trusted.
        </p>
      </Section>

      <Figure
        label="Interactive · toy receptive-field check"
        caption="A simulated receptive-field map judged with the two quality rules from the analysis (responsive area and peak-to-mean ratio). Real maps come from responses to flashed sparse-noise stimuli; the exposure rule is omitted here."
      >
        <RFQualityDemo />
      </Figure>

      <div className="mb-12 max-w-3xl">
        <Callout title="Status">An internal methods comparison for the lab; results are not shown here.</Callout>
      </div>

      <Section eyebrow="What I built" title="Skills behind the project">
        <SkillList
          groups={[
            { label: "Electrophysiology", items: ["Kilosort 4 / Phy and Plexon outputs on tetrode data", "Receptive-field mapping and Gaussian fitting", "Waveform features and cell-type classification"] },
            { label: "Data engineering", items: ["Robust merging of per-tetrode, per-unit files", "Toolbox-free MATLAB helpers that run anywhere", "Quality-control figures for spotting suspicious channels"] },
          ]}
        />
      </Section>

      <NextProject current={project.slug} />
    </article>
  );
}
