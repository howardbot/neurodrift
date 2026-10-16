"""Loading and validating NeuroDrift session files (.npz).

A session file is a NumPy ``.npz`` archive with

* ``X`` — (n_samples, n_neurons) neural features, e.g. binned spike counts (required)
* ``Y`` — (n_samples, n_outputs) behavioural targets, e.g. x/y velocity (required;
  a 1-D array is accepted as a single output)
* ``timestamps`` — (n_samples,) bin times in seconds (optional)
* ``trial_ids`` — (n_samples,) integer trial labels (optional)
* ``neuron_ids`` — (n_neurons,) unique integer or string unit identifiers (optional)

Files are always opened with ``allow_pickle=False`` so that no Python objects can be
deserialised. This module has no web or database dependencies.
"""

from __future__ import annotations

import zipfile
from dataclasses import dataclass, field
from pathlib import Path

import numpy as np

REQUIRED_KEYS = ("X", "Y")
OPTIONAL_KEYS = ("timestamps", "trial_ids", "neuron_ids")
MIN_SAMPLES = 10
MIN_DECODING_SAMPLES = 25  # 80/20 split with at least 5 bins in each block

_NUMERIC_KINDS = "biuf"  # bool, signed int, unsigned int, float


class DatasetValidationError(ValueError):
    """Raised when a session file is unusable. ``errors`` lists every problem found."""

    def __init__(self, errors: list[str]):
        super().__init__("; ".join(errors))
        self.errors = errors


@dataclass
class SessionData:
    X: np.ndarray  # float64, (n_samples, n_neurons)
    Y: np.ndarray  # float64, (n_samples, n_outputs)
    timestamps: np.ndarray | None = None
    trial_ids: np.ndarray | None = None
    neuron_ids: np.ndarray | None = None
    warnings: list[str] = field(default_factory=list)

    @property
    def n_samples(self) -> int:
        return int(self.X.shape[0])

    @property
    def n_neurons(self) -> int:
        return int(self.X.shape[1])

    @property
    def n_outputs(self) -> int:
        return int(self.Y.shape[1])

    @property
    def duration_s(self) -> float | None:
        if self.timestamps is None or self.n_samples < 2:
            return None
        return float(self.timestamps[-1] - self.timestamps[0])


def _check_archive(path: Path, max_uncompressed_bytes: int) -> list[str]:
    """Inspect the zip container before NumPy touches it (zip-bomb and junk guard)."""
    if not zipfile.is_zipfile(path):
        return ["File is not a valid .npz archive (not a zip container)."]
    with zipfile.ZipFile(path) as zf:
        infos = zf.infolist()
        if not infos:
            return ["The .npz archive is empty."]
        bad = [i.filename for i in infos if not i.filename.endswith(".npy")]
        if bad:
            return [f"Archive contains non-array members: {', '.join(bad[:5])}."]
        total = sum(i.file_size for i in infos)
        if total > max_uncompressed_bytes:
            return [
                f"Uncompressed size {total / 1e6:.0f} MB exceeds the limit of "
                f"{max_uncompressed_bytes / 1e6:.0f} MB."
            ]
    return []


def _read_array(npz: np.lib.npyio.NpzFile, key: str, errors: list[str]) -> np.ndarray | None:
    try:
        return np.asarray(npz[key])
    except ValueError as exc:
        if "allow_pickle" in str(exc):
            errors.append(
                f"'{key}' is an object array; only numeric (or, for neuron_ids, string) "
                "arrays are supported."
            )
        else:
            errors.append(f"'{key}' could not be read: {exc}")
    except Exception as exc:  # corrupt member, bad header, ...
        errors.append(f"'{key}' could not be read: {exc}")
    return None


def _check_numeric(name: str, arr: np.ndarray, errors: list[str], kinds: str = _NUMERIC_KINDS) -> bool:
    if arr.dtype.kind not in kinds:
        errors.append(f"'{name}' has unsupported dtype {arr.dtype}; expected a numeric array.")
        return False
    return True


def _check_finite(name: str, arr: np.ndarray, errors: list[str]) -> None:
    if arr.dtype.kind != "f":
        return
    n_nan = int(np.isnan(arr).sum())
    n_inf = int(np.isinf(arr).sum())
    if n_nan:
        errors.append(f"'{name}' contains {n_nan} NaN value(s).")
    if n_inf:
        errors.append(f"'{name}' contains {n_inf} infinite value(s).")


def load_session(path: str | Path, max_uncompressed_bytes: int = 4 * 1024**3) -> SessionData:
    """Load and validate a session file.

    Raises :class:`DatasetValidationError` listing *all* problems found, so the user
    can fix a file in one round trip.
    """
    path = Path(path)
    errors = _check_archive(path, max_uncompressed_bytes)
    if errors:
        raise DatasetValidationError(errors)

    warnings: list[str] = []
    try:
        npz = np.load(path, allow_pickle=False)
    except Exception as exc:
        raise DatasetValidationError([f"File could not be opened as .npz: {exc}"]) from exc

    with npz:
        keys = set(npz.files)
        missing = [k for k in REQUIRED_KEYS if k not in keys]
        if missing:
            errors.extend(f"Missing required array '{k}'." for k in missing)
        ignored = sorted(keys - set(REQUIRED_KEYS) - set(OPTIONAL_KEYS))
        if ignored:
            warnings.append(f"Ignored unrecognised arrays: {', '.join(ignored)}.")
        arrays = {k: _read_array(npz, k, errors) for k in (*REQUIRED_KEYS, *OPTIONAL_KEYS) if k in keys}

    if errors:
        raise DatasetValidationError(errors)

    X, Y = arrays["X"], arrays["Y"]
    assert X is not None and Y is not None
    ok_x = _check_numeric("X", X, errors)
    ok_y = _check_numeric("Y", Y, errors)

    if ok_x:
        if X.ndim != 2:
            errors.append(f"'X' must be 2-D (n_samples, n_neurons); got shape {X.shape}.")
        else:
            if X.shape[0] == 0:
                errors.append("'X' has zero samples.")
            if X.shape[1] == 0:
                errors.append("'X' has zero neurons/features.")
    if ok_y:
        if Y.ndim == 1:
            Y = Y[:, None]
            warnings.append("'Y' is 1-D; treated as a single behavioural output.")
        if Y.ndim != 2:
            errors.append(f"'Y' must be 2-D (n_samples, n_outputs); got shape {Y.shape}.")
        elif Y.shape[1] == 0:
            errors.append("'Y' has zero output dimensions.")
    if ok_x and ok_y and X.ndim == 2 and Y.ndim == 2 and X.shape[0] != Y.shape[0]:
        errors.append(
            f"Sample count mismatch: X has {X.shape[0]} rows but Y has {Y.shape[0]}."
        )
    if ok_x:
        _check_finite("X", X, errors)
    if ok_y:
        _check_finite("Y", Y, errors)
    if errors:
        raise DatasetValidationError(errors)

    n_samples, n_neurons = X.shape
    if n_samples < MIN_SAMPLES:
        errors.append(f"At least {MIN_SAMPLES} samples are required; got {n_samples}.")
    elif n_samples < MIN_DECODING_SAMPLES:
        warnings.append(
            f"Only {n_samples} samples: enough for QC, but too few for decoding with an 80/20 split "
            f"(needs {MIN_DECODING_SAMPLES})."
        )

    timestamps = arrays.get("timestamps")
    if timestamps is not None and _check_numeric("timestamps", timestamps, errors):
        if timestamps.ndim != 1 or timestamps.shape[0] != n_samples:
            errors.append(
                f"'timestamps' must have shape ({n_samples},); got {timestamps.shape}."
            )
        else:
            _check_finite("timestamps", timestamps, errors)
            timestamps = timestamps.astype(np.float64)
            if n_samples > 1 and np.any(np.diff(timestamps) < 0):
                warnings.append("'timestamps' are not monotonically non-decreasing.")

    trial_ids = arrays.get("trial_ids")
    if trial_ids is not None and _check_numeric("trial_ids", trial_ids, errors, kinds="biu"):
        if trial_ids.ndim != 1 or trial_ids.shape[0] != n_samples:
            errors.append(f"'trial_ids' must have shape ({n_samples},); got {trial_ids.shape}.")

    neuron_ids = arrays.get("neuron_ids")
    if neuron_ids is not None:
        if neuron_ids.dtype.kind not in "iuU":
            errors.append(
                f"'neuron_ids' has unsupported dtype {neuron_ids.dtype}; use integers or strings."
            )
        elif neuron_ids.ndim != 1 or neuron_ids.shape[0] != n_neurons:
            errors.append(f"'neuron_ids' must have shape ({n_neurons},); got {neuron_ids.shape}.")
        elif np.unique(neuron_ids).size != n_neurons:
            errors.append("'neuron_ids' contains duplicate identifiers.")

    if errors:
        raise DatasetValidationError(errors)

    return SessionData(
        X=X.astype(np.float64, copy=False),
        Y=Y.astype(np.float64, copy=False),
        timestamps=timestamps,
        trial_ids=trial_ids,
        neuron_ids=neuron_ids,
        warnings=warnings,
    )


def save_session(path: str | Path, data: SessionData) -> None:
    """Write a session in the canonical format (used by the demo generator and tests)."""
    arrays: dict[str, np.ndarray] = {"X": data.X, "Y": data.Y}
    for key in OPTIONAL_KEYS:
        value = getattr(data, key)
        if value is not None:
            arrays[key] = value
    # Write through a file handle so NumPy does not append ".npz" to the name.
    with open(path, "wb") as fh:
        np.savez_compressed(fh, **arrays)  # type: ignore[arg-type]
