from collections.abc import Iterator
from pathlib import Path

import numpy as np
import pytest
from fastapi.testclient import TestClient


@pytest.fixture(autouse=True)
def _isolated_settings(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> Iterator[None]:
    """Every test gets its own SQLite database and data directory."""
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{tmp_path / 'test.db'}")
    monkeypatch.setenv("DATA_DIR", str(tmp_path / "data"))
    monkeypatch.setenv("JOBS_INLINE", "true")
    from app.core.config import get_settings
    from app.db.session import get_engine, get_sessionmaker

    for fn in (get_settings, get_engine, get_sessionmaker):
        fn.cache_clear()
    yield
    get_engine().dispose()
    for fn in (get_settings, get_engine, get_sessionmaker):
        fn.cache_clear()


@pytest.fixture
def client() -> Iterator[TestClient]:
    import app.models  # noqa: F401
    from app.db.base import Base
    from app.db.session import get_engine
    from app.main import create_app

    Base.metadata.create_all(get_engine())
    with TestClient(create_app()) as c:
        yield c


@pytest.fixture
def rng() -> np.random.Generator:
    return np.random.default_rng(0)
