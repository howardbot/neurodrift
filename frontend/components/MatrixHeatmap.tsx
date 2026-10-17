"use client";

import { useMemo } from "react";
import type { Data } from "plotly.js";
import { Plot } from "@/components/Plot";

// Sequential light → dark blue; darker = "better" (higher r, smaller angle, ...).
const BLUES: [number, string][] = [
  [0, "#f4f7fb"],
  [0.25, "#c9d9ee"],
  [0.5, "#8fb0da"],
  [0.75, "#4f7fbe"],
  [1, "#1f3f73"],
];

export interface MatrixSpec {
  label: string;
  better: "high" | "low";
  fmt: string; // d3 format for cell text, e.g. ".2f"
  clipMin?: number;
}

/** Train × test matrix as an interactive heatmap (rows = train, columns = test). */
export function MatrixHeatmap({
  names,
  z,
  spec,
  hover,
  customdata,
  onSelect,
}: {
  names: string[];
  z: (number | null)[][];
  spec: MatrixSpec;
  hover: string; // Plotly hovertemplate fragment using %{customdata[k]}
  customdata: (number | string)[][][];
  onSelect?: (cell: [number, number]) => void;
}) {
  const n = names.length;
  const { data, layout } = useMemo(() => {
    const finite = z.flat().filter((v): v is number => v !== null && Number.isFinite(v));
    // Colour range spans the observed values so differences stay visible.
    const zmin = finite.length ? Math.max(spec.clipMin ?? -Infinity, Math.min(...finite)) : 0;
    const zmax = finite.length ? Math.max(...finite) : 1;
    const trace = {
      type: "heatmap",
      x: names,
      y: names,
      z: z.map((row) => row.map((v) => (v === null ? NaN : v))),
      customdata,
      zmin,
      zmax,
      colorscale: BLUES,
      reversescale: spec.better === "low",
      xgap: 1,
      ygap: 1,
      texttemplate: n <= 16 ? `%{z:${spec.fmt}}` : "",
      textfont: { size: n <= 8 ? 12 : 10 },
      hovertemplate: `train <b>%{y}</b> → test <b>%{x}</b><br>${hover}<extra></extra>`,
      colorbar: { thickness: 10, title: { text: spec.label, side: "right" }, outlinewidth: 0 },
    } as unknown as Data;
    return {
      data: [trace],
      layout: {
        // No zoom or pan on a small category matrix: on touch screens Plotly's drag layer would
        // otherwise swallow the swipe that scrolls a wide matrix sideways (clicks still fire).
        dragmode: false as const,
        xaxis: { title: { text: "test session" }, tickangle: n > 8 ? -45 : 0, type: "category" as const, showgrid: false, fixedrange: true },
        yaxis: { title: { text: "train session" }, autorange: "reversed" as const, type: "category" as const, showgrid: false, fixedrange: true },
        margin: { l: 90, r: 20, t: 10, b: 80 },
      },
    };
  }, [names, z, spec, hover, customdata, n]);

  return (
    <div className="overflow-x-auto">
      <div style={{ minWidth: Math.max(420, 120 + n * 44) }} className={onSelect ? "cursor-pointer" : ""}>
        <Plot
          data={data}
          layout={layout}
          height={Math.max(340, 60 + n * 40)}
          onClick={(e) => {
            const p = e.points[0];
            if (!p || !onSelect) return;
            const i = names.indexOf(String(p.y));
            const j = names.indexOf(String(p.x));
            if (i >= 0 && j >= 0) onSelect([i, j]);
          }}
        />
      </div>
    </div>
  );
}
