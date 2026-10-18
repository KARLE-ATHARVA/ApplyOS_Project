
import pytest
from fastapi.testclient import TestClient

from app.main import app, limiter
from app.services.job_extractor import JobExtractionError


client = TestClient(app)

VALID_URL = "https://jobs.example.com/intern"

EXTRACTED_JOB = {
    "url": VALID_URL,
    "title": "Software Engineer Intern",
    "company": "Example",
    "location": "Tempe, Arizona",
    "description": "Build software.",
    "employment_type": "INTERN",
    "missing_fields": [],
    "extraction_source": "json-ld",
}


@pytest.fixture(autouse=True)
def reset_rate_limit_storage():
    """Keep rate-limit state isolated between tests."""
    limiter._storage.reset()
    yield
    limiter._storage.reset()


def fake_extract_job(url: str) -> dict:
    assert url == VALID_URL
    return EXTRACTED_JOB


def test_health_endpoint():
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "service": "applyos-api",
    }


def test_health_endpoint_is_not_rate_limited():
    for _ in range(15):
        response = client.get("/health")
        assert response.status_code == 200


def test_extract_endpoint_returns_job(monkeypatch):
    monkeypatch.setattr("app.main.extract_job", fake_extract_job)

    response = client.post(
        "/api/v1/jobs/extract",
        json={"url": VALID_URL},
    )

    assert response.status_code == 200
    assert response.json() == EXTRACTED_JOB


def test_extract_endpoint_returns_422_for_extraction_error(monkeypatch):
    def failing_extract_job(url: str) -> dict:
        raise JobExtractionError("The hostname could not be resolved.")

    monkeypatch.setattr("app.main.extract_job", failing_extract_job)

    response = client.post(
        "/api/v1/jobs/extract",
        json={"url": VALID_URL},
    )

    assert response.status_code == 422
    assert response.json()["detail"] == "The hostname could not be resolved."


def test_extract_endpoint_rejects_invalid_url():
    response = client.post(
        "/api/v1/jobs/extract",
        json={"url": "not-a-valid-url"},
    )

    assert response.status_code == 422


def test_extract_endpoint_rejects_missing_url():
    response = client.post(
        "/api/v1/jobs/extract",
        json={},
    )

    assert response.status_code == 422


def test_extract_endpoint_allows_ten_requests_per_minute(monkeypatch):
    monkeypatch.setattr("app.main.extract_job", fake_extract_job)

    for _ in range(10):
        response = client.post(
            "/api/v1/jobs/extract",
            json={"url": VALID_URL},
        )
        assert response.status_code == 200


def test_extract_endpoint_blocks_eleventh_request(monkeypatch):
    monkeypatch.setattr("app.main.extract_job", fake_extract_job)

    for _ in range(10):
        response = client.post(
            "/api/v1/jobs/extract",
            json={"url": VALID_URL},
        )
        assert response.status_code == 200

    response = client.post(
        "/api/v1/jobs/extract",
        json={"url": VALID_URL},
    )

    assert response.status_code == 429


def test_extract_rate_limit_is_separate_per_client_ip(monkeypatch):
    monkeypatch.setattr("app.main.extract_job", fake_extract_job)

    first_client = TestClient(
        app,
        client=("198.51.100.10", 12345),
    )
    second_client = TestClient(
        app,
        client=("198.51.100.20", 12345),
    )

    for _ in range(10):
        response = first_client.post(
            "/api/v1/jobs/extract",
            json={"url": VALID_URL},
        )
        assert response.status_code == 200

    blocked_response = first_client.post(
        "/api/v1/jobs/extract",
        json={"url": VALID_URL},
    )
    assert blocked_response.status_code == 429

    separate_client_response = second_client.post(
        "/api/v1/jobs/extract",
        json={"url": VALID_URL},
    )
    assert separate_client_response.status_code == 200
