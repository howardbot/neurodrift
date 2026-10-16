"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import type { Data } from "plotly.js";
import { useSetCurrentProject } from "@/components/CurrentProject";
import { DecodingPanel } from "@/components/DecodingPanel";
import { SessionPcaPanel } from "@/components/SessionPcaPanel";
import { Plot } from "@/components/Plot";
import { Button, Card, ErrorBox, Notice, PageHeader, Spinner, Stat } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import { binCenters, formatBytes, formatDuration, formatNumber, outputLabel } from "@/lib/format";
import { useApi } from "@/lib/useApi";
import type { Session, SessionQc } from "@/types/api";

function MetadataForm({ session, onSaved }: { session: Session; onSaved: () => void }) {
  const [subject, setSubject] = useState(session.subject ?? "");
  const [date, setDate] = useState(session.recording_date ?? "");
  const [bin, setBin] = useState(session.bin_size_ms?.toString() ?? "");
  const [order, setOrder] = useState(session.session_order.toString());
  const [notes, setNotes] = useState(session.notes);
  const [error, setError] = useState<ApiError>();

  async function save(e: FormEvent) {
    e.preventDefault();
    try {
      await api.updateSession(session.id, {
        subject: subject.trim() || null,
        recording_date: date || null,
        bin_size_ms: bin ? Number(bin) : null,
        session_order: Number(order),
        notes,
      });
      onSaved();
    } catch (err) {
      setError(err as ApiError);
    }
  }

  return (
    <form onSubmit={save} className="grid grid-cols-2 gap-3 text-sm">
      <div><label className="label" htmlFor="md-subject">Subject</label><input id="md-subject" className="input" value={subject} onChange={(e) => setSubject(e.target.value)} /></div>
      <div><label className="label" htmlFor="md-date">Recording date</label><input id="md-date" type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} /></div>
      <div><label className="label" htmlFor="md-bin">Bin size (ms)</label><input id="md-bin" type="number" min="0" step="any" className="input" value={bin} onChange={(e) => setBin(e.target.value)} /></div>
      <div><label className="label" htmlFor="md-order">Session order</label><input id="md-order" type="number" min="0" step="1" className="input" value={order} onChange={(e) => setOrder(e.target.value)} /></div>
      <div className="col-span-2"><label className="label" htmlFor="md-notes">Notes</label><textarea id="md-notes" className="input" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
      {error && <div className="col-span-2"><ErrorBox error={error} /></div>}
      <div className="col-span-2"><Button type="submit" variant="primary">Save metadata</Button></div>
    </form>
  );
}

function Metadata({ session, onSaved }: { session: Session; onSaved: () => void }) {
  const [editing, setEditing] = useState(false);
  const rows: [string, React.ReactNode][] = [
    ["Subject", session.subject ?? "—"],
    ["Recording date", session.recording_date ?? "—"],
    ["Bin size", session.bin_size_ms ? `${session.bin_size_ms} ms` : "—"],
    ["Session order", session.session_order],
    ["Original file", <span key="f" className="block whitespace-normal break-all font-mono text-xs">{session.original_filename || "—"}</span>],
    ["File size", formatBytes(session.file_size_bytes)],
    ["SHA-256", <span key="h" className="font-mono text-xs" title={session.sha256}>{session.sha256.slice(0, 16)}…</span>],
    ["Optional arrays", [session.has_timestamps && "timestamps", session.has_trial_ids && "trial_ids", session.has_neuron_ids && "neuron_ids"].filter(Boolean).join(", ") || "none"],
    ["Notes", session.notes || "—"],
  ];
  return (
    <Card title="Metadata" actions={<Button variant="ghost" onClick={() => setEditing(!editing)}>{editing ? "Cancel" : "Edit"}</Button>}>
      {editing ? (
        <MetadataForm session={session} onSaved={() => { setEditing(false); onSaved(); }} />
      ) : (
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
          {rows.map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="text-zinc-500">{k}</dt>
              <dd className="min-w-0 truncate">{v}</dd>
            </div>
          ))}
        </dl>
      )}
    </Card>
  );
}

function ActivityPlots({ qc }: { qc: SessionQc }) {
  const { means, vars, scatter } = useMemo(() => {
    const n = qc.neurons;
    const hist = (x: number[], color: string): Data[] => [{ type: "histogram", x, marker: { color }, nbinsx: 30 } as Data]; // nbinsx is missing from @types/plotly.js
    return {
      means: hist(n.mean, "#2f5d9e"),
      vars: hist(n.var, "#2f5d9e"),
      scatter: [
        {
          type: "scatter",
          mode: "markers",
          x: n.mean,
          y: n.var,
          text: n.labels.map((l) => `neuron ${l}`),
          hovertemplate: "%{text}<br>mean %{x:.3f}<br>var %{y:.3f}<extra></extra>",
          marker: { size: 6, color: n.zero_variance.map((z) => (z ? "#b91c1c" : "#2f5d9e")), opacity: 0.8 },
        },
      ] as Data[],
    };
  }, [qc]);
  const common = { showlegend: false, margin: { l: 50, r: 10, t: 10, b: 44 } };
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div><div className="text-xs font-medium text-zinc-500">Mean activity per neuron</div><Plot data={means} layout={{ ...common, xaxis: { title: { text: "mean per bin" } }, yaxis: { title: { text: "neurons" } } }} height={220} /></div>
      <div><div className="text-xs font-medium text-zinc-500">Variance per neuron</div><Plot data={vars} layout={{ ...common, xaxis: { title: { text: "variance" } }, yaxis: { title: { text: "neurons" } } }} height={220} /></div>
      <div><div className="text-xs font-medium text-zinc-500">Mean vs variance (red: zero variance)</div><Plot data={scatter} layout={{ ...common, xaxis: { title: { text: "mean" } }, yaxis: { title: { text: "variance" } } }} height={220} /></div>
    </div>
  );
}

function TracePlots({ qc, nOutputs }: { qc: SessionQc; nOutputs: number }) {
  const t = qc.traces;
  const xTitle = t.time_unit === "s" ? "time (s)" : "time bin";
  const targets = useMemo<Data[]>(() => t.targets.map((y, j) => ({ type: "scattergl", mode: "lines", x: t.time, y, name: outputLabel(j, nOutputs), line: { width: 1 } })), [t, nOutputs]);
  const neurons = useMemo<Data[]>(() => {
    // Stack the example neurons with a fixed vertical offset, like a raster of rate traces.
    const spans = t.neurons.map((y) => Math.max(...y) - Math.min(...y) || 1);
    const step = Math.max(...spans) * 1.1;
    return t.neurons.map((y, i) => ({
      type: "scattergl",
      mode: "lines",
      x: t.time,
      y: y.map((v) => v + i * step),
      name: `neuron ${t.neuron_labels[i]}`,
      line: { width: 1 },
      hovertemplate: `neuron ${t.neuron_labels[i]}<br>%{x}<extra></extra>`,
    }));
  }, [t]);
  return (
    <div className="space-y-4">
      <div>
        <div className="text-xs font-medium text-zinc-500">Behavioural targets — first {formatNumber(t.window_bins)} bins</div>
        <Plot data={targets} layout={{ xaxis: { title: { text: xTitle } }, yaxis: { title: { text: "Y" } }, margin: { l: 50, r: 10, t: 10, b: 60 } }} height={220} />
      </div>
      <div>
        <div className="text-xs font-medium text-zinc-500">Six most variable neurons (vertically offset) — same window</div>
        <Plot data={neurons} layout={{ xaxis: { title: { text: xTitle } }, yaxis: { showticklabels: false, title: { text: "activity (offset)" } }, showlegend: false, margin: { l: 50, r: 10, t: 10, b: 44 } }} height={300} />
      </div>
    </div>
  );
}

function BehaviourPlots({ qc, nOutputs }: { qc: SessionQc; nOutputs: number }) {
  const data = useMemo<Data[]>(
    () => qc.targets.histograms.map((h, j) => ({ type: "bar", x: binCenters(h.edges), y: h.counts, name: outputLabel(j, nOutputs), opacity: 0.65 })),
    [qc, nOutputs],
  );
  return <Plot data={data} layout={{ barmode: "overlay", bargap: 0, xaxis: { title: { text: "value" } }, yaxis: { title: { text: "bins" } }, margin: { l: 50, r: 10, t: 10, b: 60 } }} height={240} />;
}

export default function SessionPage() {
  const { id } = useParams<{ id: string }>();
  const session = useApi(() => api.getSession(id), id);
  const qc = useApi(() => api.getSessionQc(id), id);
  const project = useApi(() => api.getProject(session.data!.project_id), session.data?.project_id ?? null);
  useSetCurrentProject(project.data);

  if (session.loading && !session.data) return <Spinner />;
  if (session.error) return <ErrorBox error={session.error} title="Could not load session" />;
  const s = session.data;
  if (!s) return null;
  const summary = s.qc_summary;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={
          <span>
            <Link href="/projects" className="hover:underline">Projects</Link> /{" "}
            <Link href={`/projects/${s.project_id}`} className="hover:underline">{project.data?.name ?? "…"}</Link>
          </span>
        }
        title={<span className="font-mono">{s.name}</span>}
        description={`${formatNumber(s.n_samples)} time bins × ${s.n_neurons} neurons → ${s.n_outputs} behavioural output${s.n_outputs === 1 ? "" : "s"}`}
      />

      {s.warnings.length > 0 && (
        <Notice>
          <ul className="list-disc pl-5">{s.warnings.map((w) => <li key={w}>{w}</li>)}</ul>
        </Notice>
      )}

      <div className="card grid grid-cols-2 gap-4 p-4 sm:grid-cols-4 lg:grid-cols-8">
        <Stat label="Bins" value={formatNumber(s.n_samples)} />
        <Stat label="Neurons" value={s.n_neurons} />
        <Stat label="Outputs" value={s.n_outputs} />
        <Stat label="Duration" value={formatDuration(s.duration_s)} hint={s.has_timestamps ? "From timestamps" : "No timestamps"} />
        <Stat label="Trials" value={summary.n_trials ?? "—"} />
        <Stat label="% zero bins" value={summary.pct_zero.toFixed(1)} />
        <Stat label="Flat neurons" value={summary.n_zero_variance_neurons} hint="Zero variance; dropped before decoding/PCA" />
        <Stat label="NaN" value={summary.nan_count} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
        <Metadata session={s} onSaved={session.reload} />
        <Card title="Activity statistics" subtitle={summary.count_like ? "X looks like spike counts (non-negative integers)." : "X is not integer-valued; treated as generic activity features."}>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat label="Mean / bin" value={formatNumber(summary.mean_activity)} hint="Grand mean of X" />
            <Stat label="Median neuron mean" value={formatNumber(summary.median_neuron_mean)} />
            <Stat label="Median neuron var" value={formatNumber(summary.median_neuron_var)} />
            <Stat label="Silent neurons" value={summary.n_silent_neurons} hint="All-zero columns" />
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="table-base">
              <thead><tr><th>Output</th><th className="text-right">Mean</th><th className="text-right">Variance</th><th className="text-right">SD</th></tr></thead>
              <tbody>
                {summary.target_mean.map((m, j) => (
                  <tr key={j}>
                    <td>{outputLabel(j, s.n_outputs)}</td>
                    <td className="num text-right font-mono">{formatNumber(m)}</td>
                    <td className="num text-right font-mono">{formatNumber(summary.target_var[j])}</td>
                    <td className="num text-right font-mono">{formatNumber(summary.target_std[j])}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {qc.error && <ErrorBox error={qc.error} title="Could not load QC" />}
      {qc.loading && !qc.data && <Spinner label="Loading QC…" />}
      {qc.data && (
        <>
          <Card title="Quality control">
            <ActivityPlots qc={qc.data} />
          </Card>
          <Card title="Traces">
            <TracePlots qc={qc.data} nOutputs={s.n_outputs} />
          </Card>
          <Card title="Behaviour" subtitle="Distribution of each behavioural output over all bins.">
            <BehaviourPlots qc={qc.data} nOutputs={s.n_outputs} />
          </Card>
        </>
      )}

      <Card title="Within-session decoding" subtitle="Linear decoder from neural activity X to behaviour Y, evaluated on a held-out contiguous block.">
        <DecodingPanel sessionId={s.id} nOutputs={s.n_outputs} />
      </Card>

      <Card title="PCA" subtitle="Neural population structure within this session.">
        <SessionPcaPanel sessionId={s.id} nNeurons={s.n_neurons} />
      </Card>
    </div>
  );
}
