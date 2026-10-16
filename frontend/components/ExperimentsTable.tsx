import Link from "next/link";
import { Badge } from "@/components/ui";
import type { Experiment, ExperimentStatus } from "@/types/api";

const tones: Record<ExperimentStatus, "neutral" | "accent" | "ok" | "warn"> = {
  pending: "neutral",
  running: "accent",
  completed: "ok",
  failed: "warn",
};

export function StatusBadge({ status }: { status: ExperimentStatus }) {
  return <Badge tone={tones[status]}>{status}</Badge>;
}

export function ExperimentsTable({ experiments, showProject = false }: { experiments: Experiment[]; showProject?: boolean }) {
  return (
    <div className="-mx-4 -my-4 overflow-x-auto">
      <table className="table-base">
        <thead>
          <tr>
            <th>Name</th>
            <th>Status</th>
            <th className="text-right">Sessions</th>
            <th>Decoder</th>
            <th>Z-score</th>
            {showProject && <th>Project</th>}
            <th>Created</th>
          </tr>
        </thead>
        <tbody>
          {experiments.map((e) => (
            <tr key={e.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
              <td><Link href={`/experiments/${e.id}`} className="font-medium text-accent-600 hover:underline">{e.name}</Link></td>
              <td><StatusBadge status={e.status} /></td>
              <td className="num text-right font-mono">{e.sessions.length}</td>
              <td className="font-mono text-xs">{e.config.decoder === "ridge" ? `ridge α=${e.config.alpha}` : "OLS"}</td>
              <td>{e.config.zscore ? "on" : "off"}</td>
              {showProject && <td><Link href={`/projects/${e.project_id}`} className="hover:underline">open</Link></td>}
              <td className="num font-mono text-xs">{new Date(e.created_at).toLocaleString("en-CA", { hour12: false })}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
