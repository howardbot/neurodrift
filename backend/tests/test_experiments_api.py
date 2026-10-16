"""Integration: project -> sessions -> experiment -> analysis -> matrix."""

import numpy as np
import pytest
from fastapi.testclient import TestClient

from app.core.config import get_settings
from app.services import experiments as service
from tests.helpers import npz_bytes, simple_session


def _demo(client: TestClient) -> tuple[str, list[dict]]:
    project = client.post("/api/demo").json()
    return project["id"], client.get(f"/api/projects/{project['id']}/sessions").json()


def test_full_experiment_lifecycle(client: TestClient) -> None:
    pid, sessions = _demo(client)
    r = client.post(f"/api/projects/{pid}/experiments", json={"alpha": 1.0})
    assert r.status_code == 202, r.text
    exp = r.json()
    status = client.get(f"/api/experiments/{exp['id']}/status").json()
    assert status["status"] == "completed" and status["progress"] == 1.0

    detail = client.get(f"/api/experiments/{exp['id']}").json()
    assert [s["name"] for s in detail["sessions"]] == [s["name"] for s in sessions]
    assert detail["software"]["scikit-learn"] and detail["random_seed"] == 42
    assert detail["config"]["train_fraction"] == 0.8 and detail["name"].startswith("Ridge")

    matrix = client.get(f"/api/experiments/{exp['id']}/matrix").json()
    r_mat = np.array(matrix["decoder"]["matrices"]["mean_r"], dtype=float)
    assert r_mat.shape == (6, 6)
    assert np.all(np.diag(r_mat) > 0.8)
    assert r_mat[0, 0] > r_mat[0, 5]  # nearby sessions generalise better than distant ones
    n_shared = np.array(matrix["decoder"]["matrices"]["n_shared"])
    assert n_shared[0, 5] < n_shared[0, 0]
    assert matrix["summary"]["decoder"]["mean_r"]["mean_diagonal"] > matrix["summary"]["decoder"]["mean_r"]["mean_off_diagonal"]
    assert matrix["decoder"]["sessions"][0]["name"] == "R1_D01"

    angles = np.array(matrix["subspace"]["matrices"]["mean_angle"], dtype=float)
    assert angles.shape == (6, 6)
    assert angles[0, 0] < angles[0, 5]  # distant sessions' subspaces differ more
    assert np.all(angles < np.array(matrix["subspace"]["matrices"]["chance_mean_angle"], dtype=float))
    assert matrix["subspace"]["n_components"] == 10

    projects = client.get("/api/projects").json()
    assert projects[0]["latest_experiment"]["status"] == "completed"
    assert len(client.get(f"/api/projects/{pid}/experiments").json()) == 1
    assert len(client.get("/api/experiments").json()) == 1
    assert client.delete(f"/api/experiments/{exp['id']}").status_code == 204
    assert client.get(f"/api/experiments/{exp['id']}").status_code == 404


def test_session_subset_and_outputs(client: TestClient) -> None:
    pid, sessions = _demo(client)
    ids = [sessions[4]["id"], sessions[1]["id"]]
    r = client.post(f"/api/projects/{pid}/experiments", json={"session_ids": ids, "outputs": [1], "decoder": "linear"})
    assert r.status_code == 202, r.text
    matrix = client.get(f"/api/experiments/{r.json()['id']}/matrix").json()["decoder"]
    assert [s["name"] for s in matrix["sessions"]] == ["R1_D14", "R1_D03"]
    assert len(matrix["cells"][0][1]["metrics"]["r"]) == 1


def test_invalid_configurations(client: TestClient, rng: np.random.Generator) -> None:
    pid, sessions = _demo(client)
    url = f"/api/projects/{pid}/experiments"
    assert client.post(url, json={"alpha": 0}).status_code == 422
    assert client.post(url, json={"n_components": 7}).status_code == 422
    assert client.post(url, json={"outputs": [2]}).status_code == 422
    assert client.post(url, json={"session_ids": [sessions[0]["id"]] * 2}).status_code == 422
    assert client.post(url, json={"session_ids": ["00000000-0000-0000-0000-000000000000"]}).status_code == 422
    empty = client.post("/api/projects", json={"name": "empty"}).json()
    assert client.post(f"/api/projects/{empty['id']}/experiments", json={}).status_code == 422

    # Sessions with different output counts need an explicit output selection.
    p2 = client.post("/api/projects", json={"name": "mixed"}).json()
    s1 = simple_session(rng, n=200, k=5, m=2)
    s2 = simple_session(rng, n=200, k=5, m=3)
    for name, arrays in (("a", s1), ("b", s2)):
        client.post(f"/api/projects/{p2['id']}/sessions", data={"name": name}, files={"file": ("s.npz", npz_bytes(**arrays))})
    assert client.post(f"/api/projects/{p2['id']}/experiments", json={}).status_code == 422
    assert client.post(f"/api/projects/{p2['id']}/experiments", json={"outputs": [0, 1]}).status_code == 202


def test_failure_is_recorded_not_raised(client: TestClient, monkeypatch: pytest.MonkeyPatch) -> None:
    pid, sessions = _demo(client)
    monkeypatch.setattr(service, "enqueue", lambda experiment: None)  # leave it pending
    exp = client.post(f"/api/projects/{pid}/experiments", json={}).json()
    assert exp["status"] == "pending"
    client.delete(f"/api/sessions/{sessions[2]['id']}")
    service.run_experiment(exp["id"])  # what the worker would do
    status = client.get(f"/api/experiments/{exp['id']}/status").json()
    assert status["status"] == "failed" and "no longer exists" in status["error_message"]
    assert client.get(f"/api/experiments/{exp['id']}/matrix").status_code == 409


def test_queue_unavailable_returns_503(client: TestClient) -> None:
    pid, _ = _demo(client)
    settings = get_settings()
    settings.jobs_inline = False
    settings.redis_url = "redis://127.0.0.1:1/0"
    r = client.post(f"/api/projects/{pid}/experiments", json={})
    assert r.status_code == 503
    assert client.get(f"/api/projects/{pid}/experiments").json()[0]["status"] == "failed"


def test_pair_comparison(client: TestClient) -> None:
    pid, sessions = _demo(client)
    exp = client.post(f"/api/projects/{pid}/experiments", json={"n_components": 5}).json()
    matrix = client.get(f"/api/experiments/{exp['id']}/matrix").json()
    a, b = sessions[0]["id"], sessions[5]["id"]
    r = client.get(f"/api/experiments/{exp['id']}/compare/{a}/{b}")
    assert r.status_code == 200, r.text
    body = r.json()
    # Recomputed metrics match the stored matrix cell.
    assert body["decoder"]["metrics"]["mean_r"] == pytest.approx(matrix["decoder"]["matrices"]["mean_r"][0][5], abs=1e-5)
    assert body["representation"]["mean_angle"] == pytest.approx(matrix["subspace"]["matrices"]["mean_angle"][0][5], abs=1e-3)
    assert body["alignment"]["n_shared"] == matrix["decoder"]["matrices"]["n_shared"][0][5]
    assert body["reference"]["within_test_r"] == matrix["decoder"]["matrices"]["mean_r"][5][5]
    assert body["activity"]["unit"] == "Hz" and len(body["activity"]["diff"]) == body["alignment"]["n_shared"]
    assert len(body["behaviour"]["outputs"]) == 2
    curves = body["representation"]["variance_capture"]
    assert all(x <= y + 1e-9 for x, y in zip(curves["captured_by_a"], curves["captured_by_own"]))

    other = client.post("/api/projects", json={"name": "x"}).json()
    assert client.get(f"/api/experiments/{exp['id']}/compare/{a}/{other['id']}").status_code == 404
