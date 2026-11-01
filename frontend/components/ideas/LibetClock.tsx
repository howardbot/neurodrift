"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";

// A Libet clock for /ideas#agency. As in Libet et al. (1983), a spot circles a clock face once
// every 2.56 s; the reader presses whenever they feel like it, then reports where the spot was
// when they first felt the urge. The difference is their own "W" time relative to the press.
// The brain-activity timings shown beside it are the published averages, not a measurement.

const PERIOD = 2560;
const MARKS = 60;
const R = 92;

type Phase = "idle" | "running" | "coasting" | "report" | "result";

const spot = (f: number, r = R - 12) => [110 + r * Math.sin(2 * Math.PI * f), 110 - r * Math.cos(2 * Math.PI * f)] as const;
const wrap = (f: number) => ((f % 1) + 1) % 1;

export function LibetClock() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [now, setNow] = useState(0);
  const [report, setReport] = useState(0);
  const [trials, setTrials] = useState<number[]>([]);
  const start = useRef(0);
  const pressed = useRef(0);
  const box = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);

  // The spot moves only while running or coasting on after the press.
  useEffect(() => {
    if (phase !== "running" && phase !== "coasting") return;
    let id = 0;
    const tick = (t: number) => {
      setNow(t);
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [phase]);

  const begin = () => {
    start.current = performance.now() - Math.random() * PERIOD;
    setNow(performance.now());
    setPhase("running");
    box.current?.focus();
  };
  const press = () => {
    if (phase !== "running") return;
    pressed.current = performance.now();
    setPhase("coasting");
    // Keep going a little, so the reader cannot simply report where the spot stopped.
    window.setTimeout(() => {
      setReport(wrap((pressed.current - start.current) / PERIOD));
      setPhase("report");
    }, 900 + Math.random() * 900);
  };
  const confirm = () => {
    const pressF = wrap((pressed.current - start.current) / PERIOD);
    // The urge comes before the press, or at most a little after it: read the difference in
    // the window from 0.75 of a turn before the press to 0.25 after.
    let d = wrap(report - pressF);
    if (d > 0.25) d -= 1;
    setTrials((t) => [...t, Math.round(d * PERIOD)]);
    setPhase("result");
  };

  const pick = (e: PointerEvent<SVGSVGElement>) => {
    if (phase !== "report") return;
    const rect = svg.current!.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 220 - 110;
    const y = ((e.clientY - rect.top) / rect.height) * 220 - 110;
    setReport(wrap(Math.atan2(x, -y) / (2 * Math.PI)));
  };
  const key = (e: KeyboardEvent<HTMLDivElement>) => {
    if (phase === "running" && (e.key === " " || e.key === "Enter")) {
      e.preventDefault();
      press();
    } else if (phase === "report") {
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.preventDefault();
        setReport((f) => wrap(f + (e.key === "ArrowRight" ? 1 : -1) / MARKS));
      } else if (e.key === "Enter") {
        e.preventDefault();
        confirm();
      }
    }
  };

  const f = wrap((now - start.current) / PERIOD);
  const showSpot = phase === "running" || phase === "coasting";
  const mean = trials.length ? Math.round(trials.reduce((a, b) => a + b, 0) / trials.length) : null;
  const last = trials[trials.length - 1];

  const button = "btn btn-primary px-3 py-1.5 text-sm";
  return (
    <div ref={box} tabIndex={-1} onKeyDown={key} className="grid grid-cols-1 gap-5 outline-none md:grid-cols-[220px_minmax(0,1fr)]">
      <div className="mx-auto w-[220px]">
        <svg
          ref={svg}
          viewBox="0 0 220 220"
          className={`w-full ${phase === "report" ? "cursor-pointer" : ""}`}
          onPointerDown={pick}
          onPointerMove={(e) => e.buttons && pick(e)}
          role="img"
          aria-label={phase === "report" ? "Clock face: click where the spot was when you first felt the urge." : "A clock face with a spot circling once every 2.56 seconds."}
        >
          <circle cx={110} cy={110} r={R} className="fill-white stroke-zinc-300 dark:fill-zinc-950 dark:stroke-zinc-700" strokeWidth={1.5} />
          {Array.from({ length: MARKS }, (_, i) => {
            const long = i % 5 === 0;
            const [x1, y1] = spot(i / MARKS, R - (long ? 9 : 5));
            const [x2, y2] = spot(i / MARKS, R);
            const [tx, ty] = spot(i / MARKS, R - 20);
            return (
              <g key={i}>
                <line x1={x1} y1={y1} x2={x2} y2={y2} className="stroke-zinc-400 dark:stroke-zinc-500" strokeWidth={long ? 1.5 : 0.8} />
                {long && (
                  <text x={tx} y={ty + 3.5} textAnchor="middle" className="fill-zinc-500 font-mono text-[9px]">
                    {i}
                  </text>
                )}
              </g>
            );
          })}
          {showSpot && <circle cx={spot(f)[0]} cy={spot(f)[1]} r={6} className="fill-rose-500" />}
          {(phase === "report" || phase === "result") && (
            <>
              <line x1={110} y1={110} x2={spot(report)[0]} y2={spot(report)[1]} className="stroke-accent-500" strokeWidth={2} strokeLinecap="round" />
              <circle cx={spot(report)[0]} cy={spot(report)[1]} r={6} className="fill-accent-500" />
            </>
          )}
          <circle cx={110} cy={110} r={3} className="fill-zinc-400" />
        </svg>
      </div>

      <div className="min-w-0 space-y-3 text-sm text-zinc-700 dark:text-zinc-300">
        {phase === "idle" && (
          <>
            <p>
              Watch the red spot. Whenever you feel like it, with no plan, press the button (or the space bar). Notice where the spot was
              at the moment you first felt the urge to press. Afterwards you will mark that spot.
            </p>
            <button type="button" className={button} onClick={begin}>
              Start
            </button>
          </>
        )}
        {phase === "running" && (
          <>
            <p>Press whenever you feel like it. Note where the spot is when the urge comes.</p>
            <button type="button" className={button} onClick={press}>
              Press
            </button>
          </>
        )}
        {phase === "coasting" && <p>Pressed. Keep the urge&apos;s position in mind…</p>}
        {phase === "report" && (
          <>
            <p>Where was the spot when you first felt the urge? Click the clock (or use the arrow keys), then confirm.</p>
            <button type="button" className={button} onClick={confirm}>
              That&apos;s where it was
            </button>
          </>
        )}
        {phase === "result" && last !== undefined && (
          <>
            <p>
              You felt the urge <span className="font-semibold text-zinc-900 dark:text-zinc-100">{Math.abs(last)} ms {last <= 0 ? "before" : "after"}</span> you
              pressed.{trials.length > 1 && mean !== null && ` Your average over ${trials.length} tries: ${Math.abs(mean)} ms ${mean <= 0 ? "before" : "after"}.`}
            </p>
            <button type="button" className={button} onClick={begin}>
              Try again
            </button>
          </>
        )}
        <Timeline mine={mean} />
      </div>
    </div>
  );
}

/** Published averages from Libet et al. (1983) for spontaneous presses, with the reader's own urge time. */
function Timeline({ mine }: { mine: number | null }) {
  const T0 = -1200;
  const T1 = 300;
  const x = (t: number) => 20 + ((t - T0) / (T1 - T0)) * 360;
  // Schematic shape of the readiness potential: flat, then a slow build-up from about -550 ms.
  const rp = Array.from({ length: 61 }, (_, i) => {
    const t = T0 + (i / 60) * (0 - T0);
    const v = t < -550 ? 0 : ((t + 550) / 550) ** 1.6;
    return `${i ? "L" : "M"}${x(t).toFixed(1)} ${(70 - v * 40).toFixed(1)}`;
  }).join(" ");
  // Labels sit in two rows and lean away from each other so they never overlap.
  const marks = [
    { t: -550, row: 0, anchor: "middle", dx: 0, label: "brain activity starts building", sub: "readiness potential, ≈ −550 ms", cls: "fill-violet-600 dark:fill-violet-300", line: "stroke-violet-500" },
    { t: -200, row: 1, anchor: "end", dx: -4, label: "urge reported", sub: "Libet's subjects, ≈ −200 ms", cls: "fill-amber-600 dark:fill-amber-300", line: "stroke-amber-500" },
    { t: 0, row: 0, anchor: "start", dx: 4, label: "press", sub: "0 ms", cls: "fill-zinc-800 dark:fill-zinc-100", line: "stroke-zinc-500" },
  ] as const;
  return (
    <svg viewBox="0 0 400 146" className="w-full" role="img" aria-label="Timeline: brain activity starts building about 550 ms before the press, people report the urge about 200 ms before it.">
      <path d={rp} fill="none" className="stroke-violet-500/70" strokeWidth={2} />
      <line x1={20} x2={380} y1={74} y2={74} className="stroke-zinc-300 dark:stroke-zinc-700" />
      {[-1000, -500, 0].map((t) => (
        <text key={t} x={x(t)} y={88} textAnchor="middle" className="fill-zinc-400 font-mono text-[9px]">
          {t} ms
        </text>
      ))}
      {marks.map((m) => (
        <g key={m.t}>
          <line x1={x(m.t)} x2={x(m.t)} y1={22} y2={78 + m.row * 26} className={m.line} strokeWidth={1.5} strokeDasharray={m.t === 0 ? undefined : "3 2"} />
          <text x={x(m.t)} y={102 + m.row * 26} textAnchor={m.anchor} dx={m.dx} className={`text-[10px] font-semibold ${m.cls}`}>
            {m.label}
          </text>
          <text x={x(m.t)} y={113 + m.row * 26} textAnchor={m.anchor} dx={m.dx} className="fill-zinc-500 text-[9px]">
            {m.sub}
          </text>
        </g>
      ))}
      {mine !== null && mine >= T0 && mine <= T1 && (
        <g>
          <circle cx={x(mine)} cy={74} r={5} className="fill-accent-500" />
          <text x={x(mine)} y={16} textAnchor="middle" className="fill-accent-600 text-[10px] font-semibold dark:fill-accent-300">
            your urge
          </text>
        </g>
      )}
      <text x={x(-1150)} y={40} className="fill-violet-500 text-[9px]">
        readiness potential (shape only)
      </text>
    </svg>
  );
}
