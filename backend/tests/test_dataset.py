"""Upload validation: every malformed file must be rejected with a useful message."""

import zipfile
from pathlib import Path

import numpy as np
import pytest

from app.analysis.dataset import DatasetValidationError, SessionData, load_session, save_session
from tests.helpers import simple_session, write_npz


def _errors(path: Path, **kwargs: int) -> list[str]:
    with pytest.raises(DatasetValidationError) as info:
        load_session(path, **kwargs)
    return info.value.errors


def test_valid_session_loads(tmp_path: Path, rng: np.random.Generator) -> None:
    arrays = simple_session(rng, n=300, k=8)
    data = load_session(write_npz(tmp_path / "s.npz", **arrays))
    assert (data.n_samples, data.n_neurons, data.n_outputs) == (300, 8, 2)
    assert data.X.dtype == np.float64
    assert data.duration_s == pytest.approx(299 * 0.02)
    assert data.warnings == []


def test_missing_x_and_y_both_reported(tmp_path: Path) -> None:
    errors = _errors(write_npz(tmp_path / "s.npz", foo=np.zeros(3)))
    assert any("'X'" in e for e in errors) and any("'Y'" in e for e in errors)


def test_sample_count_mismatch(tmp_path: Path) -> None:
    errors = _errors(write_npz(tmp_path / "s.npz", X=np.zeros((20, 3)), Y=np.zeros((19, 2))))
    assert any("mismatch" in e for e in errors)


@pytest.mark.parametrize("bad", [np.nan, np.inf])
def test_non_finite_values(tmp_path: Path, bad: float) -> None:
    X = np.ones((20, 3))
    X[4, 1] = bad
    errors = _errors(write_npz(tmp_path / "s.npz", X=X, Y=np.zeros((20, 2))))
    assert any(("NaN" if np.isnan(bad) else "infinite") in e for e in errors)


def test_zero_neurons_and_zero_samples(tmp_path: Path) -> None:
    errors = _errors(write_npz(tmp_path / "a.npz", X=np.zeros((20, 0)), Y=np.zeros((20, 1))))
    assert any("zero neurons" in e for e in errors)
    errors = _errors(write_npz(tmp_path / "b.npz", X=np.zeros((0, 4)), Y=np.zeros((0, 1))))
    assert any("zero samples" in e for e in errors)


def test_invalid_dimensionality(tmp_path: Path) -> None:
    errors = _errors(write_npz(tmp_path / "s.npz", X=np.zeros(20), Y=np.zeros((20, 1))))
    assert any("must be 2-D" in e for e in errors)
    errors = _errors(write_npz(tmp_path / "t.npz", X=np.zeros((20, 2)), Y=np.zeros((20, 1, 1))))
    assert any("must be 2-D" in e for e in errors)


def test_one_dimensional_y_is_accepted_with_warning(tmp_path: Path) -> None:
    data = load_session(write_npz(tmp_path / "s.npz", X=np.ones((20, 3)), Y=np.arange(20.0)))
    assert data.Y.shape == (20, 1)
    assert any("1-D" in w for w in data.warnings)


def test_object_arrays_are_never_unpickled(tmp_path: Path) -> None:
    X = np.empty((20, 2), dtype=object)
    X[:] = 1
    errors = _errors(write_npz(tmp_path / "s.npz", X=X, Y=np.zeros((20, 1))))
    assert any("object array" in e for e in errors)


def test_non_numeric_dtypes_rejected(tmp_path: Path) -> None:
    errors = _errors(
        write_npz(tmp_path / "s.npz", X=np.ones((20, 2), dtype=complex), Y=np.zeros((20, 1)))
    )
    assert any("unsupported dtype" in e for e in errors)


def test_not_a_zip(tmp_path: Path) -> None:
    path = tmp_path / "s.npz"
    path.write_bytes(b"definitely not numpy")
    assert any("not a valid .npz" in e for e in _errors(path))


def test_archive_with_foreign_members(tmp_path: Path) -> None:
    path = tmp_path / "s.npz"
    with zipfile.ZipFile(path, "w") as zf:
        zf.writestr("X.npy", b"")
        zf.writestr("payload.py", b"print('hi')")
    assert any("non-array members" in e for e in _errors(path))


def test_uncompressed_size_limit(tmp_path: Path) -> None:
    path = write_npz(tmp_path / "s.npz", X=np.zeros((1000, 50)), Y=np.zeros((1000, 2)))
    assert any("exceeds the limit" in e for e in _errors(path, max_uncompressed_bytes=1000))


def test_optional_array_shapes(tmp_path: Path) -> None:
    errors = _errors(
        write_npz(
            tmp_path / "s.npz",
            X=np.ones((20, 3)),
            Y=np.zeros((20, 1)),
            timestamps=np.arange(19.0),
            trial_ids=np.zeros(20),
            neuron_ids=np.array([1, 1, 2]),
        )
    )
    joined = " ".join(errors)
    assert "'timestamps' must have shape" in joined
    assert "'trial_ids' has unsupported dtype" in joined
    assert "duplicate" in joined


def test_too_few_samples(tmp_path: Path) -> None:
    errors = _errors(write_npz(tmp_path / "s.npz", X=np.ones((5, 3)), Y=np.zeros((5, 1))))
    assert any("At least" in e for e in errors)


def test_unknown_keys_warn_and_string_ids_allowed(tmp_path: Path) -> None:
    data = load_session(
        write_npz(
            tmp_path / "s.npz",
            X=np.ones((20, 3)),
            Y=np.zeros((20, 1)),
            neuron_ids=np.array(["e1u1", "e1u2", "e2u1"]),
            extra=np.zeros(2),
        )
    )
    assert data.neuron_ids is not None and data.neuron_ids.dtype.kind == "U"
    assert any("extra" in w for w in data.warnings)


def test_save_round_trip(tmp_path: Path, rng: np.random.Generator) -> None:
    arrays = simple_session(rng, n=50, k=4)
    path = tmp_path / "raw.npz.part"
    save_session(path, SessionData(**{k: v for k, v in arrays.items()}))
    assert path.exists() and not (tmp_path / "raw.npz.part.npz").exists()
    data = load_session(path)
    np.testing.assert_array_equal(data.X, arrays["X"])
    np.testing.assert_array_equal(data.neuron_ids, arrays["neuron_ids"])
