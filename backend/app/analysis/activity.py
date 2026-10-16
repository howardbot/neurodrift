"""Firing-rate / activity drift between two sessions on their shared neurons.

These statistics describe changes in *mean activity*, which is distinct from changes in
the population's covariance structure (subspaces) and from changes in behaviour.
"""

from __future__ import annotations

from typing import Any

import numpy as np


def activity_drift(
    X_a: np.ndarray, X_b: np.ndarray, labels: list[str], bin_size_s: float | None = None
) -> dict[str, Any]:
    """Compare per-neuron mean activity of aligned matrices ``X_a`` and ``X_b``.

    If ``bin_size_s`` is given (and data are counts) means are also reported in Hz.
    Returns per-neuron means, differences (B − A), the Pearson correlation of means
    across neurons, mean absolute difference and the median relative change.
    """
    mean_a = X_a.mean(axis=0)
    mean_b = X_b.mean(axis=0)
    diff = mean_b - mean_a
    if mean_a.std() > 1e-12 and mean_b.std() > 1e-12:
        r = float(np.corrcoef(mean_a, mean_b)[0, 1])
    else:
        r = None
    denom = np.where(np.abs(mean_a) > 1e-12, np.abs(mean_a), np.nan)
    rel = diff / denom
    rel = rel[np.isfinite(rel)]
    scale = 1.0 / bin_size_s if bin_size_s else 1.0
    return {
        "unit": "Hz" if bin_size_s else "per bin",
        "labels": labels,
        "mean_a": [round(float(v * scale), 5) for v in mean_a],
        "mean_b": [round(float(v * scale), 5) for v in mean_b],
        "diff": [round(float(v * scale), 5) for v in diff],
        "pearson_r": r,
        "mean_abs_diff": float(np.abs(diff).mean() * scale),
        "median_relative_change": float(np.median(rel)) if rel.size else None,
        "population_mean_a": float(mean_a.mean() * scale),
        "population_mean_b": float(mean_b.mean() * scale),
    }
