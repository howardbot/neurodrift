"use client";

import { useMemo } from "react";
import type { Data, Layout } from "plotly.js";
import { Plot } from "@/components/Plot";
import { meanByDistance, stabilityProfile, type StabilityPoint } from "@/lib/stability";
import type { DecoderResult, SubspaceResult } from "@/types/api";

const SERIES: { key: StabilityPoint["direction"]; name: string; color: string; symbol: string }[] = [
  { key: "same", name: "same session (diagonal)", color: "#18181b", symbol: "diamond-open" },
  { key: "before", name: "test session before the training session", color: "#c2410c", symbol: "circle" },
  { key: "after", name: "test session after the training session", color: "#2f5d9e", symbol: "circle" },
];
const MEAN_COLOUR = "#a1a1aa";

/**
 * Decoder r against session distance |i − j| for one training session, with the mean
 * principal angle of the same pairs in a second panel underneath (when available).
 */
export function StabilityExplorer({
  decoder,
  subspace,
  train,
}: {
  decoder: DecoderResult;
  subspace: SubspaceResult | null;
  train: number;
}) {
  const names = useMemo(() => decoder.sessions.map((s) => s.name), [decoder]);
  const withAngles = subspace !== null;

  const data = useMemo(() => {
    const points = stabilityProfile(decoder.matrices.mean_r, train, subspace?.matrices.mean_angle, subspace?.matrices.chance_mean_angle);
    const panels: { field: "r" | "angle"; yaxis: "y" | "y2"; label: string; fmt: string; all: ReturnType<typeof meanByDistance> }[] = [
      { field: "r", yaxis: "y", label: "decoder r", fmt: ".3f", all: meanByDistance(decoder.matrices.mean_r) },
    ];
    if (subspace) panels.push({ field: "angle", yaxis: "y2", label: "mean angle", fmt: ".1f", all: meanByDistance(subspace.matrices.mean_angle) });

    const traces: Data[] = [];
    panels.forEach((panel, p) => {
      const unit = panel.field === "angle" ? "°" : "";
      traces.push({
        type: "scatter",
        mode: "lines",
        x: panel.all.map((d) => d.distance),
        y: panel.all.map((d) => d.mean),
        yaxis: panel.yaxis,
        name: "mean over all training sessions",
        legendgroup: "mean",
        showlegend: p === 0,
        line: { color: MEAN_COLOUR, dash: "dash", width: 1.5 },
        hovertemplate: `distance %{x}: mean ${panel.label} %{y:${panel.fmt}}${unit} (all training sessions)<extra></extra>`,
      } as Data);
      for (const s of SERIES) {
        const pts = points.filter((pt) => pt.direction === s.key && pt[panel.field] !== null).sort((a, b) => a.distance - b.distance);
        if (!pts.length) continue;
        traces.push({
          type: "scatter",
          mode: s.key === "same" ? "markers" : "lines+markers",
          x: pts.map((pt) => pt.distance),
          y: pts.map((pt) => pt[panel.field]),
          text: pts.map((pt) => names[pt.test] ?? ""),
          yaxis: panel.yaxis,
          name: s.name,
          legendgroup: s.key,
          showlegend: p === 0,
          line: { color: s.color, width: 1.5 },
          marker: { color: s.color, symbol: s.symbol, size: s.key === "same" ? 11 : 8, line: { width: s.key === "same" ? 2 : 0, color: s.color } },
          hovertemplate: `train <b>${names[train] ?? ""}</b> → test <b>%{text}</b><br>distance %{x}<br>${panel.label} %{y:${panel.fmt}}${unit}<extra></extra>`,
        } as Data);
      }
      if (panel.field === "angle") {
        const chance = points.filter((pt) => pt.chance !== null).sort((a, b) => a.distance - b.distance);
        if (chance.length) {
          traces.push({
            type: "scatter",
            mode: "markers",
            x: chance.map((pt) => pt.distance),
            y: chance.map((pt) => pt.chance),
            text: chance.map((pt) => names[pt.test] ?? ""),
            yaxis: "y2",
            name: "chance (random subspaces)",
            marker: { color: MEAN_COLOUR, symbol: "line-ew", size: 14, line: { width: 2, color: MEAN_COLOUR } },
            hovertemplate: "chance level for %{text}: %{y:.1f}°<extra></extra>",
          } as Data);
        }
      }
    });
    return traces;
  }, [decoder, subspace, train, names]);

  const n = names.length;
  const xaxis = { title: { text: "session distance |i − j| (positions in session order)" }, dtick: 1, range: [-0.4, Math.max(1, n - 1) + 0.4], zeroline: false };
  const layout: Partial<Layout> = withAngles
    ? {
        xaxis: { ...xaxis, anchor: "y2" },
        yaxis: { title: { text: "decoder r" }, domain: [0.56, 1] },
        yaxis2: { title: { text: "mean angle (°)" }, domain: [0, 0.42], anchor: "x" },
        margin: { l: 60, r: 16, t: 10, b: 50 },
      }
    : { xaxis, yaxis: { title: { text: "decoder r" } }, margin: { l: 60, r: 16, t: 10, b: 50 } };

  return <Plot data={data} layout={layout} height={withAngles ? 500 : 320} />;
}
