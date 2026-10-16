"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useMemo, type ReactNode } from "react";
import type { Data } from "plotly.js";
import { useSetCurrentProject } from "@/components/CurrentProject";
import { PredictionPlots } from "@/components/DecodingPanel";
import { Plot } from "@/components/Plot";
import { Card, ErrorBox, Notice, PageHeader, Spinner } from "@/components/ui";
import { api } from "@/lib/api";
import { binCenters, formatNumber, outputLabel } from "@/lib/format";
import { useApi } from "@/lib/useApi";
import type { PairComparison } from "@/types/api";

const A_COLOUR = "#2f5d9e";
const B_COLOUR = "#c2410c";

function pct(v: number | null | undefined, digits = 1): string {
  if (v === null || v === undefined) return "—";
  return `${v > 0 ? "+" : ""}${v.toFixed(digits)} %`;
}

function Row({ label, value, note }: { label: string; value: ReactNode; note?: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-zinc-100 py-1.5 last:border-0 dark:border-zinc-800">
      <span className="text-sm text-zinc-600 dark:text-zinc-400">{label}</span>
      <span className="text-right">
        <span className="num font-mono text-sm">{value}</span>
        {note && <span className="ml-2 text-xs text-zinc-500">{note}</span>}
      </span>
    </div>
  );
}

function Headline({ c }: { c: PairComparison }) {
  const d = c.decoder;
  const rep = c.representation;
  const beh = c.behaviour;
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card title="Decoder generalisation">
        {d ? (
          <>
            <Row label="Correlation (mean r)" value={formatNumber(d.metrics.mean_r)} note={c.reference.within_test_r != null ? `within ${c.test.name}: ${formatNumber(c.reference.within_test_r)}` : undefined} />
            <Row label="R²" value={formatNumber(d.metrics.mean_r2)} />
            <Row label="RMSE" value={formatNumber(d.metrics.mean_rmse)} />
            <Row label="Within-train r" value={formatNumber(c.reference.within_train_r ?? null)} note={`${c.train.name} → ${c.train.name}`} />
          </>
        ) : (
          <p className="text-sm text-zinc-500">Not computed.</p>
        )}
      </Card>
      <Card title="Neural representation">
        {rep ? (
          <>
            <Row label="Mean subspace angle" value={`${rep.mean_angle.toFixed(1)}°`} note={`chance ≈ ${rep.chance_mean_angle.toFixed(1)}°`} />
            <Row label="Largest angle" value={`${rep.max_angle.toFixed(1)}°`} />
            <Row label="Alignment index" value={rep.alignment_index.toFixed(2)} note="1 = identical variance structure" />
            <Row label="Shared neurons" value={c.alignment?.n_shared ?? "—"} note={`of ${c.train.n_neurons} / ${c.test.n_neurons}`} />
          </>
        ) : (
          <p className="text-sm text-zinc-500">{c.representation_error ?? c.alignment_error ?? "Not computed."}</p>
        )}
      </Card>
      <Card title="Behaviour">
        <Row label="Variance Δ (all outputs)" value={pct(beh.total_var_change_pct)} note={`${c.test.name} vs ${c.train.name}`} />
        {beh.speed_mean_a !== null && beh.speed_mean_b !== null && (
          <Row label="Mean speed ‖Y‖" value={`${beh.speed_mean_a.toFixed(2)} → ${beh.speed_mean_b.toFixed(2)}`} />
        )}
        <Row label="Mean difference ‖Δμ‖" value={formatNumber(beh.mean_euclidean_difference)} />
        <Row label="Max KS statistic" value={Math.max(...beh.outputs.map((o) => o.ks_statistic)).toFixed(3)} note="descriptive, no p-value" />
      </Card>
    </div>
  );
}

function RepresentationPlots({ c }: { c: PairComparison }) {
  const rep = c.representation!;
  const angles = useMemo<Data[]>(() => {
    const idx = rep.angles_deg.map((_, i) => i + 1);
    const refs: Data[] = [
      { type: "scatter", mode: "lines", x: [0.5, rep.k + 0.5], y: [rep.chance_mean_angle, rep.chance_mean_angle], name: "chance (mean)", line: { color: "#71717a", dash: "dash", width: 1.5 } },
    ];
    if (c.reference.within_test_angle != null)
      refs.push({ type: "scatter", mode: "lines", x: [0.5, rep.k + 0.5], y: [c.reference.within_test_angle, c.reference.within_test_angle], name: `within ${c.test.name} (mean)`, line: { color: "#15803d", dash: "dot", width: 1.5 } });
    return [{ type: "bar", x: idx, y: rep.angles_deg, name: "principal angles", marker: { color: A_COLOUR } }, ...refs];
  }, [rep, c.reference.within_test_angle, c.test.name]);

  const capture = useMemo<Data[]>(
    () => [
      { type: "scatter", mode: "lines+markers", x: rep.variance_capture.k, y: rep.variance_capture.captured_by_own.map((v) => v * 100), name: `${c.test.name}'s own PCs`, line: { color: B_COLOUR } },
      { type: "scatter", mode: "lines+markers", x: rep.variance_capture.k, y: rep.variance_capture.captured_by_a.map((v) => v * 100), name: `${c.train.name}'s PCs`, line: { color: A_COLOUR } },
    ],
    [rep, c.train.name, c.test.name],
  );

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div>
        <div className="text-xs font-medium text-zinc-500">Principal angles between top-{rep.k} subspaces ({rep.n_neurons_used} neurons)</div>
        <Plot data={angles} layout={{ xaxis: { title: { text: "angle index" }, dtick: 1 }, yaxis: { title: { text: "degrees" }, range: [0, 90] }, margin: { l: 50, r: 10, t: 10, b: 70 } }} height={260} />
      </div>
      <div>
        <div className="text-xs font-medium text-zinc-500">Variance of {c.test.name} (test block) captured by each set of PCs</div>
        <Plot data={capture} layout={{ xaxis: { title: { text: "number of PCs" }, dtick: 1 }, yaxis: { title: { text: "% variance" }, rangemode: "tozero" }, margin: { l: 50, r: 10, t: 10, b: 70 } }} height={260} />
      </div>
      {rep.degenerate && (
        <div className="lg:col-span-2"><Notice>2k exceeds the number of neurons, so some angles are 0° by construction.</Notice></div>
      )}
    </div>
  );
}

function ActivityPlots({ c }: { c: PairComparison }) {
  const act = c.activity!;
  const { scatter, hist } = useMemo(() => {
    const lo = Math.min(...act.mean_a, ...act.mean_b);
    const hi = Math.max(...act.mean_a, ...act.mean_b);
    return {
      scatter: [
        { type: "scatter", mode: "markers", x: act.mean_a, y: act.mean_b, text: act.labels.map((l) => `neuron ${l}`), marker: { size: 6, color: A_COLOUR, opacity: 0.75 }, hovertemplate: `%{text}<br>${c.train.name} %{x:.2f}<br>${c.test.name} %{y:.2f}<extra></extra>`, showlegend: false },
        { type: "scatter", mode: "lines", x: [lo, hi], y: [lo, hi], line: { color: "#71717a", dash: "dash", width: 1 }, hoverinfo: "skip", showlegend: false },
      ] as Data[],
      hist: [{ type: "histogram", x: act.diff, marker: { color: B_COLOUR }, nbinsx: 30, showlegend: false } as Data],
    };
  }, [act, c.train.name, c.test.name]);
  return (
    <div className="space-y-3">
      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <div className="text-xs font-medium text-zinc-500">Mean activity per shared neuron ({act.unit})</div>
          <Plot data={scatter} layout={{ xaxis: { title: { text: c.train.name } }, yaxis: { title: { text: c.test.name } }, margin: { l: 50, r: 10, t: 10, b: 44 } }} height={260} />
        </div>
        <div>
          <div className="text-xs font-medium text-zinc-500">Neuron-level change ({c.test.name} − {c.train.name}, {act.unit})</div>
          <Plot data={hist} layout={{ xaxis: { title: { text: `Δ mean activity (${act.unit})` } }, yaxis: { title: { text: "neurons" } }, margin: { l: 50, r: 10, t: 10, b: 44 } }} height={260} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-x-6 sm:grid-cols-4">
        <Row label="Pearson r of means" value={formatNumber(act.pearson_r)} />
        <Row label="Mean |Δ|" value={`${formatNumber(act.mean_abs_diff)} ${act.unit}`} />
        <Row label="Median relative Δ" value={act.median_relative_change !== null ? pct(act.median_relative_change * 100) : "—"} />
        <Row label="Population mean" value={`${formatNumber(act.population_mean_a)} → ${formatNumber(act.population_mean_b)}`} />
      </div>
    </div>
  );
}

function BehaviourPlots({ c }: { c: PairComparison }) {
  const beh = c.behaviour;
  const nAll = Math.max(c.train.n_outputs, 2);
  const hists = useMemo(
    () =>
      beh.outputs.map((o): Data[] => [
        { type: "bar", x: binCenters(o.hist_edges), y: o.hist_a, name: c.train.name, marker: { color: A_COLOUR }, opacity: 0.55 },
        { type: "bar", x: binCenters(o.hist_edges), y: o.hist_b, name: c.test.name, marker: { color: B_COLOUR }, opacity: 0.55 },
      ]),
    [beh, c.train.name, c.test.name],
  );
  const paths = useMemo<Data[] | null>(() => {
    if (beh.example_a.length < 2) return null;
    return [
      { type: "scatter", mode: "lines", x: beh.example_a[0], y: beh.example_a[1], name: c.train.name, line: { color: A_COLOUR, width: 1 } },
      { type: "scatter", mode: "lines", x: beh.example_b[0], y: beh.example_b[1], name: c.test.name, line: { color: B_COLOUR, width: 1 } },
    ];
  }, [beh, c.train.name, c.test.name]);
  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-3">
        {hists.map((h, k) => (
          <div key={k}>
            <div className="text-xs font-medium text-zinc-500">{outputLabel(c.outputs[k] ?? k, nAll)} distribution</div>
            <Plot data={h} layout={{ barmode: "overlay", bargap: 0, xaxis: { title: { text: "value" } }, yaxis: { title: { text: "bins" } }, margin: { l: 50, r: 10, t: 10, b: 70 } }} height={240} />
          </div>
        ))}
        {paths && (
          <div>
            <div className="text-xs font-medium text-zinc-500">Example: first 400 bins in output space (Y₀ vs Y₁)</div>
            <Plot data={paths} layout={{ xaxis: { title: { text: "Y₀" } }, yaxis: { title: { text: "Y₁" }, scaleanchor: "x" }, margin: { l: 50, r: 10, t: 10, b: 70 } }} height={240} />
          </div>
        )}
      </div>
      <div className="-mx-4 overflow-x-auto">
        <table className="table-base">
          <thead>
            <tr>
              <th>Output</th>
              <th className="text-right">Mean {c.train.name}</th><th className="text-right">Mean {c.test.name}</th>
              <th className="text-right">SD {c.train.name}</th><th className="text-right">SD {c.test.name}</th>
              <th className="text-right">Variance Δ</th><th className="text-right">KS statistic</th>
            </tr>
          </thead>
          <tbody>
            {beh.outputs.map((o, k) => (
              <tr key={k}>
                <td>{outputLabel(c.outputs[k] ?? k, nAll)}</td>
                <td className="num text-right font-mono">{formatNumber(o.mean_a)}</td>
                <td className="num text-right font-mono">{formatNumber(o.mean_b)}</td>
                <td className="num text-right font-mono">{formatNumber(o.std_a)}</td>
                <td className="num text-right font-mono">{formatNumber(o.std_b)}</td>
                <td className="num text-right font-mono">{pct(o.var_change_pct)}</td>
                <td className="num text-right font-mono">{o.ks_statistic.toFixed(3)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Metadata({ c }: { c: PairComparison }) {
  const rows: [string, (s: PairComparison["train"]) => ReactNode][] = [
    ["Subject", (s) => s.subject ?? "—"],
    ["Recording date", (s) => s.recording_date ?? "—"],
    ["Bin size", (s) => (s.bin_size_ms ? `${s.bin_size_ms} ms` : "—")],
    ["Time bins", (s) => formatNumber(s.n_samples)],
    ["Neurons", (s) => s.n_neurons],
    ["Trials", (s) => s.n_trials ?? "—"],
    ["% zero bins", (s) => (s.pct_zero != null ? s.pct_zero.toFixed(1) : "—")],
  ];
  return (
    <table className="table-base">
      <thead><tr><th /><th>Train · <Link className="text-accent-600 hover:underline" href={`/sessions/${c.train.id}`}>{c.train.name}</Link></th><th>Test · <Link className="text-accent-600 hover:underline" href={`/sessions/${c.test.id}`}>{c.test.name}</Link></th></tr></thead>
      <tbody>
        {rows.map(([label, get]) => (
          <tr key={label}>
            <td className="text-zinc-500">{label}</td>
            <td className="num font-mono">{get(c.train)}</td>
            <td className="num font-mono">{get(c.test)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ComparePage() {
  const params = useParams<{ id: string; train: string; test: string }>();
  const experimentId = useSearchParams().get("experiment");
  const project = useApi(() => api.getProject(params.id), params.id);
  useSetCurrentProject(project.data);
  const key = experimentId ? `${experimentId}:${params.train}:${params.test}` : null;
  const { data: c, error, loading } = useApi(() => api.comparePair(experimentId!, params.train, params.test), key);

  if (!experimentId) return <ErrorBox error="Missing ?experiment= parameter: open this page from an experiment's heatmap." />;
  if (loading && !c) return <Spinner label="Computing pair comparison…" />;
  if (error) return <ErrorBox error={error} title="Could not compare sessions" />;
  if (!c) return null;
  const same = c.train.id === c.test.id;
  const nAll = Math.max(c.train.n_outputs, 2);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={
          <span>
            <Link href={`/projects/${params.id}`} className="hover:underline">{project.data?.name ?? "Project"}</Link> /{" "}
            <Link href={`/experiments/${c.experiment.id}`} className="hover:underline">{c.experiment.name}</Link>
          </span>
        }
        title={
          <span className="font-mono">
            Train {c.train.name} <span className="text-zinc-400">→</span> Test {c.test.name}
          </span>
        }
        description={
          same
            ? "Within-session reference: decoder trained on the first block and tested on the last block of the same session."
            : "Decoder trained on the first block of the training session, tested on the last block of the test session, using the neurons both sessions share."
        }
      />

      {c.alignment_error && <Notice>Neural comparisons unavailable: {c.alignment_error}. Behaviour is still compared below.</Notice>}
      {c.alignment?.warning && <Notice>{c.alignment.warning}.</Notice>}

      <Headline c={c} />

      {c.decoder && (
        <Card title="Predicted vs actual" subtitle={`${formatNumber(c.decoder.n_train)} training bins from ${c.train.name}; ${formatNumber(c.decoder.n_test)} test bins from ${c.test.name}; ${c.decoder.n_used} neurons used.`}>
          <PredictionPlots result={c.decoder} outputs={c.outputs} nOutputs={nAll} />
        </Card>
      )}

      {c.representation && (
        <Card title="PCA subspace comparison" subtitle="PCA fit independently on each block; angles compare the top-k subspaces on shared neurons.">
          <RepresentationPlots c={c} />
        </Card>
      )}

      {c.activity && (
        <Card title="Firing-rate comparison" subtitle="Whole-session mean activity of shared neurons. Changes in mean activity are distinct from changes in covariance structure.">
          <ActivityPlots c={c} />
        </Card>
      )}

      <Card title="Behaviour comparison" subtitle="Whole-session target distributions. Different behaviour can reduce decoder transfer independently of neural change.">
        <BehaviourPlots c={c} />
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Sessions"><div className="-mx-4 -my-4 overflow-x-auto"><Metadata c={c} /></div></Card>
        <Card title="Reading this page">
          <ul className="list-disc space-y-1.5 pl-5 text-sm text-zinc-600 dark:text-zinc-400">
            <li>Decoder transfer, subspace similarity, mean-activity change and behavioural change are separate measurements; none of them establishes the cause of another.</li>
            <li>Compare the transfer r with the within-session r of the test session: the gap, not the absolute value, reflects generalisation loss.</li>
            <li>Compare subspace angles with both the chance level and the within-session reference, which includes estimation noise.</li>
            <li>Large behavioural differences (variance, KS statistic) mean the decoder is evaluated on a different behavioural distribution than it was trained on.</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<Spinner />}>
      <ComparePage />
    </Suspense>
  );
}
