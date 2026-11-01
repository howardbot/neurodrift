"use client";

import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react";

// Gadgets for the note "We see a small part of what reaches our eyes" (/ideas#seeing).

const seg = (on: boolean) =>
  `rounded px-2.5 py-1 text-xs font-medium ${on ? "bg-accent-600 text-white dark:bg-accent-300 dark:text-zinc-900" : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"}`;

function Segmented<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: [T, string][]; onChange: (v: T) => void }) {
  return (
    <div role="group" aria-label={label} className="inline-flex rounded-md border border-zinc-300 p-0.5 dark:border-zinc-700">
      {options.map(([v, text]) => (
        <button key={v} type="button" aria-pressed={value === v} className={seg(value === v)} onClick={() => onChange(v)}>
          {text}
        </button>
      ))}
    </div>
  );
}

// ---- Fovea window --------------------------------------------------------------------

const PASSAGE =
  "Right now these words seem to sit on the page all at once, every letter sharp and every colour vivid. They are not. Only a patch about the width of your thumbnail at arm's length is seen in fine detail and full colour; everything around it is blurred, washed out and stitched together by your brain from quick glances and good guesses. Your eyes jump to a new spot about three times a second, and each jump leaves a gap the brain papers over. Move the window around and notice how little of this text you can actually read from any one place, and how strange it is that it never feels this way.";
const HUES = ["text-accent-600 dark:text-accent-300", "text-emerald-600 dark:text-emerald-400", "text-amber-600 dark:text-amber-400", "text-violet-600 dark:text-violet-400", "text-rose-600 dark:text-rose-400"];

/**
 * Sharp, colourful vision only inside a small window that follows the pointer (or arrow keys).
 * "Realistic" is two degrees at about 50 cm from the screen (about 1.7 cm, or 64 CSS pixels).
 */
export function FoveaWindow() {
  const box = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [size, setSize] = useState<"real" | "generous">("real");
  const [view, setView] = useState<"eye" | "feels">("eye");
  const r = size === "real" ? 32 : 80;

  const move = (e: PointerEvent<HTMLDivElement>) => {
    const rect = box.current!.getBoundingClientRect();
    setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };
  const key = (e: KeyboardEvent<HTMLDivElement>) => {
    const d = { ArrowLeft: [-16, 0], ArrowRight: [16, 0], ArrowUp: [0, -16], ArrowDown: [0, 16] }[e.key];
    if (!d) return;
    e.preventDefault();
    const rect = box.current!.getBoundingClientRect();
    setPos((p) => {
      const c = p ?? { x: rect.width / 2, y: rect.height / 2 };
      return { x: Math.max(0, Math.min(rect.width, c.x + d[0]!)), y: Math.max(0, Math.min(rect.height, c.y + d[1]!)) };
    });
  };

  const words = PASSAGE.split(" ");
  const text = (
    <p className="text-[15px] leading-7">
      {words.map((w, i) => (
        <span key={i} className={HUES[i % HUES.length]}>
          {w}{" "}
        </span>
      ))}
    </p>
  );
  const at = pos ?? { x: 120, y: 60 };
  const mask = `radial-gradient(circle ${r}px at ${at.x}px ${at.y}px, #000 55%, transparent 100%)`;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Segmented label="What to show" value={view} onChange={setView} options={[["eye", "What the eye resolves"], ["feels", "What it feels like"]]} />
        <Segmented label="Window size" value={size} onChange={setSize} options={[["real", "Realistic (2°)"], ["generous", "Generous"]]} />
      </div>
      <div
        ref={box}
        tabIndex={0}
        role="img"
        aria-label="A coloured paragraph. Only a small window around the pointer is sharp and in colour; the rest is blurred and grey. Use the arrow keys to move the window."
        onPointerMove={move}
        onPointerDown={move}
        onKeyDown={key}
        className="relative cursor-crosshair touch-none select-none overflow-hidden rounded-md border border-zinc-200 bg-white p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 dark:border-zinc-800 dark:bg-zinc-950"
      >
        {view === "feels" ? (
          text
        ) : (
          <>
            <div aria-hidden="true" className="opacity-80 blur-[2.5px] grayscale-[0.85]">
              {text}
            </div>
            <div aria-hidden="true" className="absolute inset-0 p-4" style={{ WebkitMaskImage: mask, maskImage: mask }}>
              {text}
            </div>
            <span
              aria-hidden="true"
              className="pointer-events-none absolute rounded-full border border-dashed border-accent-500/50"
              style={{ left: at.x - r, top: at.y - r, width: 2 * r, height: 2 * r }}
            />
          </>
        )}
      </div>
      <p className="text-xs text-zinc-500">Move the pointer or drag a finger over the text; with the keyboard, focus it and use the arrow keys.</p>
    </div>
  );
}

// ---- Blind spot ----------------------------------------------------------------------

/** The classic blind-spot test, on a plain background or on a line that the brain fills in. */
export function BlindSpot() {
  const [eye, setEye] = useState<"right" | "left">("right");
  const [onLine, setOnLine] = useState(false);
  // The cross is in front of the open eye's nose side; the dot sits about 15° towards the temple.
  const cross = eye === "right" ? "left-[12%]" : "right-[12%]";
  const dot = eye === "right" ? "right-[12%]" : "left-[12%]";
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Segmented label="Eye to use" value={eye} onChange={setEye} options={[["right", "Right eye"], ["left", "Left eye"]]} />
        <Segmented label="Background" value={onLine ? "line" : "plain"} onChange={(v) => setOnLine(v === "line")} options={[["plain", "Plain"], ["line", "On a line"]]} />
      </div>
      <div className="relative h-36 rounded-md border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950" role="img" aria-label="A cross on one side and a red dot on the other, for finding your blind spot.">
        {onLine && <div aria-hidden="true" className="absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 bg-zinc-800 dark:bg-zinc-200" />}
        <span aria-hidden="true" className={`absolute top-1/2 -translate-y-1/2 font-mono text-3xl font-bold leading-none text-zinc-900 dark:text-zinc-100 ${cross}`}>
          +
        </span>
        <span aria-hidden="true" className={`absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-rose-500 ${dot}`} />
      </div>
      <ol className="list-decimal space-y-1 pl-5 text-sm text-zinc-700 dark:text-zinc-300">
        <li>Close your {eye === "right" ? "left" : "right"} eye and look steadily at the cross with your {eye} eye.</li>
        <li>Start about an arm&apos;s length away, then slowly move closer (or further) without looking at the dot.</li>
        <li>
          At a distance of roughly three to four times the gap between cross and dot, the dot vanishes: its image has fallen on the
          blind spot, where the optic nerve leaves the eye and there are no photoreceptors.
        </li>
        <li>Switch to &ldquo;On a line&rdquo; and do it again. The line looks unbroken: your brain fills the hole with what is probably there.</li>
      </ol>
    </div>
  );
}

// ---- Bandwidth ----------------------------------------------------------------------

const RATES = [
  { label: "Photoreceptors of one eye", value: 1.6e9, text: "about 1.6 billion bits/s", source: "Zheng & Meister, 2025" },
  { label: "Optic nerve of one eye", value: 1e7, text: "about 10 million bits/s", source: "Koch et al., 2006 (estimate)" },
  { label: "Human behaviour", value: 10, text: "about 10 bits/s", source: "Zheng & Meister, 2025 (debated)" },
];

/** From light to behaviour, on a logarithmic axis or a linear one where the last two all but vanish. */
export function BandwidthChart() {
  const [scale, setScale] = useState<"log" | "linear">("log");
  const X0 = 190;
  const W = 380;
  const x = (v: number) => (scale === "log" ? X0 + (Math.log10(v) / 10) * W : X0 + (v / 1.6e9) * W);
  const ticks = scale === "log" ? [1, 1e2, 1e4, 1e6, 1e8, 1e10] : [0, 4e8, 8e8, 1.2e9, 1.6e9];
  const tickLabel = (t: number) => (scale === "log" ? (t === 1 ? "1" : `10${String(Math.log10(t)).replace(/\d/g, (d) => "⁰¹²³⁴⁵⁶⁷⁸⁹"[+d]!)}`) : t === 0 ? "0" : `${t / 1e9} bn`);
  return (
    <div className="space-y-3">
      <Segmented label="Scale" value={scale} onChange={setScale} options={[["log", "Logarithmic"], ["linear", "Linear"]]} />
      <svg viewBox="0 0 600 200" className="w-full" role="img" aria-label="Information rates: about 1.6 billion bits per second at the photoreceptors of one eye, about 10 million in its optic nerve, about 10 in human behaviour.">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={x(t)} x2={x(t)} y1={20} y2={170} className="stroke-zinc-200 dark:stroke-zinc-800" />
            <text x={x(t)} y={188} textAnchor="middle" className="fill-zinc-500 text-[11px]">
              {tickLabel(t)}
            </text>
          </g>
        ))}
        {RATES.map((r, i) => {
          const y = 30 + i * 48;
          const end = Math.max(x(r.value), X0 + 1.5);
          return (
            <g key={r.label}>
              <text x={X0 - 10} y={y + 12} textAnchor="end" className="fill-zinc-800 text-[12.5px] font-medium dark:fill-zinc-200">
                {r.label}
              </text>
              <text x={X0 - 10} y={y + 27} textAnchor="end" className="fill-zinc-500 text-[10.5px]">
                {r.source}
              </text>
              <rect x={X0} y={y} width={end - X0} height={22} rx={3} className={["fill-accent-500", "fill-violet-500", "fill-rose-500"][i]} style={{ transition: "width 500ms ease" }} />
              <text x={Math.min(end + 6, 560)} y={y + 15} textAnchor={end + 6 > 470 ? "end" : "start"} className={`text-[11.5px] ${end + 6 > 470 ? "fill-white font-medium" : "fill-zinc-700 dark:fill-zinc-300"}`} dx={end + 6 > 470 ? -12 : 0}>
                {r.text}
                {scale === "linear" && i > 0 && (r.value / RATES[0]!.value >= 0.001 ? ` — ${((r.value / RATES[0]!.value) * 100).toFixed(1)}% of the top bar` : " — far too small to see at this scale")}
              </text>
            </g>
          );
        })}
        <text x={X0 + W / 2} y={12} textAnchor="middle" className="fill-zinc-500 text-[11px]">
          bits per second{scale === "log" ? " (each gridline is 100 times the last)" : ""}
        </text>
      </svg>
    </div>
  );
}
