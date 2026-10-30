#!/usr/bin/env python3
"""Builds public/brain3d/brain-v1.bin, the 3D brain on /learn/brain-map. Run by hand; never at
build or run time.

    python3 scripts/make-brain-3d.py path/to/CerebrA-folder

Input: the CerebrA atlas (Manera, Dadar, Fonov & Collins 2020, CC0), downloaded from
https://doi.org/10.12751/g-node.be5e62 (183 MB; not committed). Only CerebrA.nii (the labels)
and mni_icbm152_t1_tal_nlin_sym_09c.mnc (the MNI ICBM 2009c symmetric template it is drawn on)
are used. Needs numpy, scipy, nibabel, h5py, scikit-image and fast-simplification.

What it makes, all in MNI coordinates (millimetres):
- each cerebral hemisphere's outer (pial) surface, from the template's grey-matter/CSF boundary
  inside the labelled cerebrum, with three numbers per vertex: the brain-map area it belongs
  to (content/learn.ts), its lobe, and its part of the body map along the motor and touch
  strips;
- the cerebellum and brainstem;
- four deep structures per side: thalamus, basal ganglia, hippocampus and amygdala.

Areas come from the atlas's cortical labels (Desikan-Killiany-Tourville protocol) where one
matches; areas without a matching label (V3A, MT, CIP, PMd, FEF) are patches around published
MNI coordinates, kept within neighbouring labels. Both are schematic: real areas vary between
people, and several are defined by function, not anatomy.
"""
import json
import struct
import sys
from pathlib import Path

import fast_simplification
import nibabel as nib
import numpy as np
from scipy import ndimage, sparse
from skimage.measure import marching_cubes

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "brain3d" / "brain-v1.bin"
SCALE = 0.02  # millimetres per int16 step

# CerebrA ids: right hemisphere 1-51, left = right + 51.
CORTEX = {
    "caudal anterior cingulate": 30, "caudal middle frontal": 42, "cuneus": 43, "entorhinal": 36, "fusiform": 24,
    "inferior parietal": 10, "inferior temporal": 3, "isthmus cingulate": 33, "lateral occipital": 34,
    "lateral orbitofrontal": 7, "lingual": 12, "medial orbitofrontal": 15, "middle temporal": 28, "parahippocampal": 18,
    "paracentral": 16, "pars opercularis": 32, "pars orbitalis": 44, "pars triangularis": 22, "pericalcarine": 6,
    "postcentral": 13, "posterior cingulate": 47, "precentral": 35, "precuneus": 31, "rostral anterior cingulate": 8,
    "rostral middle frontal": 1, "superior frontal": 38, "superior parietal": 9, "superior temporal": 45,
    "supramarginal": 51, "transverse temporal": 14, "insula": 23,
}
SUBCORTICAL = {
    "brainstem": 11, "third ventricle": 29, "fourth ventricle": 37, "optic chiasm": 17, "lateral ventricle": 41,
    "inferior lateral ventricle": 5, "cerebellum grey": 46, "cerebellum white": 39, "thalamus": 40, "caudate": 49,
    "putamen": 21, "pallidum": 27, "hippocampus": 48, "amygdala": 19, "accumbens": 4, "ventral diencephalon": 26,
    "basal forebrain": 25, "vermis I-V": 50, "vermis VI-VII": 2, "vermis VIII-X": 20,
}
both = lambda rh: (rh, rh + 51)
CEREBELLUM = [i for k in ("cerebellum grey", "cerebellum white", "vermis I-V", "vermis VI-VII", "vermis VIII-X") for i in both(SUBCORTICAL[k])]
BRAINSTEM = list(both(SUBCORTICAL["brainstem"]))
DEEP = {
    "thalamus": ["thalamus"],
    "basal-ganglia": ["caudate", "putamen", "pallidum", "accumbens"],
    "hippocampus": ["hippocampus"],
    "amygdala": ["amygdala"],
}

# Order matters: the viewer reads areas by index (1-based; 0 = none). Must match AreaId.
AREAS = ["v1", "v3a", "mt", "it", "cip", "ppc", "pmd", "m1", "s1", "cerebellum", "a1", "wernicke", "smg", "broca", "speech",
         "pfc", "fef", "thalamus", "basal-ganglia", "hippocampus", "amygdala"]
LOBES = ["frontal", "parietal", "temporal", "occipital", "insula and cingulate"]
LOBE_OF = {
    "frontal": ["caudal middle frontal", "lateral orbitofrontal", "medial orbitofrontal", "pars opercularis", "pars orbitalis",
                "pars triangularis", "precentral", "rostral middle frontal", "superior frontal", "paracentral"],
    "parietal": ["inferior parietal", "postcentral", "precuneus", "superior parietal", "supramarginal"],
    "temporal": ["entorhinal", "fusiform", "inferior temporal", "middle temporal", "parahippocampal", "superior temporal",
                 "transverse temporal"],
    "occipital": ["cuneus", "lateral occipital", "lingual", "pericalcarine"],
    "insula and cingulate": ["insula", "caudal anterior cingulate", "isthmus cingulate", "posterior cingulate",
                             "rostral anterior cingulate"],
}
BODY = ["leg", "arm", "hand", "face", "mouth"]

# Areas without a matching atlas label: a patch of the given radius (mm) around a left-hemisphere
# MNI coordinate (mirrored for the right), only on the listed labels. Sources: V3A, Tootell et al.
# 1997; hMT+, Dumoulin et al. 2000; FEF, Paus 1996; PMd, Mayka et al. 2006; CIP, the caudal
# intraparietal sulcus (approximate; the human homologue of monkey CIP is debated).
PATCHES = [
    ("fef", (-28, -4, 54), 9, ["caudal middle frontal", "superior frontal"]),
    ("pmd", (-24, -12, 64), 14, ["caudal middle frontal", "superior frontal"]),
    ("v3a", (-28, -90, 20), 11, ["lateral occipital", "superior parietal", "cuneus"]),
    ("mt", (-46, -74, 2), 12, ["lateral occipital", "middle temporal", "inferior temporal"]),
    ("cip", (-26, -70, 44), 10, ["superior parietal", "inferior parietal", "lateral occipital"]),
]


def area_of(name: str, xyz: np.ndarray, left: bool) -> str | None:
    x, y, z = xyz
    if name == "pericalcarine":
        return "v1"
    if name == "inferior temporal" and y > -66:
        return "it"
    if name == "superior parietal":
        return "ppc"
    if name == "precentral":
        return "m1" if z >= 40 else "speech"
    if name == "paracentral":
        return "m1" if y > -26 else "s1"
    if name == "postcentral":
        return "s1"
    if name == "transverse temporal":
        return "a1"
    if name == "superior temporal" and y < -28 and left:
        return "wernicke"
    if name == "supramarginal":
        return "smg"
    if name in ("pars opercularis", "pars triangularis") and left:
        return "broca"
    if name in ("rostral middle frontal", "superior frontal") and y > 14:
        return "pfc"
    return None


def body_of(name: str, xyz: np.ndarray) -> str | None:
    if name == "paracentral":
        return "leg"
    if name not in ("precentral", "postcentral"):
        return None
    z = xyz[2]
    return "leg" if z >= 68 else "arm" if z >= 60 else "hand" if z >= 46 else "face" if z >= 34 else "mouth"


def taubin(verts: np.ndarray, faces: np.ndarray, rounds: int = 12, lam: float = 0.5, mu: float = -0.53) -> np.ndarray:
    """Smooths a mesh without shrinking it (Taubin 1995)."""
    n = len(verts)
    i = np.concatenate([faces[:, 0], faces[:, 1], faces[:, 2], faces[:, 1], faces[:, 2], faces[:, 0]])
    j = np.concatenate([faces[:, 1], faces[:, 2], faces[:, 0], faces[:, 0], faces[:, 1], faces[:, 2]])
    adj = sparse.coo_matrix((np.ones(len(i)), (i, j)), shape=(n, n)).tocsr()
    adj.data[:] = 1
    deg = np.asarray(adj.sum(axis=1)).ravel()
    deg[deg == 0] = 1
    avg = sparse.diags(1 / deg) @ adj
    v = verts.copy()
    for _ in range(rounds):
        v = v + lam * (avg @ v - v)
        v = v + mu * (avg @ v - v)
    return v


def surface(mask: np.ndarray, affine: np.ndarray, triangles: int, sigma: float = 0.7, smooth: int = 12):
    """Marching cubes on a lightly blurred mask, smoothed and decimated, in MNI millimetres."""
    field = ndimage.gaussian_filter(mask.astype(np.float32), sigma)
    verts, faces, _, _ = marching_cubes(field, 0.5)
    # Wind triangles counter-clockwise seen from outside, as three.js expects of front faces.
    faces = faces[:, [0, 2, 1]]
    verts = taubin(verts, faces, smooth)
    if len(faces) > triangles:
        verts, faces = fast_simplification.simplify(verts.astype(np.float32), faces.astype(np.int32), 1 - triangles / len(faces))
    verts = nib.affines.apply_affine(affine, verts)
    return verts.astype(np.float32), faces.astype(np.int64)


def largest(mask: np.ndarray) -> np.ndarray:
    lab, n = ndimage.label(mask)
    if n <= 1:
        return mask
    sizes = ndimage.sum(mask, lab, range(1, n + 1))
    return lab == (1 + int(np.argmax(sizes)))


def main() -> None:
    folder = Path(sys.argv[1]) if len(sys.argv) > 1 else None
    if not folder:
        raise SystemExit("usage: make-brain-3d.py path/to/CerebrA-folder")
    lab_img = nib.load(folder / "CerebrA.nii")
    labels = np.rint(np.asarray(lab_img.dataobj)).astype(np.int16)
    affine = lab_img.affine
    # The MINC template stores its axes in the opposite order to the NIfTI labels.
    t1 = np.asarray(nib.load(folder / "mni_icbm152_t1_tal_nlin_sym_09c.mnc").dataobj, dtype=np.float32).transpose(2, 1, 0)
    assert t1.shape == labels.shape

    xs = nib.affines.apply_affine(affine, np.stack(np.meshgrid(*[np.arange(s) for s in labels.shape], indexing="ij"), -1).reshape(-1, 3))[:, 0].reshape(labels.shape)
    hind = np.isin(labels, CEREBELLUM + BRAINSTEM)
    cerebral = (labels > 0) & ~hind
    # The cerebrum's envelope: labels with small gaps closed, white matter filled in. The pial
    # surface is then where the template turns from grey matter to CSF (between their mean
    # intensities, about 70 and 33), which opens the sulci again.
    envelope = ndimage.binary_fill_holes(ndimage.binary_closing(cerebral, ndimage.generate_binary_structure(3, 1), iterations=4))
    envelope &= ~ndimage.binary_dilation(hind, iterations=1)
    tissue = ndimage.gaussian_filter(t1, 0.5) > 50

    meshes: list[dict] = []
    blobs: list[bytes] = []
    offset = 0

    def add(blob: bytes) -> int:
        nonlocal offset
        start = offset
        pad = (-len(blob)) % 4
        blobs.append(blob + b"\0" * pad)
        offset += len(blob) + pad
        return start

    def add_mesh(name: str, kind: str, verts: np.ndarray, faces: np.ndarray, **extra) -> dict:
        assert len(verts) < 65536, (name, len(verts))
        q = np.rint(verts / SCALE)
        assert np.abs(q).max() < 32767
        entry = {
            "name": name,
            "kind": kind,
            "vertices": int(len(verts)),
            "triangles": int(len(faces)),
            "positions": add(q.astype("<i2").tobytes()),
            "indices": add(faces.astype("<u2").tobytes()),
            **extra,
        }
        meshes.append(entry)
        return entry

    names_by_id = {}
    for name, rh in CORTEX.items():
        names_by_id[rh] = (name, False)
        names_by_id[rh + 51] = (name, True)

    for side, left in (("left", True), ("right", False)):
        hemi = envelope & tissue & ((xs < -1) if left else (xs > 1))
        hemi = ndimage.binary_fill_holes(largest(hemi))
        verts, faces = surface(hemi, affine, 52000)
        # Each vertex takes the label of the nearest cortical voxel on its side.
        ids = [rh + (51 if left else 0) for rh in CORTEX.values()]
        cortex = np.isin(labels, ids)
        _, nearest = ndimage.distance_transform_edt(~cortex, return_indices=True)
        vox = np.rint(nib.affines.apply_affine(np.linalg.inv(affine), verts)).astype(int)
        vox = np.clip(vox, 0, np.array(labels.shape) - 1)
        src = nearest[:, vox[:, 0], vox[:, 1], vox[:, 2]]
        vlab = labels[src[0], src[1], src[2]]
        dist = np.linalg.norm(vox - src.T, axis=1)
        area = np.zeros(len(verts), np.uint8)
        lobe = np.zeros(len(verts), np.uint8)
        body = np.zeros(len(verts), np.uint8)
        for k, (v, l, d) in enumerate(zip(verts, vlab, dist)):
            if d > 4 or int(l) not in names_by_id:
                continue
            name, _ = names_by_id[int(l)]
            a = area_of(name, v, left)
            for pid, seed, radius, allowed in PATCHES:
                s = np.array(seed, float) * (1 if left else np.array([-1, 1, 1]))
                if name in allowed and np.linalg.norm(v - s) <= radius:
                    a = pid
                    break
            if a:
                area[k] = AREAS.index(a) + 1
            for li, lname in enumerate(LOBES):
                if name in LOBE_OF[lname]:
                    lobe[k] = li + 1
            b = body_of(name, v)
            if b:
                body[k] = BODY.index(b) + 1
        add_mesh(f"cortex-{side}", "cortex", verts, faces, side=side, area=add(area.tobytes()), lobe=add(lobe.tobytes()), body=add(body.tobytes()))
        print(f"cortex {side}: {len(verts)} vertices, {len(faces)} triangles;", {a: int((area == i + 1).sum()) for i, a in enumerate(AREAS) if (area == i + 1).any()})

    verts, faces = surface(np.isin(labels, CEREBELLUM), affine, 16000, sigma=0.8)
    add_mesh("cerebellum", "cerebellum", verts, faces, region="cerebellum")
    verts, faces = surface(np.isin(labels, BRAINSTEM), affine, 4000, sigma=0.9, smooth=16)
    add_mesh("brainstem", "brainstem", verts, faces)
    for region, parts in DEEP.items():
        for side, left in (("left", True), ("right", False)):
            ids = [SUBCORTICAL[p] + (51 if left else 0) for p in parts]
            verts, faces = surface(np.isin(labels, ids), affine, 3000, sigma=0.7, smooth=10)
            add_mesh(f"{region}-{side}", "deep", verts, faces, side=side, region=region)

    header = {
        "version": 1,
        "scale": SCALE,
        "areas": AREAS,
        "lobes": LOBES,
        "body": BODY,
        "meshes": meshes,
        "source": "CerebrA (Manera et al. 2020, CC0) on the MNI ICBM 2009c symmetric template.",
        "notice": "Template: Copyright (C) 1993-2004 Louis Collins, McConnell Brain Imaging Centre, Montreal Neurological Institute, McGill University.",
    }
    head = json.dumps(header, separators=(",", ":")).encode()
    head += b" " * ((-len(head)) % 4)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    with open(OUT, "wb") as f:
        f.write(b"BR3D" + struct.pack("<I", len(head)) + head + b"".join(blobs))
    print(f"wrote {OUT.relative_to(ROOT)}: {OUT.stat().st_size / 1e6:.2f} MB")


if __name__ == "__main__":
    main()
