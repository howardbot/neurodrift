"""PCA and subspace-comparison sanity checks."""

import numpy as np
import pytest

from app.analysis.activity import activity_drift
from app.analysis.behavior import behaviour_comparison
from app.analysis.dataset import SessionData
from app.analysis.pca import cap_components, fit_pca, session_pca_summary
from app.analysis.subspace import (
    compare_subspaces,
    principal_angles_deg,
    projection_distance,
    random_subspace_chance,
)


def _low_rank(rng: np.random.Generator, loadings: np.ndarray, n: int = 4000, noise: float = 0.2) -> np.ndarray:
    latent = rng.standard_normal((n, loadings.shape[1]))
    return latent @ loadings.T + noise * rng.standard_normal((n, loadings.shape[0]))


def test_angles_between_known_subspaces() -> None:
    e = np.eye(4)
    assert principal_angles_deg(e[:, :2], e[:, :2]) == pytest.approx([0, 0], abs=1e-6)
    assert principal_angles_deg(e[:, :2], e[:, 2:]) == pytest.approx([90, 90])
    theta = np.radians(30)
    rotated = np.column_stack([e[:, 0], np.cos(theta) * e[:, 1] + np.sin(theta) * e[:, 2]])
    assert principal_angles_deg(e[:, :2], rotated) == pytest.approx([0, 30], abs=1e-6)
    # d = sqrt(sum sin^2 / k)
    assert projection_distance(e[:, :2], rotated) == pytest.approx(np.sqrt(np.sin(theta) ** 2 / 2))


def test_identical_tuning_gives_near_zero_angles(rng: np.random.Generator) -> None:
    L = rng.standard_normal((40, 3))
    out = compare_subspaces(_low_rank(rng, L), _low_rank(rng, L), n_components=3)
    assert out["mean_angle"] < 5 and out["alignment_index"] > 0.95
    assert out["mean_angle"] < out["chance_mean_angle"] - 30


def test_rotating_the_subspace_increases_angles(rng: np.random.Generator) -> None:
    L = rng.standard_normal((40, 3))
    Q, _ = np.linalg.qr(rng.standard_normal((40, 40)))
    angles = []
    for mix in (0.0, 0.3, 0.7, 1.0):
        L_rot = (1 - mix) * L + mix * (Q @ L)  # gradually rotate loadings
        angles.append(compare_subspaces(_low_rank(rng, L), _low_rank(rng, L_rot), 3)["mean_angle"])
    assert angles == sorted(angles) and angles[-1] - angles[0] > 30


def test_chance_level_depends_on_dimension() -> None:
    small = random_subspace_chance(100, 3)["mean"]
    large = random_subspace_chance(20, 10)["mean"]
    assert small > 70 and large < small  # random subspaces of comparatively large k overlap more
    assert random_subspace_chance(100, 3) == random_subspace_chance(100, 3)  # seeded


def test_degenerate_dimension_is_flagged(rng: np.random.Generator) -> None:
    X = rng.standard_normal((500, 6))
    assert compare_subspaces(X, rng.standard_normal((500, 6)), 5)["degenerate"]


def test_pca_caps_components_and_drops_constant_features(rng: np.random.Generator) -> None:
    X = rng.standard_normal((50, 8))
    X[:, 2] = 1.0
    fit = fit_pca(X, 20)
    assert fit.k == 7 and fit.keep.sum() == 7
    np.testing.assert_allclose(fit.basis.T @ fit.basis, np.eye(7), atol=1e-10)
    assert cap_components(10, 5, 100) == 4


def test_session_pca_summary(rng: np.random.Generator) -> None:
    L = rng.standard_normal((30, 2))
    data = SessionData(X=_low_rank(rng, L, n=3000), Y=rng.standard_normal((3000, 2)))
    out = session_pca_summary(data, n_components=10)
    assert out["n_components"] == 10 and len(out["explained_variance_ratio"]) == 30
    assert out["cumulative_explained_variance"][1] > 0.9  # two latent dimensions dominate
    assert len(out["trajectory"]["pcs"]) == 3 and len(out["trajectory"]["pcs"][0]) == 1500


def test_activity_and_behaviour_comparisons(rng: np.random.Generator) -> None:
    X_a = rng.poisson(2.0, (1000, 10)).astype(float)
    X_b = X_a * 1.5
    drift = activity_drift(X_a, X_b, [str(i) for i in range(10)], bin_size_s=0.02)
    assert drift["unit"] == "Hz" and drift["pearson_r"] == pytest.approx(1.0)
    assert drift["median_relative_change"] == pytest.approx(0.5)

    Y_a = rng.standard_normal((2000, 2))
    beh = behaviour_comparison(Y_a, 2 * Y_a)
    assert beh["outputs"][0]["var_change_pct"] == pytest.approx(300.0)
    assert beh["outputs"][0]["ks_statistic"] > 0.1
    assert sum(beh["outputs"][1]["hist_a"]) == 2000
    assert len(beh["example_a"][0]) == 400
