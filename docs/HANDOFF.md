# Handoff: next round of website work

**For:** a Claude Code session that can only see this GitHub repository.
**From:** the session that deploys the site and can reach the live server (2026-10-16, `main` at `1eac281`).

Everything below that you cannot check from the repo — the production setup, live measurements,
bugs seen on real devices — was measured on the live site and is written down here so you don't
have to guess. Server addresses and credentials are deliberately left out (this repo is public),
and you don't need them.

---

## 1. How this round works

1. **Branch → PR → owner merges → deploy session ships it.** Work on your own branch and open
   pull requests against `main`. Prefer one PR per theme (bugs, performance, motion, content) so
   each can be reviewed and rolled back on its own. Don't push to `main` directly.
2. **You cannot reach the server or the live site, and you don't need to.** Don't add scripts that
   SSH anywhere, and don't change ports, `nginx/nginx.conf`, `docker-compose.yml` or the
   Dockerfiles unless a task below says so.
3. **Every PR description ends with a "Deploy notes" section** listing:
   - which services changed: `frontend`, `backend`, `worker`, `nginx`, `docker-compose.yml`;
   - new or changed dependencies (`frontend/package.json`, `backend/requirements.txt`);
   - database migrations (new Alembic revision?) and new environment variables;
   - anything to run or check after deploy.

   A frontend-only PR means only the frontend container is rebuilt; backend, worker and data
   keep running.
4. **Checks that must pass before you open a PR** (they all pass on `1eac281`):
   ```bash
   cd backend && pip install -r requirements-dev.txt && pytest          # 79 passed
   cd frontend && npm ci && npx tsc --noEmit && npm test && npm run build # 9 tests passed
   ```
5. **Hand back:** reply with the PR links and a two-line summary. The owner merges and asks the
   deploy session to pull `main` and rebuild.

## 2. Production environment (facts you can't see)

| | |
| --- | --- |
| Host | one shared Ubuntu VM, **2 vCPU, ~7.5 GB RAM**, ~25 GB disk free; unrelated services also run on it |
| Stack | Docker Compose: `postgres:16-alpine`, `redis:7-alpine`, backend + worker (`python:3.13-slim`), frontend (`node:22-alpine`, Next.js standalone), `nginx:1.27-alpine` |
| Memory limits | frontend **512 MB**, backend 2 GB, worker 3 GB (see `docker-compose.yml`) |
| Access | private only: Tailscale serve (HTTPS, HTTP/2) → nginx → Next.js / FastAPI. No CDN, no public traffic, so Open Graph/SEO work is low value |
| Builds | the frontend image is built **on the VM** (`npm ci` + `next build` inside Docker on 2 vCPU). Keep build-time work light; anything added to `package.json` is installed there |
| Latency | ~190 ms round trip from the owner to the server; time to first byte ≈ that round trip. The number of sequential requests matters more than server CPU |
| Live data | one demo project (6 synthetic sessions), 2 completed experiments |
| Resource use at idle | frontend ~50 MB, backend ~180 MB, worker ~120 MB |

## 3. Measured baseline (live site, `1eac281`)

- **First-load JS:** 104–119 kB per route (103 kB shared). No web fonts (system font stack).
- **Lazy chunks:**
  - Plotly (`plotly.js-dist-min`): **4.4 MB raw / 1.33 MB gzip**, loaded on every analysis page
    (`/projects/[id]`, `/sessions/[id]`, `/experiments/[id]`, compare). About 1 s to download from
    the owner's location.
  - three.js: 326 kB raw / 77 kB gzip, on `/research/3d-vision`.
- **Headers:** HTML and JS/CSS are gzipped over HTTP/2, and `/_next/static/*` is
  `public, max-age=31536000, immutable`, which is good. Files in `public/` are sent with
  **`max-age=0`**.
- **Images:** `/research/cross-day-decoding` shows two PNGs, `paired_directional.png` (352 KB) and
  `directional_replication_main.png` (180 KB). They are lazy-loaded with a plain `<img>`, shown about
  990 px wide, and have no width/height attributes.
- **Home page (desktop):** 8 requests, ~39 kB transferred, layout shift 0, no console errors.
- **Console:** no errors on any of the 14 pages at 375 px or at 1366 px.
- **The hero raster is well built**
  (`components/showcase/HeroRaster.tsx`). It pauses off-screen (IntersectionObserver) and in hidden
  tabs (`visibilitychange`), renders a still frame under reduced motion, and caps pixel density at
  2×. Use it as the pattern for any new animation.

## 4. Backlog, in priority order

### P0. Bugs: one PR, "fix: phone layout and glossary tooltips"

All measured at **375 × 812** on the live site.

- **B1. Cards grow wider than the screen on phones.**
  - Where: `/projects/[id]` (the "Sessions" card is **822 px** wide, so table columns are cut
    off) and `/experiments/[id]` (cards up to 470 px).
  - Cause: single-column CSS grids give grid items the default `min-width: auto`, so the
    `overflow-x-auto` table wrapper inside the card never gets to scroll. The grids are
    `grid gap-6 xl:grid-cols-[1fr_340px]` (`app/projects/[id]/page.tsx:93`), and
    `grid gap-6 2xl:grid-cols-2` / `xl:grid-cols-[minmax(0,1fr)_380px]` in
    `app/experiments/[id]/page.tsx`.
  - Fix: `min-w-0` on the grid children, or `minmax(0,1fr)` tracks / `grid-cols-1`. Check the other
    pages with the same pattern.
- **B2. Card-header controls go off-screen.**
  - What happens: `Card` in `components/ui.tsx:71` lays out the title, subtitle and actions in one
    non-wrapping row with `shrink-0` actions, so on phones the selects ("Mean Pearson r", "Mean
    principal angle (°)", "train on …") are pushed past the edge.
  - Fix: let the header wrap so the actions drop below the title on small screens.
- **B3. Glossary tooltips are clipped at the right edge.**
  - Where: `Term` in `components/showcase/Story.tsx:8-25`, on `/research/cross-day-decoding`,
    `/research/shared-variability` and `/research/spike-sorting`.
  - What happens: the tooltip is `w-64`, centred on the word. Near the right edge it extends to
    387–418 px on a 375 px screen and is clipped by the layout's `overflow-x-clip`.
  - Fix: limit the width to `calc(100vw - 2rem)` and shift or flip it so it stays inside the
    viewport. Make sure it opens on **tap** on touch devices and closes on an outside tap or
    Escape. It already has `tabIndex={0}`; verify on iOS Safari.
- **B4. Documentation table overflows.** On `/documentation` the data-format table is **913 px**
  wide with no scroll container (`app/documentation/page.tsx:25`). Wrap it in `overflow-x-auto`.
- **B5. Check phone navigation.** The phone header only has Research / NeuroDrift / Data
  (`components/Sidebar.tsx`, `MOBILE_LINKS`). Confirm that Experiments, Demo and Documentation can
  each be reached in at most two taps on a phone. If not, add a compact menu.

**Done when:** at 375 px, on every route, `document.documentElement.scrollWidth` equals the
viewport width and no visible element sticks out past the right edge unless it sits inside an
`overflow-x-auto` container. If your environment can run a headless browser, add a dev-only check
script (never part of the Docker build), and write down in the PR how you verified it.

### P1. Load faster without removing motion: "perf: …"

- **P1a. Research figures.**
  - Convert the two PNGs to WebP (or AVIF with a WebP fallback) at about 1000 px and 2000 px wide.
  - Serve them with `srcset`/`sizes` and explicit `width`/`height`.
  - Pre-convert and commit the files: no image processing at build or run time. `next/image`
    optimisation would need `sharp` inside the 512 MB frontend container, so avoid it.
  - Target: under 150 KB in total for the two figures at 1x, with no visible quality loss in the
    plotted text.
- **P1b. Cache headers for `public/`.**
  - Give versioned asset paths a long cache: either content-hashed filenames with
    `public, max-age=31536000, immutable`, or a moderate `max-age=86400, stale-while-revalidate`.
  - Use `headers()` in `frontend/next.config.ts`; nginx passes the headers through.
- **P1c. Smaller Plotly.** The trace types in use are `scatter` (16), `scattergl` (8), `bar` (6),
  `histogram` (2) and `heatmap` (1).
  - Option A (preferred): switch `components/Plot.tsx` to `plotly.js-cartesian-dist-min` (includes
    scatter/bar/histogram/heatmap; roughly a third of the full bundle) and replace `scattergl` with
    `scatter`.
    - Check the point counts first: traces are capped at about 1,500–2,000 points, which SVG
      handles fine.
    - If one plot really needs WebGL, load the `gl2d` bundle only for that plot.
  - Keep the lazy `import()`.
  - Optionally warm the chunk with `requestIdleCallback` when an analysis link scrolls into view.
  - Done when: every existing plot renders the same, and the lazy Plotly chunk is under ~600 kB
    gzip.
- **P1d. Decorative glows.**
  - What costs: `HeroGlow` (`components/showcase/Story.tsx` ~line 29) animates three `blur-3xl`
    blobs. The site has five `blur-3xl` and several `backdrop-blur` surfaces (sidebar, phone
    header, tooltips). Animated `filter: blur()` layers are expensive on low-end phone GPUs while
    scrolling.
  - Fix: keep the look but draw the glows with `radial-gradient` backgrounds (no filter), animate
    only `transform`/`opacity`, and stop the drift off-screen and under reduced motion.
  - Consider a solid or less translucent phone header instead of `backdrop-blur-md`.
- **P1e. three.js.** Load the stereo demo on `/research/3d-vision` with `next/dynamic`
  (`ssr: false`) when it nears the viewport, behind a same-size static placeholder, so the page
  shows text before WebGL starts.
- **Out of scope:** web fonts (keep the system stack), brotli (not in the stock nginx image), CDN.

### P2. Motion polish: "motion: …"

Rules:
- Animate only `transform` and `opacity`.
- Respect reduced motion; the existing hooks are `prefersReducedMotion()` in
  `components/motion.tsx` and the `@media (prefers-reduced-motion)` blocks in `app/globals.css`.
- Pause any `requestAnimationFrame` loop off-screen and in hidden tabs (copy the HeroRaster
  pattern).
- Content must be readable with JavaScript off: no content may start hidden. `Reveal` already
  gets this right; keep it that way.

Ideas, in rough order of value:
- Smooth transitions between research pages with the View Transitions API, and no fallback
  animation where it's unsupported.
- Once-only reveal of heatmap rows and of the stability-explorer lines on the experiment page.
- Press/hover states on cards and buttons.
- Keep the page-in animation in `app/template.tsx` at 200 ms or less.
- Scroll-linked step highlighting in the research stories (`components/showcase/Story.tsx`).

### P3. More context: "content: …"

**Hard rule, from the README:**
- Show only already-public results. Unpublished projects describe questions and methods.
- Never invent numbers, publications, collaborators, affiliations or claims. If a fact isn't
  already in the repo, put a visible `TODO(owner): …` comment in the source instead of guessing.
- Keep the project's careful wording: decoder transfer, representation change and behaviour change
  are separate measurements; no causal claims; descriptive statistics are labelled as descriptive.

Safe ideas built from content already in the repo:
- A collapsible **"How to read these results"** panel on `/experiments/[id]`, drawn from
  `docs/DESIGN.md` §2 and `app/documentation/page.tsx`. It should explain the diagonal (held-out
  within-session estimate), the chance level for principal angles, and why lower transfer is not
  by itself drift.
- A **glossary page** built from the `Term` definitions, with a single source of truth in
  `frontend/content/research.ts`.
- **Links between research pages and the tool.** For example, cross-day decoding → "try it on the
  demo data" → `/demo`.
- **Better first-visit onboarding** on `/projects` when only the demo project exists.
- **Accessibility:** alt text for every figure, visible keyboard focus, and dark-mode contrast on
  the gradient headings.

### P4. Larger scientific features (only if the owner asks)

Bootstrap confidence intervals, a lagged Wiener-filter decoder and CCA/Procrustes alignment are
deferred in `docs/DESIGN.md` §2. Each needs analysis code in `backend/app/analysis/` (no FastAPI
imports, type hints, docstrings), tests, and must fit in the single worker's 3 GB.

## 5. Conventions and where things live

- **Scientific conventions:** `docs/DESIGN.md`. **API contract:** `docs/DESIGN.md` §5.
- **Frontend:**
  - UI primitives: `components/ui.tsx`
  - motion helpers: `components/motion.tsx`
  - lazy Plotly wrapper: `components/Plot.tsx`
  - research content: `content/research.ts`
  - showcase components: `components/showcase/`
  - Tailwind tokens and animations: `tailwind.config.ts`
- **Tests:** backend on SQLite with inline jobs (`backend/tests/conftest.py`); frontend vitest for
  pure helpers in `lib/*.test.ts`. Put new logic in `lib/` so it can be unit-tested.
- **Dependencies:** don't add heavy ones. Anything new in `frontend/package.json` must install and
  build inside `node:22-alpine` on a 2-vCPU VM.
