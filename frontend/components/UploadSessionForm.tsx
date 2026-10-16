"use client";

import { useRef, useState, type FormEvent } from "react";
import { ApiError, uploadSession } from "@/lib/api";
import { formatBytes } from "@/lib/format";
import { Button, ErrorBox, Notice } from "@/components/ui";
import type { Session } from "@/types/api";

const MAX_UPLOAD_MB = 500;

/** Suggest a session name from a filename: strip extension, replace disallowed chars. */
export function suggestSessionName(filename: string): string {
  return filename
    .replace(/\.npz$/i, "")
    .replace(/[^A-Za-z0-9_.\- ]+/g, "_")
    .replace(/^[^A-Za-z0-9]+/, "")
    .slice(0, 100);
}

export function UploadSessionForm({ projectId, onUploaded }: { projectId: string; onUploaded: (s: Session) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [date, setDate] = useState("");
  const [binSize, setBinSize] = useState("");
  const [notes, setNotes] = useState("");
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<ApiError>();
  const [warnings, setWarnings] = useState<string[]>([]);

  function pick(f: File | null) {
    setFile(f);
    setError(undefined);
    setWarnings([]);
    if (f && !name) setName(suggestSessionName(f.name));
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!file) return;
    if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
      setError(new ApiError(413, `File is ${formatBytes(file.size)}; the limit is ${MAX_UPLOAD_MB} MB.`));
      return;
    }
    const form = new FormData();
    form.append("file", file);
    form.append("name", name.trim());
    if (subject.trim()) form.append("subject", subject.trim());
    if (date) form.append("recording_date", date);
    if (binSize) form.append("bin_size_ms", binSize);
    if (notes.trim()) form.append("notes", notes.trim());
    setError(undefined);
    setProgress(0);
    try {
      const session = await uploadSession(projectId, form, setProgress);
      setWarnings(session.warnings);
      setFile(null);
      setName("");
      setNotes("");
      if (fileRef.current) fileRef.current.value = "";
      onUploaded(session);
    } catch (err) {
      setError(err as ApiError);
    } finally {
      setProgress(null);
    }
  }

  const busy = progress !== null;
  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <label className="label" htmlFor="session-file">Session file (.npz with X and Y)</label>
        <input
          id="session-file"
          ref={fileRef}
          type="file"
          accept=".npz"
          className="block w-full text-sm file:mr-3 file:rounded file:border file:border-zinc-300 file:bg-white file:px-2.5 file:py-1 file:text-sm dark:file:border-zinc-700 dark:file:bg-zinc-800 dark:file:text-zinc-100"
          onChange={(e) => pick(e.target.files?.[0] ?? null)}
          disabled={busy}
        />
        {file && <div className="mt-1 text-xs text-zinc-500">{formatBytes(file.size)}</div>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="label" htmlFor="session-name">Session name</label>
          <input id="session-name" className="input font-mono" required pattern="[A-Za-z0-9][A-Za-z0-9_.\- ]{0,99}" title="Letters, digits, space, _ . - (must start with a letter or digit)" value={name} onChange={(e) => setName(e.target.value)} placeholder="R1_D01" />
        </div>
        <div>
          <label className="label" htmlFor="session-subject">Subject</label>
          <input id="session-subject" className="input" maxLength={100} value={subject} onChange={(e) => setSubject(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="session-date">Recording date</label>
          <input id="session-date" type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="session-bin">Bin size (ms)</label>
          <input id="session-bin" type="number" min="0" step="any" className="input" value={binSize} onChange={(e) => setBinSize(e.target.value)} />
        </div>
        <div className="col-span-2">
          <label className="label" htmlFor="session-notes">Notes</label>
          <input id="session-notes" className="input" maxLength={5000} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
      </div>
      {busy && (
        <div className="h-1.5 overflow-hidden rounded bg-zinc-200 dark:bg-zinc-800">
          <div className="h-full bg-accent-600 transition-all" style={{ width: `${Math.round((progress ?? 0) * 100)}%` }} />
        </div>
      )}
      {error && <ErrorBox error={error} />}
      {warnings.length > 0 && (
        <Notice>
          Uploaded with warnings:
          <ul className="list-disc pl-5">{warnings.map((w) => <li key={w}>{w}</li>)}</ul>
        </Notice>
      )}
      <Button type="submit" variant="primary" disabled={!file || !name.trim() || busy}>
        {busy ? (progress !== null && progress < 1 ? `Uploading ${Math.round(progress * 100)}%` : "Validating…") : "Upload session"}
      </Button>
    </form>
  );
}
