#!/usr/bin/env python3
"""Pre-convert the research figures for the web. Run by hand; never at build or run time.

For every PNG in public/research/marmoset/ this writes WebP copies about 1000 and 2000 px
wide, named with a content hash (so they can be cached as immutable), deletes stale
copies, and records file names and pixel sizes in content/figures.json for the page's
srcset/width/height. The PNGs stay as the full-resolution originals.

    python3 scripts/convert-figures.py        # needs Pillow with WebP support

Quality 92 keeps the plotted text indistinguishable from a lossless encode at 3x zoom.
"""

import hashlib
import io
import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
FIGURES = ROOT / "public" / "research" / "marmoset"
MANIFEST = ROOT / "content" / "figures.json"
WIDTHS = (1000, 2000)
QUALITY = 92


def main() -> None:
    manifest: dict[str, dict] = {}
    for png in sorted(FIGURES.glob("*.png")):
        stem = png.stem
        image = Image.open(png).convert("RGB")
        for old in FIGURES.glob(f"{stem}-*w.*.webp"):
            old.unlink()
        variants = []
        for width in WIDTHS:
            height = round(image.height * width / image.width)
            buf = io.BytesIO()
            image.resize((width, height), Image.LANCZOS).save(buf, "WEBP", quality=QUALITY, method=6)
            data = buf.getvalue()
            name = f"{stem}-{width}w.{hashlib.sha256(data).hexdigest()[:10]}.webp"
            (FIGURES / name).write_bytes(data)
            variants.append({"file": name, "width": width, "height": height, "bytes": len(data)})
        manifest[stem] = {"original": png.name, "originalWidth": image.width, "originalHeight": image.height, "variants": variants}
        print(f"{stem}: " + ", ".join(f"{v['width']}w {v['bytes'] / 1024:.0f} KB" for v in variants))
    MANIFEST.write_text(json.dumps(manifest, indent=2) + "\n")


if __name__ == "__main__":
    main()
