"""Train/test splitting, feature normalisation and cross-session neuron alignment.

Conventions (see docs/DESIGN.md §2):

* Splits are contiguous blocks in time — never shuffled — because neighbouring bins are
  strongly autocorrelated and shuffling would leak information into the test set.
* Normalisation statistics come from the training block only and are applied unchanged
  to any test data, including other sessions. Features with zero variance in the
  training block are dropped.
"""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np

ZERO_VARIANCE_EPS = 1e-12
MIN_BLOCK_SAMPLES = 5


class AlignmentError(ValueError):
    """Two sessions cannot be compared neuron-by-neuron."""


def contiguous_split(n_samples: int, train_fraction: float = 0.8) -> tuple[slice, slice]:
    """Split ``range(n_samples)`` into a leading training block and a trailing test block."""
    if not 0.0 < train_fraction < 1.0:
        raise ValueError("train_fraction must be in (0, 1)")
    cut = int(round(n_samples * train_fraction))
    if cut < MIN_BLOCK_SAMPLES or n_samples - cut < MIN_BLOCK_SAMPLES:
        raise ValueError(
            f"{n_samples} samples are too few for a {train_fraction:.0%}/{1 - train_fraction:.0%} split"
        )
    return slice(0, cut), slice(cut, n_samples)


@dataclass
class Normalizer:
    """Feature transform fitted on training data.

    ``keep`` marks features with non-zero training variance. With ``zscore`` the kept
    features are standardised with the *training* mean and SD; otherwise they are passed
    through unchanged (the decoder's intercept absorbs the mean).
    """

    keep: np.ndarray
    mean: np.ndarray
    std: np.ndarray
    zscore: bool

    @property
    def n_features_in(self) -> int:
        return int(self.keep.size)

    @property
    def n_kept(self) -> int:
        return int(self.keep.sum())

    @property
    def n_dropped(self) -> int:
        return self.n_features_in - self.n_kept

    def transform(self, X: np.ndarray) -> np.ndarray:
        if X.shape[1] != self.keep.size:
            raise ValueError(f"expected {self.keep.size} features, got {X.shape[1]}")
        Xk = X[:, self.keep]
        if not self.zscore:
            return Xk
        return (Xk - self.mean) / self.std


def fit_normalizer(X_train: np.ndarray, zscore: bool = True) -> Normalizer:
    """Fit a :class:`Normalizer` on the training block only."""
    var = X_train.var(axis=0)
    keep = var > ZERO_VARIANCE_EPS
    if not keep.any():
        raise ValueError("All features have zero variance in the training data")
    mean = X_train[:, keep].mean(axis=0)
    std = np.sqrt(var[keep])
    return Normalizer(keep=keep, mean=mean, std=std, zscore=zscore)


@dataclass
class Alignment:
    """Column indices into session A and session B that refer to the same neurons."""

    idx_a: np.ndarray
    idx_b: np.ndarray
    method: str  # "neuron_ids" or "index"
    warning: str | None = None

    @property
    def n_shared(self) -> int:
        return int(self.idx_a.size)

    def is_identity_for_a(self, n_a: int) -> bool:
        return self.idx_a.size == n_a and bool(np.all(self.idx_a == np.arange(n_a)))


def align_neurons(
    ids_a: np.ndarray | None, ids_b: np.ndarray | None, n_a: int, n_b: int
) -> Alignment:
    """Match neurons between two sessions.

    * Both sessions have ``neuron_ids``: use the intersection (IDs compared as strings,
      so ``7`` and ``"7"`` match), ordered by ID — the same order in both sessions.
    * Neither has IDs: require equal feature counts and assume column *i* is the same
      unit in both (returned with a warning).
    * Only one has IDs: refuse, because any matching would be a guess.
    """
    if ids_a is not None and ids_b is not None:
        _, idx_a, idx_b = np.intersect1d(
            ids_a.astype(str), ids_b.astype(str), assume_unique=True, return_indices=True
        )
        if idx_a.size == 0:
            raise AlignmentError("The two sessions share no neuron_ids")
        return Alignment(idx_a=idx_a, idx_b=idx_b, method="neuron_ids")
    if ids_a is None and ids_b is None:
        if n_a != n_b:
            raise AlignmentError(
                f"Sessions have no neuron_ids and different neuron counts ({n_a} vs {n_b}); "
                "neuron identity cannot be established"
            )
        idx = np.arange(n_a)
        return Alignment(
            idx_a=idx,
            idx_b=idx.copy(),
            method="index",
            warning="No neuron_ids: column i is assumed to be the same unit in both sessions",
        )
    raise AlignmentError("Only one of the two sessions has neuron_ids; units cannot be matched")
