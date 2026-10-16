"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useSetCurrentProject } from "@/components/CurrentProject";
import { DriftScatter } from "@/components/DriftScatter";
import { StatusBadge } from "@/components/ExperimentsTable";
import { MatrixHeatmap, type MatrixSpec } from "@/components/MatrixHeatmap";
import { Button, Card, ErrorBox, Notice, PageHeader, Spinner, Stat } from "@/components/ui";
import { api } from "@/lib/api";
import { formatNumber } from "@/lib/format";
import { useApi } from "@/lib/useApi";
import type { DecoderResult, Experiment, MatrixKey, SubspaceKey, SubspaceResult } from "@/types/api";

const POLL_MS = 1500;

const DECODER_SPECS: Record<Exclude<MatrixKey, "n_used">, MatrixSpec> = {
  mean_r: { label: "Mean Pearson r", better: "high", fmt: ".2f" },
  mean_r2: { label: "Mean R²", better: "high", fmt: ".2f", clipMin: -1 },
  mean_rmse: { label: "Mean RMSE", better: "low", fmt: ".2f" },
  n_shared: { label: "Shared neurons", better: "high", fmt: "d" },
};

const SUBSPACE_SPECS: Partial<Record<SubspaceKey, MatrixSpec>> = {
  mean_angle: { label: "Mean principal angle (°)", better: "low", fmt: ".0f" },
  max_angle: { label: "Largest principal angle (°)", better: "low", fmt: ".0f" },
  projection_distance: { label: "Projection distance", better: "low", fmt: ".2f" },
  alignment_index: { label: "Alignment index", better: "high", fmt: ".2f" },
};

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

function SessionSummary({ decoder, subspace }: { decoder: DecoderResult; subspace: SubspaceResult | null }) {
  const r = decoder.matrices.mean_r;
  const ang = subspace?.matrices.mean_angle;
  const n = decoder.sessions.length;
  const mean = (vals: (number | null | undefined)[]) => {
    const v = vals.filter((x): x is number => x !== null && x !== undefined);
    return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
  };
  const offRow = (m: (number | null)[][] | undefined, i: number) => mean((m?.[i] ?? []).filter((_, j) => j !== i));
  const offCol = (m: (number | null)[][] | undefined, i: number) => mean(Array.from({ length: n }, (_, k) => (k === i ? null : m?.[k]?.[i])));
  return (
    <div className="-mx-4 -my-4 overflow-x-auto">
      <table className="table-base">
        <thead>
          <tr>
            <th>Session</th><th className="text-right">Bins</th><th className="text-right">Neurons</th>
            <th className="text-right">Within r</th>
            <th className="text-right" title="Mean r when this session's decoder is tested on other sessions">Out-transfer r</th>
            <th className="text-right" title="Mean r when other sessions' decoders are tested on this session">In-transfer r</th>
            <th className="text-right" title="First vs last block of the same session">Within angle</th>
            <th className="text-right" title="Mean angle to the other sessions (as training session)">Mean angle to others</th>
          </tr>
        </thead>
        <tbody>
          {decoder.sessions.map((s, i) => (
            <tr key={s.id}>
              <td className="font-mono">{s.name}</td>
              <td className="num text-right font-mono">{formatNumber(s.n_samples)}</td>
              <td className="num text-right font-mono">{s.n_neurons}</td>
              <td className="num text-right font-mono">{formatNumber(r[i]?.[i] ?? null)}</td>
              <td className="num text-right font-mono">{formatNumber(offRow(r, i))}</td>
              <td className="num text-right font-mono">{formatNumber(offCol(r, i))}</td>
              <td className="num text-right font-mono">{ang ? `${formatNumber(ang[i]?.[i] ?? null, 1)}°` : "—"}</td>
              <td className="num text-right font-mono">{ang ? `${formatNumber(offRow(ang, i), 1)}°` : "—"}</td>
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
  const [decoderMetric, setDecoderMetric] = useState<keyof typeof DECODER_SPECS>("mean_r");
  const [subspaceMetric, setSubspaceMetric] = useState<SubspaceKey>("mean_angle");

  const decoder = matrix.data?.decoder;
  const subspace = matrix.data?.subspace ?? null;
  const names = useMemo(() => decoder?.sessions.map((s) => s.name) ?? [], [decoder]);

  const decoderCustom = useMemo(
    () =>
      decoder?.cells.map((row) =>
        row.map((c) => (c.status === "ok" ? [c.metrics.mean_r ?? NaN, c.metrics.mean_r2 ?? NaN, c.metrics.mean_rmse, c.n_shared] : [NaN, NaN, NaN, "n/a"])),
      ) ?? [],
    [decoder],
  );
  const subspaceCustom = useMemo(
    () =>
      subspace?.cells.map((row) =>
        row.map((c) =>
          c.status === "ok" ? [c.mean_angle, c.max_angle, c.chance_mean_angle, c.alignment_index, c.n_neurons_used, c.k] : [NaN, NaN, NaN, NaN, "n/a", "n/a"],
        ),
      ) ?? [],
    [subspace],
  );

  if (exp.loading && !e) return <Spinner />;
  if (exp.error && !e) return <ErrorBox error={exp.error} title="Could not load experiment" />;
  if (!e) return null;

  const openPair = ([i, j]: [number, number]) => {
    const train = e.sessions[i];
    const test = e.sessions[j];
    if (train && test) router.push(`/projects/${e.project_id}/compare/${train.id}/${test.id}?experiment=${e.id}`);
  };

  async function remove() {
    if (!e || !window.confirm(`Delete experiment "${e.name}"?`)) return;
    await api.deleteExperiment(e.id);
    router.push(`/projects/${e.project_id}`);
  }

  const dSummary = matrix.data?.summary.decoder.mean_r;
  const sSummary = matrix.data?.summary.subspace?.mean_angle;

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
            {Math.round(e.progress * 100)} % — decoder matrix, then subspace matrix, on a single worker. This page updates automatically.
          </p>
        </Card>
      )}
      {e.status === "failed" && <ErrorBox error={e.error_message ?? "Unknown error"} title="Experiment failed" />}
      {matrix.error && <ErrorBox error={matrix.error} title="Could not load results" />}
      {e.status === "completed" && matrix.loading && !decoder && <Spinner label="Loading results…" />}

      {decoder && dSummary && (
        <>
          <div className="card grid grid-cols-2 gap-4 p-4 sm:grid-cols-5">
            <Stat label="Within-session r" value={formatNumber(dSummary.mean_diagonal)} hint="Mean of the diagonal" />
            <Stat label="Cross-session r" value={formatNumber(dSummary.mean_off_diagonal)} hint="Mean of off-diagonal cells" />
            <Stat label="Within-session angle" value={sSummary ? `${formatNumber(sSummary.mean_diagonal, 1)}°` : "—"} hint="First vs last block of the same session" />
            <Stat label="Cross-session angle" value={sSummary ? `${formatNumber(sSummary.mean_off_diagonal, 1)}°` : "—"} />
            <Stat label="Unavailable pairs" value={matrix.data!.summary.n_unavailable} hint="Pairs whose neurons could not be aligned" />
          </div>

          <div className="grid gap-6 2xl:grid-cols-2">
            <Card
              title="Decoder generalisation"
              subtitle="Rows train, columns test. Click a cell to open the pair comparison."
              actions={
                <select className="input w-auto py-1 text-xs" value={decoderMetric} onChange={(ev) => setDecoderMetric(ev.target.value as keyof typeof DECODER_SPECS)} aria-label="Decoder metric">
                  {Object.entries(DECODER_SPECS).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}
                </select>
              }
            >
              <MatrixHeatmap
                names={names}
                z={decoder.matrices[decoderMetric]}
                spec={DECODER_SPECS[decoderMetric]}
                customdata={decoderCustom}
                hover="r %{customdata[0]:.3f}<br>R² %{customdata[1]:.3f}<br>RMSE %{customdata[2]:.3f}<br>shared neurons %{customdata[3]}"
                onSelect={openPair}
              />
            </Card>

            <Card
              title="Neural subspace drift"
              subtitle={
                subspace
                  ? `Top-${subspace.n_components} PCA subspaces fit independently: rows on the training block, columns on the test block. Lower angle = more similar.`
                  : undefined
              }
              actions={
                subspace && (
                  <select className="input w-auto py-1 text-xs" value={subspaceMetric} onChange={(ev) => setSubspaceMetric(ev.target.value as SubspaceKey)} aria-label="Subspace metric">
                    {Object.entries(SUBSPACE_SPECS).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}
                  </select>
                )
              }
            >
              {subspace ? (
                <>
                  <MatrixHeatmap
                    names={names}
                    z={subspace.matrices[subspaceMetric]}
                    spec={SUBSPACE_SPECS[subspaceMetric]!}
                    customdata={subspaceCustom}
                    hover="mean angle %{customdata[0]:.1f}°<br>largest angle %{customdata[1]:.1f}°<br>chance %{customdata[2]:.1f}°<br>alignment index %{customdata[3]:.2f}<br>neurons %{customdata[4]} · k %{customdata[5]}"
                    onSelect={openPair}
                  />
                  <p className="mt-2 text-xs text-zinc-500" title="Random k-dimensional subspaces of the same neuron space are not orthogonal on average.">
                    Chance level (random subspaces, same k and neuron count) ≈ {formatNumber(subspace.matrices.chance_mean_angle[0]?.[0] ?? null, 1)}°. The diagonal
                    is the within-session reference: same session, different time blocks.
                  </p>
                </>
              ) : (
                <Notice>This experiment was run before subspace analysis was available. Run a new experiment to compute it.</Notice>
              )}
            </Card>
          </div>

          {subspace && (
            <Card title="Performance vs representation drift" subtitle="One point per train → test pair. Click a point to open the pair.">
              <DriftScatter decoder={decoder} subspace={subspace} onSelect={openPair} />
            </Card>
          )}

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
            <Card title="Session summaries" subtitle="Transfer means exclude the diagonal. Lower transfer does not by itself indicate neural drift: behaviour and recording quality also differ.">
              <SessionSummary decoder={decoder} subspace={subspace} />
            </Card>
            <Card title="Configuration">
              <ConfigSummary e={e} />
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
