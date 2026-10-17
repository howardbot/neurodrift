"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo } from "react";
import { useSetCurrentProject } from "@/components/CurrentProject";
import { ExperimentConfigForm } from "@/components/ExperimentConfigForm";
import { ExperimentsTable } from "@/components/ExperimentsTable";
import { Plot } from "@/components/Plot";
import { UploadSessionForm } from "@/components/UploadSessionForm";
import { Badge, Button, Card, EmptyState, ErrorBox, Notice, PageHeader, Spinner, Stat } from "@/components/ui";
import { api } from "@/lib/api";
import { formatDate, formatDuration, formatNumber } from "@/lib/format";
import { useApi } from "@/lib/useApi";
import { useScrollToHash } from "@/lib/useScrollToHash";
import type { Session } from "@/types/api";

function neuronAlignment(sessions: Session[]): { label: string; tone: "ok" | "warn"; detail: string } {
  if (sessions.length < 2) return { label: "—", tone: "ok", detail: "Needs at least two sessions." };
  const withIds = sessions.filter((s) => s.has_neuron_ids).length;
  if (withIds === sessions.length)
    return { label: "by neuron_ids", tone: "ok", detail: "Pairs will be restricted to the neurons shared by both sessions." };
  if (withIds === 0) {
    const counts = new Set(sessions.map((s) => s.n_neurons));
    return counts.size === 1
      ? { label: "by column index", tone: "warn", detail: "No neuron_ids: column i is assumed to be the same unit in every session." }
      : { label: "not possible", tone: "warn", detail: "No neuron_ids and unequal neuron counts: pairs with different counts cannot be compared." };
  }
  return { label: "partial", tone: "warn", detail: "Only some sessions have neuron_ids; pairs mixing the two cannot be aligned." };
}

function SessionsQcPlot({ sessions }: { sessions: Session[] }) {
  const { data, layout } = useMemo(() => {
    const names = sessions.map((s) => s.name);
    return {
      data: [
        { type: "bar" as const, x: names, y: sessions.map((s) => s.qc_summary.mean_activity), name: "Mean activity / bin", marker: { color: "#2f5d9e" } },
        { type: "scatter" as const, mode: "lines+markers" as const, x: names, y: sessions.map((s) => s.n_neurons), name: "Neurons", yaxis: "y2", line: { color: "#c2410c" } },
      ],
      layout: {
        yaxis: { title: { text: "mean activity" } },
        yaxis2: { title: { text: "neurons" }, overlaying: "y" as const, side: "right" as const, rangemode: "tozero" as const, showgrid: false },
        margin: { l: 56, r: 56, t: 12, b: 60 },
      },
    };
  }, [sessions]);
  return <Plot label="Mean activity per bin (bars) and neuron count (line) per session" data={data} layout={layout} height={240} />;
}

export default function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: project, error, loading, reload } = useApi(() => api.getProject(id), id);
  const experiments = useApi(() => api.listProjectExperiments(id), id);
  useSetCurrentProject(project);
  useScrollToHash(!!project);

  async function removeProject() {
    if (!project || !window.confirm(`Delete project "${project.name}" and all ${project.n_sessions} session files?`)) return;
    await api.deleteProject(project.id);
    router.push("/projects");
  }

  async function removeSession(s: Session) {
    if (!window.confirm(`Delete session "${s.name}" and its file?`)) return;
    await api.deleteSession(s.id);
    reload();
  }

  if (loading && !project) return <Spinner />;
  if (error) return <ErrorBox error={error} title="Could not load project" />;
  if (!project) return null;

  const sessions = project.sessions;
  const alignment = neuronAlignment(sessions);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={<Link href="/projects" className="hover:underline">Projects</Link>}
        title={<span className="flex flex-wrap items-center gap-x-2 gap-y-1">{project.name}{project.is_demo && <Badge tone="accent">synthetic demo</Badge>}</span>}
        description={project.description || undefined}
        actions={<Button variant="danger" onClick={removeProject}>Delete project</Button>}
      />

      <div className="card grid grid-cols-2 gap-4 p-4 sm:grid-cols-4 lg:grid-cols-6">
        <Stat label="Sessions" value={sessions.length} />
        <Stat label="Neurons" value={sessions.length ? `${Math.min(...sessions.map((s) => s.n_neurons))}–${Math.max(...sessions.map((s) => s.n_neurons))}` : "—"} hint="Range across sessions" />
        <Stat label="Outputs" value={sessions.length ? [...new Set(sessions.map((s) => s.n_outputs))].join(", ") : "—"} />
        <Stat label="Total bins" value={formatNumber(sessions.reduce((a, s) => a + s.n_samples, 0))} />
        <Stat label="Neuron alignment" value={<Badge tone={alignment.tone}>{alignment.label}</Badge>} hint={alignment.detail} />
        <Stat label="Created" value={formatDate(project.created_at)} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-6">
          <Card id="sessions" title="Sessions" subtitle="Ordered by session_order; this order defines 'session distance' in later analyses.">
            {sessions.length === 0 ? (
              <EmptyState title="No sessions yet">Upload one .npz file per recording session.</EmptyState>
            ) : (
              <div className="-mx-4 -my-4 overflow-x-auto">
                <table className="table-base">
                  <thead>
                    <tr>
                      <th>#</th><th>Name</th><th>Subject</th><th>Date</th>
                      <th className="text-right">Bins</th><th className="text-right">Neurons</th><th className="text-right">Out</th>
                      <th className="text-right">Duration</th><th className="text-right">% zero</th><th>Flags</th><th />
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map((s) => (
                      <tr key={s.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                        <td className="num font-mono text-zinc-500">{s.session_order}</td>
                        <td><Link href={`/sessions/${s.id}`} className="font-mono font-medium text-accent-600 hover:underline">{s.name}</Link></td>
                        <td>{s.subject ?? "—"}</td>
                        <td className="num font-mono">{s.recording_date ?? "—"}</td>
                        <td className="num text-right font-mono">{formatNumber(s.n_samples)}</td>
                        <td className="num text-right font-mono">{s.n_neurons}</td>
                        <td className="num text-right font-mono">{s.n_outputs}</td>
                        <td className="num text-right font-mono">{formatDuration(s.duration_s)}</td>
                        <td className="num text-right font-mono">{s.qc_summary.pct_zero.toFixed(1)}</td>
                        <td className="space-x-1 whitespace-nowrap">
                          {!s.has_neuron_ids && <Badge tone="warn">no ids</Badge>}
                          {s.qc_summary.n_zero_variance_neurons > 0 && <Badge tone="warn">{s.qc_summary.n_zero_variance_neurons} flat</Badge>}
                          {s.warnings.length > 0 && <span title={s.warnings.join("\n")}><Badge tone="warn">{s.warnings.length} warn</Badge></span>}
                        </td>
                        <td className="text-right"><Button variant="ghost" onClick={() => removeSession(s)} aria-label={`Delete ${s.name}`}>Delete</Button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {sessions.length > 0 && (
            <Card title="QC summary" subtitle="Mean activity per bin (bars) and neuron count (line) per session.">
              <SessionsQcPlot sessions={sessions} />
            </Card>
          )}

          <Card id="analysis" title="Run Cross-Session Analysis" subtitle="Train a decoder on each session and evaluate it on every session.">
            {sessions.length === 0 ? (
              <p className="text-sm text-zinc-500">Upload sessions first.</p>
            ) : (
              <>
                <div className="mb-4"><Notice>{alignment.detail}</Notice></div>
                {/* Remount when sessions change so new uploads are selected by default. */}
                <ExperimentConfigForm key={sessions.map((s) => s.id).join()} projectId={project.id} sessions={sessions} />
              </>
            )}
          </Card>

          {experiments.data && experiments.data.length > 0 && (
            <Card title="Experiments">
              <ExperimentsTable experiments={experiments.data} />
            </Card>
          )}
        </div>

        <Card title="Upload session" subtitle="Max 500 MB · .npz only · arrays are never unpickled">
          <UploadSessionForm projectId={project.id} onUploaded={reload} />
        </Card>
      </div>
    </div>
  );
}
