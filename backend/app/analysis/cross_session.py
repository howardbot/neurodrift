"""Cross-session decoder generalisation (train on session i, test on session j).

Split semantics (identical for every cell, including the diagonal):

* the decoder for row *i* is trained on the first ``train_fraction`` of session *i*;
* every cell in column *j* is evaluated on the last ``1 - train_fraction`` of session *j*.

So the diagonal is a held-out within-session estimate, every decoder sees the same
amount of training data regardless of the test session, and each column shares one
test block. For each pair the features are restricted to the neurons the two sessions
share (:func:`align_neurons`); normalisation statistics come from the training block
of session *i* only and are applied unchanged to session *j*.

This module is independent of the web stack: sessions are supplied by a loader
callback so the caller controls memory use (at most two sessions need to be resident).
"""

from __future__ import annotations

from collections.abc import Callable
from typing import Any

import numpy as np

from app.analysis.dataset import SessionData
from app.analysis.decoding import DecoderConfig, FittedDecoder, fit_decoder, regression_metrics
from app.analysis.preprocessing import AlignmentError, align_neurons, contiguous_split

SessionLoader = Callable[[int], SessionData]
ProgressCallback = Callable[[float], None]

MATRIX_KEYS = ("mean_r", "mean_r2", "mean_rmse", "n_shared", "n_used")


def check_outputs(n_outputs: list[int], outputs: tuple[int, ...] | None) -> None:
    """Raise ``ValueError`` unless the selected outputs exist in every session."""
    if outputs is None:
        if len(set(n_outputs)) > 1:
            raise ValueError(
                f"Sessions have different numbers of outputs ({sorted(set(n_outputs))}); "
                "select output dimensions explicitly"
            )
        return
    bad = [o for o in outputs if not all(0 <= o < n for n in n_outputs)]
    if bad:
        raise ValueError(f"Output indices {bad} do not exist in every session")


def cross_session_decoding(
    load: SessionLoader,
    n_sessions: int,
    config: DecoderConfig,
    train_fraction: float = 0.8,
    progress: ProgressCallback | None = None,
) -> dict[str, Any]:
    """Compute the N × N decoder generalisation matrix.

    Returns ``{"matrices": {key: N×N list}, "cells": N×N list of dicts, "sessions": [...]}``.
    Cells that cannot be computed (e.g. neurons cannot be aligned) have
    ``status == "unavailable"`` with a ``reason`` and ``None`` in every matrix.
    """
    matrices: dict[str, list[list[Any]]] = {k: [[None] * n_sessions for _ in range(n_sessions)] for k in MATRIX_KEYS}
    cells: list[list[dict[str, Any]]] = [[{} for _ in range(n_sessions)] for _ in range(n_sessions)]
    sessions: list[dict[str, Any]] = []

    for i in range(n_sessions):
        train_data = load(i)
        train, _ = contiguous_split(train_data.n_samples, train_fraction)
        Y_train = config.select_outputs(train_data.Y)[train]
        X_train = train_data.X[train]
        fits: dict[bytes, FittedDecoder] = {}
        sessions.append(
            {
                "n_samples": train_data.n_samples,
                "n_neurons": train_data.n_neurons,
                "n_train": train.stop - train.start,
                "n_test": train_data.n_samples - (train.stop - train.start),
            }
        )

        for j in range(n_sessions):
            test_data = train_data if j == i else load(j)
            _, test = contiguous_split(test_data.n_samples, train_fraction)
            try:
                alignment = align_neurons(
                    train_data.neuron_ids, test_data.neuron_ids, train_data.n_neurons, test_data.n_neurons
                )
            except AlignmentError as exc:
                cells[i][j] = {"status": "unavailable", "reason": str(exc)}
                continue

            key = alignment.idx_a.tobytes()
            if key not in fits:
                try:
                    fits[key] = fit_decoder(X_train[:, alignment.idx_a], Y_train, config)
                except ValueError as exc:
                    cells[i][j] = {"status": "unavailable", "reason": str(exc)}
                    continue
            decoder = fits[key]
            Y_test = config.select_outputs(test_data.Y)[test]
            Y_pred = decoder.predict(test_data.X[test][:, alignment.idx_b])
            metrics = regression_metrics(Y_test, Y_pred).to_dict()

            cell = {
                "status": "ok",
                "metrics": metrics,
                "n_shared": alignment.n_shared,
                "n_used": decoder.normalizer.n_kept,
                "n_dropped_zero_variance": decoder.normalizer.n_dropped,
                "alignment": alignment.method,
                "warning": alignment.warning,
                "n_train": decoder.n_train,
                "n_test": int(Y_test.shape[0]),
            }
            cells[i][j] = cell
            for k in ("mean_r", "mean_r2", "mean_rmse"):
                value = metrics[k]
                matrices[k][i][j] = None if value is None else round(float(value), 6)
            matrices["n_shared"][i][j] = alignment.n_shared
            matrices["n_used"][i][j] = decoder.normalizer.n_kept
            del test_data, Y_test, Y_pred

        del train_data, X_train, Y_train, fits
        if progress is not None:
            progress((i + 1) / n_sessions)

    return {"matrices": matrices, "cells": cells, "sessions": sessions}


def summarise_matrix(matrix: list[list[float | None]]) -> dict[str, float | None]:
    """Mean diagonal (within-session) vs mean off-diagonal (cross-session) value."""
    arr = np.array([[np.nan if v is None else v for v in row] for row in matrix], dtype=float)
    n = arr.shape[0]
    diag = np.diag(arr)
    off = arr[~np.eye(n, dtype=bool)]
    def nanmean(a: np.ndarray) -> float | None:
        a = a[np.isfinite(a)]
        return float(a.mean()) if a.size else None
    return {"mean_diagonal": nanmean(diag), "mean_off_diagonal": nanmean(off)}


def per_session_summary(
    decoder_r: list[list[float | None]], angles: list[list[float | None]] | None = None
) -> list[dict[str, float | None]]:
    """Per-session view of the train × test matrices (rows train, columns test).

    For session *i*: the within-session value (diagonal), the mean over the other
    sessions when *i* is the training session (row, "out") and when *i* is the test
    session (column, "in"). Diagonal cells are excluded from the transfer means and
    missing cells are ignored. ``angles`` (mean principal angle, degrees) is optional
    because experiments run before subspace analysis existed have none.
    """

    def mean(values: list[float | None]) -> float | None:
        finite = [float(v) for v in values if v is not None and np.isfinite(v)]
        return float(np.mean(finite)) if finite else None

    n = len(decoder_r)
    rows: list[dict[str, float | None]] = []
    for i in range(n):
        row: dict[str, float | None] = {
            "within_r": decoder_r[i][i],
            "out_transfer_r": mean([decoder_r[i][j] for j in range(n) if j != i]),
            "in_transfer_r": mean([decoder_r[j][i] for j in range(n) if j != i]),
            "within_angle": None,
            "out_mean_angle": None,
            "in_mean_angle": None,
        }
        if angles is not None:
            row.update(
                within_angle=angles[i][i],
                out_mean_angle=mean([angles[i][j] for j in range(n) if j != i]),
                in_mean_angle=mean([angles[j][i] for j in range(n) if j != i]),
            )
        rows.append(row)
    return rows


def summarise_by_distance(matrix: list[list[float | None]]) -> list[dict[str, Any]]:
    """Mean value of the cells at each session distance ``d = |i - j|``.

    Distance counts positions in the experiment's session order (not days). Distance 0
    is the diagonal (within-session reference). Missing cells are excluded; a distance
    with no available cells has ``mean is None``. Cells at the same distance share
    sessions, so the means are descriptive, not independent samples.
    """
    arr = np.array([[np.nan if v is None else v for v in row] for row in matrix], dtype=float)
    n = arr.shape[0]
    rows, cols = np.indices((n, n))
    distance = np.abs(rows - cols)
    out: list[dict[str, Any]] = []
    for d in range(n):
        values = arr[distance == d]
        values = values[np.isfinite(values)]
        out.append({"distance": d, "mean": float(values.mean()) if values.size else None, "n_pairs": int(values.size)})
    return out


SUBSPACE_KEYS = ("mean_angle", "max_angle", "projection_distance", "alignment_index", "chance_mean_angle", "n_used")


def cross_session_subspaces(
    load: SessionLoader,
    n_sessions: int,
    n_components: int,
    zscore: bool = True,
    train_fraction: float = 0.8,
    seed: int = 42,
    progress: ProgressCallback | None = None,
) -> dict[str, Any]:
    """N × N neural-subspace comparison using the same data blocks as the decoder matrix.

    Cell (i, j) compares a PCA fit on the *training* block of session i with an
    independent PCA fit on the *test* block of session j, restricted to their shared
    neurons. Each cell therefore describes exactly the data behind decoder cell (i, j),
    and the diagonal (first vs last block of the same session) is a within-session
    reference that includes estimation noise and within-session non-stationarity.
    """
    from app.analysis.subspace import compare_subspaces

    matrices: dict[str, list[list[Any]]] = {k: [[None] * n_sessions for _ in range(n_sessions)] for k in SUBSPACE_KEYS}
    cells: list[list[dict[str, Any]]] = [[{} for _ in range(n_sessions)] for _ in range(n_sessions)]
    for i in range(n_sessions):
        a = load(i)
        train, _ = contiguous_split(a.n_samples, train_fraction)
        for j in range(n_sessions):
            b = a if j == i else load(j)
            _, test = contiguous_split(b.n_samples, train_fraction)
            try:
                al = align_neurons(a.neuron_ids, b.neuron_ids, a.n_neurons, b.n_neurons)
                out = compare_subspaces(
                    a.X[train][:, al.idx_a], b.X[test][:, al.idx_b], n_components, zscore=zscore, seed=seed
                )
            except (AlignmentError, ValueError) as exc:
                cells[i][j] = {"status": "unavailable", "reason": str(exc)}
                continue
            out.pop("explained_variance_a")
            out.pop("explained_variance_b")
            cells[i][j] = {"status": "ok", "n_shared": al.n_shared, "alignment": al.method, **out}
            for key in SUBSPACE_KEYS:
                value = out["n_neurons_used"] if key == "n_used" else out[key]
                matrices[key][i][j] = round(float(value), 4) if key != "n_used" else int(value)
            del b
        del a
        if progress is not None:
            progress((i + 1) / n_sessions)
    return {"matrices": matrices, "cells": cells, "n_components": n_components, "zscore": zscore}
