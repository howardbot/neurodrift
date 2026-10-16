"""Comparing neural subspaces between sessions.

Metrics, for two k-dimensional subspaces A and B of ℝⁿ with orthonormal bases:

* **Principal angles** θ₁ ≤ … ≤ θ_k (``scipy.linalg.subspace_angles``), in degrees.
  0° = shared direction, 90° = orthogonal. Reported individually, as mean and maximum.
* **Chance level.** Angles between *random* k-dimensional subspaces of ℝⁿ are not 90°;
  they depend on k/n. A seeded Monte-Carlo estimate of the mean principal angle between
  random subspaces (mean and 5th percentile over draws) is reported with every comparison.
  If 2k > n, at least 2k − n angles are 0° by construction, which is flagged.
* **Normalised projection distance** d = ‖P_A − P_B‖_F / √(2k), where P = QQᵀ is the
  orthogonal projector. Equivalently d = √(Σ sin²θᵢ / k), in [0, 1].
* **Alignment index** (Elsayed et al., 2016): the fraction of session B's variance in its
  own top-k subspace that is captured by A's top-k subspace,
  ``trace(Q_Aᵀ C_B Q_A) / Σ_{i≤k} λ_i(C_B)``, in [0, 1]. Unlike angles, it weights
  directions by how much variance B actually has in them.
"""

from __future__ import annotations

from functools import lru_cache
from typing import Any

import numpy as np
from scipy.linalg import subspace_angles

from app.analysis.pca import PcaFit, fit_pca


def principal_angles_deg(A: np.ndarray, B: np.ndarray) -> np.ndarray:
    """Principal angles between column spaces of A and B, ascending, in degrees."""
    return np.sort(np.degrees(subspace_angles(A, B)))


def projection_distance(A: np.ndarray, B: np.ndarray) -> float:
    """‖P_A − P_B‖_F / √(2k) for orthonormal bases A, B with k columns each."""
    k = A.shape[1]
    diff = A @ A.T - B @ B.T
    return float(np.linalg.norm(diff, "fro") / np.sqrt(2 * k))


def alignment_index(basis_a: np.ndarray, Z_b: np.ndarray, k: int) -> float:
    """Fraction of B's top-k variance captured by subspace A (``Z_b`` standardised data of B)."""
    C = np.cov(Z_b, rowvar=False)
    captured = float(np.trace(basis_a.T @ C @ basis_a))
    top = float(np.sort(np.linalg.eigvalsh(C))[::-1][:k].sum())
    return captured / top if top > 0 else float("nan")


@lru_cache(maxsize=256)
def random_subspace_chance(n: int, k: int, n_draws: int = 200, seed: int = 42) -> dict[str, float]:
    """Mean principal angle between random k-dim subspaces of ℝⁿ (Haar-distributed)."""
    rng = np.random.default_rng(seed)
    means = np.empty(n_draws)
    for d in range(n_draws):
        qa, _ = np.linalg.qr(rng.standard_normal((n, k)))
        qb, _ = np.linalg.qr(rng.standard_normal((n, k)))
        means[d] = principal_angles_deg(qa, qb).mean()
    return {"mean": float(means.mean()), "p05": float(np.percentile(means, 5))}


def compare_subspaces(
    X_a: np.ndarray, X_b: np.ndarray, n_components: int, zscore: bool = True, seed: int = 42
) -> dict[str, Any]:
    """Fit PCA independently to aligned activity ``X_a`` and ``X_b`` (same columns = same
    neurons) and compare their top-k subspaces.

    Neurons that are constant in either block are excluded from both fits so the two
    bases live in the same space.
    """
    keep = (X_a.var(axis=0) > 1e-12) & (X_b.var(axis=0) > 1e-12)
    fit_a: PcaFit = fit_pca(X_a, n_components, zscore=zscore, keep=keep)
    fit_b: PcaFit = fit_pca(X_b, n_components, zscore=zscore, keep=keep)
    k = min(fit_a.k, fit_b.k)
    A, B = fit_a.basis[:, :k], fit_b.basis[:, :k]
    n = int(keep.sum())
    angles = principal_angles_deg(A, B)
    chance = random_subspace_chance(n, k, seed=seed)
    return {
        "k": k,
        "n_neurons_used": n,
        "angles_deg": [round(float(a), 4) for a in angles],
        "mean_angle": float(angles.mean()),
        "max_angle": float(angles.max()),
        "projection_distance": projection_distance(A, B),
        "alignment_index": alignment_index(A, fit_b.standardise(X_b), k),
        "chance_mean_angle": chance["mean"],
        "chance_p05_angle": chance["p05"],
        "degenerate": 2 * k > n,
        "explained_variance_a": [round(float(v), 6) for v in fit_a.explained_variance_ratio[:k]],
        "explained_variance_b": [round(float(v), 6) for v in fit_b.explained_variance_ratio[:k]],
    }


def variance_capture_curves(X_a: np.ndarray, X_b: np.ndarray, n_components: int, zscore: bool = True) -> dict[str, Any]:
    """Cumulative fraction of B's variance captured by A's top-k' PCs vs B's own top-k'
    PCs, for k' = 1..k. The gap between the curves shows how much of B's structure is
    missed when it is viewed through A's subspace."""
    keep = (X_a.var(axis=0) > 1e-12) & (X_b.var(axis=0) > 1e-12)
    fit_a = fit_pca(X_a, n_components, zscore=zscore, keep=keep)
    fit_b = fit_pca(X_b, n_components, zscore=zscore, keep=keep)
    k = min(fit_a.k, fit_b.k)
    C = np.cov(fit_b.standardise(X_b), rowvar=False)
    total = float(np.trace(C))
    eig = np.sort(np.linalg.eigvalsh(C))[::-1]
    by_a = [float(np.trace(fit_a.basis[:, :m].T @ C @ fit_a.basis[:, :m]) / total) for m in range(1, k + 1)]
    own = [float(eig[:m].sum() / total) for m in range(1, k + 1)]
    return {"k": list(range(1, k + 1)), "captured_by_a": by_a, "captured_by_own": own}
