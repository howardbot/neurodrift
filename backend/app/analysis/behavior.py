"""Comparing behavioural target distributions between two sessions.

Poor decoder transfer can reflect different behaviour rather than different neural
coding (e.g. faster movements, other directions). These descriptive statistics help
check that; they make no causal claim. The two-sample Kolmogorov–Smirnov *statistic*
is reported without a p-value because time bins are strongly autocorrelated, which
would make nominal p-values meaningless.
"""

from __future__ import annotations

from typing import Any

import numpy as np
from scipy.stats import ks_2samp


def behaviour_comparison(Y_a: np.ndarray, Y_b: np.ndarray, bins: int = 40, max_path_points: int = 400) -> dict[str, Any]:
    """Per-output mean/variance/SD, relative variance change, KS statistic, histograms on
    shared bin edges, and a short example of each session's behaviour."""
    k = Y_a.shape[1]
    outputs = []
    for j in range(k):
        a, b = Y_a[:, j], Y_b[:, j]
        lo, hi = float(min(a.min(), b.min())), float(max(a.max(), b.max()))
        edges = np.linspace(lo, hi if hi > lo else lo + 1.0, bins + 1)
        var_a, var_b = float(a.var()), float(b.var())
        outputs.append(
            {
                "mean_a": float(a.mean()),
                "mean_b": float(b.mean()),
                "var_a": var_a,
                "var_b": var_b,
                "std_a": float(np.sqrt(var_a)),
                "std_b": float(np.sqrt(var_b)),
                "var_change_pct": 100.0 * (var_b - var_a) / var_a if var_a > 1e-12 else None,
                "ks_statistic": float(ks_2samp(a, b).statistic),
                "hist_edges": [round(float(e), 5) for e in edges],
                "hist_a": [int(c) for c in np.histogram(a, edges)[0]],
                "hist_b": [int(c) for c in np.histogram(b, edges)[0]],
            }
        )
    var_a_total = float(Y_a.var(axis=0).sum())
    var_b_total = float(Y_b.var(axis=0).sum())
    n_a, n_b = min(len(Y_a), max_path_points), min(len(Y_b), max_path_points)
    return {
        "outputs": outputs,
        "mean_euclidean_difference": float(np.linalg.norm(Y_b.mean(axis=0) - Y_a.mean(axis=0))),
        "total_var_change_pct": 100.0 * (var_b_total - var_a_total) / var_a_total if var_a_total > 1e-12 else None,
        "speed_mean_a": float(np.linalg.norm(Y_a, axis=1).mean()) if k > 1 else None,
        "speed_mean_b": float(np.linalg.norm(Y_b, axis=1).mean()) if k > 1 else None,
        "example_a": [[round(float(v), 4) for v in Y_a[:n_a, j]] for j in range(k)],
        "example_b": [[round(float(v), 4) for v in Y_b[:n_b, j]] for j in range(k)],
    }
