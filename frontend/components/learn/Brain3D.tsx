"use client";

import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/components/motion";
import { BCI_SITES, type BciSiteHow } from "@/content/bciToday";
import { BRAIN_AREAS, BRAIN_ROUTES, type AreaId, type RouteId } from "@/content/learn";
import { areaAnchor, nearestVertex, parseBrain3D, type Brain3D as BrainData, type Brain3DMesh, type Vec3 } from "@/lib/brain3d";

// A real brain on /learn/brain-map: the cortex, cerebellum, brainstem and deep structures of
// the MNI ICBM 2009c template, labelled with the CerebrA atlas (public/brain3d, made by
// scripts/make-brain-3d.py). The same areas, BCI programs and routes as the flat map, drawn
// with three.js. MNI coordinates (x right, y front, z up) map to three.js as (x, z, -y).

export const BRAIN3D_URL = "/brain3d/brain-v1.bin";

export interface Brain3DProps {
  selected: AreaId;
  onSelect: (id: AreaId) => void;
  showBci: boolean;
  deepView: boolean;
  showLobes: boolean;
  showBody: boolean;
  routes: Record<RouteId, boolean>;
  onFail: (why: "load" | "webgl") => void;
}

const load = () =>
  Promise.all([
    import("three"),
    import("three/examples/jsm/controls/OrbitControls.js"),
    fetch(BRAIN3D_URL).then((r) => {
      if (!r.ok) throw new Error(`brain3d: ${r.status}`);
      return r.arrayBuffer();
    }),
  ]);

const PALETTE = {
  light: {
    cortex: "#e9e1db",
    hind: "#ddd3cc",
    area: "#5a8dcd",
    selected: "#2f5d9e",
    deep: "#a78bfa",
    deepSelected: "#6d28d9",
    lobes: ["#93c5fd", "#c4b5fd", "#fcd34d", "#6ee7b7", "#fda4af"],
    body: ["#f87171", "#fb923c", "#facc15", "#4ade80", "#38bdf8"],
  },
  dark: {
    cortex: "#b9b1ab",
    hind: "#a39a94",
    area: "#5a8dcd",
    selected: "#86aedf",
    deep: "#8b5cf6",
    deepSelected: "#c4b5fd",
    lobes: ["#60a5fa", "#a78bfa", "#fbbf24", "#34d399", "#fb7185"],
    body: ["#ef4444", "#f97316", "#eab308", "#22c55e", "#0ea5e9"],
  },
};
const HOW_COLOR: Record<BciSiteHow, { light: string; dark: string }> = {
  cortex: { light: "#2f5d9e", dark: "#86aedf" },
  surface: { light: "#10b981", dark: "#34d399" },
  vessel: { light: "#f43f5e", dark: "#fb7185" },
  deep: { light: "#f59e0b", dark: "#fbbf24" },
};
const ROUTE_COLOR: Record<RouteId, string> = { action: "#3b6fb6", what: "#f59e0b", language: "#f43f5e" };

const AREA_INDEX = new Map(BRAIN_AREAS.map((a) => [a.id, a]));
const toWorld = ([x, y, z]: Vec3): Vec3 => [x, z, -y];
/** Camera directions (three.js axes): the brain's left side, slightly from the front and above. */
const HOME: Vec3 = [-1, 0.32, -0.28];
const SPLIT = 22;

type Three = typeof import("three");

interface ViewState {
  selected: AreaId;
  showBci: boolean;
  deepView: boolean;
  showLobes: boolean;
  showBody: boolean;
  routes: Record<RouteId, boolean>;
  split: boolean;
}

export default function Brain3D(props: Brain3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [split, setSplit] = useState(false);
  const state = useRef<ViewState>({ ...props, split });
  state.current = { ...props, split };
  const propsRef = useRef(props);
  propsRef.current = props;
  const api = useRef<{ update: () => void; focus: (id: AreaId) => void; home: () => void; zoom: (f: number) => void } | null>(null);
  // A pick in the 3D view selects an area that is already on screen, so it should not turn the brain.
  const pickedHere = useRef(false);

  useEffect(() => {
    const mount = mountRef.current;
    const overlay = overlayRef.current;
    if (!mount || !overlay) return;
    let disposed = false;
    let cleanup = () => {};

    (async () => {
      let THREE: Three;
      let OrbitControls: typeof import("three/examples/jsm/controls/OrbitControls.js").OrbitControls;
      let data: BrainData;
      try {
        const [three, controlsModule, buf] = await load();
        THREE = three;
        OrbitControls = controlsModule.OrbitControls;
        data = parseBrain3D(buf);
      } catch {
        if (!disposed) propsRef.current.onFail("load");
        return;
      }
      if (disposed) return;
      let renderer: InstanceType<Three["WebGLRenderer"]>;
      try {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      } catch {
        propsRef.current.onFail("webgl");
        return;
      }
      cleanup = build(THREE, OrbitControls, data, renderer, mount, overlay);
      setReady(true);
    })();

    function build(
      THREE: Three,
      OrbitControls: typeof import("three/examples/jsm/controls/OrbitControls.js").OrbitControls,
      data: BrainData,
      renderer: InstanceType<Three["WebGLRenderer"]>,
      mount: HTMLDivElement,
      overlay: HTMLDivElement,
    ) {
      const reduced = prefersReducedMotion();
      const darkQuery = window.matchMedia("(prefers-color-scheme: dark)");
      let dark = darkQuery.matches;
      const pal = () => (dark ? PALETTE.dark : PALETTE.light);
      const color = (hex: string) => new THREE.Color(hex);

      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.domElement.style.display = "block";
      renderer.domElement.style.width = "100%";
      mount.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(30, 1, 1, 2000);
      scene.add(camera);
      const hemi = new THREE.HemisphereLight(0xffffff, 0x6b5b53, 1.1);
      scene.add(hemi);
      // Key light rides with the camera, so the side you look at is always lit.
      const key = new THREE.DirectionalLight(0xffffff, 1.6);
      key.position.set(-0.4, 0.8, 1);
      camera.add(key);
      const rim = new THREE.DirectionalLight(0xffffff, 0.6);
      rim.position.set(0.6, 0.2, -1);
      camera.add(rim);

      const controls = new OrbitControls(camera, renderer.domElement);
      renderer.domElement.style.touchAction = "pan-y";
      controls.enablePan = false;
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      controls.rotateSpeed = 0.7;
      // The wheel scrolls the page; with Ctrl or ⌘ held (and pinch on a trackpad) it zooms.
      controls.enableZoom = false;

      // Everything is centred on the cortex, so the brain turns about its own middle.
      const root = new THREE.Group();
      scene.add(root);
      const sides = { left: new THREE.Group(), right: new THREE.Group(), centre: new THREE.Group() };
      root.add(sides.left, sides.right, sides.centre);
      const groupOf = (side?: string) => (side === "left" ? sides.left : side === "right" ? sides.right : sides.centre);

      const disposables: { dispose: () => void }[] = [];
      const geometryOf = (m: Brain3DMesh) => {
        const g = new THREE.BufferGeometry();
        const pos = new Float32Array(m.positions.length);
        for (let i = 0; i < pos.length; i += 3) {
          pos[i] = m.positions[i]!;
          pos[i + 1] = m.positions[i + 2]!;
          pos[i + 2] = -m.positions[i + 1]!;
        }
        g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
        g.setIndex(new THREE.BufferAttribute(m.indices, 1));
        g.computeVertexNormals();
        disposables.push(g);
        return g;
      };
      const material = (opts: ConstructorParameters<Three["MeshStandardMaterial"]>[0]) => {
        const mat = new THREE.MeshStandardMaterial({ roughness: 0.62, metalness: 0, ...opts });
        disposables.push(mat);
        return mat;
      };

      const areaIdx = (id: AreaId) => data.header.areas.indexOf(id) + 1;
      const cortex = data.meshes.filter((m) => m.info.kind === "cortex");
      const cortexObjects = cortex.map((m) => {
        const g = geometryOf(m);
        g.setAttribute("color", new THREE.BufferAttribute(new Float32Array(m.info.vertices * 3), 3));
        const mesh = new THREE.Mesh(g, material({ vertexColors: true }));
        mesh.userData = { kind: "cortex", data: m };
        groupOf(m.info.side).add(mesh);
        return mesh;
      });
      const regionObjects = data.meshes
        .filter((m) => m.info.kind !== "cortex")
        .map((m) => {
          const mesh = new THREE.Mesh(geometryOf(m), material({}));
          mesh.userData = { kind: m.info.kind, data: m, region: m.info.region };
          groupOf(m.info.kind === "deep" ? m.info.side : undefined).add(mesh);
          return mesh;
        });
      const deepObjects = regionObjects.filter((o) => o.userData.kind === "deep");

      // Centre the scene on the cortex.
      const box = new THREE.Box3();
      cortexObjects.forEach((o) => box.expandByObject(o));
      const centre = box.getCenter(new THREE.Vector3());
      root.position.copy(centre).multiplyScalar(-1);
      const radius = box.getSize(new THREE.Vector3()).length() / 2;

      const left = cortex.find((m) => m.info.side === "left")!;
      const leftObject = cortexObjects[cortex.indexOf(left)]!;
      const worldVertex = (m: Brain3DMesh, i: number) => new THREE.Vector3(m.positions[3 * i]!, m.positions[3 * i + 2]!, -m.positions[3 * i + 1]!);
      const normalAt = (obj: { geometry: InstanceType<Three["BufferGeometry"]> }, i: number) =>
        new THREE.Vector3().fromBufferAttribute(obj.geometry.getAttribute("normal") as InstanceType<Three["BufferAttribute"]>, i);

      // Where each area's label sits, and which way it faces.
      const anchors = new Map<AreaId, { pos: InstanceType<Three["Vector3"]>; normal: InstanceType<Three["Vector3"]> | null; side: string }>();
      // The facing direction of a whole area: the mean of its vertex normals (one vertex can sit
      // on the wall of a fold and face sideways).
      const leftNormals = leftObject.geometry.getAttribute("normal") as InstanceType<Three["BufferAttribute"]>;
      for (const a of BRAIN_AREAS) {
        const idx = areaIdx(a.id);
        const v = areaAnchor(left, idx);
        if (v >= 0) {
          const normal = new THREE.Vector3();
          for (let i = 0; i < left.info.vertices; i++) if (left.area![i] === idx) normal.add(new THREE.Vector3().fromBufferAttribute(leftNormals, i));
          anchors.set(a.id, { pos: worldVertex(left, v), normal: normal.normalize(), side: "left" });
          continue;
        }
        const region = regionObjects.find((o) => o.userData.region === a.id && o.userData.data.info.side !== "right");
        if (region) {
          region.geometry.computeBoundingBox();
          anchors.set(a.id, { pos: region.geometry.boundingBox!.getCenter(new THREE.Vector3()), normal: null, side: region.userData.data.info.side ?? "centre" });
        }
      }

      // BCI pins: on the cortex for implants at the surface, inside the brain with a lead from
      // the top of the head for deep ones.
      const pinGeometry = new THREE.SphereGeometry(2.3, 20, 14);
      disposables.push(pinGeometry);
      const pins = BCI_SITES.map((site) => {
        const side = site.mni[0] < 0 ? "left" : "right";
        const surfaceMesh = cortex.find((m) => m.info.side === side)!;
        const surfaceObject = cortexObjects[cortex.indexOf(surfaceMesh)]!;
        const mat = new THREE.MeshStandardMaterial({ roughness: 0.35, metalness: 0.1 });
        disposables.push(mat);
        const head = new THREE.Mesh(pinGeometry, mat);
        head.userData = { kind: "pin", site };
        const group = new THREE.Group();
        let from: InstanceType<Three["Vector3"]>;
        let to: InstanceType<Three["Vector3"]>;
        if (site.how === "deep") {
          to = new THREE.Vector3(...toWorld(site.mni));
          const entry = nearestVertex(surfaceMesh.positions, [site.mni[0], site.mni[1], 90]);
          from = worldVertex(surfaceMesh, entry).add(normalAt(surfaceObject, entry).multiplyScalar(8));
          head.position.copy(to);
        } else {
          const v = nearestVertex(surfaceMesh.positions, site.mni);
          from = worldVertex(surfaceMesh, v);
          to = from.clone().add(normalAt(surfaceObject, v).multiplyScalar(site.how === "vessel" ? 4 : 5.5));
          head.position.copy(to);
        }
        const length = from.distanceTo(to);
        const stalkGeometry = new THREE.CylinderGeometry(0.45, 0.45, length, 8);
        disposables.push(stalkGeometry);
        const stalk = new THREE.Mesh(stalkGeometry, mat);
        stalk.position.copy(from).add(to).multiplyScalar(0.5);
        stalk.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), to.clone().sub(from).normalize());
        group.add(stalk, head);
        groupOf(side).add(group);
        return { site, group, head, mat };
      });

      // Routes skim the outer surface of the brain from area to area, a few millimetres above it
      // (an area can lie deep in a fold, under other cortex): the direction from the brain's
      // centre turns smoothly from stop to stop, and the height follows the brain's outline in
      // that direction. Later legs ride a little higher, so a route that doubles back stays readable.
      const outward = Array.from({ length: left.info.vertices }, (_, i) => worldVertex(left, i).sub(centre));
      const outwardLength = outward.map((v) => v.length());
      outward.forEach((v, i) => v.divideScalar(outwardLength[i]! || 1));
      const reach = (dir: InstanceType<Three["Vector3"]>) => {
        let r = 0;
        outward.forEach((v, i) => {
          if (v.dot(dir) > 0.992) r = Math.max(r, outwardLength[i]!);
        });
        return r;
      };
      const routes = BRAIN_ROUTES.map((route) => {
        const dirs = route.steps.flatMap((id) => {
          const a = anchors.get(id);
          return a?.normal ? [a.pos.clone().sub(centre).normalize()] : [];
        });
        const samples: { dir: InstanceType<Three["Vector3"]>; r: number; gap: number }[] = [];
        for (let leg = 1; leg < dirs.length; leg++) {
          for (let k = leg === 1 ? 0 : 1; k <= 16; k++) {
            const dir = dirs[leg - 1]!.clone().lerp(dirs[leg]!, k / 16).normalize();
            samples.push({ dir, r: reach(dir), gap: 4 + 2.5 * (leg - 1) });
          }
        }
        // Smooth the outline so the route does not trace every gyrus.
        const height = samples.map((_, i) => {
          const near = samples.slice(Math.max(0, i - 3), i + 4).map((x) => x.r);
          return Math.max(...near);
        });
        const points = samples.map((x, i) => {
          const near = height.slice(Math.max(0, i - 2), i + 3);
          return centre.clone().add(x.dir.clone().multiplyScalar(near.reduce((a, b) => a + b, 0) / near.length + x.gap));
        });
        const curve = new THREE.CatmullRomCurve3(points, false, "centripetal");
        const tube = new THREE.TubeGeometry(curve, Math.max(32, points.length * 3), 0.85, 8, false);
        const mat = new THREE.MeshBasicMaterial({ color: ROUTE_COLOR[route.id], transparent: true, opacity: 0.85 });
        const pulseMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const pulseGeometry = new THREE.SphereGeometry(1.5, 12, 8);
        disposables.push(tube, mat, pulseMat, pulseGeometry);
        const group = new THREE.Group();
        group.add(new THREE.Mesh(tube, mat));
        const pulses = [0, 1 / 3, 2 / 3].map((phase) => {
          const p = new THREE.Mesh(pulseGeometry, pulseMat);
          group.add(p);
          return { p, phase };
        });
        sides.left.add(group);
        return { id: route.id, group, curve, pulses, length: curve.getLength() };
      });

      // Labels are plain elements over the canvas, moved every frame.
      const makeLabel = (cls: string) => {
        const el = document.createElement("div");
        el.className = cls;
        el.style.position = "absolute";
        el.style.left = "0";
        el.style.top = "0";
        el.style.pointerEvents = "none";
        overlay.appendChild(el);
        return el;
      };
      const selectedLabel = makeLabel(
        "rounded-full bg-accent-600 px-2.5 py-0.5 text-xs font-semibold text-white shadow-md transition-opacity duration-200 dark:bg-accent-300 dark:text-zinc-900",
      );
      const hoverLabel = makeLabel("max-w-[16rem] rounded-md bg-zinc-900/90 px-2 py-1 text-[11px] leading-snug text-white shadow dark:bg-white/90 dark:text-zinc-900");
      hoverLabel.style.opacity = "0";
      const bodyParts = data.header.body;
      const bodyLabels = bodyParts.map((part, k) => {
        const el = makeLabel("text-[11px] font-semibold italic text-zinc-900 [text-shadow:0_0_3px_white] dark:text-white dark:[text-shadow:0_0_3px_black]");
        el.textContent = part;
        let sum = new THREE.Vector3();
        let n = 0;
        for (let i = 0; i < left.info.vertices; i++) {
          if (left.body![i] !== k + 1 || left.positions[3 * i]! > -20) continue;
          sum = sum.add(worldVertex(left, i));
          n++;
        }
        const target = n ? sum.divideScalar(n) : new THREE.Vector3();
        const v = nearestVertex(left.positions, [target.x, -target.z, target.y], (i) => left.body![i] === k + 1);
        const normal = new THREE.Vector3();
        for (let i = 0; i < left.info.vertices; i++) if (left.body![i] === k + 1 && left.positions[3 * i]! < -20) normal.add(new THREE.Vector3().fromBufferAttribute(leftNormals, i));
        return { el, pos: worldVertex(left, Math.max(0, v)), normal: normal.normalize() };
      });

      // ---- Appearance -------------------------------------------------------------------
      const mix = (a: InstanceType<Three["Color"]>, b: InstanceType<Three["Color"]>, t: number) => a.clone().lerp(b, t);
      const apply = () => {
        const st = state.current;
        const p = pal();
        const base = color(p.cortex);
        const areaC = color(p.area);
        const selC = color(p.selected);
        const lobes = p.lobes.map(color);
        const body = p.body.map(color);
        const sel = areaIdx(st.selected);
        cortexObjects.forEach((obj) => {
          const m = obj.userData.data as Brain3DMesh;
          const attr = obj.geometry.getAttribute("color") as InstanceType<Three["BufferAttribute"]>;
          const arr = attr.array as Float32Array;
          for (let i = 0; i < m.info.vertices; i++) {
            let c = base;
            const lobe = m.lobe![i]!;
            if (st.showLobes && lobe) c = mix(c, lobes[lobe - 1]!, 0.45);
            const a = m.area![i]!;
            const b = m.body![i]!;
            if (st.showBody && b) c = mix(mix(c, body[b - 1]!, 0.72), selC, a === sel ? 0.3 : 0);
            else if (a === sel) c = mix(c, selC, 0.88);
            else if (a) c = mix(c, areaC, 0.3);
            arr[3 * i] = c.r;
            arr[3 * i + 1] = c.g;
            arr[3 * i + 2] = c.b;
          }
          attr.needsUpdate = true;
          const mat = obj.material as InstanceType<Three["MeshStandardMaterial"]>;
          mat.transparent = st.deepView;
          mat.opacity = st.deepView ? 0.13 : 1;
          mat.depthWrite = !st.deepView;
          mat.needsUpdate = true;
        });
        regionObjects.forEach((obj) => {
          const mat = obj.material as InstanceType<Three["MeshStandardMaterial"]>;
          const on = obj.userData.region === st.selected;
          if (obj.userData.kind === "deep") {
            obj.visible = st.deepView;
            mat.color.set(on ? p.deepSelected : p.deep);
            mat.emissive.set(on ? p.deepSelected : "#000000");
            mat.emissiveIntensity = on ? 0.25 : 0;
          } else {
            mat.color.copy(on ? mix(color(p.hind), selC, 0.85) : color(obj.userData.kind === "brainstem" ? p.hind : p.cortex));
            mat.transparent = st.deepView;
            mat.opacity = st.deepView ? 0.3 : 1;
            mat.depthWrite = !st.deepView;
          }
          mat.needsUpdate = true;
        });
        pins.forEach(({ site, group, head, mat }) => {
          group.visible = st.showBci && (site.how !== "deep" || st.deepView);
          mat.color.set(HOW_COLOR[site.how][dark ? "dark" : "light"]);
          const on = site.area === st.selected;
          head.scale.setScalar(on ? 1.35 : 1);
          mat.emissive.set(on ? "#ffffff" : "#000000");
          mat.emissiveIntensity = on ? 0.18 : 0;
        });
        routes.forEach((r) => (r.group.visible = st.routes[r.id]));
        sides.left.position.x = st.split ? -SPLIT : 0;
        sides.right.position.x = st.split ? SPLIT : 0;
        const a = AREA_INDEX.get(st.selected);
        selectedLabel.textContent = a ? (a.mapLabel ?? a.short) : "";
        bodyLabels.forEach((b) => (b.el.style.display = st.showBody ? "block" : "none"));
      };

      // ---- Camera ------------------------------------------------------------------------
      let width = 1;
      let height = 1;
      const distance = radius * 2.7;
      const resize = () => {
        width = mount.clientWidth;
        height = Math.round(Math.min(560, Math.max(300, width * 0.72)));
        renderer.setSize(width, height, false);
        renderer.domElement.style.height = `${height}px`;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      };
      resize();
      controls.minDistance = radius * 1.6;
      controls.maxDistance = radius * 6;
      const dirTo = (d: Vec3) => new THREE.Vector3(...d).normalize();
      camera.position.copy(dirTo(reduced ? HOME : [-0.55, 0.45, -0.9]).multiplyScalar(distance));
      camera.lookAt(0, 0, 0);

      let flight: { from: InstanceType<Three["Vector3"]>; to: InstanceType<Three["Vector3"]>; d0: number; d1: number; start: number; ms: number } | null = null;
      const fly = (dir: InstanceType<Three["Vector3"]>, d = camera.position.length()) => {
        const to = dir.clone().normalize();
        if (reduced) {
          camera.position.copy(to.multiplyScalar(d));
          schedule();
          return;
        }
        flight = { from: camera.position.clone().normalize(), to, d0: camera.position.length(), d1: d, start: performance.now(), ms: 900 };
        schedule();
      };
      const focus = (id: AreaId) => {
        const anchor = anchors.get(id);
        if (!anchor) return;
        let dir: InstanceType<Three["Vector3"]>;
        if (anchor.normal) {
          // Out from the brain's centre through the area, kept on the left side (the areas are
          // marked on the left hemisphere) and a little from above.
          dir = anchor.pos.clone().sub(centre).normalize().multiplyScalar(1.5).add(anchor.normal);
          dir.x = Math.min(dir.x, -0.25);
          dir.y += 0.3;
        } else if (id === "cerebellum") dir = new THREE.Vector3(-0.7, -0.15, 0.75);
        else dir = new THREE.Vector3(-1, 0.45, -0.2);
        fly(dir);
      };
      const home = () => fly(dirTo(HOME), distance);
      const zoom = (f: number) => {
        const d = THREE.MathUtils.clamp(camera.position.length() * f, controls.minDistance, controls.maxDistance);
        fly(camera.position.clone(), d);
      };

      // ---- Picking -----------------------------------------------------------------------
      const raycaster = new THREE.Raycaster();
      const pointer = new THREE.Vector2();
      type Pick = { area?: AreaId; label: string } | null;
      const pick = (clientX: number, clientY: number): Pick => {
        const rect = renderer.domElement.getBoundingClientRect();
        pointer.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
        raycaster.setFromCamera(pointer, camera);
        const st = state.current;
        const pinHeads = pins.filter((p) => p.group.visible).map((p) => p.head);
        const layers = [pinHeads, st.deepView ? deepObjects : [], [...cortexObjects, ...regionObjects.filter((o) => o.userData.kind !== "deep")]];
        for (const layer of layers) {
          const hit = raycaster.intersectObjects(layer, false)[0];
          if (!hit) continue;
          const ud = hit.object.userData;
          if (ud.kind === "pin") return { area: ud.site.area, label: `${ud.site.who}: ${ud.site.what}` };
          if (ud.kind === "cortex") {
            const m = ud.data as Brain3DMesh;
            const f = hit.face!;
            const idx = m.area![f.a] || m.area![f.b] || m.area![f.c];
            if (!idx) return null;
            const id = data.header.areas[idx - 1] as AreaId;
            return { area: id, label: AREA_INDEX.get(id)?.name ?? id };
          }
          if (ud.region) return { area: ud.region as AreaId, label: AREA_INDEX.get(ud.region)?.name ?? ud.region };
          return null;
        }
        return null;
      };
      let down: { x: number; y: number } | null = null;
      const onDown = (e: PointerEvent) => {
        down = { x: e.clientX, y: e.clientY };
        flight = null;
      };
      const onUp = (e: PointerEvent) => {
        if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) < 5) {
          const hit = pick(e.clientX, e.clientY);
          if (hit?.area) {
            pickedHere.current = true;
            propsRef.current.onSelect(hit.area);
          }
        }
        down = null;
      };
      let hoverAt: { x: number; y: number } | null = null;
      const onMove = (e: PointerEvent) => {
        if (e.pointerType !== "mouse" || e.buttons) {
          hoverLabel.style.opacity = "0";
          return;
        }
        hoverAt = { x: e.clientX, y: e.clientY };
        schedule();
      };
      const onLeave = () => {
        hoverAt = null;
        hoverLabel.style.opacity = "0";
        renderer.domElement.style.cursor = "";
      };
      renderer.domElement.addEventListener("pointerdown", onDown);
      renderer.domElement.addEventListener("pointerup", onUp);
      renderer.domElement.addEventListener("pointermove", onMove);
      renderer.domElement.addEventListener("pointerleave", onLeave);
      const onWheel = (e: WheelEvent) => {
        if (!e.ctrlKey && !e.metaKey) return;
        e.preventDefault();
        const d = THREE.MathUtils.clamp(camera.position.length() * (e.deltaY > 0 ? 1.08 : 0.93), controls.minDistance, controls.maxDistance);
        flight = null;
        camera.position.setLength(d);
        schedule();
      };
      renderer.domElement.addEventListener("wheel", onWheel, { passive: false });

      // ---- Frames ------------------------------------------------------------------------
      let frame = 0;
      let visible = true;
      let disposedHere = false;
      const schedule = () => {
        if (!frame && visible && !disposedHere) frame = requestAnimationFrame(loop);
      };
      const project = (pos: InstanceType<Three["Vector3"]>, normal: InstanceType<Three["Vector3"]> | null, el: HTMLElement, sideGroup: InstanceType<Three["Group"]>) => {
        const world = pos.clone().add(root.position).add(sideGroup.position);
        const facing = normal ? normal.dot(camera.position.clone().sub(world).normalize()) : 1;
        const s = world.clone().project(camera);
        el.style.transform = `translate(-50%, -130%) translate(${((s.x + 1) / 2) * width}px, ${((1 - s.y) / 2) * height}px)`;
        el.style.opacity = facing > 0.05 ? "1" : "0";
      };
      const loop = (now: number) => {
        frame = 0;
        if (!visible) return;
        let moving = false;
        if (flight) {
          const t = Math.min(1, (now - flight.start) / flight.ms);
          const e = t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
          const q = new THREE.Quaternion().setFromUnitVectors(flight.from, flight.to);
          const dir = flight.from.clone().applyQuaternion(new THREE.Quaternion().slerp(q, e));
          camera.position.copy(dir.multiplyScalar(flight.d0 + (flight.d1 - flight.d0) * e));
          moving = true;
          if (t >= 1) flight = null;
        }
        moving = controls.update() || moving;
        const st = state.current;
        const animateRoutes = !reduced && routes.some((r) => st.routes[r.id]);
        for (const r of routes) {
          if (!st.routes[r.id]) continue;
          r.pulses.forEach(({ p, phase }) => {
            const t = reduced ? phase : (now / 1000 / (r.length / 40) + phase) % 1;
            p.position.copy(r.curve.getPointAt(t));
          });
        }
        const anchor = anchors.get(st.selected);
        if (anchor) project(anchor.pos, anchor.normal, selectedLabel, groupOf(anchor.side));
        if (st.showBody) bodyLabels.forEach((b) => project(b.pos, b.normal, b.el, sides.left));
        if (hoverAt) {
          const hit = pick(hoverAt.x, hoverAt.y);
          const rect = renderer.domElement.getBoundingClientRect();
          renderer.domElement.style.cursor = hit?.area ? "pointer" : "";
          hoverLabel.textContent = hit?.label ?? "";
          hoverLabel.style.opacity = hit ? "1" : "0";
          hoverLabel.style.transform = `translate(${hoverAt.x - rect.left + 14}px, ${hoverAt.y - rect.top + 14}px)`;
          hoverAt = null;
        }
        renderer.render(scene, camera);
        if (moving || flight || animateRoutes) schedule();
      };

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
      const onTheme = () => {
        dark = darkQuery.matches;
        apply();
        schedule();
      };
      darkQuery.addEventListener("change", onTheme);

      apply();
      if (!reduced) fly(dirTo(HOME), distance);
      schedule();

      api.current = {
        update: () => {
          apply();
          schedule();
        },
        focus,
        home,
        zoom,
      };

      return () => {
        disposedHere = true;
        cancelAnimationFrame(frame);
        api.current = null;
        ro.disconnect();
        io.disconnect();
        darkQuery.removeEventListener("change", onTheme);
        controls.removeEventListener("change", schedule);
        renderer.domElement.removeEventListener("pointerdown", onDown);
        renderer.domElement.removeEventListener("pointerup", onUp);
        renderer.domElement.removeEventListener("pointermove", onMove);
        renderer.domElement.removeEventListener("pointerleave", onLeave);
        renderer.domElement.removeEventListener("wheel", onWheel);
        controls.dispose();
        disposables.forEach((d) => d.dispose());
        renderer.dispose();
        renderer.domElement.remove();
        overlay.replaceChildren();
      };
    }

    return () => {
      disposed = true;
      cleanup();
    };
  }, []);

  // Settings: repaint. A new area chosen outside the 3D view: turn the brain to show it.
  const { selected, showBci, deepView, showLobes, showBody, routes } = props;
  useEffect(() => {
    api.current?.update();
  }, [selected, showBci, deepView, showLobes, showBody, routes, split, ready]);
  // The area selected when the page opened is shown by the opening view, not by turning to it;
  // one picked while the model was still loading is turned to as soon as it is ready.
  const opening = useRef(props.selected);
  useEffect(() => {
    if (!ready) return;
    if (selected === opening.current) {
      opening.current = "" as AreaId;
      return;
    }
    opening.current = "" as AreaId;
    if (pickedHere.current) {
      pickedHere.current = false;
      return;
    }
    api.current?.focus(selected);
  }, [selected, ready]);

  const button =
    "flex h-8 min-w-8 items-center justify-center rounded-md border border-zinc-300 bg-white/90 px-2 text-xs font-medium text-zinc-700 shadow-sm hover:border-accent-500/60 dark:border-zinc-700 dark:bg-zinc-900/90 dark:text-zinc-200";
  return (
    <div className="relative">
      <div ref={mountRef} className="min-h-[300px]">
        {!ready && <div className="flex h-[min(560px,max(300px,72vw))] items-center justify-center text-sm text-zinc-500">Loading the 3D brain…</div>}
      </div>
      <div ref={overlayRef} aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden" />
      {ready && (
        <>
          <div className="absolute right-2 top-2 flex flex-col gap-1.5">
            <button type="button" className={button} onClick={() => api.current?.zoom(0.8)} aria-label="Zoom in">
              +
            </button>
            <button type="button" className={button} onClick={() => api.current?.zoom(1.25)} aria-label="Zoom out">
              −
            </button>
          </div>
          <div className="absolute bottom-2 left-2 flex flex-wrap gap-1.5">
            <button type="button" className={button} onClick={() => api.current?.home()}>
              Reset view
            </button>
            <button type="button" className={button} aria-pressed={split} onClick={() => setSplit((s) => !s)}>
              {split ? "Join hemispheres" : "Split hemispheres"}
            </button>
          </div>
          {/* Top left, clear of the buttons along the bottom however narrow the view. */}
          <div className="pointer-events-none absolute left-2 top-2 hidden text-[11px] text-zinc-500 sm:block">Drag to turn · Ctrl or ⌘ + scroll to zoom</div>
        </>
      )}
    </div>
  );
}
