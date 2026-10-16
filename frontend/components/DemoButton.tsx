"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api, ApiError } from "@/lib/api";
import { Button, ErrorBox } from "@/components/ui";

export function DemoButton({ label = "Load Demo Project" }: { label?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ApiError>();

  async function load() {
    setBusy(true);
    setError(undefined);
    try {
      const project = await api.createDemo();
      router.push(`/projects/${project.id}`);
    } catch (e) {
      setError(e as ApiError);
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button variant="primary" onClick={load} disabled={busy}>
        {busy ? "Generating six synthetic sessions…" : label}
      </Button>
      {error && <ErrorBox error={error} />}
    </div>
  );
}
