// The 3D brain on /learn/brain-map: reading public/brain3d/brain-v1.bin (made by
// scripts/make-brain-3d.py) and the geometry the viewer needs. Coordinates are MNI millimetres:
// x to the right, y to the front, z up.

export type Vec3 = [number, number, number];

export interface Brain3DMeshInfo {
  name: string;
  kind: "cortex" | "cerebellum" | "brainstem" | "deep";
  side?: "left" | "right";
  /** Brain-map area of a whole mesh (cerebellum, deep structures). */
  region?: string;
  vertices: number;
  triangles: number;
  positions: number;
  indices: number;
  /** Byte offsets of per-vertex area, lobe and body-map indices (cortex only). */
  area?: number;
  lobe?: number;
  body?: number;
}

export interface Brain3DHeader {
  version: number;
  scale: number;
  areas: string[];
  lobes: string[];
  body: string[];
  meshes: Brain3DMeshInfo[];
  source: string;
  notice: string;
}

export interface Brain3DMesh {
  info: Brain3DMeshInfo;
  positions: Float32Array;
  indices: Uint16Array;
  /** 1-based index into header.areas, 0 for none. */
  area?: Uint8Array;
  lobe?: Uint8Array;
  body?: Uint8Array;
}

export interface Brain3D {
  header: Brain3DHeader;
  meshes: Brain3DMesh[];
}

export function parseBrain3D(buf: ArrayBuffer): Brain3D {
  const magic = new TextDecoder().decode(new Uint8Array(buf, 0, 4));
  if (magic !== "BR3D") throw new Error("Not a brain3d file");
  const headLength = new DataView(buf).getUint32(4, true);
  const header = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, 8, headLength))) as Brain3DHeader;
  const base = 8 + headLength;
  const meshes = header.meshes.map((info) => {
    const q = new Int16Array(buf, base + info.positions, info.vertices * 3);
    const positions = new Float32Array(q.length);
    for (let i = 0; i < q.length; i++) positions[i] = q[i]! * header.scale;
    const bytes = (at?: number) => (at === undefined ? undefined : new Uint8Array(buf, base + at, info.vertices));
    return {
      info,
      positions,
      indices: new Uint16Array(buf, base + info.indices, info.triangles * 3),
      area: bytes(info.area),
      lobe: bytes(info.lobe),
      body: bytes(info.body),
    };
  });
  return { header, meshes };
}

/** Index of the vertex nearest to `p`, among those `keep` accepts. */
export function nearestVertex(positions: Float32Array, p: Vec3, keep?: (i: number) => boolean): number {
  let best = -1;
  let bestD = Infinity;
  for (let i = 0; i < positions.length / 3; i++) {
    if (keep && !keep(i)) continue;
    const dx = positions[3 * i]! - p[0];
    const dy = positions[3 * i + 1]! - p[1];
    const dz = positions[3 * i + 2]! - p[2];
    const d = dx * dx + dy * dy + dz * dz;
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  }
  return best;
}

/**
 * The vertex that best stands for an area (1-based index): the one in the area closest to
 * the area's centre, or -1 when the mesh has none of it.
 */
export function areaAnchor(mesh: Brain3DMesh, area: number): number {
  if (!mesh.area) return -1;
  const c: Vec3 = [0, 0, 0];
  let n = 0;
  for (let i = 0; i < mesh.info.vertices; i++) {
    if (mesh.area[i] !== area) continue;
    c[0] += mesh.positions[3 * i]!;
    c[1] += mesh.positions[3 * i + 1]!;
    c[2] += mesh.positions[3 * i + 2]!;
    n++;
  }
  if (!n) return -1;
  return nearestVertex(mesh.positions, [c[0] / n, c[1] / n, c[2] / n], (i) => mesh.area![i] === area);
}
