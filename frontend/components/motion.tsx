"use client";

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from "react";
import { countUpFrame } from "@/lib/format";

export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Calls `onEnter` once the element scrolls into view. Returns false straight away (and
 * never calls back) when the element is already on screen at mount or the user prefers
 * reduced motion, so content that is visible on load is never hidden after hydration.
 */
function useEnterViewport<T extends Element>(onEnter: () => void): [RefObject<T | null>, boolean] {
  const ref = useRef<T>(null);
  const [pending, setPending] = useState(false);
  const callback = useRef(onEnter);
  callback.current = onEnter;

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion() || typeof IntersectionObserver === "undefined") return;
    if (el.getBoundingClientRect().top < window.innerHeight * 0.95) return;
    setPending(true);
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        io.disconnect();
        setPending(false);
        callback.current();
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return [ref, pending];
}

type RevealTag = "div" | "section" | "figure" | "li" | "aside";

/** Fades and lifts its children in as they scroll into view. */
export function Reveal({
  children,
  as = "div",
  delay = 0,
  className,
  id,
}: {
  children: ReactNode;
  as?: RevealTag;
  delay?: number;
  className?: string;
  id?: string;
}) {
  const [state, setState] = useState<"static" | "shown">("static");
  const [ref, pending] = useEnterViewport<HTMLDivElement>(() => setState("shown"));
  const Tag = as as "div";
  const style: CSSProperties | undefined = delay && state === "shown" ? { transitionDelay: `${delay}ms` } : undefined;
  return (
    <Tag ref={ref} id={id} data-reveal={pending ? "hidden" : state} className={className} style={style}>
      {children}
    </Tag>
  );
}

/**
 * Counts up to a number such as "103,680" when it scrolls into view. The final value
 * is what the server renders, so the figure is correct without JavaScript.
 */
export function CountUp({ value, duration = 1600 }: { value: string; duration?: number }) {
  const [text, setText] = useState(value);
  const frame = useRef(0);
  const [ref, pending] = useEnterViewport<HTMLSpanElement>(() => {
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      setText(countUpFrame(value, 1 - (1 - t) ** 3));
      if (t < 1) frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
  });

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  return (
    <span ref={ref} className="num inline-block" style={{ minWidth: `${value.length}ch` }}>
      {pending ? countUpFrame(value, 0) : text}
    </span>
  );
}

/** Thin bar along the top of the viewport showing how far the page has been read. */
export function ScrollProgress() {
  const bar = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const el = document.documentElement;
      const max = el.scrollHeight - el.clientHeight;
      const p = max > 0 ? Math.min(1, el.scrollTop / max) : 0;
      if (bar.current) bar.current.style.transform = `scaleX(${p})`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5">
      <div ref={bar} className="h-full origin-left scale-x-0 bg-gradient-to-r from-accent-500 via-sky-400 to-violet-400" />
    </div>
  );
}
