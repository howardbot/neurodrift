"""API integration tests: project CRUD and the session upload lifecycle."""

from pathlib import Path

import numpy as np
import pytest
from fastapi.testclient import TestClient

from app.core.config import get_settings
from app.services import storage
from tests.helpers import npz_bytes, simple_session


def _project(client: TestClient, name: str = "Rat 1") -> dict:
    r = client.post("/api/projects", json={"name": name, "description": "test"})
    assert r.status_code == 201, r.text
    return r.json()


def _upload(client: TestClient, project_id: str, name: str, content: bytes, filename: str = "s.npz", **form: str):
    return client.post(
        f"/api/projects/{project_id}/sessions",
        data={"name": name, **form},
        files={"file": (filename, content, "application/octet-stream")},
    )


def test_health(client: TestClient) -> None:
    r = client.get("/api/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok" and r.json()["database"] == "ok"


def test_project_crud(client: TestClient) -> None:
    p = _project(client)
    assert client.get("/api/projects").json()[0]["id"] == p["id"]
    r = client.patch(f"/api/projects/{p['id']}", json={"name": "  Renamed  "})
    assert r.json()["name"] == "Renamed"
    assert client.patch(f"/api/projects/{p['id']}", json={"name": "   "}).status_code == 422
    assert client.post("/api/projects", json={"name": "   "}).status_code == 422
    assert client.delete(f"/api/projects/{p['id']}").status_code == 204
    assert client.get(f"/api/projects/{p['id']}").status_code == 404
    assert client.get("/api/projects/not-a-uuid").status_code == 422


def test_upload_inspect_and_delete_session(client: TestClient, rng: np.random.Generator) -> None:
    p = _project(client)
    r = _upload(
        client, p["id"], "R1_D01", npz_bytes(**simple_session(rng, n=400, k=10)),
        subject="R1", recording_date="2026-01-05", bin_size_ms="20",
    )
    assert r.status_code == 201, r.text
    s = r.json()
    assert (s["n_samples"], s["n_neurons"], s["n_outputs"]) == (400, 10, 2)
    assert s["has_neuron_ids"] and s["has_timestamps"] and not s["has_trial_ids"]
    assert s["subject"] == "R1" and s["recording_date"] == "2026-01-05" and s["bin_size_ms"] == 20
    assert "file_path" not in s

    raw = storage.resolve(f"projects/{p['id']}/sessions/{s['id']}/raw.npz")
    assert raw.exists() and not raw.with_name("raw.npz.part").exists()

    detail = client.get(f"/api/projects/{p['id']}").json()
    assert detail["n_sessions"] == 1 and detail["sessions"][0]["name"] == "R1_D01"
    assert client.get("/api/projects").json()[0]["n_sessions"] == 1

    qc = client.get(f"/api/sessions/{s['id']}/qc").json()
    assert qc["summary"]["n_neurons"] == 10 and len(qc["neurons"]["mean"]) == 10

    # QC is recomputed if the cached payload is missing.
    raw.with_name("qc.json").unlink()
    assert client.get(f"/api/sessions/{s['id']}/qc").json()["summary"]["n_samples"] == 400

    r = client.patch(f"/api/sessions/{s['id']}", json={"name": "R1_D02", "notes": "moved"})
    assert r.status_code == 200 and r.json()["name"] == "R1_D02"

    assert client.delete(f"/api/sessions/{s['id']}").status_code == 204
    assert not raw.parent.exists()
    assert client.get(f"/api/sessions/{s['id']}").status_code == 404


def test_session_order_and_duplicate_names(client: TestClient, rng: np.random.Generator) -> None:
    p = _project(client)
    content = npz_bytes(**simple_session(rng, n=100, k=5))
    for name in ("D01", "D02"):
        assert _upload(client, p["id"], name, content).status_code == 201
    r = _upload(client, p["id"], "D01", content)
    assert r.status_code == 409
    sessions = client.get(f"/api/projects/{p['id']}/sessions").json()
    assert [(x["name"], x["session_order"]) for x in sessions] == [("D01", 0), ("D02", 1)]
    second = sessions[1]["id"]
    assert client.patch(f"/api/sessions/{second}", json={"name": "D01"}).status_code == 409


def test_invalid_upload_reports_errors_and_leaves_no_files(client: TestClient) -> None:
    p = _project(client)
    r = _upload(client, p["id"], "bad", npz_bytes(X=np.zeros((20, 3)), Y=np.zeros((19, 1))))
    assert r.status_code == 422
    assert any("mismatch" in e for e in r.json()["detail"]["errors"])
    sessions_dir = storage.resolve(f"projects/{p['id']}/sessions")
    assert not sessions_dir.exists() or not any(sessions_dir.iterdir())


def test_upload_rejections(client: TestClient, rng: np.random.Generator) -> None:
    p = _project(client)
    content = npz_bytes(**simple_session(rng, n=100, k=5))
    assert _upload(client, p["id"], "x", content, filename="s.mat").status_code == 400
    assert _upload(client, p["id"], "../evil", content).status_code == 422
    assert _upload(client, p["id"], "x", content, filename="../../etc/passwd.npz").status_code == 201
    assert client.post(
        "/api/projects/00000000-0000-0000-0000-000000000000/sessions",
        data={"name": "x"},
        files={"file": ("s.npz", content)},
    ).status_code == 404

    get_settings().max_upload_mb = 0
    assert _upload(client, p["id"], "big", content).status_code == 413

    get_settings().max_upload_mb = 500
    get_settings().max_sessions_per_project = 1
    assert _upload(client, p["id"], "over", content).status_code == 409


def test_project_delete_removes_session_files(client: TestClient, rng: np.random.Generator) -> None:
    p = _project(client)
    s = _upload(client, p["id"], "D01", npz_bytes(**simple_session(rng, n=100, k=5))).json()
    project_dir = storage.resolve(f"projects/{p['id']}")
    assert project_dir.exists()
    client.delete(f"/api/projects/{p['id']}")
    assert not project_dir.exists()
    assert client.get(f"/api/sessions/{s['id']}").status_code == 404


def test_storage_refuses_path_traversal() -> None:
    with pytest.raises(ValueError):
        storage.resolve(Path("..") / "outside")


def test_demo_project(client: TestClient) -> None:
    r = client.post("/api/demo")
    assert r.status_code == 201, r.text
    project = r.json()
    assert project["is_demo"] and project["n_sessions"] == 6
    sessions = client.get(f"/api/projects/{project['id']}/sessions").json()
    assert [s["session_order"] for s in sessions] == list(range(6))
    assert sessions[0]["recording_date"] == "2026-03-02" and sessions[-1]["name"] == "R1_D21"
    qc = client.get(f"/api/sessions/{sessions[2]['id']}/qc").json()
    assert qc["summary"]["count_like"] is True
    # A second click returns the existing demo instead of duplicating it.
    again = client.post("/api/demo")
    assert again.status_code == 200 and again.json()["id"] == project["id"]
