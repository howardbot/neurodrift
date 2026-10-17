// Loading the chart library, kept apart from components/Plot.tsx so pages that only want to
// prefetch it do not ship the Plot component.

// The cartesian partial bundle covers every trace type the app uses (scatter, bar,
// histogram, heatmap) at about a third of the full bundle's size. WebGL traces
// (scattergl) are not in it: traces are capped at ~2,000 points, which SVG handles.
export const loadPlotly = () => import("plotly.js-cartesian-dist-min");

export type PlotlyModule = Awaited<ReturnType<typeof loadPlotly>>;

/**
 * Starts downloading the Plotly chunk while the browser is idle, for pages whose links
 * lead to analysis pages. The module is cached, so the later lazy import is instant.
 * Returns a function that cancels the request if it has not started yet.
 */
export function warmPlotly(): () => void {
  if (typeof window === "undefined") return () => {};
  const run = () => void loadPlotly().catch(() => {});
  if ("requestIdleCallback" in window) {
    const id = window.requestIdleCallback(run, { timeout: 4000 });
    return () => window.cancelIdleCallback(id);
  }
  const id = setTimeout(run, 1500);
  return () => clearTimeout(id);
}

/**
 * Warms the Plotly chunk once `el` (a list of links to analysis pages) scrolls into view,
 * so pages without any such link, or visits that never reach it, download nothing.
 */
export function warmPlotlyWhenVisible(el: Element | null): () => void {
  if (!el || typeof IntersectionObserver === "undefined") return () => {};
  let cancel = () => {};
  const io = new IntersectionObserver(([entry]) => {
    if (!entry?.isIntersecting) return;
    io.disconnect();
    cancel = warmPlotly();
  });
  io.observe(el);
  return () => {
    io.disconnect();
    cancel();
  };
}
