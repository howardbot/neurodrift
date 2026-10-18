"use client";

import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { prefersReducedMotion } from "@/components/motion";
import {
  DECODER_KINDS,
  DT,
  MLP_STEPS,
  MlpTrainer,
  evaluate,
  fitKalman,
  fitPopulationVector,
  makeDataset,
  makeNeurons,
  spikeCounts,
  type Decoder,
  type DecoderKind,
} from "@/lib/decoders";
import { r2 } from "@/lib/linalg";
import { rng } from "@/lib/random";

const SIZE = 360;
const PAD = 12;
const toPx = (v: number) => PAD + ((v + 1) / 2) * (SIZE - 2 * PAD);
const fromPx = (p: number) => ((p - PAD) / (SIZE - 2 * PAD)) * 2 - 1;
const clamp = (v: number, lo = -1, hi = 1) => Math.max(lo, Math.min(hi, v));

const NEURON_OPTIONS = [10, 20, 40, 80];
const MINUTE_OPTIONS = [0.5, 2, 5];
const TRAIL = 36;
const RASTER_BINS = 72;
const GAIN = 2.6; // how hard the simulated subject steers towards the target, per second
const VMAX = 1.3;
const HIT_RADIUS = 0.13;

export const DECODER_STYLE: Record<DecoderKind, { label: string; dot: string; stroke: string; text: string; bar: string }> = {
  pv: { label: "Population vector", dot: "fill-amber-500", stroke: "stroke-amber-500", text: "text-amber-600 dark:text-amber-400", bar: "bg-amber-500" },
  kalman: { label: "Kalman filter", dot: "fill-accent-600 dark:fill-accent-300", stroke: "stroke-accent-600 dark:stroke-accent-300", text: "text-accent-600 dark:text-accent-300", bar: "bg-accent-600 dark:bg-accent-300" },
  mlp: { label: "Neural network", dot: "fill-violet-500", stroke: "stroke-violet-500", text: "text-violet-600 dark:text-violet-400", bar: "bg-violet-500" },
};

interface Cursor {
  x: number;
  y: number;
  vx: number;
  vy: number;
  trail: [number, number][];
  dec: Decoder;
  rand: () => number;
  miss: number[];
  hits: number;
  hitThisTarget: boolean;
}

function chip(on: boolean) {
  return `rounded-full px-3 py-1 text-xs font-medium transition-colors ${
    on
      ? "bg-accent-600 text-white shadow-sm shadow-accent-600/30 dark:bg-accent-300 dark:text-zinc-900"
      : "border border-zinc-300 bg-white/80 text-zinc-700 hover:border-accent-500/60 dark:border-zinc-700 dark:bg-zinc-900/80 dark:text-zinc-300"
  }`;
}

export function DecoderPlayground() {
  const [n, setN] = useState(40);
  const [minutes, setMinutes] = useState(2);
  const [mode, setMode] = useState<"follow" | "targets">("follow");
  const [shown, setShown] = useState<Record<DecoderKind, boolean>>({ pv: true, kalman: true, mlp: true });
  const [running, setRunning] = useState(false);
  const [onScreen, setOnScreen] = useState(false);
  const [mlpProgress, setMlpProgress] = useState(0);
  const [scores, setScores] = useState<Partial<Record<DecoderKind, number>>>({});
  const [, setTick] = useState(0);

  const svg = useRef<SVGSVGElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const pointer = useRef<{ x: number; y: number } | null>(null);
  const target = useRef({ x: 0.5, y: -0.3 });
  const simTime = useRef(0);
  const nextJump = useRef(0);
  const cursors = useRef<Partial<Record<DecoderKind, Cursor>>>({});
  const raster = useRef<number[][]>([]);
  const mlpFactory = useRef<(() => Decoder) | null>(null);

  // The model: neurons, recorded training data, and the decoders fitted to it.
  const model = useMemo(() => {
    const neurons = makeNeurons(n, 11);
    const data = makeDataset(neurons, Math.round((minutes * 60) / DT), 12);
    const test = makeDataset(neurons, 1200, 13);
    const order = neurons.map((nr, i) => [nr.pd, i] as const).sort((a, b) => a[0] - b[0]).map(([, i]) => i);
    return { neurons, data, test, order, pv: fitPopulationVector(data), kalman: fitKalman(data) };
  }, [n, minutes]);

  const factoryFor = (k: DecoderKind) => (k === "pv" ? model.pv : k === "kalman" ? model.kalman : mlpFactory.current);

  const resetCursor = (k: DecoderKind, i: number) => {
    const f = factoryFor(k);
    if (!f) return;
    const prev = cursors.current[k];
    cursors.current[k] = {
      x: prev?.x ?? 0,
      y: prev?.y ?? 0,
      vx: 0,
      vy: 0,
      trail: prev?.trail ?? [],
      dec: f(),
      rand: rng(100 + i),
      miss: [],
      hits: prev?.hits ?? 0,
      hitThisTarget: false,
    };
  };

  // Fit the population vector and Kalman filter at once; train the network a little each frame.
  useEffect(() => {
    const fast = evaluate({ pv: model.pv, kalman: model.kalman, mlp: model.pv }, model.test);
    setScores({ pv: fast.pv, kalman: fast.kalman });
    raster.current = [];
    cursors.current = {};
    const trainer = new MlpTrainer(model.data, 5);
    mlpFactory.current = trainer.factory();
    DECODER_KINDS.forEach(resetCursor);
    setMlpProgress(0);
    const valid = { V: model.test.V.slice(0, 500), Y: model.test.Y.slice(0, 500) };
    let raf = 0;
    const chunk = () => {
      trainer.train(120);
      mlpFactory.current = trainer.factory();
      resetCursor("mlp", 2);
      const d = mlpFactory.current();
      setScores((s) => ({ ...s, mlp: r2(valid.V, valid.Y.map((y) => d.step(y))) }));
      setMlpProgress(trainer.stepsDone / MLP_STEPS);
      if (trainer.stepsDone < MLP_STEPS) raf = requestAnimationFrame(chunk);
    };
    raf = requestAnimationFrame(chunk);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model]);

  // Run only while on screen; start by itself unless the reader prefers reduced motion.
  useEffect(() => {
    const el = wrap.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setOnScreen(!!e?.isIntersecting), { threshold: 0.2 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  useEffect(() => {
    if (!prefersReducedMotion()) setRunning(true);
  }, []);

  useEffect(() => {
    if (!running || !onScreen) return;
    let raf = 0;
    let last = performance.now();
    let acc = 0;
    const loop = (now: number) => {
      acc += Math.min(0.25, (now - last) / 1000);
      last = now;
      let stepped = false;
      while (acc >= DT) {
        acc -= DT;
        stepped = true;
        simStep();
      }
      if (stepped) {
        drawRaster();
        setTick((t) => t + 1);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, onScreen, model, mode, shown]);

  function simStep() {
    const t = (simTime.current += DT);
    if (mode === "targets") {
      if (t >= nextJump.current) {
        const r = Math.random;
        target.current = { x: (r() * 2 - 1) * 0.8, y: (r() * 2 - 1) * 0.8 };
        nextJump.current = t + 3;
        DECODER_KINDS.forEach((k) => {
          const c = cursors.current[k];
          if (c) c.hitThisTarget = false;
        });
      }
    } else if (pointer.current) {
      target.current = pointer.current;
    } else {
      target.current = { x: 0.68 * Math.sin(0.55 * t), y: 0.55 * Math.sin(0.9 * t + 1) };
    }
    const tg = target.current;
    const rasterKind = shown.kalman ? "kalman" : DECODER_KINDS.find((k) => shown[k]);
    DECODER_KINDS.forEach((k) => {
      const c = cursors.current[k];
      if (!c || !shown[k]) return;
      // The simulated subject aims at the target from wherever the cursor is now.
      let ix = GAIN * (tg.x - c.x);
      let iy = GAIN * (tg.y - c.y);
      const sp = Math.hypot(ix, iy);
      if (sp > VMAX) {
        ix *= VMAX / sp;
        iy *= VMAX / sp;
      }
      c.vx = 0.6 * c.vx + 0.4 * ix;
      c.vy = 0.6 * c.vy + 0.4 * iy;
      const y = spikeCounts(model.neurons, c.vx, c.vy, c.rand);
      if (k === rasterKind) {
        raster.current.push(y);
        if (raster.current.length > RASTER_BINS) raster.current.shift();
      }
      const [ux, uy] = c.dec.step(y);
      c.x = clamp(c.x + ux * DT);
      c.y = clamp(c.y + uy * DT);
      c.trail.push([c.x, c.y]);
      if (c.trail.length > TRAIL) c.trail.shift();
      const d = Math.hypot(tg.x - c.x, tg.y - c.y);
      c.miss.push(d);
      if (c.miss.length > 200) c.miss.shift();
      if (mode === "targets" && !c.hitThisTarget && d < HIT_RADIUS) {
        c.hitThisTarget = true;
        c.hits++;
      }
    });
  }

  function drawRaster() {
    const cv = canvas.current;
    const ctx = cv?.getContext("2d");
    if (!cv || !ctx) return;
    const w = cv.width;
    const h = cv.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = getComputedStyle(cv).color;
    const rowH = h / model.neurons.length;
    const colW = w / RASTER_BINS;
    raster.current.forEach((y, b) => {
      const x = w - (raster.current.length - b) * colW;
      model.order.forEach((i, row) => {
        const c = y[i]!;
        if (c > 0) {
          ctx.globalAlpha = Math.min(1, 0.45 + 0.25 * c);
          ctx.fillRect(x, row * rowH, Math.max(1, colW - 1), Math.max(1, rowH - (rowH > 3 ? 1 : 0)));
        }
      });
    });
    ctx.globalAlpha = 1;
  }

  const onMove = (e: PointerEvent<SVGSVGElement>) => {
    const ctm = svg.current?.getScreenCTM();
    if (!ctm) return;
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse());
    pointer.current = { x: clamp(fromPx(p.x), -0.95, 0.95), y: clamp(fromPx(p.y), -0.95, 0.95) };
  };

  const switchMode = (m: "follow" | "targets") => {
    setMode(m);
    nextJump.current = simTime.current;
    DECODER_KINDS.forEach((k) => {
      const c = cursors.current[k];
      if (c) {
        c.hits = 0;
        c.miss = [];
      }
    });
  };

  const tg = target.current;
  const trainingDone = mlpProgress >= 1;

  return (
    <div ref={wrap} className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="min-w-0">
        <svg
          ref={svg}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="w-full touch-none select-none rounded-md bg-zinc-50 dark:bg-zinc-950/60"
          onPointerMove={onMove}
          onPointerDown={onMove}
          onPointerLeave={() => (pointer.current = null)}
          role="img"
          aria-label="Arena with a target and three cursors, each driven by simulated neurons through a different decoder."
        >
          {[-0.5, 0, 0.5].map((v) => (
            <g key={v} aria-hidden="true">
              <line x1={toPx(v)} x2={toPx(v)} y1={PAD} y2={SIZE - PAD} className="stroke-zinc-200 dark:stroke-zinc-800" />
              <line y1={toPx(v)} y2={toPx(v)} x1={PAD} x2={SIZE - PAD} className="stroke-zinc-200 dark:stroke-zinc-800" />
            </g>
          ))}
          <g aria-hidden="true">
            <circle cx={toPx(tg.x)} cy={toPx(tg.y)} r={mode === "targets" ? HIT_RADIUS * ((SIZE - 2 * PAD) / 2) : 14} className="fill-emerald-500/10 stroke-emerald-500" strokeWidth={1.5} strokeDasharray={mode === "targets" ? "4 3" : undefined} />
            <circle cx={toPx(tg.x)} cy={toPx(tg.y)} r={3} className="fill-emerald-500" />
          </g>
          {DECODER_KINDS.filter((k) => shown[k]).map((k) => {
            const c = cursors.current[k];
            if (!c) return null;
            return (
              <g key={k} aria-hidden="true">
                <polyline points={c.trail.map(([x, y]) => `${toPx(x).toFixed(1)},${toPx(y).toFixed(1)}`).join(" ")} fill="none" className={DECODER_STYLE[k].stroke} strokeWidth={2} strokeOpacity={0.45} strokeLinecap="round" strokeLinejoin="round" />
                <circle cx={toPx(c.x)} cy={toPx(c.y)} r={7} className={`${DECODER_STYLE[k].dot} stroke-white dark:stroke-zinc-900`} strokeWidth={2} />
              </g>
            );
          })}
          {!running && (
            <text x={SIZE / 2} y={SIZE / 2} textAnchor="middle" className="fill-zinc-500 text-[13px]">
              Paused
            </text>
          )}
        </svg>
        <div className="mt-2">
          <div className="mb-1 flex items-center justify-between text-[11px] uppercase tracking-wider text-zinc-500">
            <span>Simulated neurons behind the {DECODER_STYLE[shown.kalman ? "kalman" : (DECODER_KINDS.find((k) => shown[k]) ?? "kalman")].label.toLowerCase()} cursor</span>
            <span className="normal-case tracking-normal">last 3.6 s →</span>
          </div>
          <canvas ref={canvas} width={720} height={160} className="h-20 w-full rounded bg-zinc-50 text-zinc-700 dark:bg-zinc-950/60 dark:text-zinc-300" aria-hidden="true" />
          <p className="mt-1 text-[11px] text-zinc-500">Rows sorted by preferred direction: as the movement turns, the burst of activity slides up or down.</p>
        </div>
      </div>

      <div className="min-w-0 space-y-4 text-sm">
        <p className="leading-relaxed text-zinc-700 dark:text-zinc-300">
          <span className="font-medium">Move your pointer over the box</span> (or touch and drag). Three cursors chase it. Each is driven by the
          same simulated neurons, read out by a different decoder. Leave the box and the target wanders by itself.
        </p>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn btn-primary px-3 py-1 text-xs" onClick={() => setRunning((r) => !r)} aria-pressed={running}>
            {running ? "Pause" : "Play"}
          </button>
          <button type="button" className={chip(mode === "follow")} aria-pressed={mode === "follow"} onClick={() => switchMode("follow")}>
            Follow me
          </button>
          <button type="button" className={chip(mode === "targets")} aria-pressed={mode === "targets"} onClick={() => switchMode("targets")}>
            Target practice
          </button>
        </div>

        <div className="space-y-2">
          <div className="text-[11px] uppercase tracking-wider text-zinc-500">Neurons recorded</div>
          <div className="flex flex-wrap gap-1.5">
            {NEURON_OPTIONS.map((v) => (
              <button key={v} type="button" className={chip(n === v)} aria-pressed={n === v} onClick={() => setN(v)}>
                {v}
              </button>
            ))}
          </div>
          <div className="text-[11px] uppercase tracking-wider text-zinc-500">Training data</div>
          <div className="flex flex-wrap gap-1.5">
            {MINUTE_OPTIONS.map((v) => (
              <button key={v} type="button" className={chip(minutes === v)} aria-pressed={minutes === v} onClick={() => setMinutes(v)}>
                {v < 1 ? "30 seconds" : `${v} minutes`}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-baseline justify-between text-[11px] uppercase tracking-wider text-zinc-500">
            <span>Decoders</span>
            <span className="normal-case tracking-normal">{mode === "targets" ? "targets hit" : "share of movement explained"}</span>
          </div>
          <ul className="space-y-2.5">
            {DECODER_KINDS.map((k) => {
              const s = scores[k];
              const c = cursors.current[k];
              return (
                <li key={k}>
                  <div className="flex items-center justify-between gap-3">
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={shown[k]} onChange={(e) => setShown({ ...shown, [k]: e.target.checked })} />
                      <span className={`font-medium ${DECODER_STYLE[k].text}`}>{DECODER_STYLE[k].label}</span>
                      {k === "mlp" && !trainingDone && <span className="text-xs text-zinc-500">training… {Math.round(mlpProgress * 100)}%</span>}
                    </label>
                    <span className="num shrink-0 font-mono text-xs text-zinc-600 dark:text-zinc-400">
                      {mode === "targets" ? (c?.hits ?? 0) : s === undefined ? "…" : `${Math.round(Math.max(0, s) * 100)}%`}
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-800">
                    <div className={`h-1.5 rounded-full transition-[width] duration-300 ${DECODER_STYLE[k].bar}`} style={{ width: `${Math.max(2, Math.max(0, s ?? 0) * 100)}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
          <p className="mt-2 text-xs leading-relaxed text-zinc-500">
            Percentages are measured on a separate recording the decoders never saw (R², the share of the hand&apos;s velocity they predict).
            The network starts from random guesses and improves as it trains.
          </p>
        </div>
      </div>
    </div>
  );
}
