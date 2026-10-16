"""Exports (CSV / JSON / ZIP), the HTML report and re-running failed experiments."""

import csv
import io
import json
import re
import uuid
import zipfile

import numpy as np
import pytest
from fastapi.testclient import TestClient

from app.core.config import get_settings
from app.models import ExperimentStatus
from app.services import experiments as service
from app.services.exports import SESSION_SUMMARY_COLUMNS
from tests.helpers import npz_bytes, simple_session

SINGLE_FILES = ("decoder_matrix.csv", "subspace_angles.csv", "session_summary.csv", "experiment_config.json")


def _demo_experiment(client: TestClient, **config) -> tuple[dict, dict]:
    project = client.post("/api/demo").json()
    r = client.post(f"/api/projects/{project['id']}/experiments", json={"n_components": 5, **config})
    assert r.status_code == 202, r.text
    exp = r.json()
    return exp, client.get(f"/api/experiments/{exp['id']}/matrix").json()


def _rows(content: bytes) -> list[list[str]]:
    return list(csv.reader(io.StringIO(content.decode("utf-8"))))


def _as_float(text: str) -> float | None:
    return None if text == "" else float(text)


def _set_db(experiment_id: str, fn) -> None:
    from app.db.session import get_sessionmaker
    from app.models import Experiment

    db = get_sessionmaker()()
    try:
        fn(db, db.get(Experiment, uuid.UUID(experiment_id)))
        db.commit()
    finally:
        db.close()


def test_matrix_and_summary_exports(client: TestClient) -> None:
    exp, matrix = _demo_experiment(client)
    names = [s["name"] for s in exp["sessions"]]
    base = f"/api/experiments/{exp['id']}/export"

    r = client.get(f"{base}/decoder_matrix.csv")
    assert r.status_code == 200
    assert r.headers["content-type"].startswith("text/csv")
    assert r.headers["content-disposition"] == f'attachment; filename="neurodrift-{exp["id"][:8]}-decoder_matrix.csv"'
    rows = _rows(r.content)
    assert rows[0] == ["mean_r: train \\ test", *names]  # columns = test sessions
    assert [row[0] for row in rows[1:]] == names  # rows = training sessions
    assert all(len(row) == len(names) + 1 for row in rows)
    values = [[_as_float(v) for v in row[1:]] for row in rows[1:]]
    assert values == matrix["decoder"]["matrices"]["mean_r"]

    rows = _rows(client.get(f"{base}/subspace_angles.csv").content)
    assert rows[0] == ["mean_angle_deg: train \\ test", *names] and [row[0] for row in rows[1:]] == names
    assert [[_as_float(v) for v in row[1:]] for row in rows[1:]] == matrix["subspace"]["matrices"]["mean_angle"]

    rows = _rows(client.get(f"{base}/session_summary.csv").content)
    assert tuple(rows[0]) == SESSION_SUMMARY_COLUMNS
    summary = [dict(zip(rows[0], row)) for row in rows[1:]]
    assert [s["session"] for s in summary] == names and [s["position"] for s in summary] == ["1", "2", "3", "4", "5", "6"]
    r_mat = np.array(matrix["decoder"]["matrices"]["mean_r"], dtype=float)
    ang = np.array(matrix["subspace"]["matrices"]["mean_angle"], dtype=float)
    for i, s in enumerate(summary):
        assert float(s["within_r"]) == pytest.approx(r_mat[i, i])
        # Means are rounded to the stored precision (r: 6 decimals, angles: 4).
        assert float(s["out_transfer_r"]) == pytest.approx(np.delete(r_mat[i], i).mean(), abs=1e-6)
        assert float(s["in_transfer_r"]) == pytest.approx(np.delete(r_mat[:, i], i).mean(), abs=1e-6)
        assert float(s["within_angle_deg"]) == pytest.approx(ang[i, i])
        assert float(s["out_mean_angle_deg"]) == pytest.approx(np.delete(ang[i], i).mean(), abs=1e-4)
        assert s["subject"] == "R1" and re.fullmatch(r"\d{4}-\d{2}-\d{2}", s["recording_date"])
        assert int(s["n_train"]) + int(s["n_test"]) == int(s["n_samples"])


def test_config_json_and_zip(client: TestClient) -> None:
    exp, matrix = _demo_experiment(client, alpha=2.5, random_seed=7)
    base = f"/api/experiments/{exp['id']}/export"

    r = client.get(f"{base}/experiment_config.json")
    assert r.status_code == 200 and r.headers["content-type"].startswith("application/json")
    config = r.json()
    assert config["config"]["alpha"] == 2.5 and config["config"]["n_components"] == 5
    assert config["random_seed"] == 7
    assert [s["name"] for s in config["sessions"]] == [s["name"] for s in exp["sessions"]]
    assert {"id", "name", "session_order"} <= set(config["sessions"][0])
    assert {"neurodrift", "python", "numpy", "scipy", "scikit-learn"} <= set(config["software"])
    assert config["project"]["name"] == client.get(f"/api/projects/{exp['project_id']}").json()["name"]
    assert config["experiment"]["status"] == "completed" and config["experiment"]["finished_at"]
    assert config["summary"] == matrix["summary"] and config["unavailable_pairs"] == []

    r = client.get(f"{base}/all.zip")
    assert r.status_code == 200 and r.headers["content-type"] == "application/zip"
    assert r.headers["content-disposition"].endswith('-all.zip"')
    with zipfile.ZipFile(io.BytesIO(r.content)) as archive:
        assert archive.testzip() is None
        folder = f"neurodrift-{exp['id'][:8]}-export"
        assert sorted(archive.namelist()) == sorted(f"{folder}/{n}" for n in (*SINGLE_FILES, "report.html"))
        for name in ("decoder_matrix.csv", "subspace_angles.csv", "session_summary.csv"):
            assert archive.read(f"{folder}/{name}") == client.get(f"{base}/{name}").content
        assert json.loads(archive.read(f"{folder}/experiment_config.json"))["random_seed"] == 7
        assert archive.read(f"{folder}/report.html").startswith(b"<!doctype html>")

    assert client.get(f"{base}/results.xlsx").status_code == 422
    assert client.get(f"/api/experiments/{uuid.uuid4()}/export/decoder_matrix.csv").status_code == 404


def test_missing_cells_exported_as_empty(client: TestClient, rng: np.random.Generator) -> None:
    """A pair whose neurons cannot be aligned has no value: empty CSV cell, listed in the JSON."""
    p = client.post("/api/projects", json={"name": "mixed ids"}).json()
    with_ids = simple_session(rng, n=300, k=6)
    without_ids = {k: v for k, v in simple_session(rng, n=300, k=6).items() if k != "neuron_ids"}
    for name, arrays in (("a", with_ids), ("b", without_ids)):
        r = client.post(f"/api/projects/{p['id']}/sessions", data={"name": name}, files={"file": ("s.npz", npz_bytes(**arrays))})
        assert r.status_code == 201, r.text
    exp = client.post(f"/api/projects/{p['id']}/experiments", json={"n_components": 3}).json()
    assert exp["status"] == "completed"

    rows = _rows(client.get(f"/api/experiments/{exp['id']}/export/decoder_matrix.csv").content)
    assert rows[1][2] == "" and rows[2][1] == ""  # a → b and b → a are unavailable
    assert rows[1][1] != "" and rows[2][2] != ""  # within-session cells exist
    pairs = client.get(f"/api/experiments/{exp['id']}/export/experiment_config.json").json()["unavailable_pairs"]
    assert {(q["train"], q["test"]) for q in pairs} == {("a", "b"), ("b", "a")}
    assert "neuron_ids" in pairs[0]["reason"]

    report = client.get(f"/api/experiments/{exp['id']}/report.html").text
    assert "2 cell(s) could not be computed" in report and ">n/a<" in report


def test_exports_require_completed_experiment(client: TestClient, monkeypatch: pytest.MonkeyPatch) -> None:
    project = client.post("/api/demo").json()
    monkeypatch.setattr(service, "enqueue", lambda experiment: None)  # stays pending
    exp = client.post(f"/api/projects/{project['id']}/experiments", json={}).json()
    urls = [f"/api/experiments/{exp['id']}/export/{a}" for a in (*SINGLE_FILES, "all.zip")]
    urls.append(f"/api/experiments/{exp['id']}/report.html")
    for url in urls:
        r = client.get(url)
        assert r.status_code == 409 and r.json()["detail"] == "Experiment is pending", url

    _set_db(exp["id"], lambda db, e: setattr(e, "status", ExperimentStatus.failed))
    assert all(client.get(url).status_code == 409 for url in urls)
    assert client.get(f"/api/experiments/{uuid.uuid4()}/report.html").status_code == 404


def test_report_is_self_contained_and_contains_matrices(client: TestClient) -> None:
    exp, matrix = _demo_experiment(client)
    r = client.get(f"/api/experiments/{exp['id']}/report.html")
    assert r.status_code == 200 and r.headers["content-type"].startswith("text/html")
    assert r.headers["content-disposition"].startswith("inline;")
    assert "default-src 'none'" in r.headers["content-security-policy"]
    html = r.text
    assert html.startswith("<!doctype html>") and html.rstrip().endswith("</html>")

    # No scripts and no external resources: the only URL is the SVG XML namespace.
    assert "<script" not in html.lower() and "<link" not in html.lower() and "@import" not in html
    assert set(re.findall(r"https?://[^\s\"')<]+", html)) == {"http://www.w3.org/2000/svg"}
    assert html.count("<svg") == 2

    for heading in (
        "Experiment configuration",
        "Session summary",
        "Decoder generalisation matrix",
        "Neural subspace matrix",
        "Within- vs cross-session summary",
        "Interpretation notes",
    ):
        assert f"<h2>{heading}</h2>" in html
    assert "Demo" in html and "Ridge regression (α = 1)" in html
    for s in exp["sessions"]:
        assert s["name"] in html

    # Every decoder and subspace cell value appears in the value tables.
    r_mat = matrix["decoder"]["matrices"]["mean_r"]
    ang = matrix["subspace"]["matrices"]["mean_angle"]
    for i in range(len(r_mat)):
        for j in range(len(r_mat)):
            assert f'<td class="num">{r_mat[i][j]:.3f}</td>' in html
            assert f'<td class="num">{ang[i][j]:.2f}</td>' in html
    within = matrix["summary"]["decoder"]["mean_r"]["mean_diagonal"]
    assert f'{within:.3f}' in html

    # Careful language: separate measurements, no causal claims.
    assert "separate measurements" in html and "does not show that representational change causes" in html

    download = client.get(f"/api/experiments/{exp['id']}/report.html?download=true")
    assert download.headers["content-disposition"].startswith("attachment;")


def test_report_escapes_names_and_handles_missing_subspace(client: TestClient, rng: np.random.Generator) -> None:
    p = client.post("/api/projects", json={"name": "<b>Lab & Co</b>"}).json()
    for name in ("s1", "s2"):
        client.post(f"/api/projects/{p['id']}/sessions", data={"name": name}, files={"file": ("s.npz", npz_bytes(**simple_session(rng, n=300, k=6)))})
    exp = client.post(f"/api/projects/{p['id']}/experiments", json={"name": "<script>x</script>", "n_components": 3}).json()

    html = client.get(f"/api/experiments/{exp['id']}/report.html").text
    assert "&lt;b&gt;Lab &amp; Co&lt;/b&gt;" in html and "<b>Lab" not in html
    assert "&lt;script&gt;x&lt;/script&gt;" in html and "<script" not in html

    # Experiments from before subspace analysis existed have no subspace results.
    _set_db(exp["id"], lambda db, e: setattr(e.result, "subspace", None))
    html = client.get(f"/api/experiments/{exp['id']}/report.html").text
    assert "run before subspace analysis was available" in html and html.count("<svg") == 1
    assert client.get(f"/api/experiments/{exp['id']}/export/subspace_angles.csv").status_code == 404
    rows = _rows(client.get(f"/api/experiments/{exp['id']}/export/session_summary.csv").content)
    assert rows[1][SESSION_SUMMARY_COLUMNS.index("within_angle_deg")] == ""
    with zipfile.ZipFile(io.BytesIO(client.get(f"/api/experiments/{exp['id']}/export/all.zip").content)) as archive:
        assert not any(n.endswith("subspace_angles.csv") for n in archive.namelist())
        assert any(n.endswith("decoder_matrix.csv") for n in archive.namelist())


def test_rerun_failed_experiment(client: TestClient) -> None:
    project = client.post("/api/demo").json()
    settings = get_settings()
    settings.jobs_inline = False
    settings.redis_url = "redis://127.0.0.1:1/0"
    r = client.post(f"/api/projects/{project['id']}/experiments", json={"n_components": 5})
    assert r.status_code == 503
    exp = client.get(f"/api/projects/{project['id']}/experiments").json()[0]
    assert exp["status"] == "failed" and "queue unavailable" in exp["error_message"]

    # Still no queue: the re-run is recorded as failed again.
    assert client.post(f"/api/experiments/{exp['id']}/rerun").status_code == 503
    assert client.get(f"/api/experiments/{exp['id']}/status").json()["status"] == "failed"

    settings.jobs_inline = True
    r = client.post(f"/api/experiments/{exp['id']}/rerun")
    assert r.status_code == 202, r.text
    body = r.json()
    assert body["id"] == exp["id"] and body["status"] == "completed" and body["error_message"] is None
    assert body["config"] == exp["config"] and body["random_seed"] == exp["random_seed"]
    assert client.get(f"/api/experiments/{exp['id']}/matrix").status_code == 200
    assert len(client.get(f"/api/projects/{project['id']}/experiments").json()) == 1  # same experiment, not a copy

    assert client.post(f"/api/experiments/{exp['id']}/rerun").status_code == 409  # completed
    assert client.post(f"/api/experiments/{uuid.uuid4()}/rerun").status_code == 404


def test_rerun_resets_state_and_rejects_missing_sessions(client: TestClient, monkeypatch: pytest.MonkeyPatch) -> None:
    project = client.post("/api/demo").json()
    sessions = client.get(f"/api/projects/{project['id']}/sessions").json()
    monkeypatch.setattr(service, "enqueue", lambda experiment: None)
    exp = client.post(f"/api/projects/{project['id']}/experiments", json={}).json()

    def fail(db, e):
        e.status = ExperimentStatus.failed
        e.error_message = "boom"
        e.progress = 0.4
        e.job_id = "old"

    _set_db(exp["id"], fail)
    r = client.post(f"/api/experiments/{exp['id']}/rerun")
    assert r.status_code == 202
    body = r.json()
    assert body["status"] == "pending" and body["progress"] == 0.0 and body["error_message"] is None
    assert body["started_at"] is None and body["finished_at"] is None
    assert client.post(f"/api/experiments/{exp['id']}/rerun").status_code == 409  # pending

    _set_db(exp["id"], fail)
    client.delete(f"/api/sessions/{sessions[2]['id']}")
    r = client.post(f"/api/experiments/{exp['id']}/rerun")
    assert r.status_code == 422 and sessions[2]["name"] in r.json()["detail"]
    assert client.get(f"/api/experiments/{exp['id']}/status").json()["error_message"] == "boom"


def test_enqueue_replaces_previous_job(client: TestClient, monkeypatch: pytest.MonkeyPatch) -> None:
    """A re-run reuses the experiment id as RQ job id, so the old job is deleted first."""
    import rq.job

    deleted: list[str] = []
    enqueued: list[str] = []

    class FakeJob:
        def __init__(self, job_id: str) -> None:
            self.id = job_id

        @staticmethod
        def exists(job_id, connection=None):
            return True

        @staticmethod
        def fetch(job_id, connection=None):
            return FakeJob(job_id)

        def delete(self) -> None:
            deleted.append(self.id)

    class FakeQueue:
        connection = None

        def enqueue(self, func, experiment_id, job_id, **kwargs):
            enqueued.append(job_id)
            return FakeJob(job_id)

    monkeypatch.setattr(rq.job, "Job", FakeJob)
    monkeypatch.setattr(service, "_queue", lambda: FakeQueue())
    get_settings().jobs_inline = False

    class Exp:
        id = uuid.uuid4()
        job_id = None

    exp = Exp()
    service.enqueue(exp)  # type: ignore[arg-type]
    assert deleted == [str(exp.id)] and enqueued == [str(exp.id)] and exp.job_id == str(exp.id)
