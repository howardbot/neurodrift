"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { DecoderControls, defaultDecoderSettings, type DecoderSettings } from "@/components/DecoderControls";
import { Button, ErrorBox, Notice } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import type { Session } from "@/types/api";

const LARGE_RUN = 100;

export function ExperimentConfigForm({ projectId, sessions }: { projectId: string; sessions: Session[] }) {
  const router = useRouter();
  const minOutputs = Math.min(...sessions.map((s) => s.n_outputs));
  const [decoder, setDecoder] = useState<DecoderSettings>(() => defaultDecoderSettings(minOutputs));
  const minNeuronsAll = Math.min(...sessions.map((s) => s.n_neurons));
  const [nComponents, setNComponents] = useState<3 | 5 | 10 | 20>(() =>
    ([10, 5, 3] as const).find((k) => k < minNeuronsAll) ?? 3,
  );
  const [selected, setSelected] = useState<string[]>(() => sessions.map((s) => s.id));
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ApiError>();

  const chosen = sessions.filter((s) => selected.includes(s.id));
  const nPairs = chosen.length * chosen.length;
  const minNeurons = chosen.length ? Math.min(...chosen.map((s) => s.n_neurons)) : 0;

  function toggle(id: string) {
    setSelected((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  }

  async function run() {
    if (nPairs > LARGE_RUN && !window.confirm(`This runs ${nPairs} train/test combinations. Continue?`)) return;
    setBusy(true);
    setError(undefined);
    try {
      const allOutputs = decoder.outputs.length === minOutputs && sessions.every((s) => s.n_outputs === minOutputs);
      const experiment = await api.createExperiment(projectId, {
        name: name.trim() || undefined,
        session_ids: chosen.map((s) => s.id),
        decoder: decoder.decoder,
        alpha: decoder.alpha,
        zscore: decoder.zscore,
        n_components: nComponents,
        outputs: allOutputs ? null : decoder.outputs,
        train_fraction: 0.8,
      });
      router.push(`/experiments/${experiment.id}`);
    } catch (e) {
      setError(e as ApiError);
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <DecoderControls value={decoder} onChange={setDecoder} nOutputs={minOutputs} />
      <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        <div>
          <label className="label" htmlFor="pca-k">PCA components (subspace analysis)</label>
          <select id="pca-k" className="input" value={nComponents} onChange={(e) => setNComponents(Number(e.target.value) as 3 | 5 | 10 | 20)}>
            {[3, 5, 10, 20].map((k) => (
              <option key={k} value={k} disabled={k >= minNeurons}>{k}</option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-3">
          <label className="label" htmlFor="exp-name">Experiment name (optional)</label>
          <input id="exp-name" className="input" maxLength={200} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ridge α=1 · all sessions" />
        </div>
      </div>
      <div>
        <span className="label">Sessions (analysis order = session order)</span>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
          {sessions.map((s) => (
            <label key={s.id} className="flex items-center gap-1.5 font-mono">
              <input type="checkbox" checked={selected.includes(s.id)} onChange={() => toggle(s.id)} />
              {s.name}
            </label>
          ))}
        </div>
      </div>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        {chosen.length} sessions → <span className="num font-mono font-medium">{nPairs}</span> train/test combinations. Each decoder is trained
        on the first 80 % of its session; every cell is tested on the last 20 % of the test session, restricted to shared neurons.
      </p>
      {nPairs > LARGE_RUN && <Notice>Large run: {nPairs} combinations will take a while on a small server.</Notice>}
      {error && <ErrorBox error={error} title="Could not start experiment" />}
      <Button variant="primary" onClick={run} disabled={busy || chosen.length === 0 || !(decoder.alpha > 0)}>
        {busy ? "Submitting…" : "Run Experiment"}
      </Button>
    </div>
  );
}
