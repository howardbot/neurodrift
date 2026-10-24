"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { prefersReducedMotion } from "@/components/motion";
import { LAND_RUNS, LATTICE_SIZE } from "@/content/globeLand";
import { BY_COUNTRY, PLACES, type Place } from "@/content/places";
import { decodeRuns, latticePoint, lonDelta, toVec, view, type Vec3 } from "@/lib/globe";

// Dotted globe of the places on /places. Canvas 2D: land is a lattice of dots facing the viewer
// (fainter towards the rim), places are pins. Drag to turn it (sideways only on touch, so the page
// still scrolls), click a pin or a place below to fly there. It turns slowly when idle unless the
// viewer prefers reduced motion, and only animates while on screen.

const PIN = { light: "#2f5d9e", dark: "#86aedf" }; // accent-600 / accent-300
const SPIN = 4; // degrees per second when idle
const TILT = 60; // furthest the view tilts towards a pole
const DRAG = 0.35; // degrees per pixel dragged
const clampTilt = (lat: number) => Math.max(-TILT, Math.min(TILT, lat));

const where = (p: Place) => [p.area, p.country].filter(Boolean).join(", ");

export function PlacesGlobe() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const land = useMemo(() => decodeRuns(LAND_RUNS).map((i) => toVec(latticePoint(i, LATTICE_SIZE))), []);
  const pins = useMemo(() => PLACES.map((p) => ({ place: p, v: toVec([p.lon, p.lat]) as Vec3 })), []);

  // Mutable animation state lives in one ref; React state only drives the panel beside the globe.
  const s = useRef({
    lon: PLACES[0]?.lon ?? 0,
    lat: 25,
    target: null as { lon: number; lat: number } | null,
    drag: null as { id: number; x: number; y: number; lon: number; lat: number; touch: boolean; moved: boolean } | null,
    selected: null as string | null,
    hovered: null as string | null,
    kick: () => {},
    hit: (_x: number, _y: number): Place | null => null,
  });
  s.current.selected = selected;
  s.current.hovered = hovered;

  const select = (id: string | null) => {
    setSelected(id);
    const place = PLACES.find((p) => p.id === id);
    if (place) {
      const target = { lon: place.lon, lat: clampTilt(place.lat * 0.85) };
      if (prefersReducedMotion()) Object.assign(s.current, target, { target: null });
      else s.current.target = target;
    }
    s.current.kick();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const st = s.current;
    const dark = window.matchMedia("(prefers-color-scheme: dark)");
    const reduced = prefersReducedMotion();
    let dpr = 1;
    let raf = 0;
    let last = 0;
    let onScreen = true;

    const geometry = () => {
      const w = canvas.width;
      return { c: w / 2, r: w * 0.45 };
    };

    const project = (v: Vec3) => {
      const { c, r } = geometry();
      const [x, y, z] = view(v, st.lon, st.lat);
      return { x: c + x * r, y: c - y * r, z };
    };

    st.hit = (cssX, cssY) => {
      const x = cssX * dpr;
      const y = cssY * dpr;
      let best: Place | null = null;
      let bestD = 16 * dpr;
      for (const { place, v } of pins) {
        const p = project(v);
        if (p.z < 0.05) continue;
        const d = Math.hypot(p.x - x, p.y - y);
        if (d < bestD) {
          bestD = d;
          best = place;
        }
      }
      return best;
    };

    const draw = (t: number) => {
      const w = canvas.width;
      const { c, r } = geometry();
      const isDark = dark.matches;
      ctx.clearRect(0, 0, w, w);

      // Sphere, lit from the upper left.
      const sphere = ctx.createRadialGradient(c - r * 0.35, c - r * 0.4, r * 0.05, c, c, r);
      sphere.addColorStop(0, isDark ? "#1c2230" : "#ffffff");
      sphere.addColorStop(1, isDark ? "#0a0d13" : "#e6ebf3");
      ctx.fillStyle = sphere;
      ctx.beginPath();
      ctx.arc(c, c, r, 0, 2 * Math.PI);
      ctx.fill();
      ctx.lineWidth = dpr;
      ctx.strokeStyle = isDark ? "rgba(134,174,223,0.22)" : "rgba(47,93,158,0.16)";
      ctx.stroke();

      // Land dots, smaller and fainter towards the rim.
      const dot = Math.max(1.2 * dpr, r / 150);
      ctx.fillStyle = isDark ? "#a1a1aa" : "#52525b";
      for (const v of land) {
        const [x, y, z] = view(v, st.lon, st.lat);
        if (z <= 0) continue;
        ctx.globalAlpha = 0.15 + 0.75 * z;
        const size = dot * (0.55 + 0.45 * z);
        ctx.fillRect(c + x * r - size / 2, c - y * r - size / 2, size, size);
      }
      ctx.globalAlpha = 1;

      // Pins on the visible side; the selected or hovered one pulses and is labelled.
      const phase = reduced ? 0.35 : (t / 1600) % 1;
      for (const { place, v } of pins) {
        const p = project(v);
        if (p.z < 0.05) continue;
        const colour = PIN[isDark ? "dark" : "light"];
        const focus = place.id === st.selected || place.id === st.hovered;
        ctx.globalAlpha = 0.25 * p.z;
        ctx.fillStyle = colour;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 7 * dpr, 0, 2 * Math.PI);
        ctx.fill();
        if (focus) {
          ctx.globalAlpha = (1 - phase) * p.z;
          ctx.strokeStyle = colour;
          ctx.lineWidth = 1.5 * dpr;
          ctx.beginPath();
          ctx.arc(p.x, p.y, (6 + 14 * phase) * dpr, 0, 2 * Math.PI);
          ctx.stroke();
        }
        ctx.globalAlpha = Math.min(1, 0.35 + p.z);
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3.6 * dpr, 0, 2 * Math.PI);
        ctx.fill();
        ctx.lineWidth = 1.5 * dpr;
        ctx.strokeStyle = isDark ? "#0a0d13" : "#ffffff";
        ctx.stroke();
        if (focus) {
          ctx.globalAlpha = 1;
          ctx.font = `600 ${12 * dpr}px ui-sans-serif, system-ui, sans-serif`;
          const label = place.name;
          const tw = ctx.measureText(label).width;
          const pad = 6 * dpr;
          const bx = Math.min(w - tw - 2 * pad - 2, Math.max(2, p.x - tw / 2 - pad));
          const by = Math.max(2, p.y - 34 * dpr);
          ctx.fillStyle = isDark ? "rgba(24,24,27,0.92)" : "rgba(255,255,255,0.94)";
          ctx.beginPath();
          ctx.roundRect(bx, by, tw + 2 * pad, 20 * dpr, 6 * dpr);
          ctx.fill();
          ctx.strokeStyle = colour;
          ctx.lineWidth = dpr;
          ctx.stroke();
          ctx.fillStyle = isDark ? "#f4f4f5" : "#18181b";
          ctx.textBaseline = "middle";
          ctx.fillText(label, bx + pad, by + 10 * dpr);
        }
      }
      ctx.globalAlpha = 1;
    };

    // Animation runs only while something moves and the globe is on screen in a visible tab.
    const moving = () => Boolean(st.target || st.drag || (!reduced && !st.selected && !st.hovered));
    const frame = (t: number) => {
      const dt = last ? Math.min(0.05, (t - last) / 1000) : 0;
      last = t;
      if (st.target) {
        const k = Math.min(1, dt * 5);
        const dl = lonDelta(st.lon, st.target.lon);
        const db = st.target.lat - st.lat;
        st.lon += dl * k;
        st.lat += db * k;
        if (Math.abs(dl) < 0.05 && Math.abs(db) < 0.05) {
          st.lon = st.target.lon;
          st.lat = st.target.lat;
          st.target = null;
        }
      } else if (!st.drag && !reduced && !st.selected && !st.hovered) {
        st.lon += SPIN * dt;
      }
      draw(t);
      const pulsing = !reduced && Boolean(st.selected || st.hovered);
      if (onScreen && !document.hidden && (moving() || pulsing)) raf = requestAnimationFrame(frame);
      else raf = 0;
    };
    st.kick = () => {
      if (raf) return;
      last = 0;
      if (onScreen && !document.hidden) raf = requestAnimationFrame(frame);
      else draw(performance.now());
    };

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const size = Math.round(canvas.clientWidth * dpr);
      if (size && size !== canvas.width) {
        canvas.width = size;
        canvas.height = size;
      }
      draw(performance.now());
      st.kick();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    const io = new IntersectionObserver(([entry]) => {
      onScreen = Boolean(entry?.isIntersecting);
      if (onScreen) st.kick();
    });
    io.observe(canvas);
    const onVisibility = () => !document.hidden && st.kick();
    const onScheme = () => draw(performance.now());
    document.addEventListener("visibilitychange", onVisibility);
    dark.addEventListener("change", onScheme);
    resize();
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      dark.removeEventListener("change", onScheme);
      st.kick = () => {};
    };
  }, [land, pins]);

  // Restart the loop when selection or hover changes (pulses, or the idle spin resumes).
  useEffect(() => s.current.kick(), [selected, hovered]);

  const local = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const current = PLACES.find((p) => p.id === selected) ?? null;

  return (
    <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_17rem] md:items-center">
      <canvas
        ref={canvasRef}
        tabIndex={0}
        role="img"
        aria-label={`Globe showing ${PLACES.length} places: ${PLACES.map((p) => p.name).join(", ")}. Arrow keys turn it.`}
        className="mx-auto aspect-square w-full max-w-[30rem] cursor-grab rounded-full outline-none focus-visible:ring-2 focus-visible:ring-accent-500 active:cursor-grabbing"
        style={{ touchAction: "pan-y" }}
        onPointerDown={(e) => {
          const st = s.current;
          st.target = null;
          st.drag = { id: e.pointerId, x: e.clientX, y: e.clientY, lon: st.lon, lat: st.lat, touch: e.pointerType === "touch", moved: false };
          e.currentTarget.setPointerCapture(e.pointerId);
          st.kick();
        }}
        onPointerMove={(e) => {
          const st = s.current;
          const d = st.drag;
          if (d && d.id === e.pointerId) {
            const dx = e.clientX - d.x;
            const dy = e.clientY - d.y;
            if (Math.abs(dx) + Math.abs(dy) > 4) d.moved = true;
            st.lon = d.lon - dx * DRAG;
            if (!d.touch) st.lat = clampTilt(d.lat + dy * DRAG);
            return;
          }
          const { x, y } = local(e);
          const hit = st.hit(x, y);
          e.currentTarget.style.cursor = hit ? "pointer" : "";
          if ((hit?.id ?? null) !== st.hovered) setHovered(hit?.id ?? null);
        }}
        onPointerUp={(e) => {
          const st = s.current;
          const d = st.drag;
          st.drag = null;
          if (d && !d.moved) {
            const { x, y } = local(e);
            const hit = st.hit(x, y);
            if (hit) select(hit.id === selected ? null : hit.id);
          }
          st.kick();
        }}
        onPointerCancel={() => {
          s.current.drag = null;
          s.current.kick();
        }}
        onPointerLeave={() => hovered && setHovered(null)}
        onKeyDown={(e) => {
          const st = s.current;
          const step = { ArrowLeft: [-12, 0], ArrowRight: [12, 0], ArrowUp: [0, 10], ArrowDown: [0, -10] }[e.key];
          if (step) {
            e.preventDefault();
            st.target = { lon: st.lon + step[0]!, lat: clampTilt(st.lat + step[1]!) };
            st.kick();
          } else if (e.key === "Escape") select(null);
        }}
      />

      <div className="space-y-4">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">{PLACES.length}</span> {PLACES.length === 1 ? "place" : "places"} in{" "}
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">{BY_COUNTRY.length}</span> {BY_COUNTRY.length === 1 ? "country" : "countries"}
        </p>
        {BY_COUNTRY.map(({ country, places }) => (
          <div key={country}>
            <div className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-zinc-500">{country}</div>
            <div className="flex flex-wrap gap-1.5" role="group" aria-label={country}>
              {places.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  aria-pressed={p.id === selected}
                  onClick={() => select(p.id === selected ? null : p.id)}
                  onMouseEnter={() => setHovered(p.id)}
                  onMouseLeave={() => setHovered(null)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    p.id === selected
                      ? "bg-accent-600 text-white shadow-sm shadow-accent-600/30 dark:bg-accent-300 dark:text-zinc-900"
                      : "border border-zinc-300 bg-white/80 text-zinc-700 hover:border-accent-500/60 dark:border-zinc-700 dark:bg-zinc-900/80 dark:text-zinc-300"
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>
        ))}
        <div className="min-h-[4rem] rounded-lg border border-zinc-200 p-3 text-sm dark:border-zinc-800" aria-live="polite">
          {current ? (
            <>
              <div className="font-semibold">{current.name}</div>
              <div className="text-xs text-zinc-500">{where(current)}</div>
            </>
          ) : (
            <p className="text-zinc-500">Drag to turn the globe. Click a place to fly there.</p>
          )}
        </div>
      </div>
    </div>
  );
}
