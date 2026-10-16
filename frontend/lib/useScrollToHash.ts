"use client";

import { useEffect } from "react";

/**
 * Scrolls to the element named by the URL hash once `ready` turns true. For pages whose
 * content is fetched on the client: the browser (or Next.js) tries to scroll to the hash
 * before that content, and so the target, exists.
 */
export function useScrollToHash(ready: boolean): void {
  useEffect(() => {
    if (!ready) return;
    const go = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      if (id) document.getElementById(id)?.scrollIntoView({ block: "start" });
    };
    go();
    window.addEventListener("hashchange", go);
    return () => window.removeEventListener("hashchange", go);
  }, [ready]);
}
