"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { gauss, rng } from "@/lib/random";

const BASELINE = 10; // spikes/s
const GAIN = 9;
const R = 110; // radius of the neuron ring in the SVG

function angleDiff(a: number, b: number): number {
  return Math.abs(((a - b + 540) % 360) - 180);
}

/** Trig results can differ in the last bit between server and browser; round what reaches the DOM. */
const round = (v: number, digits = 2) => Math.round(v * 10 ** digits) / 10 ** digits;

/** The equivalent of `angle` (degrees) nearest to `previous`, so a rotation never takes the long way round. */
function unwrap(angle: number, previous: number): number {
  return angle + 360 * Math.round((previous - angle) / 360);
}

/**
 * Toy population-vector decoder. Each neuron fires most for its preferred movement
 * direction (cosine tuning) plus noise; the decoder adds up each neuron's preferred
 * direction weighted by how strongly it fired.
 */
export function PopulationDecodingDemo() {
  const [direction, setDirection] = useState(60);
  const [nNeurons, setNNeurons] = useState(12);
  const [noise, setNoise] = useState(0.6);
  const [trial, setTrial] = useState(0);
  const [live, setLive] = useState(true);
  const svgRef = useRef<SVGSVGElement>(null);
  const dragging = useRef(false);
  const shownDecoded = useRef<number | null>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) setLive(false);
  }, []);

  useEffect(() => {
    if (!live) return;
    const t = window.setInterval(() => setTrial((x) => x + 1), 800);
    return () => window.clearInterval(t);
  }, [live]);

  const { neurons, decoded } = useMemo(() => {
    const rand = rng(1000 + trial * 7919 + nNeurons);
    const theta = (direction * Math.PI) / 180;
    const list = Array.from({ length: nNeurons }, (_, i) => {
      const pd = (2 * Math.PI * i) / nNeurons;
      const expected = BASELINE + GAIN * Math.cos(theta - pd);
      const rate = Math.max(0, expected + noise * 6 * gauss(rand));
      return { pd, rate };
    });
    let vx = 0;
    let vy = 0;
    for (const n of list) {
      vx += (n.rate - BASELINE) * Math.cos(n.pd);
      vy += (n.rate - BASELINE) * Math.sin(n.pd);
    }
    const dec = ((Math.atan2(vy, vx) * 180) / Math.PI + 360) % 360;
    return { neurons: list, decoded: dec };
  }, [direction, nNeurons, noise, trial]);

  const error = angleDiff(decoded, direction);
  // Idempotent, so re-rendering with the same value leaves it unchanged.
  const decodedAngle = round(unwrap(decoded, shownDecoded.current ?? decoded), 1);
  shownDecoded.current = decodedAngle;

  function pointerToDirection(clientX: number, clientY: number) {
    const svg = svgRef.current;
    if (!svg) return;
    const box = svg.getBoundingClientRect();
    const x = clientX - (box.left + box.width / 2);
    const y = -(clientY - (box.top + box.height / 2));
    setDirection(Math.round(((Math.atan2(y, x) * 180) / Math.PI + 360) % 360));
  }

  const arm = R - 28;

  return (
    <div className="grid grid-cols-1 items-center gap-6 md:grid-cols-[300px_minmax(0,1fr)]">
      <svg
        ref={svgRef}
        viewBox="-150 -150 300 300"
        className="mx-auto w-full max-w-[300px] touch-none select-none"
        role="img"
        aria-label={`Movement direction ${direction} degrees, decoded ${Math.round(decoded)} degrees`}
        onPointerDown={(e) => {
          dragging.current = true;
          (e.target as Element).setPointerCapture?.(e.pointerId);
          pointerToDirection(e.clientX, e.clientY);
        }}
        onPointerMove={(e) => dragging.current && pointerToDirection(e.clientX, e.clientY)}
        onPointerUp={() => (dragging.current = false)}
      >
        <circle r={R} fill="none" className="stroke-zinc-200 dark:stroke-zinc-800" strokeDasharray="3 4" />
        {neurons.map((n, i) => {
          const [x, y] = [round(R * Math.cos(n.pd)), round(-R * Math.sin(n.pd))];
          const strength = Math.min(1, n.rate / (BASELINE + GAIN + 4));
          return (
            <g key={i}>
              <circle
                cx={x}
                cy={y}
                r={14}
                className="fill-accent-600 dark:fill-accent-400"
                style={{
                  opacity: round(0.15 + 0.85 * strength, 3),
                  transform: `scale(${round((5 + 9 * strength) / 14, 3)})`,
                  transformBox: "fill-box",
                  transformOrigin: "center",
                  transition: "transform 0.4s cubic-bezier(0.2, 0.7, 0.2, 1), opacity 0.4s",
                }}
              />
              <title>{`Neuron preferring ${Math.round((n.pd * 180) / Math.PI)}°: ${n.rate.toFixed(1)} spikes/s`}</title>
            </g>
          );
        })}
        <g style={{ transform: `rotate(${-direction}deg)` }}>
          <line x1={0} y1={0} x2={arm} y2={0} stroke="#15803d" strokeWidth={4} strokeLinecap="round" />
          <circle cx={arm} cy={0} r={7} fill="#15803d" className="cursor-grab" />
        </g>
        <g style={{ transform: `rotate(${-decodedAngle}deg)`, transition: "transform 0.45s cubic-bezier(0.2, 0.7, 0.2, 1)" }}>
          <line x1={0} y1={0} x2={arm} y2={0} stroke="#c2410c" strokeWidth={3} strokeDasharray="6 4" strokeLinecap="round" />
        </g>
        <circle r={4} className="fill-zinc-500" />
      </svg>

      <div className="space-y-4 text-sm">
        <div className="flex flex-wrap gap-x-5 gap-y-1">
          <span className="flex items-center gap-2"><span className="h-1 w-5 rounded bg-[#15803d]" /> real movement direction (drag it)</span>
          <span className="flex items-center gap-2"><span className="h-1 w-5 rounded border-t-2 border-dashed border-[#c2410c]" /> direction read from the neurons</span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs uppercase tracking-wider text-zinc-500">Decoding error</div>
            <div className="num font-mono text-2xl">{error.toFixed(0)}°</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-zinc-500">Neurons recorded</div>
            <div className="num font-mono text-2xl">{nNeurons}</div>
          </div>
        </div>
        <label className="block">
          <span className="label">Number of neurons: {nNeurons}</span>
          <input type="range" min={3} max={48} value={nNeurons} onChange={(e) => setNNeurons(Number(e.target.value))} className="w-full accent-[#2f5d9e]" />
        </label>
        <label className="block">
          <span className="label">How noisy each neuron is: {noise < 0.3 ? "low" : noise < 0.9 ? "medium" : "high"}</span>
          <input type="range" min={0} max={1.5} step={0.05} value={noise} onChange={(e) => setNoise(Number(e.target.value))} className="w-full accent-[#2f5d9e]" />
        </label>
        <label className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
          <input type="checkbox" checked={live} onChange={(e) => setLive(e.target.checked)} />
          Replay new trials automatically (each trial has fresh noise)
        </label>
      </div>
    </div>
  );
}
