import json

import numpy as np

from app.analysis.dataset import SessionData
from app.analysis.qc import compute_qc


def test_qc_statistics_match_definitions() -> None:
    X = np.array([[0, 2, 5], [0, 4, 5], [0, 0, 5], [0, 2, 5]], dtype=float).repeat(5, axis=0)
    Y = np.column_stack([np.linspace(-1, 1, 20), np.full(20, 3.0)])
    qc = compute_qc(SessionData(X=X, Y=Y, timestamps=np.arange(20) * 0.5))
    s = qc["summary"]
    assert s["n_samples"] == 20 and s["n_neurons"] == 3 and s["n_outputs"] == 2
    assert s["duration_s"] == 9.5
    assert s["n_silent_neurons"] == 1  # neuron 0 never fires
    assert s["n_zero_variance_neurons"] == 2  # neurons 0 and 2 are constant
    assert s["count_like"] is True
    np.testing.assert_allclose(qc["neurons"]["mean"], [0, 2, 5])
    np.testing.assert_allclose(qc["neurons"]["var"], X.var(axis=0))
    np.testing.assert_allclose(s["pct_zero"], 100 * (X == 0).mean())
    np.testing.assert_allclose(s["target_mean"], [0, 3], atol=1e-12)
    assert s["target_var"][1] == 0
    # Most variable neuron comes first in the trace payload.
    assert qc["traces"]["neuron_indices"][0] == 1
    assert qc["traces"]["time_unit"] == "s"
    json.dumps(qc)  # fully serialisable


def test_trace_window_is_bounded(rng: np.random.Generator) -> None:
    X = rng.poisson(2.0, size=(10_000, 40)).astype(float)
    qc = compute_qc(SessionData(X=X, Y=rng.standard_normal((10_000, 2))), max_trace_points=1500)
    assert qc["traces"]["window_bins"] == 1500
    assert all(len(t) == 1500 for t in qc["traces"]["neurons"])
    assert len(qc["traces"]["neurons"]) == 6
    assert qc["traces"]["time_unit"] == "bin"
    assert sum(qc["targets"]["histograms"][0]["counts"]) == 10_000
