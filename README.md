# NeuroDrift

**Measure neural representation drift and decoder stability across recording sessions.**

NeuroDrift is a lightweight web application for studying the cross-session stability of
neural population representations and linear neural decoders. Upload one `.npz` file per
recording session (binned neural activity `X` and behaviour `Y`), inspect quality control,
and — as the milestones below land — train decoders on one session, test them on every other
session, and compare that generalisation with changes in neural subspaces, activity levels
and behaviour.

> Status: **Milestones 1–7 of 8 are implemented** (foundation, data ingestion + QC, synthetic
> demo, ridge/OLS decoding, cross-session decoder matrix via RQ, PCA subspace drift, pair
> comparison). Exports, report generation and deployment polish are next. See [Roadmap](#roadmap).

<!-- Screenshots: add docs/img/project.png and docs/img/session.png once captured. -->

## Why

Neural population activity recorded from the same brain region changes across days — through
biological variability, learning, electrode instability, neuron turnover, recording quality and
behavioural differences — and decoders trained on earlier sessions degrade. NeuroDrift analyses
three related but distinct phenomena:

1. **neural representation change** (PCA subspaces, activity levels),
2. **behavioural distribution change**, and
3. **decoder generalisation**.

They are reported separately. Decoder degradation is not treated as evidence of
representational drift, and the software makes no causal claims.

## Architecture

```text
Browser ──► nginx ──► /        Next.js 15 (TypeScript, Tailwind, Plotly)
                  └─► /api/*   FastAPI ──► PostgreSQL   (metadata, compact JSON results)
                                  │    ──► filesystem   (/data/projects/<uuid>/sessions/<uuid>/raw.npz)
                                  └──► Redis ──► RQ worker (cross-session experiments)
                                                     └─ NumPy / SciPy / scikit-learn
```

Scientific code lives in [`backend/app/analysis/`](backend/app/analysis) and has no web or
database dependencies, so it can be imported from a notebook. Design decisions, the data model
and the full API contract are in [`docs/DESIGN.md`](docs/DESIGN.md). Interactive API docs are
served at `/api/docs`.

## Quick start (Docker)

```bash
cp .env.example .env        # then set POSTGRES_PASSWORD
docker compose up -d --build
open http://localhost       # click "Load Demo Project"
```

Data persists in the `pgdata` and `datasets` volumes across `docker compose down`/`up`.

## Local development

Backend (Python ≥ 3.11):

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements-dev.txt
# Postgres (matches the default DATABASE_URL), or simply: export DATABASE_URL=sqlite:///./dev.db
docker run -d --name neurodrift-pg -p 5432:5432 -e POSTGRES_USER=neurodrift \
  -e POSTGRES_PASSWORD=neurodrift -e POSTGRES_DB=neurodrift postgres:16-alpine
alembic upgrade head
uvicorn app.main:app --reload --port 8000
pytest
```

Frontend (Node ≥ 20):

```bash
cd frontend
npm install
npm run dev        # http://localhost:3000, proxies /api to localhost:8000
npm test && npm run typecheck
```

## Production deployment

On a 2-CPU / 8-GB Ubuntu host with Docker:

```bash
git clone https://github.com/howardbot/neurodrift.git && cd neurodrift
cp .env.example .env && $EDITOR .env      # strong POSTGRES_PASSWORD, ENVIRONMENT=production
docker compose up -d --build
```

**TLS with Let's Encrypt.** If NeuroDrift owns ports 80/443, put certbot in front of the
bundled nginx or terminate TLS on the host. If the host already runs nginx for other sites,
bind NeuroDrift locally (`HTTP_BIND=127.0.0.1`, `HTTP_PORT=8088`) and add a host server block:

```nginx
server {
    server_name neurodrift.example.com;
    client_max_body_size 510m;
    location / {
        proxy_pass http://127.0.0.1:8088;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_request_buffering off;
        proxy_read_timeout 600s;
    }
}
```

then `sudo certbot --nginx -d neurodrift.example.com`.

**Private access over Tailscale (no public exposure).** Bind NeuroDrift to localhost and let
Tailscale terminate HTTPS for your tailnet only:

```bash
# .env: HTTP_BIND=127.0.0.1  HTTP_PORT=8088
docker compose up -d --build
sudo tailscale serve --bg --https=8443 http://127.0.0.1:8088   # tailnet only (not Funnel)
# → https://<machine>.<tailnet>.ts.net:8443 ; undo with: sudo tailscale serve --https=8443 off
```

The serve configuration persists across reboots. Nothing listens on the public interface, so
no firewall changes are needed.

Resource use is deliberately small: one uvicorn process, one RQ worker (one job at a time), BLAS/OpenMP
limited to one thread (`OMP_NUM_THREADS=1` etc.), container memory limits in
`docker-compose.yml`.

## Data format

One NumPy `.npz` per session. Rows of `X` and `Y` are aligned time bins.

| Key | Shape | Required | Meaning |
| --- | --- | --- | --- |
| `X` | `(n_samples, n_neurons)` | yes | neural features, e.g. binned spike counts |
| `Y` | `(n_samples, n_outputs)` | yes | behaviour, e.g. x/y velocity (1-D → one output) |
| `timestamps` | `(n_samples,)` | no | bin times in seconds |
| `trial_ids` | `(n_samples,)` | no | integer trial label per bin |
| `neuron_ids` | `(n_neurons,)` | no | unique int/str unit IDs, used to match units across sessions |

```python
np.savez("R1_D01.npz", X=X, Y=Y, timestamps=t, trial_ids=trial_ids, neuron_ids=unit_ids)
```

Files are opened with `allow_pickle=False` (object arrays are rejected, never unpickled), the
zip container is inspected before loading (non-array members and oversized archives are
refused), and every problem — missing arrays, mismatched sample counts, NaN/inf, zero samples
or neurons, wrong dimensionality, duplicate IDs — is reported in one response. Session
metadata (subject, recording date, bin size, notes) is entered in the UI. Limits: 500 MB per
upload, 30 sessions per project.

## Demo data

**Load Demo Project** generates six seeded (seed 42) synthetic sessions, days 1–21, each with
8,000 bins of 20 ms, 94–96 Poisson units and 2-D velocity:

```text
minimum-jerk reaches (8 directions) ─► latent z = [vx, vy, |v|, f1, f2]
                                      ─► log-rate = log(baseline) + C_s z
                                      ─► counts ~ Poisson(rate · dt)
```

`f1, f2` are slow Ornstein–Uhlenbeck factors unrelated to behaviour. Between sessions the
tuning (preferred direction, depth, speed gain, factor loadings, baseline) performs a random
walk with s.d. ∝ √(days apart); a non-accumulating per-session jitter, small behavioural
changes and unit turnover (new `neuron_ids`) make the drift realistic rather than perfectly
monotonic. With a ridge decoder, within-session correlation is ≈ 0.86–0.90 and transfer
between the most distant sessions falls to ≈ 0.6–0.7. See
[`synthetic.py`](backend/app/analysis/synthetic.py).

## Scientific methods

Implemented:

* **QC** — per-neuron mean, variance and fraction of zero bins; zero-variance (flat) and
  silent units; target mean/variance/SD; duration from timestamps. Trace plots show a
  contiguous window (first 2,000 bins), not a decimated session.
* **Neuron identity** — with `neuron_ids` in both sessions comparisons use the intersection
  (IDs compared as strings, ordered by ID); without IDs equal counts are required and identity
  is assumed (shown in the UI); IDs in only one session → the pair is marked unavailable.
  Dimensions are never silently truncated, and the number of shared/used neurons is reported
  for every cell.
* **Preprocessing** — features with zero variance in the training block are dropped;
  optional z-scoring uses training-block μ/σ only, applied unchanged to test data (no
  test-set statistics, no per-session re-normalisation).
* **Decoder** — `sklearn.linear_model.Ridge` (α = 1 default) or ordinary least squares, with
  intercept, single bin → same bin (no lags). Metrics per output and averaged: Pearson r
  (headline), R², RMSE. Undefined values (constant signals) are reported as missing and
  excluded from means, never propagated as NaN.
* **Splits** — contiguous, never shuffled. Within a session: first 80 % train, last 20 % test.
  Across sessions: decoders for row *i* are trained on the first 80 % of session *i*; every
  cell in column *j* is evaluated on the last 20 % of session *j*. The diagonal is therefore a
  held-out within-session estimate, all cells share training-set size, and each column shares
  one test block.
* **Jobs** — experiments are saved with their configuration, seed, session snapshot and
  package versions, queued in Redis and run by a single RQ worker that keeps at most ~1 GB of
  session arrays resident. Failures are stored on the experiment (`status = failed`,
  `error_message`); the worker keeps serving later jobs. Completed results reopen without
  recomputation.

* **PCA** — per session: zero-variance neurons dropped, centred and optionally z-scored with
  the data's own statistics, `sklearn.decomposition.PCA`; k ∈ {3, 5, 10, 20}, capped by data
  size. The session page shows the spectrum, PC time courses and the PC1–PC2 trajectory
  (smoothing is display-only).
* **Subspace drift** — cell (i, j) compares a PCA fit on the *training block* of session i
  with an independent PCA fit on the *test block* of session j, on the neurons both share and
  that vary in both blocks — exactly the data behind decoder cell (i, j). The diagonal is a
  within-session reference (estimation noise + within-session non-stationarity), not 0°.
  Reported: principal angles (`scipy.linalg.subspace_angles`, degrees; mean and largest), a
  seeded Monte-Carlo chance level for random k-dimensional subspaces of the same neuron space,
  the normalised projection distance ‖P_A − P_B‖_F / √(2k) = √(Σ sin²θᵢ / k), and the alignment
  index of Elsayed et al. (2016) — the fraction of B's top-k variance captured by A's top-k
  PCs. Cases with 2k > n (angles forced to 0°) are flagged.
* **Drift vs decoding** — scatter of mean principal angle against decoder r per pair, coloured
  by session distance, with Spearman ρ over off-diagonal pairs labelled descriptive (pairs
  share sessions and are not independent; association is not causation).
* **Pair comparison** — for any train → test pair: decoder metrics with within-session
  references, predicted vs actual traces, principal angles against chance and the
  within-session reference, variance-capture curves, per-neuron mean activity (Hz when bin
  size is known and data are counts), and behaviour distributions (mean, SD, variance change,
  two-sample KS statistic reported without p-values because bins are autocorrelated).

Limitations: no uncertainty estimates yet (no bootstrap CIs), no lagged/Wiener decoders, no
alignment methods (CCA/Procrustes), and correlation between representation drift and decoder
loss across pairs is descriptive only.

## Roadmap

| Milestone | Scope | Status |
| --- | --- | --- |
| 1 Foundation | repo, Docker, Postgres, FastAPI, Next.js, project CRUD | ✅ |
| 2 Data ingestion | `.npz` upload, validation, storage, session pages, QC | ✅ |
| 3 Demo dataset | seeded synthetic six-session project | ✅ |
| 4 Decoder | preprocessing, ridge, within-session evaluation | ✅ |
| 5 Cross-session matrix | RQ jobs, train × test heatmap | ✅ |
| 6 Representation drift | PCA, principal angles, drift-vs-decoding scatter | ✅ |
| 7 Pair comparison | click-through pair view | ✅ |
| 8 Polish | exports, report, docs, deployment hardening | ⏳ |

## Tests

```bash
cd backend && pytest          # validation, QC, decoding sanity checks, experiment lifecycle
cd frontend && npm test       # formatting and API error handling
```
