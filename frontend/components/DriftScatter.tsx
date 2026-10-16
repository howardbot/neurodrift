"use client";

import { useMemo } from "react";
import type { Data } from "plotly.js";
import { Plot } from "@/components/Plot";
import { formatNumber } from "@/lib/format";
import { spearman } from "@/lib/stats";
import type { DecoderResult, SubspaceResult } from "@/types/api";

const DISTANCE_COLOURS = ["#1f3f73", "#2f5d9e", "#4f7fbe", "#8fb0da", "#c2410c", "#a16207", "#7e22ce", "#15803d"];

/** Decoder generalisation (y) against neural subspace angle (x), one point per pair. */
export function DriftScatter({
  decoder,
  subspace,
  onSelect,
}: {
  decoder: DecoderResult;
  subspace: SubspaceResult;
  onSelect?: (cell: [number, number]) => void;
}) {
  const names = decoder.sessions.map((s) => s.name);
  const { data, rho, nPairs } = useMemo(() => {
    const byDistance = new Map<number, { x: number[]; y: number[]; text: string[]; cell: [number, number][] }>();
    const xs: number[] = [];
    const ys: number[] = [];
    names.forEach((_, i) =>
      names.forEach((__, j) => {
        const x = subspace.matrices.mean_angle[i]?.[j];
        const y = decoder.matrices.mean_r[i]?.[j];
        if (x == null || y == null) return;
        const d = Math.abs(i - j);
        const g = byDistance.get(d) ?? { x: [], y: [], text: [], cell: [] };
        g.x.push(x);
        g.y.push(y);
        g.text.push(`${names[i]} → ${names[j]}`);
        g.cell.push([i, j]);
        byDistance.set(d, g);
        if (d > 0) {
          xs.push(x);
          ys.push(y);
        }
      }),
    );
    const traces: Data[] = [...byDistance.entries()]
      .sort(([a], [b]) => a - b)
      .map(([d, g]) => ({
        type: "scatter",
        mode: "markers",
        x: g.x,
        y: g.y,
        text: g.text,
        customdata: g.cell,
        name: d === 0 ? "same session (diagonal)" : `distance ${d}`,
        marker: {
          size: d === 0 ? 10 : 8,
          symbol: d === 0 ? "diamond-open" : "circle",
          color: DISTANCE_COLOURS[Math.min(d, DISTANCE_COLOURS.length - 1)],
          line: { width: d === 0 ? 2 : 0 },
          opacity: 0.85,
        },
        hovertemplate: "%{text}<br>mean angle %{x:.1f}°<br>decoder r %{y:.3f}<extra></extra>",
      }));
    return { data: traces, rho: spearman(xs, ys), nPairs: xs.length };
  }, [decoder, subspace, names]);

  return (
    <div>
      <Plot
        data={data}
        layout={{
          xaxis: { title: { text: "mean principal angle (°) — larger = more different" } },
          yaxis: { title: { text: "decoder generalisation (mean r)" } },
          legend: { orientation: "v", x: 1.02, y: 1, font: { size: 11 } },
          margin: { l: 60, r: 10, t: 10, b: 50 },
        }}
        height={340}
        onClick={(e) => {
          const cell = e.points[0]?.customdata as unknown as [number, number] | undefined;
          if (cell && onSelect) onSelect(cell);
        }}
      />
      <p className="mt-2 text-xs text-zinc-500">
        Spearman ρ over {nPairs} off-diagonal pairs: <span className="num font-mono">{formatNumber(rho)}</span>. Descriptive only — pairs share
        sessions and are not independent, and an association does not show that representational change causes decoder
        degradation (behaviour and neuron turnover vary along with it).
      </p>
    </div>
  );
}
