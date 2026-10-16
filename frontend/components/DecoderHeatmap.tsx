"use client";

import { useMemo } from "react";
import type { Data } from "plotly.js";
import { Plot } from "@/components/Plot";
import type { DecoderResult, MatrixKey } from "@/types/api";

export const METRICS: { key: MatrixKey; label: string; better: "high" | "low"; fmt: string }[] = [
  { key: "mean_r", label: "Mean Pearson r", better: "high", fmt: ".2f" },
  { key: "mean_r2", label: "Mean R²", better: "high", fmt: ".2f" },
  { key: "mean_rmse", label: "Mean RMSE", better: "low", fmt: ".2f" },
  { key: "n_shared", label: "Shared neurons", better: "high", fmt: "d" },
];

// Sequential light → dark blue; darker = better for the selected metric.
const BLUES: [number, string][] = [
  [0, "#f4f7fb"],
  [0.25, "#c9d9ee"],
  [0.5, "#8fb0da"],
  [0.75, "#4f7fbe"],
  [1, "#1f3f73"],
];

export function DecoderHeatmap({
  result,
  metric,
  selected,
  onSelect,
}: {
  result: DecoderResult;
  metric: MatrixKey;
  selected: [number, number] | null;
  onSelect: (cell: [number, number]) => void;
}) {
  const names = result.sessions.map((s) => s.name);
  const n = names.length;
  const spec = METRICS.find((m) => m.key === metric) ?? METRICS[0]!;

  const { data, layout } = useMemo(() => {
    const z = result.matrices[metric];
    const custom = result.cells.map((row) =>
      row.map((c) =>
        c.status === "ok"
          ? [c.metrics.mean_r ?? NaN, c.metrics.mean_r2 ?? NaN, c.metrics.mean_rmse, c.n_shared]
          : [NaN, NaN, NaN, NaN],
      ),
    );
    const finite = z.flat().filter((v): v is number => v !== null && Number.isFinite(v));
    // Colour range spans the observed values so differences between cells stay visible;
    // R² is clipped at −1 because cross-session R² can be arbitrarily negative.
    const zmin = metric === "mean_r2" ? Math.max(-1, Math.min(...finite)) : Math.min(...finite);
    const zmax = Math.max(...finite);
    const trace = {
      type: "heatmap",
      x: names,
      y: names,
      z: z.map((row) => row.map((v) => (v === null ? NaN : v))),
      customdata: custom,
      zmin,
      zmax,
      colorscale: BLUES,
      reversescale: spec.better === "low",
      xgap: 1,
      ygap: 1,
      texttemplate: n <= 16 ? `%{z:${spec.fmt}}` : "",
      textfont: { size: n <= 8 ? 12 : 10 },
      hovertemplate:
        "train <b>%{y}</b> → test <b>%{x}</b><br>r %{customdata[0]:.3f}<br>R² %{customdata[1]:.3f}<br>RMSE %{customdata[2]:.3f}<br>shared neurons %{customdata[3]}<extra></extra>",
      colorbar: { thickness: 10, title: { text: spec.label, side: "right" }, outlinewidth: 0 },
    } as unknown as Data;
    const shapes = selected
      ? [{ type: "rect" as const, xref: "x" as const, yref: "y" as const, x0: selected[1] - 0.5, x1: selected[1] + 0.5, y0: selected[0] - 0.5, y1: selected[0] + 0.5, line: { color: "#c2410c", width: 2.5 } }]
      : [];
    return {
      data: [trace],
      layout: {
        xaxis: { title: { text: "test session" }, side: "bottom" as const, tickangle: n > 8 ? -45 : 0, type: "category" as const, showgrid: false },
        yaxis: { title: { text: "train session" }, autorange: "reversed" as const, type: "category" as const, showgrid: false },
        margin: { l: 90, r: 20, t: 10, b: 80 },
        shapes,
      },
    };
  }, [result, metric, selected, names, n, spec]);

  const height = Math.max(360, 60 + n * 40);
  return (
    <div className="overflow-x-auto">
      <div style={{ minWidth: Math.max(420, 120 + n * 44) }}>
        <Plot
          data={data}
          layout={layout}
          height={height}
          onClick={(e) => {
            const p = e.points[0];
            if (!p) return;
            const i = names.indexOf(String(p.y));
            const j = names.indexOf(String(p.x));
            if (i >= 0 && j >= 0) onSelect([i, j]);
          }}
        />
      </div>
    </div>
  );
}
