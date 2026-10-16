"""Pair comparison (train session A → test session B) for one experiment's settings.

Recomputed on request from the raw files (a few hundred ms for typical sessions) so the
plots can show predictions; scalar results match the stored experiment matrices.
"""

from __future__ import annotations

from typing import Any

import numpy as np

from app.analysis.activity import activity_drift
from app.analysis.behavior import behaviour_comparison
from app.analysis.decoding import fit_decoder, regression_metrics
from app.analysis.preprocessing import AlignmentError, align_neurons, contiguous_split
from app.analysis.subspace import compare_subspaces, variance_capture_curves
from app.models import Experiment, RecordingSession
from app.services import ingest
from app.services.experiments import decoder_config


def _round(a: np.ndarray, digits: int = 4) -> list[float]:
    return [float(v) for v in np.round(a, digits)]


def _session_meta(s: RecordingSession) -> dict[str, Any]:
    return {
        "id": str(s.id),
        "name": s.name,
        "subject": s.subject,
        "recording_date": s.recording_date.isoformat() if s.recording_date else None,
        "bin_size_ms": s.bin_size_ms,
        "n_samples": s.n_samples,
        "n_neurons": s.n_neurons,
        "n_outputs": s.n_outputs,
        "n_trials": s.qc_summary.get("n_trials"),
        "duration_s": s.duration_s,
        "pct_zero": s.qc_summary.get("pct_zero"),
        "has_neuron_ids": s.has_neuron_ids,
    }


def _stored(experiment: Experiment, i: int, j: int) -> dict[str, Any]:
    result = experiment.result
    if result is None:
        return {}
    r = result.decoder["matrices"]["mean_r"]
    out: dict[str, Any] = {"within_train_r": r[i][i], "within_test_r": r[j][j], "transfer_r": r[i][j]}
    if result.subspace:
        angles = result.subspace["matrices"]["mean_angle"]
        out.update(within_train_angle=angles[i][i], within_test_angle=angles[j][j])
    return out


def compare_pair(
    experiment: Experiment, train: RecordingSession, test: RecordingSession, max_points: int = 1500
) -> dict[str, Any]:
    ids = [ref["id"] for ref in experiment.sessions]
    i, j = ids.index(str(train.id)), ids.index(str(test.id))
    config = decoder_config(experiment.config)
    train_fraction = float(experiment.config["train_fraction"])
    a = ingest.load_session_data(train)
    b = a if train.id == test.id else ingest.load_session_data(test)
    Y_a, Y_b = config.select_outputs(a.Y), config.select_outputs(b.Y)
    tr, _ = contiguous_split(a.n_samples, train_fraction)
    _, te = contiguous_split(b.n_samples, train_fraction)

    payload: dict[str, Any] = {
        "experiment": {"id": str(experiment.id), "name": experiment.name, "config": experiment.config},
        "train": _session_meta(train),
        "test": _session_meta(test),
        "indices": [i, j],
        "outputs": config.output_indices(a.n_outputs),
        "reference": _stored(experiment, i, j),
        "behaviour": behaviour_comparison(Y_a, Y_b),
        "alignment": None,
        "decoder": None,
        "representation": None,
        "activity": None,
    }
    try:
        al = align_neurons(a.neuron_ids, b.neuron_ids, a.n_neurons, b.n_neurons)
    except AlignmentError as exc:
        payload["alignment_error"] = str(exc)
        return payload

    payload["alignment"] = {"method": al.method, "n_shared": al.n_shared, "warning": al.warning}
    X_a, X_b = a.X[:, al.idx_a], b.X[:, al.idx_b]

    decoder = fit_decoder(X_a[tr], Y_a[tr], config)
    Y_test = Y_b[te]
    Y_pred = decoder.predict(X_b[te])
    window = min(len(Y_test), max_points)
    t = b.timestamps[te][:window] if b.timestamps is not None else np.arange(te.start, te.start + window, dtype=float)
    rng = np.random.default_rng(experiment.random_seed)
    idx = np.sort(rng.choice(len(Y_test), size=min(len(Y_test), 2000), replace=False))
    payload["decoder"] = {
        "metrics": regression_metrics(Y_test, Y_pred).to_dict(),
        "n_used": decoder.normalizer.n_kept,
        "n_train": decoder.n_train,
        "n_test": int(len(Y_test)),
        "traces": {
            "time": _round(t),
            "time_unit": "s" if b.timestamps is not None else "bin",
            "actual": [_round(Y_test[:window, k]) for k in range(Y_test.shape[1])],
            "predicted": [_round(Y_pred[:window, k]) for k in range(Y_test.shape[1])],
        },
        "scatter": {
            "actual": [_round(Y_test[idx, k]) for k in range(Y_test.shape[1])],
            "predicted": [_round(Y_pred[idx, k]) for k in range(Y_test.shape[1])],
        },
    }

    k = int(experiment.config["n_components"])
    zscore = bool(experiment.config["zscore"])
    try:
        rep = compare_subspaces(X_a[tr], X_b[te], k, zscore=zscore, seed=experiment.random_seed)
        rep["variance_capture"] = variance_capture_curves(X_a[tr], X_b[te], k, zscore=zscore)
        payload["representation"] = rep
    except ValueError as exc:
        payload["representation_error"] = str(exc)

    labels = [str(v) for v in a.neuron_ids[al.idx_a]] if a.neuron_ids is not None else [str(v) for v in al.idx_a]
    count_like = bool(train.qc_summary.get("count_like") and test.qc_summary.get("count_like"))
    same_bins = train.bin_size_ms is not None and train.bin_size_ms == test.bin_size_ms
    bin_s = train.bin_size_ms / 1000 if (count_like and same_bins and train.bin_size_ms) else None
    payload["activity"] = activity_drift(X_a, X_b, labels, bin_size_s=bin_s)
    return payload
