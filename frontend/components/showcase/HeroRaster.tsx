"use client";

import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "@/components/motion";
import { rng } from "@/lib/random";

const ROWS = 28;
const SPEED = 64; // px per simulated second
const DT = 1 / 120; // simulation step, s
const BASE = 0.8; // spikes/s far from the preferred direction
const PEAK = 38; // spikes/s at the preferred direction
const KAPPA = 2.8; // tuning sharpness (von Mises)
const WINDOW = 0.3; // decoding window, s
const HEAD = 28; // px from the right edge where new spikes appear

interface Spike {
  row: number;
  t: number;
}

/** Slow, smooth wander of the movement direction, kept away from the 0/2π seam. */
function latent(t: number): number {
  const s = 0.55 * Math.sin(t * 0.37) + 0.3 * Math.sin(t * 0.83 + 1.3) + 0.15 * Math.sin(t * 1.9 + 0.4);
  return Math.PI + s * 0.74 * Math.PI;
}

const preferred = (row: number) => (2 * Math.PI * (row + 0.5)) / ROWS;

/**
 * A scrolling spike raster from a simulated population tuned to a drifting movement
 * direction, with the direction decoded from the spikes drawn on top. Decorative: it
 * pauses off screen and renders a single still frame when reduced motion is preferred.
 */
export function HeroRaster() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const rand = rng(20261016);
    const spikes: Spike[] = [];
    const truth: { t: number; v: number }[] = [];
    const decoded: { t: number; v: number }[] = [];
    let simT = 0;
    let smooth = latent(0);
    let width = 0;
    let height = 0;
    let span = 20; // seconds visible across the strip
    const dark = window.matchMedia("(prefers-color-scheme: dark)");

    function step() {
      simT += DT;
      const theta = latent(simT);
      for (let r = 0; r < ROWS; r++) {
        const rate = BASE + PEAK * Math.exp(KAPPA * (Math.cos(theta - preferred(r)) - 1));
        if (rand() < rate * DT) spikes.push({ row: r, t: simT });
      }
      if (Math.round(simT / DT) % 4 === 0) {
        let vx = 0;
        let vy = 0;
        for (let i = spikes.length - 1; i >= 0 && spikes[i]!.t > simT - WINDOW; i--) {
          const pd = preferred(spikes[i]!.row);
          vx += Math.cos(pd);
          vy += Math.sin(pd);
        }
        if (vx || vy) {
          const est = (Math.atan2(vy, vx) + 2 * Math.PI) % (2 * Math.PI);
          smooth += 0.35 * (est - smooth);
        }
        // The window is centred half a window back, so plot the estimate there.
        decoded.push({ t: simT - WINDOW / 2, v: smooth });
        truth.push({ t: simT, v: theta });
      }
      const oldest = simT - span - 1;
      while (spikes.length && spikes[0]!.t < oldest) spikes.shift();
      while (decoded.length && decoded[0]!.t < oldest) decoded.shift();
      while (truth.length && truth[0]!.t < oldest) truth.shift();
    }

    function resize() {
      const box = canvas!.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = box.width;
      height = box.height;
      canvas!.width = Math.round(width * dpr);
      canvas!.height = Math.round(height * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      span = (width - HEAD) / SPEED;
    }

    const yOf = (angle: number) => (1 - angle / (2 * Math.PI)) * height;

    function trace(points: { t: number; v: number }[]) {
      ctx!.beginPath();
      points.forEach((p, i) => {
        const x = width - HEAD - (simT - p.t) * SPEED;
        if (i === 0) ctx!.moveTo(x, yOf(p.v));
        else ctx!.lineTo(x, yOf(p.v));
      });
    }

    function draw() {
      const isDark = dark.matches;
      const rowH = height / ROWS;
      const tick = Math.max(2, rowH * 0.62);
      const headX = width - HEAD;
      ctx!.clearRect(0, 0, width, height);

      // Actual direction: a soft band behind the spikes.
      trace(truth);
      ctx!.strokeStyle = isDark ? "rgba(74, 222, 128, 0.16)" : "rgba(21, 128, 61, 0.12)";
      ctx!.lineWidth = rowH * 3.2;
      ctx!.lineCap = "round";
      ctx!.lineJoin = "round";
      ctx!.stroke();

      // Spikes: older ticks muted, the last half-second brighter.
      const fresh = 0.5;
      for (const pass of [0, 1]) {
        ctx!.beginPath();
        for (const s of spikes) {
          const age = simT - s.t;
          if ((age < fresh) !== (pass === 1)) continue;
          const x = headX - age * SPEED;
          if (x < -2) continue;
          const y = (ROWS - 1 - s.row) * rowH + (rowH - tick) / 2;
          ctx!.rect(x, y, 1.6, tick);
        }
        ctx!.fillStyle =
          pass === 0
            ? isDark ? "rgba(134, 174, 223, 0.55)" : "rgba(47, 93, 158, 0.55)"
            : isDark ? "rgba(186, 214, 255, 0.95)" : "rgba(38, 75, 128, 0.95)";
        ctx!.fill();
      }

      // Decoded direction, read out from the spikes.
      trace(decoded);
      ctx!.strokeStyle = isDark ? "#fb923c" : "#ea580c";
      ctx!.lineWidth = 2;
      ctx!.shadowColor = isDark ? "rgba(251, 146, 60, 0.6)" : "rgba(234, 88, 12, 0.35)";
      ctx!.shadowBlur = 8;
      ctx!.stroke();
      ctx!.shadowBlur = 0;

      // Write head: a faint line, with a flash for each row that just fired.
      const grad = ctx!.createLinearGradient(0, 0, 0, height);
      const head = isDark ? "rgba(148, 163, 184, 0.35)" : "rgba(100, 116, 139, 0.3)";
      grad.addColorStop(0, "rgba(0,0,0,0)");
      grad.addColorStop(0.5, head);
      grad.addColorStop(1, "rgba(0,0,0,0)");
      ctx!.fillStyle = grad;
      ctx!.fillRect(headX, 0, 1, height);
      for (let i = spikes.length - 1; i >= 0; i--) {
        const age = simT - spikes[i]!.t;
        if (age > 0.18) break;
        const k = 1 - age / 0.18;
        const y = (ROWS - 1 - spikes[i]!.row) * rowH + rowH / 2;
        ctx!.beginPath();
        ctx!.arc(headX, y, 1.2 + 2.8 * k, 0, 2 * Math.PI);
        ctx!.fillStyle = isDark ? `rgba(147, 197, 253, ${0.7 * k})` : `rgba(59, 111, 182, ${0.55 * k})`;
        ctx!.fill();
      }
      const now = decoded[decoded.length - 1];
      if (now) {
        ctx!.beginPath();
        ctx!.arc(width - HEAD - (simT - now.t) * SPEED, yOf(now.v), 3.5, 0, 2 * Math.PI);
        ctx!.fillStyle = isDark ? "#fdba74" : "#ea580c";
        ctx!.fill();
      }
    }

    resize();
    // Fill the strip before the first frame so it never starts empty.
    while (simT < span + 1) step();
    draw();

    const ro = new ResizeObserver(() => {
      resize();
      draw();
    });
    ro.observe(canvas);
    dark.addEventListener("change", draw);
    if (prefersReducedMotion()) {
      return () => {
        ro.disconnect();
        dark.removeEventListener("change", draw);
      };
    }

    let raf = 0;
    let last = 0;
    let visible = true;
    const loop = (now: number) => {
      const elapsed = last ? Math.min(0.1, (now - last) / 1000) : 0;
      last = now;
      for (let n = Math.round(elapsed / DT); n > 0; n--) step();
      draw();
      raf = requestAnimationFrame(loop);
    };
    const start = () => {
      if (raf || !visible || document.hidden) return;
      last = 0;
      raf = requestAnimationFrame(loop);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };
    const io = new IntersectionObserver(([entry]) => {
      visible = !!entry?.isIntersecting;
      if (visible) start();
      else stop();
    });
    io.observe(canvas);
    const onVisibility = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVisibility);
    start();

    return () => {
      stop();
      io.disconnect();
      ro.disconnect();
      dark.removeEventListener("change", draw);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="absolute inset-0 h-full w-full [mask-image:linear-gradient(to_right,transparent,black_14%)]"
    />
  );
}
