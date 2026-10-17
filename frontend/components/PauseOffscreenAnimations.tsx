"use client";

import { useEffect } from "react";

/**
 * Pauses the looping CSS animations of every `[data-pause-offscreen]` element while it is
 * off screen, by setting `data-offscreen` (see globals.css). Mounted once in the layout;
 * elements added later, e.g. by client-side navigation, are picked up too.
 */
export function PauseOffscreenAnimations() {
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) e.target.toggleAttribute("data-offscreen", !e.isIntersecting);
      },
      { rootMargin: "100px" },
    );
    const watched = new Set<Element>();
    const sync = () => {
      for (const el of watched) {
        if (!el.isConnected) {
          io.unobserve(el);
          watched.delete(el);
        }
      }
      document.querySelectorAll("[data-pause-offscreen]").forEach((el) => {
        if (!watched.has(el)) {
          watched.add(el);
          io.observe(el);
        }
      });
    };
    sync();
    // Coalesce DOM changes (charts mutate the DOM a lot) into one scan per frame.
    let raf = 0;
    const mo = new MutationObserver(() => {
      if (!raf) raf = requestAnimationFrame(() => ((raf = 0), sync()));
    });
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      cancelAnimationFrame(raf);
      mo.disconnect();
      io.disconnect();
    };
  }, []);
  return null;
}
