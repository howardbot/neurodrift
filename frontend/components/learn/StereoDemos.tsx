"use client";

import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { RDS_SIZE, eyeGeometry, makeStereogram, type StereoShape } from "@/lib/stereo";

function chip(on: boolean) {
  return `rounded-full px-3 py-1 text-xs font-medium transition-colors ${
    on
      ? "bg-accent-600 text-white shadow-sm shadow-accent-600/30 dark:bg-accent-300 dark:text-zinc-900"
      : "border border-zinc-300 bg-white/80 text-zinc-700 hover:border-accent-500/60 dark:border-zinc-700 dark:bg-zinc-900/80 dark:text-zinc-300"
  }`;
}

// ---------------------------------------------------------------------------------------
// Two eyes, two views: a top-down drawing of binocular disparity.
// ---------------------------------------------------------------------------------------

const EYES = { lx: 130, rx: 190, y: 236 };
const FIX = { x: 160, y: 78 };
const EYE_R = 15;
const round = (v: number) => Math.round(v * 10) / 10;

export function EyesDisparity() {
  const [obj, setObj] = useState({ x: 160, y: 150 });
  const svg = useRef<SVGSVGElement>(null);
  const dragging = useRef(false);
  const g = eyeGeometry(EYES, FIX, obj);
  const kind = Math.abs(g.disparity) < 0.4 ? "zero" : g.disparity > 0 ? "crossed" : "uncrossed";

  const move = (e: PointerEvent<SVGSVGElement>) => {
    if (!dragging.current) return;
    const ctm = svg.current?.getScreenCTM();
    if (!ctm) return;
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse());
    setObj({ x: Math.max(70, Math.min(250, p.x)), y: Math.max(24, Math.min(200, p.y)) });
  };

  // Where a point's image lands on the back of an eye: through the centre, to the far side.
  const retina = (ex: number, p: { x: number; y: number }) => {
    const dx = p.x - ex;
    const dy = p.y - EYES.y;
    const d = Math.hypot(dx, dy);
    return { x: round(ex - (dx / d) * EYE_R), y: round(EYES.y - (dy / d) * EYE_R) };
  };

  const view = (deg: number) => 50 + Math.max(-45, Math.min(45, deg * 2.2));

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
      <svg
        ref={svg}
        viewBox="40 10 240 250"
        className="mx-auto w-full max-w-[360px] touch-none select-none"
        onPointerDown={(e) => {
          dragging.current = true;
          e.currentTarget.setPointerCapture(e.pointerId);
          move(e);
        }}
        onPointerMove={move}
        onPointerUp={() => (dragging.current = false)}
        role="img"
        aria-label={`Top-down view of two eyes looking at a fixation point, with an object whose disparity is ${round(g.disparity)} degrees`}
      >
        {[EYES.lx, EYES.rx].map((ex) => (
          <g key={ex}>
            <line x1={ex} y1={EYES.y} x2={FIX.x} y2={FIX.y} className="stroke-zinc-400 dark:stroke-zinc-500" strokeWidth={1} strokeDasharray="4 3" />
            <line x1={ex} y1={EYES.y} x2={obj.x} y2={obj.y} className="stroke-accent-500 dark:stroke-accent-300" strokeWidth={1.4} />
            <circle cx={ex} cy={EYES.y} r={EYE_R} className="fill-white stroke-zinc-500 dark:fill-zinc-900 dark:stroke-zinc-400" strokeWidth={1.5} />
            <circle cx={ex} cy={EYES.y - EYE_R + 3} r={4} className="fill-zinc-700 dark:fill-zinc-300" />
            {(() => {
              const f = retina(ex, FIX);
              const o = retina(ex, obj);
              return (
                <>
                  <circle cx={f.x} cy={f.y} r={2.4} className="fill-zinc-500" />
                  <circle cx={o.x} cy={o.y} r={2.6} className="fill-accent-600 dark:fill-accent-300" />
                </>
              );
            })()}
          </g>
        ))}
        <g>
          <line x1={FIX.x - 6} x2={FIX.x + 6} y1={FIX.y} y2={FIX.y} className="stroke-zinc-600 dark:stroke-zinc-300" strokeWidth={2} />
          <line y1={FIX.y - 6} y2={FIX.y + 6} x1={FIX.x} x2={FIX.x} className="stroke-zinc-600 dark:stroke-zinc-300" strokeWidth={2} />
          <text x={FIX.x + 10} y={FIX.y - 6} className="fill-zinc-500 text-[10px]">
            where you look
          </text>
        </g>
        <g className="cursor-grab">
          <circle cx={obj.x} cy={obj.y} r={14} className="fill-accent-500/10" />
          <circle cx={obj.x} cy={obj.y} r={7} className="fill-accent-600 stroke-white dark:fill-accent-300 dark:stroke-zinc-900" strokeWidth={2} />
          <text x={obj.x + 11} y={obj.y + 4} className="fill-accent-700 text-[10px] font-medium dark:fill-accent-200">
            drag me
          </text>
        </g>
        <text x={160} y={258} textAnchor="middle" className="fill-zinc-400 text-[9px]">
          seen from above, not to scale
        </text>
      </svg>

      <div className="min-w-0 space-y-4 text-sm" aria-live="polite">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-zinc-500">What each eye sees</div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {[
              { label: "Left eye", deg: g.leftDeg },
              { label: "Right eye", deg: g.rightDeg },
            ].map((v) => (
              <div key={v.label} className="rounded-md border border-zinc-200 p-2 dark:border-zinc-800">
                <svg viewBox="0 0 100 40" className="w-full" aria-hidden="true">
                  <line x1={50} x2={50} y1={6} y2={34} className="stroke-zinc-400" strokeWidth={1} />
                  <line x1={44} x2={56} y1={20} y2={20} className="stroke-zinc-400" strokeWidth={1} />
                  <circle cx={round(view(v.deg))} cy={20} r={5} className="fill-accent-600 dark:fill-accent-300" />
                </svg>
                <div className="text-center text-xs text-zinc-500">{v.label}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-md border-l-4 border-accent-500/50 bg-accent-50/60 px-3 py-2 dark:bg-accent-700/10">
          <div className="font-medium">
            Disparity: <span className="num font-mono">{Math.abs(round(g.disparity)).toFixed(1)}°</span>{" "}
            {kind === "zero" ? "(about zero)" : kind === "crossed" ? "crossed" : "uncrossed"}
          </div>
          <p className="mt-1 text-zinc-700 dark:text-zinc-300">
            {kind === "zero"
              ? "The object is about as far away as where you are looking: both eyes see it in almost the same place relative to the cross."
              : kind === "crossed"
                ? "The object is nearer than where you are looking. The left eye sees it further to the right than the right eye does: the lines of sight cross in front of the cross."
                : "The object is farther than where you are looking. The left eye sees it further to the left than the right eye does."}
          </p>
        </div>
        <p className="text-xs leading-relaxed text-zinc-500">
          The brain reads the size and direction of this difference as distance. Disparity in this drawing is exaggerated: real eyes are about
          6 cm apart and can detect differences far smaller than a hundredth of a degree.
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------------------
// Random-dot stereogram
// ---------------------------------------------------------------------------------------

type ViewMode = "cross" | "parallel" | "anaglyph" | "wiggle" | "one-eye";

const SHAPES: { id: StereoShape; label: string }[] = [
  { id: "square", label: "Square" },
  { id: "ring", label: "Ring" },
  { id: "letters", label: "Letters" },
  { id: "slant", label: "Tilted disc" },
];

const MODES: { id: ViewMode; label: string; how: string }[] = [
  { id: "cross", label: "Cross your eyes", how: "Hold the screen at arm's length and cross your eyes slightly, as if looking at your nose, until the two squares become three. Hold the middle one steady and the hidden shape floats out of it. It can take a minute the first time." },
  { id: "parallel", label: "Look through", how: "Bring your face close to the screen, look 'through' it as if at something far away, and slowly move back until the two squares merge into one." },
  { id: "anaglyph", label: "Red–cyan glasses", how: "If you have red–cyan 3D glasses, put them on with red over the left eye." },
  { id: "wiggle", label: "Wiggle", how: "No glasses or eye tricks: the two eyes' images alternate quickly. The hidden shape shows up as a patch that jumps while everything else stays still. That jump is exactly the disparity your two eyes would see." },
  { id: "one-eye", label: "One eye only", how: "This is all one eye sees: random dots, with no shape anywhere. The shape exists only in the difference between the two images." },
];

function paint(canvas: HTMLCanvasElement | null, a: Uint8Array, b?: Uint8Array) {
  const ctx = canvas?.getContext("2d");
  if (!canvas || !ctx) return;
  const img = ctx.createImageData(RDS_SIZE, RDS_SIZE);
  for (let i = 0; i < a.length; i++) {
    const o = i * 4;
    if (b) {
      // Anaglyph: left image in the red channel, right image in green and blue.
      img.data[o] = a[i] ? 30 : 245;
      img.data[o + 1] = b[i] ? 30 : 245;
      img.data[o + 2] = b[i] ? 30 : 245;
    } else {
      const v = a[i] ? 24 : 244;
      img.data[o] = v;
      img.data[o + 1] = v;
      img.data[o + 2] = v;
    }
    img.data[o + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
}

export function RandomDotStereogram() {
  const [shape, setShape] = useState<StereoShape>("square");
  const [depth, setDepth] = useState(4);
  const [mode, setMode] = useState<ViewMode>("cross");
  const [seed, setSeed] = useState(1);
  const [phase, setPhase] = useState(0);
  const a = useRef<HTMLCanvasElement>(null);
  const b = useRef<HTMLCanvasElement>(null);
  const rds = useMemo(() => makeStereogram(shape, depth, seed), [shape, depth, seed]);

  useEffect(() => {
    if (mode !== "wiggle") return;
    const id = window.setInterval(() => setPhase((p) => 1 - p), 160);
    return () => window.clearInterval(id);
  }, [mode]);

  useEffect(() => {
    if (mode === "cross") {
      paint(a.current, rds.right);
      paint(b.current, rds.left);
    } else if (mode === "parallel") {
      paint(a.current, rds.left);
      paint(b.current, rds.right);
    } else if (mode === "anaglyph") {
      paint(a.current, rds.left, rds.right);
    } else if (mode === "wiggle") {
      paint(a.current, phase ? rds.right : rds.left);
    } else {
      paint(a.current, rds.left);
    }
  }, [rds, mode, phase]);

  const pair = mode === "cross" || mode === "parallel";
  const how = MODES.find((m) => m.id === mode)!.how;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="How to view">
        {MODES.map((m) => (
          <button key={m.id} type="button" className={chip(mode === m.id)} aria-pressed={mode === m.id} onClick={() => setMode(m.id)}>
            {m.label}
          </button>
        ))}
      </div>

      <div className={`mx-auto flex justify-center ${pair ? "max-w-[520px] gap-[4%]" : "max-w-[260px]"}`}>
        <canvas
          ref={a}
          width={RDS_SIZE}
          height={RDS_SIZE}
          className="aspect-square w-full max-w-[250px] rounded-sm shadow-sm ring-1 ring-zinc-300 dark:ring-zinc-700"
          style={{ imageRendering: "pixelated" }}
          role="img"
          aria-label="Random-dot stereogram"
        />
        {pair && (
          <canvas
            ref={b}
            width={RDS_SIZE}
            height={RDS_SIZE}
            className="aspect-square w-full max-w-[250px] rounded-sm shadow-sm ring-1 ring-zinc-300 dark:ring-zinc-700"
            style={{ imageRendering: "pixelated" }}
            aria-hidden="true"
          />
        )}
      </div>
      <p key={mode} className="mx-auto max-w-2xl animate-fade-up text-center text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
        {how}
      </p>

      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm">
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Hidden shape">
          <span className="text-xs text-zinc-500">Hidden shape</span>
          {SHAPES.map((s) => (
            <button key={s.id} type="button" className={chip(shape === s.id)} aria-pressed={shape === s.id} onClick={() => setShape(s.id)}>
              {s.label}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2">
          <span className="text-xs text-zinc-500">Far</span>
          <input type="range" min={-6} max={6} step={1} value={depth} onChange={(e) => setDepth(Number(e.target.value))} className="w-32 accent-accent-600" aria-label="Depth of the hidden shape" />
          <span className="text-xs text-zinc-500">Near</span>
        </label>
        <button type="button" className="btn btn-outline px-2.5 py-1 text-xs" onClick={() => setSeed((s) => s + 1)}>
          New dots
        </button>
      </div>
    </div>
  );
}
