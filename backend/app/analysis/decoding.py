"""Linear neural decoders and their evaluation.

The decoder maps one time bin of neural features to the same bin of behaviour
(no lags/history). Two estimators are available:

* ``ridge`` — ``sklearn.linear_model.Ridge(alpha)``, the default;
* ``linear`` — ordinary least squares (``LinearRegression``).

Both fit an intercept. Metrics are computed per behavioural output and averaged:
Pearson correlation (the headline metric), coefficient of determination R² and RMSE.
Metrics that are undefined (e.g. Pearson r when predictions or targets are constant)
are reported as ``None`` and excluded from the averages, with a count, rather than
propagating NaN.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Literal

import numpy as np
from sklearn.linear_model import LinearRegression, Ridge

from app.analysis.dataset import SessionData
from app.analysis.preprocessing import Normalizer, contiguous_split, fit_normalizer

DecoderKind = Literal["ridge", "linear"]


@dataclass(frozen=True)
class DecoderConfig:
    kind: DecoderKind = "ridge"
    alpha: float = 1.0
    zscore: bool = True
    outputs: tuple[int, ...] | None = None  # output columns of Y; None = all

    def select_outputs(self, Y: np.ndarray) -> np.ndarray:
        if self.outputs is None:
            return Y
        bad = [o for o in self.outputs if not 0 <= o < Y.shape[1]]
        if bad:
            raise ValueError(f"Output indices {bad} out of range for Y with {Y.shape[1]} columns")
        return Y[:, list(self.outputs)]

    def output_indices(self, n_outputs: int) -> list[int]:
        return list(self.outputs) if self.outputs is not None else list(range(n_outputs))


@dataclass
class FittedDecoder:
    normalizer: Normalizer
    model: Ridge | LinearRegression
    config: DecoderConfig
    n_train: int

    def predict(self, X: np.ndarray) -> np.ndarray:
        return np.asarray(self.model.predict(self.normalizer.transform(X)))


def fit_decoder(X_train: np.ndarray, Y_train: np.ndarray, config: DecoderConfig) -> FittedDecoder:
    """Fit normalisation and decoder on training data only. ``Y_train`` must already
    contain only the selected outputs."""
    normalizer = fit_normalizer(X_train, zscore=config.zscore)
    if config.kind == "ridge":
        model: Ridge | LinearRegression = Ridge(alpha=config.alpha)
    elif config.kind == "linear":
        model = LinearRegression()
    else:
        raise ValueError(f"Unknown decoder kind: {config.kind}")
    model.fit(normalizer.transform(X_train), Y_train)
    return FittedDecoder(normalizer=normalizer, model=model, config=config, n_train=len(X_train))


def _pearson(a: np.ndarray, b: np.ndarray) -> float | None:
    sa, sb = a.std(), b.std()
    if sa < 1e-12 or sb < 1e-12:
        return None
    return float(np.mean((a - a.mean()) * (b - b.mean())) / (sa * sb))


def _r2(y: np.ndarray, p: np.ndarray) -> float | None:
    ss_tot = float(np.sum((y - y.mean()) ** 2))
    if ss_tot < 1e-12:
        return None
    return 1.0 - float(np.sum((y - p) ** 2)) / ss_tot


def _mean_defined(values: list[float | None]) -> float | None:
    defined = [v for v in values if v is not None]
    return float(np.mean(defined)) if defined else None


@dataclass
class Metrics:
    r: list[float | None]
    r2: list[float | None]
    rmse: list[float]
    mean_r: float | None = field(init=False)
    mean_r2: float | None = field(init=False)
    mean_rmse: float = field(init=False)
    n_undefined: int = field(init=False)

    def __post_init__(self) -> None:
        self.mean_r = _mean_defined(self.r)
        self.mean_r2 = _mean_defined(self.r2)
        self.mean_rmse = float(np.mean(self.rmse))
        self.n_undefined = sum(v is None for v in self.r) + sum(v is None for v in self.r2)

    def to_dict(self) -> dict[str, Any]:
        return {
            "r": self.r,
            "r2": self.r2,
            "rmse": self.rmse,
            "mean_r": self.mean_r,
            "mean_r2": self.mean_r2,
            "mean_rmse": self.mean_rmse,
            "n_undefined": self.n_undefined,
        }


def regression_metrics(Y_true: np.ndarray, Y_pred: np.ndarray) -> Metrics:
    """Per-output Pearson r, R² and RMSE (``Y`` arrays are (n_samples, n_outputs))."""
    if Y_true.shape != Y_pred.shape:
        raise ValueError(f"shape mismatch {Y_true.shape} vs {Y_pred.shape}")
    k = Y_true.shape[1]
    return Metrics(
        r=[_pearson(Y_true[:, j], Y_pred[:, j]) for j in range(k)],
        r2=[_r2(Y_true[:, j], Y_pred[:, j]) for j in range(k)],
        rmse=[float(np.sqrt(np.mean((Y_true[:, j] - Y_pred[:, j]) ** 2))) for j in range(k)],
    )


def _round(values: np.ndarray, digits: int = 4) -> list[float]:
    return [float(v) for v in np.round(values, digits)]


def evaluate_within_session(
    data: SessionData,
    config: DecoderConfig,
    train_fraction: float = 0.8,
    max_trace_points: int = 1500,
    max_scatter_points: int = 2000,
    seed: int = 42,
) -> dict[str, Any]:
    """Train on the first ``train_fraction`` of the session, test on the remainder.

    Returns metrics plus bounded plot payloads: the first ``max_trace_points`` bins of
    the test block (predicted and actual), and a random subsample of test bins for
    scatter plots (seeded, for reproducibility).
    """
    train, test = contiguous_split(data.n_samples, train_fraction)
    Y = config.select_outputs(data.Y)
    decoder = fit_decoder(data.X[train], Y[train], config)
    Y_test = Y[test]
    Y_pred = decoder.predict(data.X[test])
    metrics = regression_metrics(Y_test, Y_pred)

    n_test = Y_test.shape[0]
    window = min(n_test, max_trace_points)
    if data.timestamps is not None:
        t = data.timestamps[test][:window]
        time_unit = "s"
    else:
        t = np.arange(test.start, test.start + window, dtype=np.float64)
        time_unit = "bin"
    rng = np.random.default_rng(seed)
    scatter_idx = np.sort(rng.choice(n_test, size=min(n_test, max_scatter_points), replace=False))

    return {
        "config": {
            "decoder": config.kind,
            "alpha": config.alpha if config.kind == "ridge" else None,
            "zscore": config.zscore,
            "outputs": config.output_indices(data.n_outputs),
            "train_fraction": train_fraction,
        },
        "split": {
            "n_train": train.stop - train.start,
            "n_test": n_test,
            "train_bins": [train.start, train.stop],
            "test_bins": [test.start, test.stop],
        },
        "features": {
            "n_in": decoder.normalizer.n_features_in,
            "n_used": decoder.normalizer.n_kept,
            "n_dropped_zero_variance": decoder.normalizer.n_dropped,
        },
        "metrics": metrics.to_dict(),
        "traces": {
            "time": _round(t, 4),
            "time_unit": time_unit,
            "actual": [_round(Y_test[:window, j]) for j in range(Y.shape[1])],
            "predicted": [_round(Y_pred[:window, j]) for j in range(Y.shape[1])],
        },
        "scatter": {
            "actual": [_round(Y_test[scatter_idx, j]) for j in range(Y.shape[1])],
            "predicted": [_round(Y_pred[scatter_idx, j]) for j in range(Y.shape[1])],
        },
    }
