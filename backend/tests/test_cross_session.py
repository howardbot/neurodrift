"""Cross-session generalisation: split semantics, alignment and sanity checks."""

import numpy as np
import pytest

from app.analysis.cross_session import (
    check_outputs,
    cross_session_decoding,
    per_session_summary,
    summarise_by_distance,
    summarise_matrix,
)
from app.analysis.dataset import SessionData
from app.analysis.decoding import DecoderConfig


def _session(rng: np.random.Generator, W: np.ndarray, ids: np.ndarray | None = None, n: int = 3000) -> SessionData:
    Y = rng.standard_normal((n, 2))
    X = Y @ W + 0.5 * rng.standard_normal((n, W.shape[1]))
    return SessionData(X=X, Y=Y, neuron_ids=ids)


def _rot(theta: float) -> np.ndarray:
    return np.array([[np.cos(theta), -np.sin(theta)], [np.sin(theta), np.cos(theta)]])


def test_matrix_reflects_tuning_rotation(rng: np.random.Generator) -> None:
    W = rng.standard_normal((2, 30))
    sessions = [_session(rng, _rot(t) @ W) for t in (0.0, 0.2, 1.4)]
    progress: list[float] = []
    out = cross_session_decoding(lambda i: sessions[i], 3, DecoderConfig(), progress=progress.append)
    r = np.array(out["matrices"]["mean_r"])
    assert progress == pytest.approx([1 / 3, 2 / 3, 1.0])
    assert np.all(np.diag(r) > 0.95)
    assert r[0, 1] > r[0, 2] + 0.3  # small rotation transfers, large does not
    assert out["cells"][0][2]["n_train"] == 2400 and out["cells"][0][2]["n_test"] == 600
    assert out["cells"][0][0]["alignment"] == "index" and out["cells"][0][0]["warning"]


def test_shared_neurons_used_and_reported(rng: np.random.Generator) -> None:
    W = rng.standard_normal((2, 20))
    a = _session(rng, W, ids=np.arange(20))
    # Session b lost units 0-4, gained 5 new ones, and stores columns in another order.
    perm = rng.permutation(20)
    ids_b = np.concatenate([np.arange(5, 20), np.arange(100, 105)])[perm]
    W_b = np.concatenate([W[:, 5:], rng.standard_normal((2, 5))], axis=1)[:, perm]
    b = _session(rng, W_b, ids=ids_b)
    out = cross_session_decoding(lambda i: [a, b][i], 2, DecoderConfig())
    assert out["matrices"]["n_shared"] == [[20, 15], [15, 20]]
    assert out["cells"][0][1]["alignment"] == "neuron_ids"
    # Same tuning on the shared units -> transfer works despite reordering.
    assert out["matrices"]["mean_r"][0][1] > 0.9


def test_unalignable_pairs_are_marked_not_guessed(rng: np.random.Generator) -> None:
    a = _session(rng, rng.standard_normal((2, 10)))
    b = _session(rng, rng.standard_normal((2, 12)))
    out = cross_session_decoding(lambda i: [a, b][i], 2, DecoderConfig())
    assert out["cells"][0][1]["status"] == "unavailable"
    assert out["matrices"]["mean_r"][0][1] is None
    assert out["matrices"]["mean_r"][1][1] is not None


def test_unrelated_sessions_transfer_at_chance(rng: np.random.Generator) -> None:
    a = _session(rng, rng.standard_normal((2, 30)))
    b = SessionData(X=rng.standard_normal((3000, 30)), Y=rng.standard_normal((3000, 2)))
    r = cross_session_decoding(lambda i: [a, b][i], 2, DecoderConfig())["matrices"]["mean_r"]
    assert abs(r[0][1]) < 0.1


def test_output_checks_and_summary() -> None:
    check_outputs([2, 2], None)
    check_outputs([2, 3], (0, 1))
    with pytest.raises(ValueError):
        check_outputs([2, 3], None)
    with pytest.raises(ValueError):
        check_outputs([2, 3], (2,))
    s = summarise_matrix([[0.9, 0.5], [None, 0.8]])
    assert s["mean_diagonal"] == pytest.approx(0.85) and s["mean_off_diagonal"] == pytest.approx(0.5)


def test_subspace_matrix_tracks_tuning_rotation(rng: np.random.Generator) -> None:
    from app.analysis.cross_session import cross_session_subspaces

    W = rng.standard_normal((2, 30))
    sessions = [_session(rng, _rot(t) @ W) for t in (0.0, 0.0, 1.4)]
    # Rotating within the 2-D velocity plane leaves the *subspace* unchanged.
    out = cross_session_subspaces(lambda i: sessions[i], 3, n_components=2)
    angles = np.array(out["matrices"]["mean_angle"], dtype=float)
    assert np.all(angles < 10)
    # A genuinely different readout space gives large angles.
    other = _session(rng, rng.standard_normal((2, 30)))
    out = cross_session_subspaces(lambda i: [sessions[0], other][i], 2, n_components=2)
    assert out["matrices"]["mean_angle"][0][1] > 30
    assert out["cells"][0][1]["chance_mean_angle"] > out["matrices"]["mean_angle"][0][0]


def test_per_session_summary_and_distance_profile() -> None:
    r = [[0.9, 0.7, None], [0.6, 0.8, 0.5], [0.4, 0.6, 0.85]]
    angles = [[10.0, 20.0, 30.0], [22.0, 12.0, 18.0], [35.0, 19.0, 11.0]]
    rows = per_session_summary(r, angles)
    assert rows[0]["within_r"] == 0.9
    assert rows[0]["out_transfer_r"] == pytest.approx(0.7)  # missing cell ignored, diagonal excluded
    assert rows[2]["in_transfer_r"] == pytest.approx(0.5)  # column 2 without its diagonal; None ignored
    assert rows[1]["out_mean_angle"] == pytest.approx(20.0) and rows[1]["in_mean_angle"] == pytest.approx(19.5)
    assert per_session_summary(r)[0]["within_angle"] is None  # older experiments: no subspace

    by_d = summarise_by_distance(r)
    assert [d["distance"] for d in by_d] == [0, 1, 2]
    assert by_d[0]["mean"] == pytest.approx(0.85) and by_d[0]["n_pairs"] == 3
    assert by_d[1]["mean"] == pytest.approx((0.7 + 0.6 + 0.5 + 0.6) / 4)
    assert by_d[2] == {"distance": 2, "mean": 0.4, "n_pairs": 1}
    assert summarise_by_distance([[None]]) == [{"distance": 0, "mean": None, "n_pairs": 0}]
