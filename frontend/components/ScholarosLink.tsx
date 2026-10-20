"use client";

import { useEffect, useState, type ReactNode } from "react";

/**
 * ScholarOS runs privately on the same server, one port up (8444), reachable only on the owner's
 * tailnet. The address is worked out in the browser so no private hostname is committed to this
 * public repository; NEXT_PUBLIC_SCHOLAROS_URL overrides it.
 */
export function useScholarosUrl(): string | null {
  const [url, setUrl] = useState<string | null>(process.env.NEXT_PUBLIC_SCHOLAROS_URL || null);
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SCHOLAROS_URL) setUrl(`https://${window.location.hostname}:8444/`);
  }, []);
  return url;
}

export function ScholarosLink({ className, children }: { className?: string; children: ReactNode }) {
  const url = useScholarosUrl();
  return (
    <a href={url ?? undefined} target="_blank" rel="noreferrer" className={className} aria-disabled={!url}>
      {children}
    </a>
  );
}
