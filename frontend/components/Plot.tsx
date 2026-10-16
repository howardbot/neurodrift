"use client";

import { useEffect, useRef, useState } from "react";
import type { Config, Data, Layout, PlotMouseEvent } from "plotly.js";

type PlotlyModule = typeof import("plotly.js-dist-min");

function usePrefersDark(): boolean {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setDark(mq.matches);
    const listener = (e: MediaQueryListEvent) => setDark(e.matches);
    mq.addEventListener("change", listener);
    return () => mq.removeEventListener("change", listener);
  }, []);
  return dark;
}

function baseLayout(dark: boolean): Partial<Layout> {
  const fg = dark ? "#d4d4d8" : "#3f3f46";
  const grid = dark ? "#27272a" : "#e4e4e7";
  const axis = { gridcolor: grid, zerolinecolor: grid, linecolor: grid, tickfont: { size: 11 }, automargin: true };
  return {
    paper_bgcolor: "rgba(0,0,0,0)",
    plot_bgcolor: "rgba(0,0,0,0)",
    font: { family: "ui-sans-serif, system-ui, sans-serif", size: 12, color: fg },
    margin: { l: 50, r: 16, t: 28, b: 44 },
    xaxis: axis,
    yaxis: axis,
    legend: { orientation: "h", y: -0.2, font: { size: 11 } },
    hoverlabel: { font: { family: "ui-monospace, monospace", size: 11 } },
    colorway: ["#2f5d9e", "#c2410c", "#15803d", "#7e22ce", "#b91c1c", "#0e7490", "#a16207", "#4d7c0f"],
  };
}

function mergeLayout(base: Partial<Layout>, layout: Partial<Layout>): Partial<Layout> {
  const merged: Record<string, unknown> = { ...base, ...layout };
  for (const key of Object.keys(layout)) {
    const b = (base as Record<string, unknown>)[key];
    const l = (layout as Record<string, unknown>)[key];
    if (b && l && typeof b === "object" && typeof l === "object" && !Array.isArray(l)) {
      merged[key] = { ...(b as object), ...(l as object) };
    }
  }
  // Extra axes (xaxis2, yaxis2, ...) inherit the base axis styling.
  for (const key of Object.keys(layout)) {
    if (/^[xy]axis\d+$/.test(key)) merged[key] = { ...(base.xaxis as object), ...((layout as Record<string, object>)[key]) };
  }
  return merged as Partial<Layout>;
}

/** Thin wrapper around Plotly; the ~3 MB bundle is loaded lazily on first render. */
export function Plot({
  data,
  layout = {},
  config,
  height = 300,
  onClick,
  className = "",
}: {
  data: Data[];
  layout?: Partial<Layout>;
  config?: Partial<Config>;
  height?: number;
  onClick?: (event: PlotMouseEvent) => void;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const plotly = useRef<PlotlyModule | null>(null);
  const clickRef = useRef(onClick);
  clickRef.current = onClick;
  const dark = usePrefersDark();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const el = ref.current;
    import("plotly.js-dist-min")
      .then((mod) => {
        if (cancelled || !el) return;
        const Plotly = ((mod as unknown as { default?: PlotlyModule }).default ?? mod) as PlotlyModule;
        const firstRender = plotly.current === null;
        plotly.current = Plotly;
        return Plotly.react(el, data, mergeLayout(baseLayout(dark), { height, ...layout }), {
          responsive: true,
          displaylogo: false,
          modeBarButtonsToRemove: ["lasso2d", "select2d"],
          ...config,
        }).then((gd) => {
          if (firstRender) {
            (gd as unknown as { on: (ev: string, cb: (e: PlotMouseEvent) => void) => void }).on(
              "plotly_click",
              (e) => clickRef.current?.(e),
            );
          }
        });
      })
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [data, layout, config, height, dark]);

  useEffect(() => {
    const el = ref.current;
    return () => {
      if (el && plotly.current) plotly.current.purge(el);
    };
  }, []);

  if (failed) return <div className="py-6 text-sm text-red-600">Plot library failed to load.</div>;
  return <div ref={ref} className={`w-full ${className}`} style={{ minHeight: height }} />;
}
