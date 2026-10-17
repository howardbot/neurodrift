"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { flushSync } from "react-dom";
import { prefersReducedMotion } from "@/components/motion";

type Mode = "rows" | "wipe";

interface Cover {
  left: number;
  top: number;
  width: number;
  height: number;
}

/**
 * A one-time reveal of a chart the first time it scrolls into view. "rows" fades the plot
 * area out of a cover band by band (heatmap rows, top to bottom); "wipe" slides a cover off
 * each subplot from left to right (lines). Covers are opacity/transform animations in the
 * card's background colour. They only exist once the chart has been drawn, so nothing is
 * hidden without JavaScript, and they are skipped under reduced motion. Later redraws (a
 * different metric, a resize) never replay it.
 *
 * Usage: <PlotReveal mode="rows" rows={n}>{(onRender) => <Plot onRender={onRender} … />}</PlotReveal>
 */
export function PlotReveal({ mode, rows = 1, children }: { mode: Mode; rows?: number; children: (onRender: (gd: HTMLElement) => void) => ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  const [covers, setCovers] = useState<Cover[] | null>(null);
  const [phase, setPhase] = useState<"idle" | "armed" | "playing" | "done">("idle");
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  // Called after every draw. The first one arms the covers; redraws before the reveal plays
  // (a resize, another metric) move them to the new plot area.
  const onRender = (gd: HTMLElement) => {
    if (phaseRef.current === "playing" || phaseRef.current === "done") return;
    const root = box.current;
    if (!root || prefersReducedMotion() || typeof IntersectionObserver === "undefined") {
      setPhase("done");
      return;
    }
    const origin = root.getBoundingClientRect();
    const areas = [...gd.querySelectorAll(".nsewdrag")].map((el) => {
      const r = el.getBoundingClientRect();
      return { left: r.left - origin.left, top: r.top - origin.top, width: r.width, height: r.height };
    });
    if (!areas.length) {
      setPhase("done");
      return;
    }
    // Synchronously, so the covers are in place before the browser first paints the chart.
    flushSync(() => {
      setCovers(areas);
      setPhase("armed");
    });
  };

  // Play once the chart is a quarter in view.
  useEffect(() => {
    if (phase !== "armed" || !box.current) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          io.disconnect();
          setPhase("playing");
        }
      },
      { threshold: 0.25 },
    );
    io.observe(box.current);
    return () => io.disconnect();
  }, [phase]);

  // Remove the covers once played; a timer backs up animationend.
  const total = mode === "rows" ? 420 + rows * 70 : 900;
  useEffect(() => {
    if (phase !== "playing") return;
    const t = window.setTimeout(() => setPhase("done"), total + 300);
    return () => window.clearTimeout(t);
  }, [phase, total]);

  const showCovers = covers && (phase === "armed" || phase === "playing");
  return (
    <div ref={box} className="relative">
      {children(onRender)}
      {showCovers && (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0" data-plot-reveal={phase}>
          {covers.flatMap((c, k) =>
            mode === "wipe"
              ? [<span key={k} className="plot-cover-wipe absolute block bg-white dark:bg-zinc-900" style={c as CSSProperties} />]
              : Array.from({ length: rows }, (_, i) => (
                  <span
                    key={`${k}-${i}`}
                    className="plot-cover-row absolute block bg-white dark:bg-zinc-900"
                    style={{ left: c.left, width: c.width, top: c.top + (c.height * i) / rows, height: Math.ceil(c.height / rows) + 1, animationDelay: `${i * 70}ms` }}
                  />
                )),
          )}
        </div>
      )}
    </div>
  );
}
