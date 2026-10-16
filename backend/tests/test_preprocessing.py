import numpy as np
import pytest

from app.analysis.preprocessing import AlignmentError, align_neurons, contiguous_split, fit_normalizer


def test_contiguous_split_is_ordered_and_complete() -> None:
    train, test = contiguous_split(1000, 0.8)
    assert (train.start, train.stop, test.start, test.stop) == (0, 800, 800, 1000)
    with pytest.raises(ValueError):
        contiguous_split(6, 0.8)
    with pytest.raises(ValueError):
        contiguous_split(100, 1.0)


def test_normalizer_uses_training_statistics_only(rng: np.random.Generator) -> None:
    X_train = rng.normal(5.0, 2.0, (500, 4))
    X_test = rng.normal(50.0, 20.0, (200, 4))  # very different distribution
    norm = fit_normalizer(X_train, zscore=True)
    Z_train, Z_test = norm.transform(X_train), norm.transform(X_test)
    np.testing.assert_allclose(Z_train.mean(0), 0, atol=1e-12)
    np.testing.assert_allclose(Z_train.std(0), 1, atol=1e-12)
    # Test data keeps its shift relative to training statistics: no re-centring.
    np.testing.assert_allclose(Z_test, (X_test - X_train.mean(0)) / X_train.std(0))
    assert Z_test.mean() > 10


def test_zero_variance_features_dropped_by_training_variance() -> None:
    X_train = np.column_stack([np.arange(10.0), np.full(10, 3.0), np.arange(10.0) ** 2])
    norm = fit_normalizer(X_train)
    assert norm.n_dropped == 1 and norm.keep.tolist() == [True, False, True]
    # A feature constant in training is dropped even if it varies at test time.
    X_test = np.column_stack([np.arange(5.0), np.arange(5.0), np.arange(5.0)])
    assert norm.transform(X_test).shape == (5, 2)
    assert np.isfinite(norm.transform(X_test)).all()
    with pytest.raises(ValueError):
        fit_normalizer(np.ones((10, 3)))


def test_no_zscore_passes_features_through() -> None:
    X = np.column_stack([np.arange(10.0), np.full(10, 1.0)])
    norm = fit_normalizer(X, zscore=False)
    np.testing.assert_array_equal(norm.transform(X), X[:, :1])


def test_align_by_neuron_ids() -> None:
    a = np.array([10, 3, 7, 22])
    b = np.array([7, 99, 10, 5, 22])
    al = align_neurons(a, b, 4, 5)
    assert al.method == "neuron_ids" and al.n_shared == 3
    np.testing.assert_array_equal(a[al.idx_a], b[al.idx_b])
    # int and string IDs refer to the same units
    al2 = align_neurons(a, np.array(["7", "10"]), 4, 2)
    assert al2.n_shared == 2


def test_align_without_ids() -> None:
    al = align_neurons(None, None, 5, 5)
    assert al.method == "index" and al.warning and al.is_identity_for_a(5)
    with pytest.raises(AlignmentError):
        align_neurons(None, None, 5, 6)
    with pytest.raises(AlignmentError):
        align_neurons(np.arange(5), None, 5, 5)
    with pytest.raises(AlignmentError):
        align_neurons(np.arange(5), np.arange(10, 15), 5, 5)
