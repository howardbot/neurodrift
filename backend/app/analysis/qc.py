"""Per-session quality-control statistics.

Everything returned is JSON-serialisable and bounded in size: per-neuron vectors
(length n_neurons), histograms with a fixed number of bins, and a contiguous window
of at most ``max_trace_points`` bins for trace plots. Raw matrices are never returned.
"""

from __future__ import annotations

from typing import Any

import numpy as np

from app.analysis.dataset import SessionData


def _floats(a: np.ndarray, digits: int = 6) -> list[float]:
    return [float(v) for v in np.round(np.asarray(a, dtype=np.float64), digits)]


def _histogram(values: np.ndarray, bins: int) -> dict[str, list[float]]:
    counts, edges = np.histogram(values, bins=bins)
    return {"counts": [int(c) for c in counts], "edges": _floats(edges)}


def is_count_like(X: np.ndarray) -> bool:
    """True if X looks like spike counts (non-negative integers)."""
    return bool(np.all(X >= 0) and np.all(np.mod(X, 1) == 0))


def compute_qc(
    data: SessionData,
    max_trace_points: int = 2000,
    n_example_neurons: int = 6,
    hist_bins: int = 40,
) -> dict[str, Any]:
    """Compute summary statistics, per-neuron statistics and plot payloads.

    Returns a dict with keys ``summary`` (scalars, stored in the database),
    ``neurons`` (per-neuron mean / variance / fraction of zero bins), ``targets``
    (per-output statistics and histograms) and ``traces`` (a contiguous window of
    target and example-neuron traces, starting at the first bin).
    """
    X, Y = data.X, data.Y
    n_samples, n_neurons = X.shape

    neuron_mean = X.mean(axis=0)
    neuron_var = X.var(axis=0)
    neuron_frac_zero = (X == 0).mean(axis=0)
    zero_var = neuron_var <= 1e-12

    target_mean = Y.mean(axis=0)
    target_var = Y.var(axis=0)

    summary: dict[str, Any] = {
        "n_samples": n_samples,
        "n_neurons": n_neurons,
        "n_outputs": int(Y.shape[1]),
        "duration_s": data.duration_s,
        "nan_count": int(np.isnan(X).sum() + np.isnan(Y).sum()),
        "pct_zero": float(100.0 * (X == 0).mean()),
        "mean_activity": float(neuron_mean.mean()),
        "median_neuron_mean": float(np.median(neuron_mean)),
        "median_neuron_var": float(np.median(neuron_var)),
        "n_zero_variance_neurons": int(zero_var.sum()),
        "n_silent_neurons": int((neuron_frac_zero == 1.0).sum()),
        "count_like": is_count_like(X),
        "target_mean": _floats(target_mean),
        "target_var": _floats(target_var),
        "target_std": _floats(np.sqrt(target_var)),
        "n_trials": int(np.unique(data.trial_ids).size) if data.trial_ids is not None else None,
    }

    window = min(n_samples, max_trace_points)
    if data.timestamps is not None:
        t = data.timestamps[:window]
        time_unit = "s"
    else:
        t = np.arange(window, dtype=np.float64)
        time_unit = "bin"

    # Example neurons: the most variable ones, which make the most informative traces.
    order = np.argsort(neuron_var)[::-1][: min(n_example_neurons, n_neurons)]
    neuron_labels = (
        [str(v) for v in data.neuron_ids] if data.neuron_ids is not None else [str(i) for i in range(n_neurons)]
    )

    return {
        "summary": summary,
        "neurons": {
            "labels": neuron_labels,
            "mean": _floats(neuron_mean),
            "var": _floats(neuron_var),
            "frac_zero": _floats(neuron_frac_zero, 4),
            "zero_variance": [bool(v) for v in zero_var],
        },
        "targets": {
            "mean": _floats(target_mean),
            "var": _floats(target_var),
            "histograms": [_histogram(Y[:, j], hist_bins) for j in range(Y.shape[1])],
        },
        "traces": {
            "time": _floats(t),
            "time_unit": time_unit,
            "window_bins": window,
            "targets": [_floats(Y[:window, j]) for j in range(Y.shape[1])],
            "neuron_indices": [int(i) for i in order],
            "neuron_labels": [neuron_labels[i] for i in order],
            "neurons": [_floats(X[:window, i]) for i in order],
        },
    }
