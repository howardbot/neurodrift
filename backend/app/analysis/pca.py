"""Principal component analysis of neural population activity.

Each PCA fit is self-contained: features with zero variance in the fitted data are
dropped, the data are centred (and optionally z-scored) with their *own* statistics,
and ``sklearn.decomposition.PCA`` is fitted. When two sessions' subspaces are compared,
each session is fitted independently on the same set of (shared, non-constant) neurons.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import numpy as np
from sklearn.decomposition import PCA

from app.analysis.dataset import SessionData

MAX_SPECTRUM = 50


def cap_components(n_components: int, n_samples: int, n_features: int) -> int:
    """Largest usable number of components for a data matrix of this shape."""
    return max(1, min(n_components, n_samples - 1, n_features))


@dataclass
class PcaFit:
    keep: np.ndarray  # boolean mask over input features
    basis: np.ndarray  # (n_kept, k) orthonormal columns
    explained_variance_ratio: np.ndarray  # (k,)
    mean: np.ndarray
    scale: np.ndarray

    @property
    def k(self) -> int:
        return int(self.basis.shape[1])

    def standardise(self, X: np.ndarray) -> np.ndarray:
        return (X[:, self.keep] - self.mean) / self.scale

    def project(self, X: np.ndarray) -> np.ndarray:
        return self.standardise(X) @ self.basis


def fit_pca(
    X: np.ndarray, n_components: int, zscore: bool = True, keep: np.ndarray | None = None
) -> PcaFit:
    """Fit PCA to ``X`` (n_samples, n_features).

    ``keep`` optionally fixes which features to use (e.g. neurons non-constant in *both*
    sessions); otherwise zero-variance features are dropped.
    """
    var = X.var(axis=0)
    if keep is None:
        keep = var > 1e-12
    if keep.sum() < 2:
        raise ValueError("PCA needs at least two features with non-zero variance")
    Xk = X[:, keep]
    mean = Xk.mean(axis=0)
    scale = np.sqrt(var[keep]) if zscore else np.ones(int(keep.sum()))
    scale = np.where(scale > 1e-12, scale, 1.0)
    k = cap_components(n_components, Xk.shape[0], Xk.shape[1])
    pca = PCA(n_components=k, svd_solver="full").fit((Xk - mean) / scale)
    return PcaFit(
        keep=keep,
        basis=pca.components_.T.copy(),
        explained_variance_ratio=pca.explained_variance_ratio_.copy(),
        mean=mean,
        scale=scale,
    )


def _smooth(x: np.ndarray, width: int) -> np.ndarray:
    if width <= 1:
        return x
    kernel = np.ones(width) / width
    return np.column_stack([np.convolve(x[:, i], kernel, mode="same") for i in range(x.shape[1])])


def session_pca_summary(
    data: SessionData,
    n_components: int = 10,
    zscore: bool = True,
    max_trajectory_points: int = 1500,
    smooth_bins: int = 5,
) -> dict[str, Any]:
    """PCA of a whole session for display.

    Returns the explained-variance spectrum (up to 50 components), the first
    ``n_components`` (capped), PC time courses for a contiguous window, and the
    behaviour over the same window for colouring. Projections are smoothed with a
    ``smooth_bins`` boxcar *for display only*.
    """
    spectrum = fit_pca(data.X, MAX_SPECTRUM, zscore=zscore)
    k = min(cap_components(n_components, data.n_samples, int(spectrum.keep.sum())), spectrum.k)
    window = min(data.n_samples, max_trajectory_points)
    proj = _smooth(spectrum.project(data.X[:window])[:, :k], smooth_bins)
    t = data.timestamps[:window] if data.timestamps is not None else np.arange(window, dtype=float)
    evr = spectrum.explained_variance_ratio

    return {
        "n_components_requested": n_components,
        "n_components": k,
        "zscore": zscore,
        "n_features_used": int(spectrum.keep.sum()),
        "n_features_dropped": int((~spectrum.keep).sum()),
        "explained_variance_ratio": [round(float(v), 6) for v in evr],
        "cumulative_explained_variance": [round(float(v), 6) for v in np.cumsum(evr)],
        "variance_explained_by_k": round(float(evr[:k].sum()), 6),
        "trajectory": {
            "time": [round(float(v), 4) for v in t],
            "time_unit": "s" if data.timestamps is not None else "bin",
            "smooth_bins": smooth_bins,
            "pcs": [[round(float(v), 4) for v in proj[:, i]] for i in range(min(k, 3))],
            "behaviour": [[round(float(v), 4) for v in data.Y[:window, j]] for j in range(data.n_outputs)],
        },
    }
