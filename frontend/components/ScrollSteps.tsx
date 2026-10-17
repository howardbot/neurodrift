"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Timeline for a numbered list of steps that follows the reader: the line fills in as the
 * middle of the viewport moves through the list (a scaleY transform), and the step that has
 * most recently passed it gets `data-active` on its `[data-step]` badge (styled in
 * globals.css). Scroll is only followed while the list is on screen. Without JavaScript the
 * plain line shows and nothing is highlighted; text is never dimmed.
 */
export function ScrollSteps({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const fill = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const badges = [...el.querySelectorAll<HTMLElement>("[data-step]")];
    let raf = 0;
    let active = -1;

    const update = () => {
      raf = 0;
      const mid = window.innerHeight / 2;
      const r = el.getBoundingClientRect();
      const progress = Math.min(1, Math.max(0, (mid - r.top) / Math.max(1, r.height)));
      if (fill.current) fill.current.style.transform = `scaleY(${progress.toFixed(4)})`;
      let next = -1;
      badges.forEach((b, i) => {
        if (b.getBoundingClientRect().top <= mid) next = i;
      });
      if (next !== active) {
        badges.forEach((b, i) => b.toggleAttribute("data-active", i === next));
        active = next;
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    const listen = (on: boolean) => {
      const method = on ? "addEventListener" : "removeEventListener";
      window[method]("scroll", onScroll, { passive: true } as AddEventListenerOptions);
      window[method]("resize", onScroll);
    };
    const io = new IntersectionObserver(([entry]) => {
      listen(!!entry?.isIntersecting);
      if (entry?.isIntersecting) onScroll();
    });
    io.observe(el);
    return () => {
      io.disconnect();
      listen(false);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={root} className="relative">
      <span aria-hidden="true" className="absolute bottom-3 left-3 top-3 w-px -translate-x-1/2 bg-gradient-to-b from-accent-500/50 via-zinc-200 to-transparent dark:via-zinc-800" />
      <span
        ref={fill}
        aria-hidden="true"
        className="absolute bottom-3 left-[calc(0.75rem-0.5px)] top-3 w-px origin-top bg-accent-500 dark:bg-accent-300"
        style={{ transform: "scaleY(0)" }}
      />
      {children}
    </div>
  );
}
