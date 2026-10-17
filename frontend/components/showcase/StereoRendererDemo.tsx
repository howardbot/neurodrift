"use client";

import { useEffect, useRef, useState } from "react";

type ViewMode = "mono" | "anaglyph" | "sbs" | "left" | "right";
type Shape = "teapot" | "knot" | "sphere";

const MODES: { id: ViewMode; label: string }[] = [
  { id: "mono", label: "Normal" },
  { id: "anaglyph", label: "Red–cyan 3D" },
  { id: "sbs", label: "Left | right" },
  { id: "left", label: "Left eye" },
  { id: "right", label: "Right eye" },
];

const SHAPES: { id: Shape; label: string }[] = [
  { id: "teapot", label: "Teapot" },
  { id: "knot", label: "Knot" },
  { id: "sphere", label: "Low-poly sphere" },
];

interface Settings {
  mode: ViewMode;
  smooth: boolean;
  eyeFraction: number;
  marker: boolean;
  spin: boolean;
}

/**
 * Browser re-implementation of the ideas in the lab's MATLAB/Psychtoolbox renderer:
 * the model is normalised to a unit bounding sphere, the camera sits at twice the model
 * size, the eye separation is a fraction of that distance (default 1/30), shading uses
 * face normals (flat) or averaged vertex normals (smooth), and each eye can be shown
 * separately, side by side, or combined as a red–cyan anaglyph.
 */
export function StereoRendererDemo() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<ViewMode>("anaglyph");
  const [shape, setShape] = useState<Shape>("teapot");
  const [smooth, setSmooth] = useState(true);
  const [eyeFraction, setEyeFraction] = useState(1 / 30);
  const [marker, setMarker] = useState(true);
  const [spin, setSpin] = useState(true);
  const [failed, setFailed] = useState<"load" | "webgl" | null>(null);
  // three.js and WebGL start only once the demo nears the viewport, so the page's text
  // and figures come first; until then the mount shows a same-size placeholder.
  const [near, setNear] = useState(false);
  const [ready, setReady] = useState(false);
  const settings = useRef<Settings>({ mode, smooth, eyeFraction, marker, spin });
  settings.current = { mode, smooth, eyeFraction, marker, spin };
  const shapeRef = useRef<(s: Shape) => void>(() => {});
  // The shape picked so far, so a choice made while three.js is still loading is not lost.
  const shapeNow = useRef(shape);
  shapeNow.current = shape;
  const requestRender = useRef<() => void>(() => {});

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) setSpin(false);
  }, []);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount || near) return;
    if (typeof IntersectionObserver === "undefined") {
      setNear(true);
      return;
    }
    const io = new IntersectionObserver(([entry]) => entry?.isIntersecting && setNear(true), { rootMargin: "300px 0px" });
    io.observe(mount);
    return () => io.disconnect();
  }, [near]);

  // Settings changes need a frame even when nothing is spinning.
  useEffect(() => {
    requestRender.current();
  }, [mode, smooth, eyeFraction, marker, spin, shape]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount || !near) return;
    let disposed = false;
    let frame = 0;
    let cleanup = () => {};

    (async () => {
      let modules;
      try {
        modules = await Promise.all([
          import("three"),
          import("three/examples/jsm/controls/OrbitControls.js"),
          import("three/examples/jsm/geometries/TeapotGeometry.js"),
        ]);
      } catch {
        // Typically a chunk that no longer exists after a deploy; a reload fetches the new one.
        if (!disposed) setFailed("load");
        return;
      }
      const [THREE, { OrbitControls }, { TeapotGeometry }] = modules;
      try {
        if (disposed) return;

        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        mount.appendChild(renderer.domElement);
        renderer.domElement.style.display = "block";
        renderer.domElement.style.width = "100%";

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x1c1c1f);
        scene.add(new THREE.AmbientLight(0xffffff, 0.45));
        const sun = new THREE.DirectionalLight(0xffffff, 2.2);
        sun.position.set(2, 3, 4);
        scene.add(sun);

        const CAMERA_DISTANCE = 4; // model normalised to radius 1 → size 2 → distance = 2 × size
        const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 50);
        camera.position.set(0, 0, CAMERA_DISTANCE);
        camera.focus = CAMERA_DISTANCE; // eyes converge on the model centre
        const stereo = new THREE.StereoCamera();

        const controls = new OrbitControls(camera, renderer.domElement);
        // After the controls, which set touch-action: none: vertical swipes keep scrolling the page.
        renderer.domElement.style.touchAction = "pan-y";
        controls.enableZoom = false;
        controls.enablePan = false;
        controls.enableDamping = true;
        controls.autoRotateSpeed = 2.5;

        const material = new THREE.MeshStandardMaterial({ color: 0xa9bfdc, roughness: 0.45, metalness: 0.08 });
        const mesh = new THREE.Mesh(new THREE.BufferGeometry(), material);
        scene.add(mesh);

        const fusion = new THREE.Mesh(
          new THREE.SphereGeometry(0.045, 24, 16),
          new THREE.MeshBasicMaterial({ color: 0xffffff }),
        );
        scene.add(fusion);

        function buildGeometry(kind: Shape) {
          let g: InstanceType<typeof THREE.BufferGeometry>;
          if (kind === "teapot") g = new TeapotGeometry(1, 8);
          else if (kind === "knot") g = new THREE.TorusKnotGeometry(1, 0.32, 140, 18);
          else g = new THREE.IcosahedronGeometry(1, 2);
          g.center();
          g.computeBoundingSphere();
          const r = g.boundingSphere?.radius ?? 1;
          g.scale(1 / r, 1 / r, 1 / r);
          mesh.geometry.dispose();
          mesh.geometry = g as typeof mesh.geometry;
        }
        buildGeometry(shapeNow.current);
        shapeRef.current = buildGeometry;

        // Red–cyan composite of the two eye images.
        const targetL = new THREE.WebGLRenderTarget(1, 1);
        const targetR = new THREE.WebGLRenderTarget(1, 1);
        const quadScene = new THREE.Scene();
        const quadCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        const composite = new THREE.ShaderMaterial({
          uniforms: { mapLeft: { value: targetL.texture }, mapRight: { value: targetR.texture } },
          vertexShader: "varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }",
          fragmentShader: `
            uniform sampler2D mapLeft; uniform sampler2D mapRight; varying vec2 vUv;
            void main() {
              vec3 l = texture2D(mapLeft, vUv).rgb; vec3 r = texture2D(mapRight, vUv).rgb;
              float ll = dot(l, vec3(0.299, 0.587, 0.114)); float rl = dot(r, vec3(0.299, 0.587, 0.114));
              gl_FragColor = vec4(ll, rl, rl, 1.0);
            }`,
        });
        quadScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), composite));

        let width = 1;
        let height = 1;
        const resize = () => {
          width = mount.clientWidth;
          height = Math.round(Math.min(420, Math.max(260, width * 0.55)));
          renderer.setSize(width, height, false);
          renderer.domElement.style.height = `${height}px`;
          const pr = renderer.getPixelRatio();
          targetL.setSize(width * pr, height * pr);
          targetR.setSize(width * pr, height * pr);
        };
        resize();
        // Render on demand: a frame is drawn only while something moves (auto-rotation, a
        // drag and its damping) or after a change, and never while the demo is off screen.
        let visible = true;
        const schedule = () => {
          if (!frame && visible && !disposed) frame = requestAnimationFrame(loop);
        };
        requestRender.current = schedule;

        const ro = new ResizeObserver(() => {
          resize();
          schedule();
        });
        ro.observe(mount);

        const io = new IntersectionObserver(([entry]) => {
          visible = entry?.isIntersecting ?? true;
          if (visible) schedule();
        });
        io.observe(mount);
        controls.addEventListener("change", schedule);

        let lastSmooth: boolean | null = null;
        const loop = () => {
          frame = 0;
          if (!visible) return;
          controls.autoRotate = settings.current.spin;
          // update() applies auto-rotation and damping; true while the camera still moves.
          const moving = controls.update();
          render();
          if (settings.current.spin || moving) schedule();
        };
        const render = () => {
          const s = settings.current;
          if (s.smooth !== lastSmooth) {
            material.flatShading = !s.smooth;
            material.needsUpdate = true;
            lastSmooth = s.smooth;
          }
          fusion.visible = s.marker;
          // Fusion marker on the front of the canonical sphere, facing the viewer.
          fusion.position.copy(camera.position).normalize().multiplyScalar(1.08);

          stereo.eyeSep = CAMERA_DISTANCE * s.eyeFraction;
          renderer.setScissorTest(false);
          if (s.mode === "mono") {
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            renderer.setViewport(0, 0, width, height);
            renderer.render(scene, camera);
            return;
          }
          if (s.mode === "sbs") {
            camera.aspect = width / 2 / height;
            camera.updateProjectionMatrix();
            stereo.update(camera);
            renderer.setScissorTest(true);
            renderer.setScissor(0, 0, width / 2, height);
            renderer.setViewport(0, 0, width / 2, height);
            renderer.render(scene, stereo.cameraL);
            renderer.setScissor(width / 2, 0, width / 2, height);
            renderer.setViewport(width / 2, 0, width / 2, height);
            renderer.render(scene, stereo.cameraR);
            renderer.setScissorTest(false);
            return;
          }
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
          stereo.update(camera);
          renderer.setViewport(0, 0, width, height);
          if (s.mode === "left" || s.mode === "right") {
            renderer.render(scene, s.mode === "left" ? stereo.cameraL : stereo.cameraR);
            return;
          }
          renderer.setRenderTarget(targetL);
          renderer.render(scene, stereo.cameraL);
          renderer.setRenderTarget(targetR);
          renderer.render(scene, stereo.cameraR);
          renderer.setRenderTarget(null);
          renderer.render(quadScene, quadCamera);
        };
        schedule();
        setReady(true);

        cleanup = () => {
          cancelAnimationFrame(frame);
          requestRender.current = () => {};
          ro.disconnect();
          io.disconnect();
          controls.removeEventListener("change", schedule);
          controls.dispose();
          mesh.geometry.dispose();
          material.dispose();
          composite.dispose();
          targetL.dispose();
          targetR.dispose();
          renderer.dispose();
          renderer.domElement.remove();
        };
      } catch {
        if (!disposed) setFailed("webgl");
      }
    })();

    return () => {
      disposed = true;
      cleanup();
    };
  }, [near]);

  useEffect(() => {
    shapeRef.current(shape);
  }, [shape]);

  if (failed === "load") return <div className="py-6 text-sm text-zinc-500">The 3D demo could not be loaded. Reloading the page usually fixes this.</div>;
  if (failed === "webgl") return <div className="py-6 text-sm text-zinc-500">This demo needs WebGL, which is not available in this browser.</div>;

  return (
    <div className="space-y-4">
      {/* Sized like the canvas (min(420, max(260, 55% of the width))) before it exists, so the
          page does not shift when WebGL starts. */}
      <div
        ref={mountRef}
        className={`relative overflow-hidden rounded bg-[#1c1c1f] ${ready ? "" : "aspect-[100/55] max-h-[420px] min-h-[260px] w-full"}`}
        aria-label="Interactive 3D model renderer; drag to rotate"
        role="img"
      >
        {!ready && <div className="absolute inset-0 flex items-center justify-center text-xs text-zinc-500">Loading the 3D demo…</div>}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setMode(m.id)}
            aria-pressed={mode === m.id}
            className={`rounded px-2.5 py-1 text-xs font-medium ${mode === m.id ? "bg-accent-600 text-white" : "border border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"}`}
          >
            {m.label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-3">
        <div>
          <span className="label">Shape</span>
          <div className="flex flex-wrap gap-1.5">
            {SHAPES.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setShape(s.id)}
                aria-pressed={shape === s.id}
                className={`rounded px-2 py-0.5 text-xs ${shape === s.id ? "bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-900" : "border border-zinc-300 dark:border-zinc-700"}`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
        <label className="block">
          <span className="label">Eye separation: 1/{Math.round(1 / eyeFraction)} of viewing distance</span>
          <input
            type="range"
            min={0}
            max={4}
            step={1}
            value={[60, 45, 30, 20, 12].indexOf(Math.round(1 / eyeFraction))}
            onChange={(e) => setEyeFraction(1 / [60, 45, 30, 20, 12][Number(e.target.value)]!)}
            className="w-full accent-[#2f5d9e]"
          />
        </label>
        <div className="space-y-1.5">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={smooth} onChange={(e) => setSmooth(e.target.checked)} /> Smooth shading (vertex normals)
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={marker} onChange={(e) => setMarker(e.target.checked)} /> Fusion marker
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={spin} onChange={(e) => setSpin(e.target.checked)} /> Rotate
          </label>
        </div>
      </div>
    </div>
  );
}
