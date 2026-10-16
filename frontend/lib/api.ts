import type {
  DecodeParams,
  DecodeResult,
  Experiment,
  ExperimentCreate,
  ExperimentMatrix,
  PairComparison,
  Project,
  ProjectDetail,
  Session,
  SessionPca,
  SessionQc,
} from "@/types/api";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details: string[] = [],
  ) {
    super(message);
  }
}

/** Turn a FastAPI error body into a message plus a list of details. */
export function parseErrorBody(status: number, body: unknown): ApiError {
  const detail = (body as { detail?: unknown } | null)?.detail;
  if (typeof detail === "string") return new ApiError(status, detail);
  if (Array.isArray(detail)) {
    // Pydantic request-validation errors.
    const items = detail.map((d: { loc?: unknown[]; msg?: string }) => {
      const field = (d.loc ?? []).filter((p) => p !== "body").join(".");
      return field ? `${field}: ${d.msg ?? "invalid"}` : (d.msg ?? "invalid");
    });
    return new ApiError(status, "Invalid request", items);
  }
  if (detail && typeof detail === "object") {
    const d = detail as { message?: string; errors?: string[] };
    return new ApiError(status, d.message ?? `Request failed (${status})`, d.errors ?? []);
  }
  return new ApiError(status, `Request failed (${status})`);
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...init,
    headers: init?.body && !(init.body instanceof FormData) ? { "Content-Type": "application/json" } : undefined,
  });
  if (!res.ok) {
    let body: unknown = null;
    try {
      body = await res.json();
    } catch {
      /* non-JSON error page, e.g. from the proxy */
    }
    throw parseErrorBody(res.status, body);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
  listProjects: () => request<Project[]>("/projects"),
  getProject: (id: string) => request<ProjectDetail>(`/projects/${id}`),
  createProject: (name: string, description = "") =>
    request<Project>("/projects", { method: "POST", body: JSON.stringify({ name, description }) }),
  updateProject: (id: string, body: { name?: string; description?: string }) =>
    request<Project>(`/projects/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  deleteProject: (id: string) => request<void>(`/projects/${id}`, { method: "DELETE" }),

  getSession: (id: string) => request<Session>(`/sessions/${id}`),
  getSessionQc: (id: string) => request<SessionQc>(`/sessions/${id}/qc`),
  updateSession: (id: string, body: Partial<Pick<Session, "name" | "subject" | "recording_date" | "bin_size_ms" | "notes" | "session_order">>) =>
    request<Session>(`/sessions/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  deleteSession: (id: string) => request<void>(`/sessions/${id}`, { method: "DELETE" }),

  decodeSession: (id: string, p: DecodeParams) => {
    const q = new URLSearchParams({ decoder: p.decoder, alpha: String(p.alpha), zscore: String(p.zscore) });
    p.outputs.forEach((o) => q.append("outputs", String(o)));
    return request<DecodeResult>(`/sessions/${id}/decode?${q.toString()}`);
  },

  listExperiments: () => request<Experiment[]>("/experiments"),
  listProjectExperiments: (projectId: string) => request<Experiment[]>(`/projects/${projectId}/experiments`),
  createExperiment: (projectId: string, body: ExperimentCreate) =>
    request<Experiment>(`/projects/${projectId}/experiments`, { method: "POST", body: JSON.stringify(body) }),
  getExperiment: (id: string) => request<Experiment>(`/experiments/${id}`),
  getExperimentMatrix: (id: string) => request<ExperimentMatrix>(`/experiments/${id}/matrix`),
  deleteExperiment: (id: string) => request<void>(`/experiments/${id}`, { method: "DELETE" }),

  getSessionPca: (id: string, nComponents: number, zscore: boolean) =>
    request<SessionPca>(`/sessions/${id}/pca?n_components=${nComponents}&zscore=${zscore}`),
  comparePair: (experimentId: string, trainId: string, testId: string) =>
    request<PairComparison>(`/experiments/${experimentId}/compare/${trainId}/${testId}`),

  createDemo: () => request<Project>("/demo", { method: "POST" }),
};

/** Upload a session with progress reporting (fetch has no upload progress events). */
export function uploadSession(
  projectId: string,
  form: FormData,
  onProgress: (fraction: number) => void,
): Promise<Session> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `/api/projects/${projectId}/sessions`);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(e.loaded / e.total);
    };
    xhr.onload = () => {
      let body: unknown = null;
      try {
        body = JSON.parse(xhr.responseText);
      } catch {
        /* ignore */
      }
      if (xhr.status >= 200 && xhr.status < 300) resolve(body as Session);
      else reject(parseErrorBody(xhr.status, body));
    };
    xhr.onerror = () => reject(new ApiError(0, "Network error during upload"));
    xhr.send(form);
  });
}
