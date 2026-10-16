"""Synthetic multi-session dataset with gradual, non-monotonic representational drift.

Generative model, per session::

    reaching behaviour  ->  latent z(t) = [vx, vy, |v|, f1, f2]
                        ->  log-rate  = log(baseline) + C_s z(t)      (C_s: session tuning)
                        ->  spike counts ~ Poisson(rate * dt)

* ``vx, vy`` — 2-D hand/cursor velocity from minimum-jerk centre-out-like reaches
  (8 directions with jitter), followed by short holds. ``|v|`` is speed.
* ``f1, f2`` — slow Ornstein–Uhlenbeck factors unrelated to behaviour (shared
  "internal state" variability), so the neural covariance is not purely behavioural.
* Each unit has a preferred direction (PD), modulation depth, speed gain, factor
  loadings and baseline rate.

Between consecutive sessions separated by ``Δ`` days the tuning of every unit performs
a random walk with standard deviation ∝ √Δ (PD angle, depth, baseline, loadings).
A per-session transient jitter that does *not* accumulate, random behavioural changes
(speed scale, direction bias) and unit turnover (some units disappear and new unit IDs
appear) make the drift realistic rather than perfectly monotonic. A few units are also
missing from individual sessions, so neuron counts differ slightly.

Everything is driven by one seed, so the dataset is exactly reproducible.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date, timedelta

import numpy as np

from app.analysis.dataset import SessionData

DEFAULT_DAYS = (1, 3, 7, 10, 14, 21)


@dataclass
class DemoSession:
    name: str
    day: int
    recording_date: date
    bin_size_ms: float
    data: SessionData
    params: dict[str, float] = field(default_factory=dict)


@dataclass
class _UnitPool:
    ids: np.ndarray  # (n,) int
    pd: np.ndarray  # preferred direction angle, rad
    depth: np.ndarray  # velocity modulation depth (per unit of normalised velocity)
    speed_gain: np.ndarray
    loadings: np.ndarray  # (n, 2) loadings on the internal factors
    log_base: np.ndarray  # log baseline rate (Hz)

    @classmethod
    def new(cls, rng: np.random.Generator, ids: np.ndarray) -> _UnitPool:
        n = ids.size
        return cls(
            ids=ids,
            pd=rng.uniform(-np.pi, np.pi, n),
            depth=rng.uniform(0.35, 0.8, n),
            speed_gain=rng.normal(0.15, 0.12, n),
            loadings=rng.normal(0.0, 0.25, (n, 2)),
            log_base=np.log(rng.uniform(5.0, 30.0, n)),
        )

    def replace(self, idx: np.ndarray, fresh: _UnitPool) -> None:
        for name in ("ids", "pd", "depth", "speed_gain", "loadings", "log_base"):
            getattr(self, name)[idx] = getattr(fresh, name)


def _min_jerk_reaches(
    rng: np.random.Generator, n: int, dt: float, speed_scale: float, dir_bias: float
) -> tuple[np.ndarray, np.ndarray]:
    """Velocity (n, 2) in cm/s from successive reaches + holds, and per-bin trial IDs."""
    v = np.zeros((n, 2))
    trial_ids = np.zeros(n, dtype=np.int64)
    t, trial = 0, 0
    while t < n:
        reach = int(rng.integers(35, 65))
        hold = int(rng.integers(5, 25))
        angle = rng.integers(8) * np.pi / 4 + dir_bias + rng.normal(0, 0.15)
        distance = rng.uniform(8.0, 12.0) * speed_scale
        tau = (np.arange(reach) + 0.5) / reach
        speed = distance / (reach * dt) * 30 * tau**2 * (1 - tau) ** 2  # minimum-jerk profile
        seg = np.column_stack([speed * np.cos(angle), speed * np.sin(angle)])
        stop = min(n, t + reach)
        v[t:stop] = seg[: stop - t]
        trial_ids[t : min(n, t + reach + hold)] = trial
        t += reach + hold
        trial += 1
    v += rng.normal(0, 0.4, v.shape)  # small tremor / measurement noise
    return v, trial_ids


def _ou(rng: np.random.Generator, n: int, k: int, dt: float, tau_s: float) -> np.ndarray:
    """Unit-variance Ornstein–Uhlenbeck processes, shape (n, k)."""
    a = np.exp(-dt / tau_s)
    x = np.zeros((n, k))
    x[0] = rng.standard_normal(k)
    noise = rng.standard_normal((n, k)) * np.sqrt(1 - a**2)
    for i in range(1, n):
        x[i] = a * x[i - 1] + noise[i]
    return x


def generate_demo_sessions(
    seed: int = 42,
    n_neurons: int = 96,
    n_samples: int = 8000,
    bin_size_ms: float = 20.0,
    days: tuple[int, ...] = DEFAULT_DAYS,
    drift_per_sqrt_day: float = 0.24,
    turnover_per_session: int = 4,
    subject: str = "R1",
    start_date: date = date(2026, 3, 2),
) -> list[DemoSession]:
    """Generate the demo project's sessions. See the module docstring for the model."""
    rng = np.random.default_rng(seed)
    dt = bin_size_ms / 1000.0
    pool = _UnitPool.new(rng, np.arange(1, n_neurons + 1))
    next_id = n_neurons + 1
    sessions: list[DemoSession] = []
    prev_day = days[0]

    for s, day in enumerate(days):
        gap = max(day - prev_day, 0)
        if s > 0:
            step = drift_per_sqrt_day * np.sqrt(gap)
            pool.pd += rng.normal(0, step, n_neurons)
            pool.depth = np.clip(pool.depth + rng.normal(0, 0.25 * step, n_neurons), 0.1, 1.2)
            pool.speed_gain += rng.normal(0, 0.2 * step, n_neurons)
            pool.loadings += rng.normal(0, 0.3 * step, pool.loadings.shape)
            pool.log_base += rng.normal(0, 0.3 * step, n_neurons)
            # Unit turnover: some units are lost and new ones appear on the array.
            n_turn = int(rng.poisson(turnover_per_session * max(gap, 1) / 4))
            if n_turn:
                idx = rng.choice(n_neurons, size=min(n_turn, n_neurons), replace=False)
                fresh = _UnitPool.new(rng, np.arange(next_id, next_id + idx.size))
                next_id += idx.size
                pool.replace(idx, fresh)
        prev_day = day

        # Session-specific, non-accumulating perturbations.
        pd = pool.pd + rng.normal(0, 0.08, n_neurons)
        speed_scale = float(rng.uniform(0.88, 1.12))
        dir_bias = float(rng.normal(0, 0.08))

        vel, trial_ids = _min_jerk_reaches(rng, n_samples, dt, speed_scale, dir_bias)
        v_scale = 12.0  # normalises velocity so that depth is in log-rate units
        speed = np.linalg.norm(vel, axis=1)
        factors = _ou(rng, n_samples, 2, dt, tau_s=0.6)

        drive = (
            (vel[:, 0:1] * np.cos(pd) + vel[:, 1:2] * np.sin(pd)) * (pool.depth / v_scale)
            + (speed[:, None] - speed.mean()) * (pool.speed_gain / v_scale)
            + factors @ pool.loadings.T
        )
        rates = np.exp(pool.log_base + np.clip(drive, -4, 3))  # Hz
        counts = rng.poisson(rates * dt).astype(np.float64)

        # A few units are missing from this particular recording.
        keep = np.ones(n_neurons, dtype=bool)
        keep[rng.choice(n_neurons, size=int(rng.integers(0, 3)), replace=False)] = False

        data = SessionData(
            X=counts[:, keep],
            Y=vel,
            timestamps=np.arange(n_samples) * dt,
            trial_ids=trial_ids,
            neuron_ids=pool.ids[keep].copy(),
        )
        sessions.append(
            DemoSession(
                name=f"{subject}_D{day:02d}",
                day=day,
                recording_date=start_date + timedelta(days=day - days[0]),
                bin_size_ms=bin_size_ms,
                data=data,
                params={"speed_scale": speed_scale, "dir_bias": dir_bias},
            )
        )
    return sessions
