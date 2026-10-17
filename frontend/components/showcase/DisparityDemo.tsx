"use client";

import { useMemo, useState } from "react";

const IOD = 6.3; // cm, typical human interocular distance
const HALF_WIDTH = 10; // cm, half-width of the surface patch
const ARCMIN_PER_RAD = 3437.75;

/**
 * Small-angle binocular disparity across a slanted surface patch:
 *   δ(x) ≈ IOD · (1/f − 1/z(x)),  z(x) = d + tan(slant) · x
 * where f is the fixation distance and d the surface distance (all in cm).
 * Positive = farther than fixation in this sign convention.
 */
function disparityArcmin(x: number, d: number, slantDeg: number, f: number): number {
  const z = d + Math.tan((slantDeg * Math.PI) / 180) * x;
  return IOD * (1 / f - 1 / z) * ARCMIN_PER_RAD;
}

export function DisparityDemo() {
  const [slant, setSlant] = useState(30);
  const [distance, setDistance] = useState(60);
  const [fixation, setFixation] = useState(60);

  const xs = useMemo(() => Array.from({ length: 41 }, (_, i) => -HALF_WIDTH + i * 0.5), []);
  const profile = xs.map((x) => disparityArcmin(x, distance, slant, fixation));

  // --- Top-down scene. Eyes at the bottom; depth is compressed (not to scale) but the
  // surface itself is drawn at its true slant angle. ---
  const sceneW = 300;
  const sceneH = 360;
  const LATERAL = 6; // px per cm
  const eyeY = sceneH - 10;
  const px = (x: number) => sceneW / 2 + x * LATERAL;
  const pz = (z: number) => 290 - (z / 150) * 190;
  const t = Math.tan((slant * Math.PI) / 180);
  const left = { x: px(-HALF_WIDTH), y: pz(distance) + t * HALF_WIDTH * LATERAL };
  const right = { x: px(HALF_WIDTH), y: pz(distance) - t * HALF_WIDTH * LATERAL };
  const eyes = [-IOD / 2, IOD / 2];

  // --- Disparity profile plot ---
  const plotW = 300;
  const plotH = 190;
  const yLim = 120; // arcmin
  const qx = (x: number) => 30 + ((x + HALF_WIDTH) / (2 * HALF_WIDTH)) * (plotW - 40);
  const qy = (v: number) => plotH / 2 - (Math.max(-yLim, Math.min(yLim, v)) / yLim) * (plotH / 2 - 12);
  const line = profile.map((v, i) => `${i ? "L" : "M"}${qx(xs[i]!).toFixed(1)},${qy(v).toFixed(1)}`).join("");

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <div className="mb-1 text-xs font-medium text-zinc-500">Seen from above</div>
          <svg viewBox={`0 0 ${sceneW} ${sceneH}`} className="mx-auto w-full max-w-[320px]" role="img" aria-label="Top-down view of two eyes, a fixation point and a slanted surface">
            {eyes.map((ex) => (
              <g key={ex}>
                <line x1={px(ex)} y1={eyeY} x2={left.x} y2={left.y} className="stroke-zinc-300 dark:stroke-zinc-700" strokeWidth={0.8} />
                <line x1={px(ex)} y1={eyeY} x2={right.x} y2={right.y} className="stroke-zinc-300 dark:stroke-zinc-700" strokeWidth={0.8} />
                <line x1={px(ex)} y1={eyeY} x2={px(0)} y2={pz(fixation)} stroke="#15803d" strokeWidth={0.8} strokeDasharray="3 3" />
              </g>
            ))}
            <line x1={left.x} y1={left.y} x2={right.x} y2={right.y} stroke="#2f5d9e" strokeWidth={5} strokeLinecap="round" />
            <circle cx={px(0)} cy={pz(fixation)} r={4} fill="#15803d" />
            {eyes.map((ex) => (
              <circle key={ex} cx={px(ex)} cy={eyeY} r={7} className="fill-white stroke-zinc-500 dark:fill-zinc-900" strokeWidth={1.5} />
            ))}
            <text x={6} y={14} className="fill-zinc-400 text-[11px]">depth not to scale</text>
            <text x={px(0) + 8} y={pz(fixation) + 3} className="fill-[#15803d] text-[11px]">where you look</text>
          </svg>
        </div>
        <div>
          <div className="mb-1 text-xs font-medium text-zinc-500">Difference between the two eyes&apos; images across the surface</div>
          <svg viewBox={`0 0 ${plotW} ${plotH + 22}`} className="w-full" role="img" aria-label="Binocular disparity across the surface">
            <line x1={30} x2={plotW - 10} y1={qy(0)} y2={qy(0)} className="stroke-zinc-300 dark:stroke-zinc-700" />
            <line x1={30} x2={30} y1={8} y2={plotH - 8} className="stroke-zinc-300 dark:stroke-zinc-700" />
            <path d={line} fill="none" stroke="#2f5d9e" strokeWidth={2.5} />
            <text x={26} y={qy(yLim) + 4} textAnchor="end" className="fill-zinc-500 text-[9px]">far</text>
            <text x={26} y={qy(-yLim) + 4} textAnchor="end" className="fill-zinc-500 text-[9px]">near</text>
            <text x={26} y={qy(0) + 3} textAnchor="end" className="fill-zinc-500 text-[9px]">0</text>
            <text x={qx(-HALF_WIDTH)} y={plotH + 14} className="fill-zinc-500 text-[9px]">left edge</text>
            <text x={qx(HALF_WIDTH)} y={plotH + 14} textAnchor="end" className="fill-zinc-500 text-[9px]">right edge</text>
          </svg>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-3">
        <label className="block">
          <span className="label">Surface tilt (slant): {slant}°</span>
          <input type="range" min={-60} max={60} value={slant} onChange={(e) => setSlant(Number(e.target.value))} className="w-full accent-[#2f5d9e]" />
        </label>
        <label className="block">
          <span className="label">Surface distance: {distance} cm</span>
          <input type="range" min={40} max={140} value={distance} onChange={(e) => setDistance(Number(e.target.value))} className="w-full accent-[#2f5d9e]" />
        </label>
        <label className="block">
          <span className="label">Where the eyes look: {fixation} cm</span>
          <input type="range" min={40} max={140} value={fixation} onChange={(e) => setFixation(Number(e.target.value))} className="w-full accent-[#15803d]" />
        </label>
      </div>
    </div>
  );
}
