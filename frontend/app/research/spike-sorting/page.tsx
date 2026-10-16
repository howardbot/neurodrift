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
          <Term def="The process of detecting spikes in a recording and assigning each one to the neuron that most likely produced it, based on its shape across the recording channels.">Spike sorting</Term>{" "}
          uses those differences to work out which spike came from which neuron.
        </p>
        <p>
          The recordings in this project used{" "}
          <Term def="An electrode bundle of four closely spaced recording wires. A spike looks slightly different on each wire, which helps tell neighbouring neurons apart.">tetrodes</Term>.
          Traditionally a person sorts them by eye in software such as Plexon Offline Sorter, drawing boundaries around clusters. Newer
          algorithms such as <Term def="An open-source spike-sorting algorithm that learns a template waveform for each neuron and matches it across channels and time. It is fast and reproducible but still needs checking.">Kilosort 4</Term>{" "}
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
            { title: "Line up both outputs", body: "Built matching neuron-level tables from the manual and automated sorts of the same recordings, tetrode by tetrode." },
            { title: "Check receptive fields", body: <>Mapped each neuron&apos;s <Term def="The patch of the visual field where a stimulus makes a neuron fire. A well-isolated visual neuron usually has a compact, clearly defined receptive field.">receptive field</Term> from responses to briefly flashed patterns, classified fields as clear or weak with explicit criteria, and fitted 2D Gaussians to compare their size and position.</> },
            { title: "Compare spike shapes", body: "Measured each neuron's waveform width and timing to separate narrow-spiking from broad-spiking cell types, and compared the proportions each method finds." },
            { title: "Audit channel by channel", body: "Flagged tetrodes where one method reports many neurons with poor receptive fields, a sign of over-splitting or noise." },
          ]}
        />
        <p>
          Every later analysis — tuning curves, correlations between neurons, decoding — inherits whatever sorting decided, so this kind
          of check decides how much those results can be trusted.
        </p>
      </Section>

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
