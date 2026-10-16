import io
from pathlib import Path
from typing import Any

import numpy as np


def npz_bytes(**arrays: Any) -> bytes:
    buf = io.BytesIO()
    np.savez(buf, **arrays)
    return buf.getvalue()


def write_npz(path: Path, **arrays: Any) -> Path:
    path.write_bytes(npz_bytes(**arrays))
    return path


def simple_session(rng: np.random.Generator, n: int = 500, k: int = 12, m: int = 2) -> dict[str, np.ndarray]:
    """Small session where Y is a noisy linear readout of Poisson-like X."""
    Y = rng.standard_normal((n, m))
    W = rng.standard_normal((m, k))
    rates = np.exp(0.3 * Y @ W)
    X = rng.poisson(rates).astype(np.float64)
    return {"X": X, "Y": Y, "timestamps": np.arange(n) * 0.02, "neuron_ids": np.arange(100, 100 + k)}
