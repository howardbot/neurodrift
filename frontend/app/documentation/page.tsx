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
      <PageHeader title="Documentation" description="Data format, analysis conventions and exports." />

      <Section title="Session file format">
        <p>One NumPy <code>.npz</code> archive per recording session. Rows of <code>X</code> and <code>Y</code> are aligned time bins.</p>
        <div className="overflow-x-auto">
          <table className="table-base [&_td:last-child]:min-w-[14rem] [&_td:last-child]:whitespace-normal">
            <thead><tr><th>Key</th><th>Shape</th><th>Required</th><th>Meaning</th></tr></thead>
            <tbody>
              <tr><td className="font-mono">X</td><td className="font-mono">(n_samples, n_neurons)</td><td>yes</td><td>Neural features, e.g. binned spike counts</td></tr>
              <tr><td className="font-mono">Y</td><td className="font-mono">(n_samples, n_outputs)</td><td>yes</td><td>Behavioural targets, e.g. cursor velocity (1-D is treated as one output)</td></tr>
              <tr><td className="font-mono">timestamps</td><td className="font-mono">(n_samples,)</td><td>no</td><td>Bin times in seconds</td></tr>
              <tr><td className="font-mono">trial_ids</td><td className="font-mono">(n_samples,)</td><td>no</td><td>Integer trial label per bin</td></tr>
              <tr><td className="font-mono">neuron_ids</td><td className="font-mono">(n_neurons,)</td><td>no</td><td>Unique integer or string unit IDs, used to match neurons across sessions</td></tr>
            </tbody>
          </table>
        </div>
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

      <Section title="PCA and subspace drift">
        <p>
          PCA is fit with <code>sklearn.decomposition.PCA</code> after dropping zero-variance neurons and centring (optionally
          z-scoring) with the data&apos;s own statistics. For the subspace matrix, cell (i, j) compares a PCA fit on the training
          block of session i with an independent fit on the test block of session j, using shared neurons only — the same data
          as decoder cell (i, j). The diagonal is a within-session reference, not 0°.
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li><strong>Principal angles</strong> (<code>scipy.linalg.subspace_angles</code>), in degrees; mean and largest.</li>
          <li><strong>Chance level</strong>: mean angle between random k-dimensional subspaces of the same neuron space (seeded Monte Carlo). Random subspaces are not orthogonal on average.</li>
          <li><strong>Projection distance</strong> ‖P<sub>A</sub> − P<sub>B</sub>‖<sub>F</sub> / √(2k) = √(Σ sin²θ<sub>i</sub> / k), in [0, 1].</li>
          <li><strong>Alignment index</strong> (Elsayed et al., 2016): fraction of B&apos;s top-k variance captured by A&apos;s top-k PCs.</li>
        </ul>
        <p>
          The drift-vs-decoding scatter reports Spearman ρ across off-diagonal pairs as a description only: pairs share sessions
          and are not independent, and an association does not show that representational change causes decoder degradation.
        </p>
      </Section>

      <Section title="Pair comparison">
        <p>
          Clicking a matrix cell opens the train → test pair: decoder metrics next to within-session references, predicted vs
          actual traces, principal angles against chance, variance-capture curves, per-neuron mean activity and behavioural
          distributions. The Kolmogorov–Smirnov statistic is shown without a p-value because bins are autocorrelated.
        </p>
      </Section>

      <Section title="Decoder stability explorer">
        <p>
          On a completed experiment, pick a training session to plot its decoder r against session distance |i − j|, counted in
          positions of the experiment&apos;s session order (not days). Test sessions before and after the training session are
          drawn separately, and a dashed line averages all training sessions at each distance. When the experiment has subspace
          results, the mean principal angle of the same pairs is shown underneath, next to its chance level. The plot is
          descriptive: there are no uncertainty estimates.
        </p>
      </Section>

      <Section title="Exports and reports">
        <p>
          Completed experiments can be downloaded from their page, built from the stored results without recomputation:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li><code>decoder_matrix.csv</code> (mean Pearson r) and <code>subspace_angles.csv</code> (mean principal angle, °): rows are training sessions, columns test sessions, labelled with session names; cells that could not be computed are empty.</li>
          <li><code>session_summary.csv</code>: metadata, block sizes, within-session values and transfer means per session.</li>
          <li><code>experiment_config.json</code>: configuration, random seed, ordered session snapshot and software versions.</li>
          <li><code>all.zip</code>: all of the above plus the HTML report.</li>
        </ul>
        <p>
          <strong>Generate report</strong> opens a single self-contained HTML file (inline CSS and SVG, no external requests) with
          the configuration, session summary, both matrices, within- vs cross-session means and interpretation notes. Print it
          from the browser if you need a PDF. A failed experiment can be <strong>re-run</strong> with its stored configuration
          and seed.
        </p>
        <Code>{`curl -OJ http://<host>/api/experiments/<id>/export/all.zip
curl -o report.html http://<host>/api/experiments/<id>/report.html`}</Code>
      </Section>
    </div>
  );
}
