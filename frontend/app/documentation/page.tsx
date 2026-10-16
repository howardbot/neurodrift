import { PageHeader } from "@/components/ui";

export const metadata = { title: "Documentation" };

function Code({ children }: { children: string }) {
  return <pre className="overflow-x-auto rounded border border-zinc-200 bg-zinc-50 p-3 font-mono text-xs dark:border-zinc-800 dark:bg-zinc-900">{children}</pre>;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-base font-semibold">{title}</h2>
      {children}
    </section>
  );
}

export default function Documentation() {
  return (
    <div className="max-w-3xl space-y-8 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
      <PageHeader title="Documentation" description="Data format and analysis conventions." />

      <Section title="Session file format">
        <p>One NumPy <code>.npz</code> archive per recording session. Rows of <code>X</code> and <code>Y</code> are aligned time bins.</p>
        <table className="table-base">
          <thead><tr><th>Key</th><th>Shape</th><th>Required</th><th>Meaning</th></tr></thead>
          <tbody>
            <tr><td className="font-mono">X</td><td className="font-mono">(n_samples, n_neurons)</td><td>yes</td><td>Neural features, e.g. binned spike counts</td></tr>
            <tr><td className="font-mono">Y</td><td className="font-mono">(n_samples, n_outputs)</td><td>yes</td><td>Behavioural targets, e.g. cursor velocity (1-D is treated as one output)</td></tr>
            <tr><td className="font-mono">timestamps</td><td className="font-mono">(n_samples,)</td><td>no</td><td>Bin times in seconds</td></tr>
            <tr><td className="font-mono">trial_ids</td><td className="font-mono">(n_samples,)</td><td>no</td><td>Integer trial label per bin</td></tr>
            <tr><td className="font-mono">neuron_ids</td><td className="font-mono">(n_neurons,)</td><td>no</td><td>Unique integer or string unit IDs, used to match neurons across sessions</td></tr>
          </tbody>
        </table>
        <Code>{`import numpy as np
np.savez("R1_D01.npz", X=X, Y=Y, timestamps=t, trial_ids=trial_ids, neuron_ids=unit_ids)`}</Code>
        <p>
          Files are opened with <code>allow_pickle=False</code>: object arrays are rejected, never deserialised. Uploads are
          rejected if <code>X</code> or <code>Y</code> is missing, sample counts differ, any value is NaN or infinite, there are
          zero samples or neurons, or the arrays have the wrong dimensionality. All problems are reported at once.
        </p>
      </Section>

      <Section title="Quality control">
        <p>
          For each session NeuroDrift reports per-neuron mean, variance and fraction of zero bins, target means and variances,
          duration (from timestamps), and flags zero-variance (&ldquo;flat&rdquo;) neurons, which are dropped before decoding and PCA.
          Trace plots show a contiguous window of the first 2,000 bins rather than a decimated whole session, so temporal
          structure is preserved.
        </p>
      </Section>

      <Section title="Neuron identity across sessions">
        <p>
          If both sessions provide <code>neuron_ids</code>, comparisons use the intersection of IDs. Without IDs, equal feature
          counts are required and column <em>i</em> is assumed to be the same unit in both sessions; the UI says so wherever
          this assumption is used. Dimensions are never silently truncated.
        </p>
      </Section>

      <Section title="Decoding">
        <p>
          The decoder maps one bin of neural features to the same bin of behaviour (no lags): ridge regression
          (<code>sklearn.linear_model.Ridge</code>, α = 1 by default) or ordinary least squares, both with an intercept.
          Features with zero variance in the training block are dropped; optional z-scoring uses the training block&apos;s mean
          and SD only, applied unchanged to test data. Metrics are reported per output and averaged: Pearson r (headline), R²
          and RMSE. Undefined values (constant signals) are shown as missing rather than NaN.
        </p>
        <p>
          Splits are contiguous and never shuffled, because neighbouring bins are autocorrelated. Within a session the first
          80 % of bins train and the last 20 % test.
        </p>
      </Section>

      <Section title="Cross-session generalisation">
        <p>
          For sessions S<sub>1</sub>…S<sub>N</sub>, the decoder for row <em>i</em> is trained on the first 80 % of S<sub>i</sub>, and
          every cell in column <em>j</em> is evaluated on the last 20 % of S<sub>j</sub>, restricted to the neurons the two
          sessions share. The diagonal is therefore a held-out within-session estimate and all cells use the same amount of
          training data. Lower off-diagonal performance is not by itself evidence of neural representational drift:
          behaviour, recording quality and neuron turnover also differ between sessions, and NeuroDrift reports these
          separately.
        </p>
      </Section>

      <Section title="Planned analyses">
        <p>
          Per-session PCA and principal angles between PCA subspaces (with a chance level for random subspaces), the
          pair-comparison view, and CSV/JSON exports arrive in the next milestones.
        </p>
      </Section>
    </div>
  );
}
