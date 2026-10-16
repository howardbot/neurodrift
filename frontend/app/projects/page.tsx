"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { DemoButton } from "@/components/DemoButton";
import { Badge, Button, ErrorBox, PageHeader, Spinner } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { useApi } from "@/lib/useApi";

function CreateProjectForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ApiError>();

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(undefined);
    try {
      const project = await api.createProject(name, description);
      router.push(`/projects/${project.id}`);
    } catch (err) {
      setError(err as ApiError);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="card space-y-3 p-4">
      <h2 className="text-sm font-semibold">New project</h2>
      <div>
        <label className="label" htmlFor="project-name">Name</label>
        <input id="project-name" className="input" required maxLength={200} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Monkey J — M1 array" />
      </div>
      <div>
        <label className="label" htmlFor="project-description">Description (optional)</label>
        <textarea id="project-description" className="input" rows={2} maxLength={5000} value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      {error && <ErrorBox error={error} />}
      <Button type="submit" variant="primary" disabled={busy || !name.trim()}>
        {busy ? "Creating…" : "Create project"}
      </Button>
    </form>
  );
}

export default function ProjectsPage() {
  const { data, error, loading } = useApi(api.listProjects, "projects");

  return (
    <div>
      <PageHeader title="Projects" description="A project groups recording sessions from one subject or array that you want to compare." />
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div>
          {loading && !data && <Spinner />}
          {error && <ErrorBox error={error} title="Could not load projects" />}
          {data && data.length === 0 && (
            <div className="card px-6 py-10 text-center">
              <div className="text-sm font-medium">No projects yet</div>
              <p className="mt-1 text-sm text-zinc-500">Create one, or load the synthetic demo to explore the analyses.</p>
              <div className="mt-4 flex justify-center"><DemoButton /></div>
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            {data?.map((p) => (
              <Link key={p.id} href={`/projects/${p.id}`} className="card card-hover block p-4">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="truncate text-sm font-semibold">{p.name}</h2>
                  {p.is_demo && <Badge tone="accent">demo</Badge>}
                </div>
                {p.description && <p className="mt-1 line-clamp-2 text-xs text-zinc-500">{p.description}</p>}
                <dl className="mt-3 grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <dt className="text-zinc-500">Sessions</dt>
                    <dd className="num font-mono">{p.n_sessions}</dd>
                  </div>
                  <div>
                    <dt className="text-zinc-500">Latest experiment</dt>
                    <dd className="truncate">{p.latest_experiment ? p.latest_experiment.status : "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-zinc-500">Created</dt>
                    <dd className="num font-mono">{formatDate(p.created_at)}</dd>
                  </div>
                </dl>
              </Link>
            ))}
          </div>
        </div>
        <CreateProjectForm />
      </div>
    </div>
  );
}
