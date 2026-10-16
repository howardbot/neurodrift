"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSetCurrentProject } from "@/components/CurrentProject";
import { DecoderHeatmap, METRICS } from "@/components/DecoderHeatmap";
import { StatusBadge } from "@/components/ExperimentsTable";
import { Button, Card, ErrorBox, Notice, PageHeader, Spinner, Stat } from "@/components/ui";
import { api } from "@/lib/api";
import { formatNumber, outputLabel } from "@/lib/format";
import { useApi } from "@/lib/useApi";
import type { DecoderResult, Experiment, MatrixKey } from "@/types/api";

const POLL_MS = 1500;

function useExperiment(id: string) {
  const state = useApi(() => api.getExperiment(id), id);
  const { data, reload } = state;
  const active = data?.status === "pending" || data?.status === "running";
  useEffect(() => {
    if (!active) return;
    const timer = window.setInterval(reload, POLL_MS);
    return () => window.clearInterval(timer);
  }, [active, reload]);
  return state;
}

function ConfigSummary({ e }: { e: Experiment }) {
  const c = e.config;
  const rows: [string, string][] = [
    ["Decoder", c.decoder === "ridge" ? `Ridge (α = ${c.alpha})` : "Linear regression (OLS)"],
    ["Neural preprocessing", c.zscore ? "z-score with training-block μ/σ" : "none (zero-variance features dropped)"],
    ["Outputs", c.outputs ? c.outputs.map((o) => `Y${o}`).join(", ") : "all"],
    ["Split", `train first ${c.train_fraction * 100}% · test last ${Math.round((1 - c.train_fraction) * 100)}% (contiguous)`],
    ["PCA components", String(c.n_components)],
    ["Random seed", String(e.random_seed)],
    ["Software", Object.entries(e.software).map(([k, v]) => `${k} ${v}`).join(" · ") || "—"],
  ];
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
      {rows.map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="text-zinc-500">{k}</dt>
          <dd className="min-w-0 break-words">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

function CellDetail({ result, cell, outputs, nAll }: { result: DecoderResult; cell: [number, number]; outputs: number[]; nAll: number }) {
  const [i, j] = cell;
  const c = result.cells[i]?.[j];
  const train = result.sessions[i]!;
  const test = result.sessions[j]!;
  if (!c) return null;
  return (
    <div className="space-y-3">
      <div className="text-sm">
        Train <span className="font-mono font-medium">{train.name}</span> → test <span className="font-mono font-medium">{test.name}</span>
        {i === j && <span className="ml-2 text-xs text-zinc-500">(within-session, held-out block)</span>}
      </div>
      {c.status === "unavailable" ? (
        <Notice>Not computed: {c.reason}</Notice>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
            <Stat label="Mean r" value={formatNumber(c.metrics.mean_r)} />
            <Stat label="Mean R²" value={formatNumber(c.metrics.mean_r2)} />
            <Stat label="Mean RMSE" value={formatNumber(c.metrics.mean_rmse)} />
            <Stat label="Shared neurons" value={c.n_shared} hint={`${train.n_neurons} in ${train.name}, ${test.n_neurons} in ${test.name}`} />
            <Stat label="Used in decoder" value={c.n_used} hint="Shared neurons with non-zero training variance" />
          </div>
          <table className="table-base max-w-lg">
            <thead><tr><th>Output</th><th className="text-right">r</th><th className="text-right">R²</th><th className="text-right">RMSE</th></tr></thead>
            <tbody>
              {c.metrics.r.map((_, k) => (
                <tr key={k}>
                  <td>{outputLabel(outputs[k] ?? k, nAll)}</td>
                  <td className="num text-right font-mono">{formatNumber(c.metrics.r[k])}</td>
                  <td className="num text-right font-mono">{formatNumber(c.metrics.r2[k])}</td>
                  <td className="num text-right font-mono">{formatNumber(c.metrics.rmse[k])}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-xs text-zinc-500">
            {formatNumber(c.n_train)} training bins from {train.name}; {formatNumber(c.n_test)} test bins from {test.name}. Neurons matched by{" "}
            {c.alignment === "neuron_ids" ? "neuron_ids" : "column index"}.
            {c.warning && <span className="text-amber-700"> {c.warning}.</span>}
          </p>
        </>
      )}
    </div>
  );
}

function SessionSummary({ result }: { result: DecoderResult }) {
  const r = result.matrices.mean_r;
  const n = result.sessions.length;
  const mean = (vals: (number | null)[]) => {
    const v = vals.filter((x): x is number => x !== null);
    return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
  };
  return (
    <div className="-mx-4 -my-4 overflow-x-auto">
      <table className="table-base">
        <thead>
          <tr>
            <th>Session</th><th className="text-right">Bins</th><th className="text-right">Neurons</th>
            <th className="text-right">Within r</th>
            <th className="text-right" title="Mean r when this session's decoder is tested on other sessions">Out-transfer r</th>
            <th className="text-right" title="Mean r when other sessions' decoders are tested on this session">In-transfer r</th>
          </tr>
        </thead>
        <tbody>
          {result.sessions.map((s, i) => (
            <tr key={s.id}>
              <td className="font-mono">{s.name}</td>
              <td className="num text-right font-mono">{formatNumber(s.n_samples)}</td>
              <td className="num text-right font-mono">{s.n_neurons}</td>
              <td className="num text-right font-mono">{formatNumber(r[i]?.[i] ?? null)}</td>
              <td className="num text-right font-mono">{formatNumber(mean((r[i] ?? []).filter((_, j) => j !== i)))}</td>
              <td className="num text-right font-mono">{formatNumber(mean(Array.from({ length: n }, (_, k) => (k === i ? null : (r[k]?.[i] ?? null)))))}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function ExperimentPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const exp = useExperiment(id);
  const e = exp.data;
  const project = useApi(() => api.getProject(e!.project_id), e?.project_id ?? null);
  useSetCurrentProject(project.data);
  const matrix = useApi(() => api.getExperimentMatrix(id), e?.status === "completed" ? id : null);
  const [metric, setMetric] = useState<MatrixKey>("mean_r");
  const [selected, setSelected] = useState<[number, number] | null>(null);

  if (exp.loading && !e) return <Spinner />;
  if (exp.error && !e) return <ErrorBox error={exp.error} title="Could not load experiment" />;
  if (!e) return null;

  const decoder = matrix.data?.decoder;
  const summary = matrix.data?.summary.decoder.mean_r;
  const nAll = project.data?.sessions.length ? Math.min(...project.data.sessions.map((s) => s.n_outputs)) : 2;
  const outputs = e.config.outputs ?? Array.from({ length: nAll }, (_, k) => k);

  async function remove() {
    if (!e || !window.confirm(`Delete experiment "${e.name}"?`)) return;
    await api.deleteExperiment(e.id);
    router.push(`/projects/${e.project_id}`);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={
          <span>
            <Link href="/experiments" className="hover:underline">Experiments</Link> /{" "}
            <Link href={`/projects/${e.project_id}`} className="hover:underline">{project.data?.name ?? "…"}</Link>
          </span>
        }
        title={<span className="flex items-center gap-2">{e.name} <StatusBadge status={e.status} /></span>}
        description={`${e.sessions.length} sessions · ${e.sessions.length ** 2} train/test combinations · created ${new Date(e.created_at).toLocaleString("en-CA", { hour12: false })}`}
        actions={e.status !== "running" && <Button variant="danger" onClick={remove}>Delete</Button>}
      />

      {(e.status === "pending" || e.status === "running") && (
        <Card title={e.status === "pending" ? "Queued" : "Running"}>
          <div className="h-2 overflow-hidden rounded bg-zinc-200 dark:bg-zinc-800">
            <div className="h-full bg-accent-600 transition-all" style={{ width: `${Math.round(e.progress * 100)}%` }} />
          </div>
          <p className="mt-2 text-xs text-zinc-500">
            {Math.round(e.progress * 100)} % — one training session at a time on a single worker. This page updates automatically.
          </p>
        </Card>
      )}
      {e.status === "failed" && <ErrorBox error={e.error_message ?? "Unknown error"} title="Experiment failed" />}
      {matrix.error && <ErrorBox error={matrix.error} title="Could not load results" />}

      {decoder && summary && (
        <>
          <div className="card grid grid-cols-2 gap-4 p-4 sm:grid-cols-4">
            <Stat label="Mean within-session r" value={formatNumber(summary.mean_diagonal)} hint="Diagonal: train and test blocks from the same session" />
            <Stat label="Mean cross-session r" value={formatNumber(summary.mean_off_diagonal)} hint="Off-diagonal cells" />
            <Stat label="Unavailable pairs" value={matrix.data!.summary.n_unavailable} hint="Pairs whose neurons could not be aligned" />
            <Stat label="Duration" value={e.started_at && e.finished_at ? `${((Date.parse(e.finished_at) - Date.parse(e.started_at)) / 1000).toFixed(1)} s` : "—"} />
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
            <Card
              title="Decoder generalisation"
              subtitle="Rows: training session. Columns: test session. Click a cell for details."
              actions={
                <select className="input w-auto py-1 text-xs" value={metric} onChange={(ev) => setMetric(ev.target.value as MatrixKey)} aria-label="Matrix metric">
                  {METRICS.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}
                </select>
              }
            >
              <DecoderHeatmap result={decoder} metric={metric} selected={selected} onSelect={setSelected} />
            </Card>
            <div className="space-y-6">
              <Card title="Selected pair">
                {selected ? <CellDetail result={decoder} cell={selected} outputs={outputs} nAll={nAll} /> : <p className="text-sm text-zinc-500">Click a heatmap cell.</p>}
              </Card>
              <Card title="Configuration">
                <ConfigSummary e={e} />
              </Card>
            </div>
          </div>

          <Card title="Session summaries" subtitle="Transfer means exclude the diagonal. Lower transfer does not by itself indicate neural drift: behaviour and recording quality also differ between sessions.">
            <SessionSummary result={decoder} />
          </Card>
        </>
      )}
      {e.status === "completed" && matrix.loading && !decoder && <Spinner label="Loading results…" />}
    </div>
  );
}
