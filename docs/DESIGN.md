# NeuroDrift — Design

This document records the architecture, the scientific/engineering decisions taken
where the specification was ambiguous, the data model and the API contract.

## 1. Architecture

```text
Browser ──► nginx ──► /        Next.js (standalone server, client-rendered pages)
                  └─► /api/*   FastAPI (uvicorn, 1 process)
                                  │  SQLAlchemy ──► PostgreSQL  (metadata + compact JSON results)
                                  │  filesystem ──► /data/projects/{project}/sessions/{session}/raw.npz
                                  └─ RQ enqueue ──► Redis ──► RQ worker (1 process)
                                                                 └─ numpy / scipy / scikit-learn
```

* **One backend image, two roles.** The API and the worker share the same Python
  image; the worker runs `rq worker`. Scientific code lives in `app/analysis/` and
  imports nothing from FastAPI or SQLAlchemy, so it can be used from a notebook.
* **Compact results in Postgres, arrays on disk.** Raw sessions and per-session
  derived payloads (QC traces, PCA) live next to `raw.npz`; the database stores
  metadata, file paths (relative to `DATA_DIR`, built only from UUIDs) and result
  matrices as JSON.
* **Single worker, single BLAS thread.** `OMP_NUM_THREADS=1` etc. are set in the
  images. Cross-session analysis loads at most two sessions at once, runs pairs
  sequentially and caches per-session preprocessing within one job.
* **Frontend talks only to `/api`.** In Docker nginx routes `/api` to FastAPI; in
  local development Next.js rewrites `/api` to `http://localhost:8000`.
* **Migrations.** Alembic runs `upgrade head` when the backend container starts.
  Tests use SQLite via `create_all` for speed; Docker deployments use Postgres.
* **No authentication in V1.** All routes go through a `get_db` dependency and a
  project lookup, so a `current_user` dependency can be added later in one place.

## 2. Decisions on ambiguous or risky parts of the specification

1. **Diagonal vs off-diagonal comparability.** If the diagonal uses an 80/20 split
   while off-diagonal cells train on all of Sᵢ and test on all of Sⱼ, the cells are
   not comparable (different training-set sizes, different test sets). NeuroDrift
   trains every decoder for row *i* on the **first 80 %** of Sᵢ and evaluates every
   cell in column *j* on the **last 20 %** of Sⱼ. Each row therefore uses one
   training block and each column one test block, and the diagonal is an honest
   held-out within-session estimate. Because every pair is restricted to the neurons
   both sessions share (decision 4), the row's decoder is refit on that block for each
   distinct shared-neuron set — one fit per row when all sessions share the same
   neurons, several when units turn over. This is shown in the UI.
2. **Contiguous splits.** Time bins are autocorrelated, so splits are contiguous
   blocks, never shuffled. No gap is inserted between blocks in V1 (documented).
3. **Normalisation.** Features are z-scored with the training block's μ/σ only;
   the same μ/σ are applied to every test session (spec §31). Features with zero
   variance in the training block are dropped before fitting, and the count is
   reported.
4. **Neuron alignment.** With `neuron_ids` in both sessions the intersection is used
   (order of the training session). Without ids, equal feature counts are required
   and the UI warns that identity is assumed. Mixed cases (ids in one session only)
   are rejected for that pair rather than guessed.
5. **Subspace comparisons use the decoder's data blocks.** Cell (i, j) compares a PCA
   fit on the training block of Sᵢ with an independent PCA fit on the test block of
   Sⱼ, restricted to the neurons the pair shares and that vary in both blocks. Each
   subspace cell therefore describes exactly the data behind the matching decoder
   cell, which keeps the drift-vs-decoding scatter like-for-like. The matrix is not
   symmetric, and its diagonal is a within-session reference (block-to-block
   estimation noise plus within-session non-stationarity) rather than a trivial 0°.
   Each fit centres/scales with its own statistics because the fits are independent.
6. **Chance level for principal angles.** Angles between random k-dimensional
   subspaces of ℝⁿ are not 90°; they depend on k/n. A Monte-Carlo chance level
   for random subspaces of the same (k, n) is reported next to every angle.
7. **No lag/history in V1.** Ridge maps a single bin of X to the same bin of Y. A
   Wiener filter (lagged features) is the natural next decoder and is deferred.
8. **Negative R².** Cross-session R² can be strongly negative. Values are reported
   unclipped; only the heatmap colour scale is bounded.
9. **No uncertainty estimates in V1.** No bootstrap CIs; the UI does not imply
   significance. Deferred (spec §48).
10. **"Firing rate" wording.** `X` may be counts or already-processed features, so
    the UI says "activity" unless values are non-negative integers.
11. **1-D `Y`** is accepted and treated as a single output (with a warning); 1-D `X`
    is rejected.

## 3. Repository structure

```text
neurodrift/
├── README.md  docker-compose.yml  .env.example
├── docs/DESIGN.md
├── nginx/nginx.conf
├── backend/
│   ├── Dockerfile  requirements.txt  requirements-dev.txt  pyproject.toml  alembic.ini
│   ├── alembic/ (env.py, versions/)
│   ├── app/
│   │   ├── main.py
│   │   ├── core/      config.py, logging.py
│   │   ├── db/        base.py, session.py
│   │   ├── models/    project.py, session.py, experiment.py
│   │   ├── schemas/   pydantic request/response models
│   │   ├── api/       health.py, projects.py, sessions.py, experiments.py
│   │   ├── services/  storage.py, ingest.py, experiments.py
│   │   └── analysis/  dataset.py, qc.py, preprocessing.py, decoding.py,
│   │                  pca.py, subspace.py, behavior.py, synthetic.py
│   └── tests/
└── frontend/
    ├── app/ (routes)  components/  lib/  types/
    └── Dockerfile
```

## 4. Data model

| Table | Columns |
| --- | --- |
| `projects` | `id` UUID PK, `name`, `description`, `is_demo`, `created_at`, `updated_at` |
| `sessions` | `id` UUID PK, `project_id` FK (cascade), `name` (unique per project), `session_order`, `subject`, `recording_date`, `bin_size_ms`, `notes`, `extra_metadata` JSON, `n_samples`, `n_neurons`, `n_outputs`, `has_timestamps`, `has_trial_ids`, `has_neuron_ids`, `duration_s`, `file_path` (relative), `file_size_bytes`, `sha256`, `original_filename` (display only), `qc_summary` JSON, `warnings` JSON, `created_at` |
| `experiments` | `id` UUID PK, `project_id` FK, `name`, `status` (pending/running/completed/failed), `config` JSON (decoder, alpha, zscore, n_components, output dims, split fraction), `session_ids` JSON (ordered), `random_seed`, `software` JSON (package versions), `progress`, `error_message`, `job_id`, `created_at`, `started_at`, `finished_at` |
| `experiment_results` | `id` UUID PK, `experiment_id` FK unique, `decoder_matrix` JSON, `subspace_matrix` JSON, `session_summaries` JSON, `pairs` JSON (per-pair scalar metrics), `created_at` |

`experiments` / `experiment_results` are added by the Milestone 5 migration.

## 5. API contract

All bodies are JSON unless noted. Errors are `{"detail": ...}` with the usual
status codes (400 bad input, 404 missing, 409 conflict, 413 too large, 422 invalid
dataset or parameters).

| Method & path | Purpose |
| --- | --- |
| `GET /api/health` | `{status, database, version}` |
| `GET /api/projects` | list with `n_sessions`, `latest_experiment` |
| `POST /api/projects` | `{name, description?}` → 201 project |
| `GET /api/projects/{id}` | project with sessions |
| `PATCH /api/projects/{id}` | rename / describe |
| `DELETE /api/projects/{id}` | 204, removes files |
| `GET /api/projects/{id}/sessions` | ordered sessions |
| `POST /api/projects/{id}/sessions` | multipart: `file` (.npz), `name`, `subject?`, `recording_date?`, `bin_size_ms?`, `notes?` → 201 session (+ `warnings`) |
| `GET /api/sessions/{id}` | session metadata |
| `PATCH /api/sessions/{id}` | edit metadata |
| `DELETE /api/sessions/{id}` | 204 |
| `GET /api/sessions/{id}/qc` | QC summary, per-neuron stats, trace windows, target histograms |
| `GET /api/sessions/{id}/pca?n_components=&zscore=` | explained variance, loadings summary, PC trajectories |
| `GET /api/sessions/{id}/decode?alpha=&zscore=&decoder=` | within-session held-out evaluation |
| `POST /api/projects/{id}/experiments` | config → 202 experiment (enqueued) |
| `GET /api/projects/{id}/experiments` | list |
| `GET /api/experiments/{id}` | config + status + results |
| `GET /api/experiments/{id}/status` | `{status, progress, error_message}` |
| `GET /api/experiments/{id}/matrix` | decoder + subspace matrices |
| `GET /api/experiments/{id}/compare/{train}/{test}` | pair comparison payload |
| `POST /api/experiments/{id}/rerun` | failed → 202 experiment reset to pending and re-queued (409 unless failed, 422 if a session was deleted) |
| `GET /api/experiments/{id}/export/{artifact}` | `decoder_matrix.csv`, `subspace_angles.csv`, `session_summary.csv`, `experiment_config.json`, `all.zip` (409 unless completed) |
| `GET /api/experiments/{id}/report.html` | self-contained HTML report, inline CSS/SVG (409 unless completed; `?download=true` → attachment) |
| `POST /api/demo` | create the synthetic demo project → 201 |
