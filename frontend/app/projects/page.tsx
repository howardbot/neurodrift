"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { DemoButton } from "@/components/DemoButton";
import { warmPlotlyWhenVisible } from "@/lib/plotly";
import { Badge, Button, ErrorBox, PageHeader, Spinner } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { useApi } from "@/lib/useApi";
import type { Project } from "@/types/api";

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

/** Shown while the synthetic demo is the only project: where to start, in three steps. */
function FirstVisitGuide({ project }: { project: Project }) {
  const base = `/projects/${project.id}`;
  const experiment = project.latest_experiment?.status === "completed" ? project.latest_experiment : null;
  const link = "font-medium text-accent-600 underline-offset-2 hover:underline dark:text-accent-300";
  return (
    <div className="card mb-4 border-l-4 border-l-accent-500/60 p-4 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
      <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">New here? Start with the demo</h2>
      <ol className="mt-2 list-decimal space-y-1.5 pl-5 marker:text-zinc-400">
        <li>
          Open the <Link href={base} className={link}>demo project</Link>: {project.n_sessions} synthetic recording sessions whose
          tuning drifts across sessions.
        </li>
        <li>
          {experiment ? (
            <>
              Open its latest experiment <Link href={`/experiments/${experiment.id}`} className={link}>{experiment.name}</Link>, or run a new one
              from the project&apos;s <Link href={`${base}#analysis`} className={link}>analysis</Link> section.
            </>
          ) : (
            <>
              Run a cross-session analysis from the project&apos;s <Link href={`${base}#analysis`} className={link}>analysis</Link> section.
            </>
          )}
        </li>
        <li>Read the results: each experiment page has a &ldquo;How to read these results&rdquo; panel above the matrices.</li>
      </ol>
      <p className="mt-2 text-xs">
        For your own recordings, create a project and upload one <code className="font-mono">.npz</code> file per session (format in the{" "}
        <Link href="/documentation#session-file-format" className={link}>documentation</Link>).
      </p>
    </div>
  );
}

export default function ProjectsPage() {
  const { data, error, loading } = useApi(api.listProjects, "projects");
  // Every project link leads to plots: fetch the chart library once the list is in view.
  const list = useRef<HTMLDivElement>(null);
  const hasProjects = !!data?.length;
  useEffect(() => (hasProjects ? warmPlotlyWhenVisible(list.current) : undefined), [hasProjects]);

  return (
    <div>
      <PageHeader title="Projects" description="A project groups recording sessions from one subject or array that you want to compare." />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
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
          {data?.length === 1 && data[0]!.is_demo && <FirstVisitGuide project={data[0]!} />}
          <div ref={list} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {data?.map((p) => (
              <Link key={p.id} href={`/projects/${p.id}`} className="card card-hover block p-4">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="min-w-0 truncate text-sm font-semibold" title={p.name}>{p.name}</h2>
                  {p.is_demo && <span className="shrink-0"><Badge tone="accent">demo</Badge></span>}
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
