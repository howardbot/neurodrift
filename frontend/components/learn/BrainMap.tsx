"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { prefersReducedMotion } from "@/components/motion";
import { BRAINSTEM, CEREBELLUM, CEREBELLUM_FOLIA, OUTLINE, SULCI } from "@/components/learn/brainShapes";
import { BCI_SITE_HOW, BCI_SITES, type BciSite, type BciSiteHow } from "@/content/bciToday";
import { AREA_GROUPS, BRAIN_AREAS, type AreaId, type BrainArea } from "@/content/learn";
import { RESEARCH } from "@/content/research";

// Schematic left hemisphere, front to the left (viewBox 600 × 410), with the cerebellum and
// brainstem below. Shapes and positions are approximate and drawn for a generic primate brain;
// several areas lie inside folds, and deep structures are drawn where they would sit beneath
// the surface.

const LOBES = [
  { name: "frontal", d: "M0 0 L332 0 L330 36 C318 90, 300 150, 278 228 L212 258 L0 380 Z", cls: "fill-sky-300/25 dark:fill-sky-400/10", swatch: "bg-sky-300/50 dark:bg-sky-400/25" },
  { name: "parietal", d: "M332 0 L520 0 L512 70 C524 120, 522 180, 508 236 L368 206 L278 228 C300 150, 318 90, 330 36 Z", cls: "fill-violet-300/25 dark:fill-violet-400/10", swatch: "bg-violet-300/50 dark:bg-violet-400/25" },
  { name: "occipital", d: "M520 0 L600 0 L600 410 L508 410 L508 236 C522 180, 524 120, 512 70 Z", cls: "fill-emerald-300/25 dark:fill-emerald-400/10", swatch: "bg-emerald-300/50 dark:bg-emerald-400/25" },
  { name: "temporal", d: "M212 258 L278 228 L368 206 L508 236 L508 410 L0 410 Z", cls: "fill-amber-300/25 dark:fill-amber-400/10", swatch: "bg-amber-300/50 dark:bg-amber-400/25" },
];

/** Where each sulcus label sits along its groove, and on which side. */
const SULCUS_LABELS: Record<string, { offset: string; dy: number }> = {
  "central sulcus": { offset: "60%", dy: -3 },
  "lateral fissure": { offset: "2%", dy: 9 },
  "intraparietal sulcus": { offset: "0%", dy: 9 },
};

interface Shape {
  /** Where the leader line to the label starts, and the selection ring sits. */
  cx: number;
  cy: number;
  d: string;
}

const ellipse = (cx: number, cy: number, rx: number, ry: number): Shape => ({
  cx,
  cy,
  d: `M${cx - rx} ${cy} a${rx} ${ry} 0 1 0 ${2 * rx} 0 a${rx} ${ry} 0 1 0 ${-2 * rx} 0 Z`,
});

const SHAPES: Record<AreaId, Shape> = {
  v1: { cx: 550, cy: 178, d: "M528 112 C552 104, 574 130, 576 178 C576 214, 562 240, 540 246 C526 220, 520 160, 528 112 Z" },
  v3a: { cx: 499, cy: 140, d: "M488 112 C500 106, 510 116, 512 140 C512 160, 506 172, 496 170 C486 160, 484 128, 488 112 Z" },
  mt: ellipse(478, 222, 17, 13),
  it: { cx: 368, cy: 286, d: "M300 290 C320 276, 380 268, 420 262 C436 268, 430 288, 410 296 C370 306, 320 308, 300 290 Z" },
  cip: { cx: 466, cy: 100, d: "M444 96 C452 84, 478 82, 488 92 C492 104, 480 114, 462 114 C448 112, 440 106, 444 96 Z" },
  ppc: { cx: 398, cy: 80, d: "M362 66 C378 52, 414 50, 434 62 C440 78, 430 98, 410 104 C388 108, 366 98, 362 84 Z" },
  pmd: { cx: 254, cy: 94, d: "M222 72 C240 60, 268 62, 282 74 C286 96, 276 120, 258 126 C238 124, 222 108, 222 72 Z" },
  m1: { cx: 312, cy: 50, d: "M324 38 C318 62, 308 100, 290 165 L270 162 C286 104, 296 66, 304 40 Z" },
  s1: { cx: 342, cy: 52, d: "M334 38 C328 90, 314 150, 298 226 L318 222 C332 150, 346 92, 354 42 Z" },
  cerebellum: { cx: 500, cy: 300, d: CEREBELLUM },
  a1: ellipse(330, 234, 20, 8),
  wernicke: ellipse(404, 226, 26, 12),
  smg: { cx: 394, cy: 168, d: "M362 160 C372 140, 404 136, 422 150 C430 168, 420 190, 398 196 C378 198, 360 184, 362 160 Z" },
  broca: { cx: 185, cy: 220, d: "M156 214 C164 200, 190 196, 206 204 C214 214, 210 234, 196 240 C178 244, 160 236, 156 214 Z" },
  speech: { cx: 262, cy: 196, d: "M290 168 C286 190, 282 208, 276 226 L240 226 C234 208, 236 186, 246 170 C258 164, 278 164, 290 168 Z" },
  pfc: { cx: 145, cy: 140, d: "M88 170 C86 130, 110 96, 150 84 C176 78, 196 84, 204 96 C200 130, 192 160, 170 178 C140 190, 100 196, 88 170 Z" },
  fef: ellipse(210, 134, 12, 10),
  thalamus: ellipse(356, 192, 26, 15),
  "basal-ganglia": { cx: 280, cy: 196, d: "M252 196 C254 180, 286 172, 308 182 C318 192, 310 210, 288 214 C266 216, 250 210, 252 196 Z" },
  hippocampus: { cx: 350, cy: 252, d: "M300 262 C320 246, 360 236, 398 236 C406 240, 404 248, 396 250 C362 252, 330 260, 308 272 C300 274, 296 268, 300 262 Z" },
  amygdala: ellipse(284, 268, 10, 9),
};

// The body map along the motor (M1) and touch (S1) strips, top to bottom: where each part
// starts, measured down the central sulcus.
const SULCUS_X: [number, number][] = [[36, 330], [78, 320], [123, 308], [173, 294], [228, 278]];
const sulcusX = (y: number) => {
  for (let i = 1; i < SULCUS_X.length; i++) {
    const [y0, x0] = SULCUS_X[i - 1]!;
    const [y1, x1] = SULCUS_X[i]!;
    if (y <= y1) return x0 + ((y - y0) / (y1 - y0)) * (x1 - x0);
  }
  return SULCUS_X[SULCUS_X.length - 1]![1];
};
const BODY = [
  { part: "leg", y: 50 },
  { part: "arm", y: 83 },
  { part: "hand", y: 125 },
  { part: "face", y: 171 },
  { part: "mouth", y: 210 },
];
const BODY_BOUNDS = [66, 100, 150, 192];

// Routes: seeing to doing (dorsal stream), seeing to knowing ("what"), hearing to speaking.
const DORSAL = "M552 182 C532 162, 512 150, 499 140 C490 124, 478 106, 466 100 C430 90, 360 82, 300 82 C270 84, 252 90, 248 96 C256 112, 266 124, 284 140";
const VENTRAL = "M548 196 C522 232, 470 252, 430 266 C390 280, 350 288, 318 290";
const LANGUAGE = "M330 236 C360 240, 392 236, 404 226 C428 196, 404 152, 350 150 C296 148, 236 174, 192 214 C214 206, 240 198, 262 196";

type RouteId = "action" | "language";
const ROUTES: { id: RouteId; label: string; steps: AreaId[] }[] = [
  { id: "action", label: "Seeing to doing", steps: ["v1", "v3a", "cip", "pmd", "m1"] },
  { id: "language", label: "Hearing to speaking", steps: ["a1", "wernicke", "broca", "speech"] },
];

const HOW_FILL: Record<BciSiteHow, string> = {
  cortex: "fill-accent-600 dark:fill-accent-300",
  surface: "fill-emerald-500",
  vessel: "fill-rose-500",
  deep: "fill-amber-500",
};
const HOW_DOT: Record<BciSiteHow, string> = {
  cortex: "bg-accent-600 dark:bg-accent-300",
  surface: "bg-emerald-500",
  vessel: "bg-rose-500",
  deep: "bg-amber-500",
};

const isDeep = (a: BrainArea) => a.group === "Deep structures";
const sitesAt = (id: AreaId) => BCI_SITES.filter((s) => s.area === id);
const projectTitle = (slug: string) => RESEARCH.find((r) => r.slug === slug)?.title ?? slug;
const halo = "stroke-white dark:stroke-zinc-900 [paint-order:stroke]";

/** One BCI program at one area: who, what for, the main result and its sources. */
export function BciSiteItem({ site }: { site: BciSite }) {
  return (
    <li className="rounded-md border border-zinc-200 p-3 dark:border-zinc-800">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{site.who}</span>
        <span className="flex items-center gap-1.5 text-[11px] text-zinc-500">
          <span aria-hidden="true" className={`h-2 w-2 rounded-full ${HOW_DOT[site.how]}`} />
          {BCI_SITE_HOW[site.how]}
        </span>
      </div>
      <div className="mt-0.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">{site.what}</div>
      <p className="mt-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{site.result}</p>
      <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs">
        {site.sources.map((src) => (
          <a key={src.url} href={src.url} target="_blank" rel="noreferrer" className="text-accent-600 hover:underline dark:text-accent-300">
            {src.label} ↗
          </a>
        ))}
        {site.landscape && (
          <Link href="/learn/bcis-today" className="text-zinc-500 hover:text-accent-600 hover:underline">
            In BCIs today →
          </Link>
        )}
      </div>
    </li>
  );
}

/** Every BCI program, grouped by the area it records from or stimulates. */
export function BciSitesByArea() {
  const order = [...new Set(BCI_SITES.map((s) => s.area))];
  return (
    <div className="space-y-6">
      {order.map((id) => {
        const area = BRAIN_AREAS.find((a) => a.id === id)!;
        return (
          <section key={id} aria-labelledby={`bci-area-${id}`}>
            <h3 id={`bci-area-${id}`} className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {area.name} <span className="font-normal text-zinc-500">· {area.group}</span>
            </h3>
            <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {sitesAt(id).map((s) => (
                <BciSiteItem key={s.id} site={s} />
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

function Toggle({ checked, onChange, disabled, children }: { checked: boolean; onChange: (on: boolean) => void; disabled?: boolean; children: ReactNode }) {
  return (
    <label className={`flex items-center gap-2 ${disabled ? "opacity-60" : ""}`}>
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} /> {children}
    </label>
  );
}

export function BrainMap() {
  const [selected, setSelected] = useState<AreaId>("m1");
  const [showLobes, setShowLobes] = useState(true);
  const [showBody, setShowBody] = useState(false);
  const [showDeep, setShowDeep] = useState(false);
  const [showBci, setShowBci] = useState(true);
  const [routes, setRoutes] = useState({ action: false, language: false, what: false });
  const [animate, setAnimate] = useState(false);
  const area = BRAIN_AREAS.find((a) => a.id === selected)!;
  const deepView = showDeep || isDeep(area);
  const route = ROUTES.find((r) => r.steps.includes(selected));
  const step = route ? route.steps.indexOf(selected) : -1;
  const sites = sitesAt(selected);

  // Travelling pulses only after hydration and never with reduced motion.
  useEffect(() => setAnimate(!prefersReducedMotion()), []);

  const goTo = (id: AreaId, routeId: RouteId) => {
    setSelected(id);
    setRoutes((r) => ({ ...r, [routeId]: true }));
  };

  const hotspot = (a: BrainArea) => {
    const s = SHAPES[a.id];
    const on = a.id === selected;
    const deep = isDeep(a);
    const tone = deep
      ? on
        ? "fill-violet-500/60 stroke-violet-700 dark:fill-violet-400/55 dark:stroke-violet-200"
        : "fill-violet-400/25 stroke-violet-600/70 hover:fill-violet-400/45 dark:fill-violet-400/20 dark:stroke-violet-300/70"
      : on
        ? "fill-accent-500/70 stroke-accent-700 dark:fill-accent-300/60 dark:stroke-accent-100"
        : "fill-accent-500/30 stroke-accent-600/60 hover:fill-accent-500/50 dark:fill-accent-300/25 dark:stroke-accent-300/50";
    return (
      <g key={a.id} onClick={() => setSelected(a.id)} className={`cursor-pointer transition-opacity duration-300 ${!deep && deepView ? "opacity-35" : ""}`}>
        <path d={s.d} className={`transition-[fill-opacity,stroke-width] duration-300 ${tone}`} strokeWidth={on ? 2.5 : 1.2} strokeDasharray={deep ? "4 3" : undefined} />
        {on && <circle cx={s.cx} cy={s.cy} r={14} className="animate-ping fill-none stroke-accent-500/60 motion-reduce:hidden" style={{ transformOrigin: `${s.cx}px ${s.cy}px` }} />}
      </g>
    );
  };

  const label = (a: BrainArea) => {
    const s = SHAPES[a.id];
    const on = a.id === selected;
    const [lx, ly] = a.label;
    const far = Math.hypot(lx - s.cx, ly - 4 - s.cy) > 20;
    const deep = isDeep(a);
    return (
      <g key={a.id} onClick={() => setSelected(a.id)} className={`cursor-pointer transition-opacity duration-300 ${!deep && deepView ? "opacity-35" : ""}`}>
        {far && <line x1={s.cx} y1={s.cy} x2={lx} y2={ly - 4} className="stroke-zinc-400/70" strokeWidth={0.8} />}
        <text
          x={lx}
          y={ly}
          textAnchor="middle"
          strokeWidth={3}
          className={`${deep ? "text-[10.5px]" : "text-[12px]"} font-semibold ${halo} ${on ? "fill-accent-700 dark:fill-accent-200" : "fill-zinc-700 dark:fill-zinc-200"}`}
        >
          {a.mapLabel ?? a.short}
        </text>
      </g>
    );
  };

  const cortical = BRAIN_AREAS.filter((a) => !isDeep(a) && a.id !== "cerebellum");
  const deepAreas = BRAIN_AREAS.filter(isDeep);
  const cerebellum = BRAIN_AREAS.find((a) => a.id === "cerebellum")!;
  const markers = BCI_SITES.filter((s) => showBci && (s.how !== "deep" || deepView));

  return (
    <div className="space-y-4">
      <div className="space-y-2" role="group" aria-label="Brain area">
        {AREA_GROUPS.map((g) => (
          <div key={g} className="grid grid-cols-1 items-start gap-1.5 sm:grid-cols-[9.5rem_minmax(0,1fr)]">
            <div className="pt-1 text-[11px] font-medium uppercase tracking-wider text-zinc-500">{g}</div>
            <div className="flex flex-wrap gap-1.5">
              {BRAIN_AREAS.filter((a) => a.group === g).map((a) => {
                const on = a.id === selected;
                const n = sitesAt(a.id).length;
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setSelected(a.id)}
                    aria-pressed={on}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      on
                        ? "bg-accent-600 text-white shadow-sm shadow-accent-600/30 dark:bg-accent-300 dark:text-zinc-900"
                        : "border border-zinc-300 bg-white/80 text-zinc-700 hover:border-accent-500/60 dark:border-zinc-700 dark:bg-zinc-900/80 dark:text-zinc-300"
                    }`}
                  >
                    {a.short}
                    {showBci && n > 0 && (
                      <>
                        <span aria-hidden="true" className={`ml-1.5 rounded-full px-1.5 font-mono text-[10px] ${on ? "bg-white/25" : "bg-zinc-200 dark:bg-zinc-700"}`}>
                          {n}
                        </span>
                        <span className="sr-only">, {n} BCI {n === 1 ? "program" : "programs"}</span>
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <div>
          <svg viewBox="0 0 600 410" className="w-full" aria-hidden="true">
            <defs>
              <clipPath id="brain-clip">
                <path d={OUTLINE} />
              </clipPath>
              {SULCI.map((s, i) => (
                <path key={i} id={`sulcus-${i}`} d={s.d} />
              ))}
            </defs>

            <path d={BRAINSTEM} className="fill-zinc-200 stroke-zinc-400 dark:fill-zinc-700/70 dark:stroke-zinc-500" strokeWidth={1.5} />
            <text x={432} y={392} className="fill-zinc-500 text-[9.5px] italic dark:fill-zinc-400">
              brainstem → spinal cord
            </text>
            <path d={CEREBELLUM} className="fill-zinc-200 dark:fill-zinc-700/70" />
            {hotspot(cerebellum)}
            {CEREBELLUM_FOLIA.map((d) => (
              <path key={d} d={d} fill="none" className="pointer-events-none stroke-zinc-400/70 dark:stroke-zinc-500/70" strokeWidth={1.2} />
            ))}

            <path d={OUTLINE} className="fill-zinc-100 dark:fill-zinc-800" />
            {showLobes && (
              <g clipPath="url(#brain-clip)">
                {LOBES.map((l) => (
                  <path key={l.name} d={l.d} className={l.cls} />
                ))}
              </g>
            )}
            {SULCI.map((s, i) => (
              <path key={i} d={s.d} fill="none" className="stroke-zinc-400/80 dark:stroke-zinc-500/70" strokeWidth={2} strokeLinecap="round" />
            ))}
            <path d={OUTLINE} fill="none" className="stroke-zinc-400 dark:stroke-zinc-500" strokeWidth={2} />

            {routes.what && (
              <g>
                <path d={VENTRAL} fill="none" className="stroke-amber-500/70" strokeWidth={3} strokeDasharray="6 5" strokeLinecap="round" />
                {animate && (
                  <circle r={4} className="fill-amber-500 motion-reduce:hidden">
                    <animateMotion dur="3.4s" repeatCount="indefinite" path={VENTRAL} />
                  </circle>
                )}
              </g>
            )}

            {cortical.map(hotspot)}

            {showBody && (
              <g className="pointer-events-none">
                {BODY_BOUNDS.map((y) => (
                  <line key={y} x1={sulcusX(y) - 30} y1={y} x2={sulcusX(y) + 26} y2={y + 4} className="stroke-zinc-50 dark:stroke-zinc-900" strokeWidth={2.5} />
                ))}
                {BODY.map((b) => (
                  <text key={b.part} x={sulcusX(b.y) + 34} y={b.y + 3} strokeWidth={3} className={`fill-rose-600 text-[10px] font-medium italic dark:fill-rose-300 ${halo}`}>
                    {b.part}
                  </text>
                ))}
              </g>
            )}

            {routes.action && (
              <g className="pointer-events-none">
                <path d={DORSAL} fill="none" className="stroke-accent-600/80 dark:stroke-accent-200/80" strokeWidth={3} strokeLinecap="round" />
                {animate &&
                  [0, 1.2, 2.4].map((delay) => (
                    <circle key={delay} r={4.2} className="fill-accent-700 motion-reduce:hidden dark:fill-accent-100">
                      <animateMotion dur="3.6s" begin={`${delay}s`} repeatCount="indefinite" path={DORSAL} />
                    </circle>
                  ))}
              </g>
            )}
            {routes.language && (
              <g className="pointer-events-none">
                <path d={LANGUAGE} fill="none" className="stroke-rose-500/80 dark:stroke-rose-300/80" strokeWidth={3} strokeLinecap="round" />
                {animate &&
                  [0, 1.4].map((delay) => (
                    <circle key={delay} r={4.2} className="fill-rose-600 motion-reduce:hidden dark:fill-rose-200">
                      <animateMotion dur="4s" begin={`${delay}s`} repeatCount="indefinite" path={LANGUAGE} />
                    </circle>
                  ))}
              </g>
            )}

            {deepView && deepAreas.map(hotspot)}

            {showLobes &&
              SULCI.filter((s) => s.label).map((s) => {
                const i = SULCI.indexOf(s);
                const at = SULCUS_LABELS[s.label]!;
                return (
                  <text key={s.label} dy={at.dy} strokeWidth={3} className={`pointer-events-none fill-zinc-500 text-[9px] italic dark:fill-zinc-400 ${halo}`}>
                    <textPath href={`#sulcus-${i}`} startOffset={at.offset}>
                      {s.label}
                    </textPath>
                  </text>
                );
              })}

            {[...cortical, cerebellum].map(label)}
            {deepView && deepAreas.map(label)}

            {markers.map((m) => {
              const on = m.area === selected;
              return (
                <g key={m.id} onClick={() => setSelected(m.area)} className="cursor-pointer">
                  {on && <circle cx={m.at[0]} cy={m.at[1]} r={8.5} className="fill-none stroke-zinc-900/60 dark:stroke-white/70" strokeWidth={1.2} />}
                  <circle cx={m.at[0]} cy={m.at[1]} r={5} className={`${HOW_FILL[m.how]} stroke-white dark:stroke-zinc-900`} strokeWidth={1.5}>
                    <title>{`${m.who}: ${m.what}`}</title>
                  </circle>
                </g>
              );
            })}

            <text x={8} y={404} className="fill-zinc-400 text-[9.5px]">left side of the brain, front to the left · schematic, not to scale</text>
          </svg>

          <div className="mt-2 space-y-2 text-xs text-zinc-600 dark:text-zinc-400">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              <span className="w-14 text-[11px] uppercase tracking-wider text-zinc-500">Show</span>
              <Toggle checked={showBci} onChange={setShowBci}>BCI implants</Toggle>
              <Toggle checked={showBody} onChange={setShowBody}>Body map</Toggle>
              <Toggle checked={deepView} onChange={setShowDeep} disabled={isDeep(area)}>
                Deep structures
              </Toggle>
              <Toggle checked={showLobes} onChange={setShowLobes}>Lobes and grooves</Toggle>
            </div>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              <span className="w-14 text-[11px] uppercase tracking-wider text-zinc-500">Routes</span>
              <Toggle checked={routes.action} onChange={(on) => setRoutes((r) => ({ ...r, action: on }))}>Seeing → doing</Toggle>
              <Toggle checked={routes.what} onChange={(on) => setRoutes((r) => ({ ...r, what: on }))}>Seeing → knowing what</Toggle>
              <Toggle checked={routes.language} onChange={(on) => setRoutes((r) => ({ ...r, language: on }))}>Hearing → speaking</Toggle>
            </div>
            {(showBci || showLobes) && (
              <div className="flex flex-wrap gap-x-4 gap-y-1.5 border-t border-zinc-200 pt-2 text-[11px] text-zinc-500 dark:border-zinc-800">
                {showBci &&
                  (Object.keys(BCI_SITE_HOW) as BciSiteHow[]).map((h) => (
                    <span key={h} className="flex items-center gap-1.5">
                      <span aria-hidden="true" className={`h-2.5 w-2.5 rounded-full ${HOW_DOT[h]}`} />
                      {BCI_SITE_HOW[h]}
                      {h === "deep" && !deepView && " (show deep structures)"}
                    </span>
                  ))}
                {showLobes &&
                  LOBES.map((l) => (
                    <span key={l.name} className="flex items-center gap-1.5">
                      <span aria-hidden="true" className={`h-2.5 w-2.5 rounded-sm ${l.swatch}`} />
                      {l.name} lobe
                    </span>
                  ))}
              </div>
            )}
          </div>
        </div>

        <div className="min-w-0 space-y-4" aria-live="polite">
          <div key={area.id} className="animate-fade-up space-y-3">
            <div>
              <div className="flex flex-wrap items-baseline gap-x-2 text-xs">
                <span className="font-mono font-semibold text-accent-600 dark:text-accent-300">{area.short}</span>
                <span className="text-zinc-500">{area.group}</span>
              </div>
              <h3 className="text-lg font-semibold tracking-tight">{area.name}</h3>
              <p className="mt-0.5 text-sm text-zinc-500">{area.where}</p>
            </div>
            <p className="text-[15px] leading-relaxed text-zinc-700 dark:text-zinc-300">{area.does}</p>
            <div className="rounded-md border-l-4 border-violet-400/60 bg-violet-50/60 px-3 py-2 text-sm leading-relaxed text-zinc-700 dark:bg-violet-500/10 dark:text-zinc-300">
              <span className="font-semibold">Did you know? </span>
              {area.fact}
            </div>
            {sites.length > 0 && (
              <div>
                <div className="mb-1.5 text-[11px] uppercase tracking-wider text-zinc-500">BCIs here</div>
                <ul className="space-y-2">
                  {sites.map((s) => (
                    <BciSiteItem key={s.id} site={s} />
                  ))}
                </ul>
              </div>
            )}
            {area.projects.length > 0 && (
              <div>
                <div className="mb-1.5 text-[11px] uppercase tracking-wider text-zinc-500">In my research</div>
                <div className="flex flex-col gap-1.5">
                  {area.projects.map((slug) => (
                    <Link key={slug} href={`/research/${slug}`} className="group text-sm font-medium text-accent-600 dark:text-accent-300">
                      {projectTitle(slug)} <span className="arrow">→</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {route && (
            <div className="rounded-md border border-zinc-200 p-3 dark:border-zinc-800">
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-500">
                <span>
                  {route.label} · step <span className="num font-mono">{step + 1}</span> of {route.steps.length}
                </span>
                <span className="flex gap-1.5">
                  <button type="button" className="btn btn-outline px-2.5 py-1 text-xs disabled:opacity-40" disabled={step === 0} onClick={() => goTo(route.steps[step - 1]!, route.id)}>
                    ← Back
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary px-2.5 py-1 text-xs disabled:opacity-40"
                    disabled={step === route.steps.length - 1}
                    onClick={() => goTo(route.steps[step + 1]!, route.id)}
                  >
                    Follow the signal →
                  </button>
                </span>
              </div>
              <div className="mt-2 flex gap-1" aria-hidden="true">
                {route.steps.map((id, i) => (
                  <span key={id} className={`h-1 flex-1 rounded-full transition-colors duration-300 ${i <= step ? "bg-accent-500 dark:bg-accent-300" : "bg-zinc-200 dark:bg-zinc-800"}`} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
