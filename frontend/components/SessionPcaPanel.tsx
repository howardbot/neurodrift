"use client";

import { useMemo, useState } from "react";
import type { Data } from "plotly.js";
import { Plot } from "@/components/Plot";
import { ErrorBox, Spinner, Stat } from "@/components/ui";
import { api } from "@/lib/api";
import { formatNumber } from "@/lib/format";
import { useApi } from "@/lib/useApi";
import type { SessionPca } from "@/types/api";

const OPTIONS = [3, 5, 10, 20] as const;

function PcaPlots({ pca }: { pca: SessionPca }) {
  const k = pca.n_components;
  const spectrum = useMemo<Data[]>(() => {
    const idx = pca.explained_variance_ratio.map((_, i) => i + 1);
    return [
      { type: "bar", x: idx, y: pca.explained_variance_ratio.map((v) => v * 100), name: "per component", marker: { color: idx.map((i) => (i <= k ? "#2f5d9e" : "#a1a1aa")) } },
      { type: "scatter", mode: "lines+markers", x: idx, y: pca.cumulative_explained_variance.map((v) => v * 100), name: "cumulative", yaxis: "y2", line: { color: "#c2410c", width: 1.5 }, marker: { size: 4 } },
    ];
  }, [pca, k]);

  const tr = pca.trajectory;
  const timecourses = useMemo<Data[]>(
    () => tr.pcs.map((y, i) => ({ type: "scatter", mode: "lines", x: tr.time, y, name: `PC${i + 1}`, line: { width: 1.2 } })),
    [tr],
  );
  const plane = useMemo<Data[]>(() => {
    const [pc1, pc2] = tr.pcs;
    const colour = tr.behaviour[0] ?? [];
    return [
      { type: "scatter", mode: "lines", x: pc1, y: pc2, line: { color: "rgba(113,113,122,0.35)", width: 1 }, hoverinfo: "skip", showlegend: false },
      { type: "scatter", mode: "markers", x: pc1, y: pc2, marker: { size: 3, color: colour, colorscale: "RdBu", showscale: true, colorbar: { thickness: 8, title: { text: "Y₀", side: "right" } } }, hovertemplate: "PC1 %{x:.2f}<br>PC2 %{y:.2f}<extra></extra>", showlegend: false },
    ];
  }, [tr]);

  const xTitle = tr.time_unit === "s" ? "time (s)" : "time bin";
  return (
    <div className="space-y-4">
      <div>
        <div className="text-xs font-medium text-zinc-500">Explained variance (blue: first {k} components)</div>
        <Plot
          data={spectrum}
          layout={{
            xaxis: { title: { text: "component" } },
            yaxis: { title: { text: "% variance" } },
            yaxis2: { title: { text: "cumulative %" }, overlaying: "y", side: "right", range: [0, 100], showgrid: false },
            margin: { l: 50, r: 50, t: 10, b: 60 },
          }}
          height={230}
        />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div>
          <div className="text-xs font-medium text-zinc-500">PC time courses — first {formatNumber(tr.time.length)} bins ({tr.smooth_bins}-bin boxcar, display only)</div>
          <Plot data={timecourses} layout={{ xaxis: { title: { text: xTitle } }, yaxis: { title: { text: "projection" } }, margin: { l: 50, r: 10, t: 10, b: 60 } }} height={260} />
        </div>
        <div>
          <div className="text-xs font-medium text-zinc-500">Trajectory in PC1–PC2, coloured by behaviour Y₀</div>
          <Plot data={plane} layout={{ xaxis: { title: { text: "PC1" } }, yaxis: { title: { text: "PC2" } }, margin: { l: 50, r: 10, t: 10, b: 44 } }} height={260} />
        </div>
      </div>
    </div>
  );
}

export function SessionPcaPanel({ sessionId, nNeurons }: { sessionId: string; nNeurons: number }) {
  const [k, setK] = useState<number>(Math.min(10, OPTIONS.filter((o) => o < nNeurons).at(-1) ?? 3));
  const [zscore, setZscore] = useState(true);
  const { data, error, loading } = useApi(() => api.getSessionPca(sessionId, k, zscore), `${sessionId}:${k}:${zscore}`);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-4 text-sm">
        <div>
          <label className="label" htmlFor="pca-components">Components</label>
          <select id="pca-components" className="input w-28" value={k} onChange={(e) => setK(Number(e.target.value))}>
            {OPTIONS.map((o) => <option key={o} value={o} disabled={o >= nNeurons}>{o}</option>)}
          </select>
        </div>
        <label className="flex items-center gap-2 pb-1.5">
          <input type="checkbox" checked={zscore} onChange={(e) => setZscore(e.target.checked)} /> Z-score neurons
        </label>
        <span className="pb-1.5 text-xs text-zinc-500">Fit on the whole session; zero-variance neurons dropped.</span>
      </div>
      {error && <ErrorBox error={error} title="PCA failed" />}
      {loading && !data && <Spinner label="Fitting PCA…" />}
      {data && (
        <div className={loading ? "opacity-60" : ""}>
          <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat label={`Variance in ${data.n_components} PCs`} value={`${(data.variance_explained_by_k * 100).toFixed(1)} %`} />
            <Stat label="PC1" value={`${((data.explained_variance_ratio[0] ?? 0) * 100).toFixed(1)} %`} />
            <Stat label="Neurons used" value={data.n_features_used} hint={`${data.n_features_dropped} zero-variance neurons dropped`} />
            <Stat label="Preprocessing" value={data.zscore ? "z-score" : "centre"} />
          </div>
          <PcaPlots pca={data} />
        </div>
      )}
    </div>
  );
}
