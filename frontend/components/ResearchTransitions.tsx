"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, type ReactNode } from "react";
import { prefersReducedMotion } from "@/components/motion";

const isStory = (path: string) => /^\/research\/[^/]+\/?$/.test(path);

/**
 * Plays a View Transition when one research story replaces another (styled in
 * globals.css). Plain left-clicks on links from a story to another story are taken over:
 * the browser snapshots the old story, Next navigates, and the snapshot is released once
 * the new story has rendered. Browsers without View Transitions, reduced motion, and every
 * other navigation (including back/forward) just navigate as usual.
 */
export function ResearchTransitions({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const story = useRef<HTMLDivElement>(null);
  const finish = useRef<(() => void) | null>(null);
  const latest = useRef(0);

  // The new story has been committed: let the browser capture it and animate.
  useLayoutEffect(() => {
    finish.current?.();
    finish.current = null;
  }, [pathname]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const link = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!link || (link.target && link.target !== "_self") || link.hasAttribute("download")) return;
      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin || !isStory(window.location.pathname) || !isStory(url.pathname)) return;
      if (url.pathname === window.location.pathname || !("startViewTransition" in document) || prefersReducedMotion()) return;
      e.preventDefault(); // Next's <Link> leaves a prevented click alone.
      // A click while an earlier transition still waits for its page: release that one now
      // (the new transition replaces it) rather than leaving it to its timeout, and only let
      // the newest transition remove the class, so a stale clean-up cannot strip it mid-way.
      finish.current?.();
      const id = ++latest.current;
      const el = story.current;
      el?.classList.add("research-story");
      const transition = document.startViewTransition(
        () =>
          new Promise<void>((resolve) => {
            // Never keep the page frozen on the old snapshot for long.
            const timer = window.setTimeout(done, 2000);
            function done() {
              window.clearTimeout(timer);
              resolve();
            }
            finish.current = done;
            router.push(url.pathname + url.search + url.hash);
          }),
      );
      transition.finished.finally(() => {
        if (latest.current === id) el?.classList.remove("research-story");
      });
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [router]);

  return <div ref={story}>{children}</div>;
}
