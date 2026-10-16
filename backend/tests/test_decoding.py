"""Decoder correctness and scientific sanity checks."""

import numpy as np
import pytest

from app.analysis.dataset import SessionData
from app.analysis.decoding import (
    DecoderConfig,
    evaluate_within_session,
    fit_decoder,
    regression_metrics,
)


def _linear_session(rng: np.random.Generator, n: int = 4000, k: int = 40, noise: float = 0.5) -> SessionData:
    # Smooth behaviour (autocorrelated, like real kinematics).
    Y = np.cumsum(rng.standard_normal((n, 2)), axis=0) / 10
    Y = Y - Y.mean(0)
    W = rng.standard_normal((2, k))
    X = Y @ W + noise * rng.standard_normal((n, k))
    return SessionData(X=X, Y=Y)


def test_metrics_definitions() -> None:
    y = np.array([[1.0, 0.0], [2.0, 1.0], [3.0, 0.0], [4.0, 1.0]])
    m = regression_metrics(y, y)
    assert m.r == pytest.approx([1.0, 1.0]) and m.r2 == pytest.approx([1.0, 1.0])
    assert m.rmse == [0.0, 0.0]
    p = y.copy()
    p[:, 0] = 2 * y[:, 0] + 3  # perfectly correlated but biased
    m = regression_metrics(y, p)
    assert m.r[0] == pytest.approx(1.0)
    assert m.r2[0] < 0  # R² penalises the bias, r does not
    assert m.rmse[0] == pytest.approx(np.sqrt(np.mean((y[:, 0] + 3) ** 2)))


def test_undefined_metrics_are_none_not_nan() -> None:
    y = np.column_stack([np.arange(5.0), np.zeros(5)])
    m = regression_metrics(y, np.column_stack([np.arange(5.0), np.arange(5.0)]))
    assert m.r[1] is None and m.r2[1] is None
    assert m.mean_r == pytest.approx(1.0) and m.n_undefined == 2


def test_within_session_decoding_is_strong_for_linear_data(rng: np.random.Generator) -> None:
    result = evaluate_within_session(_linear_session(rng), DecoderConfig())
    assert result["metrics"]["mean_r"] > 0.95
    assert result["split"] == {"n_train": 3200, "n_test": 800, "train_bins": [0, 3200], "test_bins": [3200, 4000]}
    assert len(result["traces"]["predicted"][0]) == 800


def test_unrelated_activity_decodes_at_chance(rng: np.random.Generator) -> None:
    n = 6000
    data = SessionData(X=rng.poisson(2.0, (n, 50)).astype(float), Y=rng.standard_normal((n, 2)))
    result = evaluate_within_session(data, DecoderConfig())
    assert abs(result["metrics"]["mean_r"]) < 0.08
    assert result["metrics"]["mean_r2"] < 0.02


def test_identical_tuning_generalises_and_rotated_tuning_does_not(rng: np.random.Generator) -> None:
    n, k = 4000, 40
    W = rng.standard_normal((2, k))
    def make(Wm: np.ndarray) -> SessionData:
        Y = rng.standard_normal((n, 2))
        return SessionData(X=Y @ Wm + 0.3 * rng.standard_normal((n, k)), Y=Y)
    a, same = make(W), make(W)
    theta = np.pi / 2
    R = np.array([[np.cos(theta), -np.sin(theta)], [np.sin(theta), np.cos(theta)]])
    rotated = make(R @ W)  # the population encodes a rotated velocity
    dec = fit_decoder(a.X, a.Y, DecoderConfig())
    r_same = regression_metrics(same.Y, dec.predict(same.X)).mean_r
    r_rot = regression_metrics(rotated.Y, dec.predict(rotated.X)).mean_r
    assert r_same is not None and r_rot is not None
    assert r_same > 0.95 and abs(r_rot) < 0.1


def test_output_selection_and_linear_decoder(rng: np.random.Generator) -> None:
    data = _linear_session(rng)
    result = evaluate_within_session(data, DecoderConfig(kind="linear", outputs=(1,)))
    assert result["config"]["outputs"] == [1] and len(result["metrics"]["r"]) == 1
    assert result["config"]["alpha"] is None
    with pytest.raises(ValueError):
        evaluate_within_session(data, DecoderConfig(outputs=(5,)))


def test_zero_variance_neurons_are_dropped_not_nan(rng: np.random.Generator) -> None:
    data = _linear_session(rng, k=10)
    data.X[:, 3] = 0.0
    result = evaluate_within_session(data, DecoderConfig())
    assert result["features"] == {"n_in": 10, "n_used": 9, "n_dropped_zero_variance": 1}
    assert np.isfinite(result["metrics"]["mean_r"])
