"""Sanity checks on the synthetic demo generator: it must produce the intended structure."""

import numpy as np
import pytest

from app.analysis.synthetic import generate_demo_sessions


def _ridge_corr(Xtr: np.ndarray, Ytr: np.ndarray, Xte: np.ndarray, Yte: np.ndarray) -> float:
    mu, sd = Xtr.mean(0), Xtr.std(0)
    ok = sd > 0
    A = (Xtr[:, ok] - mu[ok]) / sd[ok]
    B = (Xte[:, ok] - mu[ok]) / sd[ok]
    A1 = np.column_stack([A, np.ones(len(A))])
    W = np.linalg.solve(A1.T @ A1 + np.eye(A1.shape[1]), A1.T @ Ytr)
    P = np.column_stack([B, np.ones(len(B))]) @ W
    return float(np.mean([np.corrcoef(P[:, k], Yte[:, k])[0, 1] for k in range(Yte.shape[1])]))


@pytest.fixture(scope="module")
def sessions():
    return generate_demo_sessions(seed=42)


def test_shapes_and_metadata(sessions) -> None:
    assert [s.name for s in sessions] == ["R1_D01", "R1_D03", "R1_D07", "R1_D10", "R1_D14", "R1_D21"]
    for s in sessions:
        d = s.data
        assert d.n_samples == 8000 and 90 <= d.n_neurons <= 96 and d.n_outputs == 2
        assert np.all(d.X >= 0) and np.all(d.X == np.round(d.X))
        assert np.unique(d.neuron_ids).size == d.n_neurons
        assert d.trial_ids is not None and np.all(np.diff(d.trial_ids) >= 0)


def test_reproducible() -> None:
    a = generate_demo_sessions(seed=7, n_samples=500)
    b = generate_demo_sessions(seed=7, n_samples=500)
    c = generate_demo_sessions(seed=8, n_samples=500)
    np.testing.assert_array_equal(a[3].data.X, b[3].data.X)
    assert not np.array_equal(a[3].data.X, c[3].data.X)


def test_drift_structure(sessions) -> None:
    """Within-session decoding is good; transfer to the most distant session is worse;
    neuron overlap shrinks with distance (turnover)."""
    first, last = sessions[0].data, sessions[-1].data
    cut = int(0.8 * first.n_samples)
    within = _ridge_corr(first.X[:cut], first.Y[:cut], first.X[cut:], first.Y[cut:])
    assert within > 0.75

    ids, ia, ib = np.intersect1d(first.neuron_ids, last.neuron_ids, return_indices=True)
    assert ids.size < min(first.n_neurons, last.n_neurons)
    across = _ridge_corr(first.X[:cut, ia], first.Y[:cut], last.X[cut:, ib], last.Y[cut:])
    assert across < within - 0.1

    near = np.intersect1d(sessions[0].data.neuron_ids, sessions[1].data.neuron_ids).size
    assert near > ids.size
