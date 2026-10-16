"use client";

import { useMemo, useState } from "react";
import type { Data } from "plotly.js";
import { DecoderControls, defaultDecoderSettings, type DecoderSettings } from "@/components/DecoderControls";
import { Plot } from "@/components/Plot";
import { Button, ErrorBox, Spinner, Stat } from "@/components/ui";
import { api } from "@/lib/api";
import { formatNumber, outputLabel } from "@/lib/format";
import { useApi } from "@/lib/useApi";
import type { DecodeResult } from "@/types/api";

const ACTUAL = "#c2410c";
const PREDICTED = "#2f5d9e";

function DecodePlots({ result, nOutputs }: { result: DecodeResult; nOutputs: number }) {
  const outputs = result.config.outputs;
  const traces = useMemo(
    () =>
      outputs.map((o, j): Data[] => [
        // Actual is drawn last so the smooth behaviour stays visible over noisy single-bin predictions.
        { type: "scattergl", mode: "lines", x: result.traces.time, y: result.traces.predicted[j], name: "predicted", line: { color: PREDICTED, width: 1 }, opacity: 0.75 },
        { type: "scattergl", mode: "lines", x: result.traces.time, y: result.traces.actual[j], name: "actual", line: { color: ACTUAL, width: 1.6 } },
      ]),
    [result, outputs],
  );
  const scatters = useMemo(
    () =>
      outputs.map((o, j): Data[] => {
        const a = result.scatter.actual[j] ?? [];
        const lo = Math.min(...a);
        const hi = Math.max(...a);
        return [
          { type: "scattergl", mode: "markers", x: a, y: result.scatter.predicted[j], marker: { size: 3, color: PREDICTED, opacity: 0.35 }, name: "test bins", hovertemplate: "actual %{x:.2f}<br>predicted %{y:.2f}<extra></extra>" },
          { type: "scatter", mode: "lines", x: [lo, hi], y: [lo, hi], line: { color: ACTUAL, dash: "dash", width: 1 }, name: "y = x", hoverinfo: "skip" },
        ];
      }),
    [result, outputs],
  );
  const xTitle = result.traces.time_unit === "s" ? "time (s)" : "time bin";
  return (
    <div className="space-y-4">
      {outputs.map((o, j) => (
        <div key={o} className="grid gap-4 lg:grid-cols-[1fr_280px]">
          <div>
            <div className="text-xs font-medium text-zinc-500">{outputLabel(o, nOutputs)} — predicted vs actual, start of test block</div>
            <Plot data={traces[j] ?? []} layout={{ xaxis: { title: { text: xTitle } }, margin: { l: 50, r: 10, t: 10, b: 60 } }} height={200} />
          </div>
          <div>
            <div className="text-xs font-medium text-zinc-500">{outputLabel(o, nOutputs)} — all test bins (subsample)</div>
            <Plot data={scatters[j] ?? []} layout={{ showlegend: false, xaxis: { title: { text: "actual" } }, yaxis: { title: { text: "predicted" } }, margin: { l: 50, r: 10, t: 10, b: 44 } }} height={200} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function DecodingPanel({ sessionId, nOutputs }: { sessionId: string; nOutputs: number }) {
  const [draft, setDraft] = useState<DecoderSettings>(() => defaultDecoderSettings(nOutputs));
  const [applied, setApplied] = useState<DecoderSettings>(draft);
  const key = `${sessionId}:${JSON.stringify(applied)}`;
  const { data, error, loading } = useApi(() => api.decodeSession(sessionId, applied), key);
  const dirty = JSON.stringify(draft) !== JSON.stringify(applied);
  const m = data?.metrics;

  return (
    <div className="space-y-4">
      <DecoderControls value={draft} onChange={setDraft} nOutputs={nOutputs} />
      <div className="flex items-center gap-3">
        <Button variant="primary" onClick={() => setApplied(draft)} disabled={!dirty || loading || !(draft.alpha > 0)}>
          Evaluate
        </Button>
        <span className="text-xs text-zinc-500">
          Train on the first 80 % of bins, test on the last 20 % (contiguous, not shuffled). Normalisation uses training-block statistics only.
        </span>
      </div>
      {error && <ErrorBox error={error} title="Decoding failed" />}
      {loading && !data && <Spinner label="Fitting decoder…" />}
      {data && m && (
        <div className={loading ? "opacity-60" : ""}>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-6">
            <Stat label="Mean Pearson r" value={formatNumber(m.mean_r)} hint="Headline metric: mean over selected outputs" />
            <Stat label="Mean R²" value={formatNumber(m.mean_r2)} />
            <Stat label="Mean RMSE" value={formatNumber(m.mean_rmse)} />
            <Stat label="Train / test bins" value={`${formatNumber(data.split.n_train)} / ${formatNumber(data.split.n_test)}`} />
            <Stat label="Neurons used" value={`${data.features.n_used} / ${data.features.n_in}`} hint="Zero-variance neurons (in the training block) are dropped" />
            <Stat label="Decoder" value={data.config.decoder === "ridge" ? `ridge α=${data.config.alpha}` : "OLS"} />
          </div>
          {m.n_undefined > 0 && <p className="mt-2 text-xs text-amber-700">{m.n_undefined} metric value(s) are undefined (constant signal) and excluded from means.</p>}
          <table className="table-base mt-4 max-w-xl">
            <thead><tr><th>Output</th><th className="text-right">Pearson r</th><th className="text-right">R²</th><th className="text-right">RMSE</th></tr></thead>
            <tbody>
              {data.config.outputs.map((o, j) => (
                <tr key={o}>
                  <td>{outputLabel(o, nOutputs)}</td>
                  <td className="num text-right font-mono">{formatNumber(m.r[j])}</td>
                  <td className="num text-right font-mono">{formatNumber(m.r2[j])}</td>
                  <td className="num text-right font-mono">{formatNumber(m.rmse[j])}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-4"><DecodePlots result={data} nOutputs={nOutputs} /></div>
        </div>
      )}
    </div>
  );
}
