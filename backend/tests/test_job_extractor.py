
import socket
from contextlib import contextmanager

import pytest

from app.services.job_extractor import (
    JobExtractionError,
    fetch_public_html,
    parse_job_html,
    validate_public_url,
)


def test_extracts_job_posting_json_ld():
    html = """
    <html>
      <head>
        <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "JobPosting",
          "title": "Software Engineer Intern",
          "description": "<p>Build software.</p>",
          "employmentType": "INTERN",
          "hiringOrganization": {
            "@type": "Organization",
            "name": "Example"
          },
          "jobLocation": {
            "@type": "Place",
            "address": {
              "@type": "PostalAddress",
              "addressLocality": "Tempe",
              "addressRegion": "Arizona",
              "addressCountry": "US"
            }
          }
        }
        </script>
      </head>
      <body></body>
    </html>
    """

    result = parse_job_html(html, "https://jobs.example.com/intern")

    assert result["title"] == "Software Engineer Intern"
    assert result["company"] == "Example"
    assert result["location"] == "Tempe, Arizona, US"
    assert result["description"] == "Build software."
    assert result["employment_type"] == "INTERN"
    assert result["missing_fields"] == []
    assert result["extraction_source"] == "json-ld"


def test_metadata_fallback_reports_missing_fields():
    html = """
    <html>
      <head>
        <title>Backend Intern</title>
        <meta property="og:site_name" content="Example Careers">
      </head>
      <body></body>
    </html>
    """

    result = parse_job_html(html, "https://jobs.example.com/backend")

    assert result["title"] == "Backend Intern"
    assert result["company"] == "Example Careers"
    assert "location" in result["missing_fields"]
    assert "description" in result["missing_fields"]
    assert result["extraction_source"] == "page-metadata"


def test_blocks_localhost():
    with pytest.raises(JobExtractionError):
        validate_public_url("http://localhost/")


def test_blocks_private_ip():
    with pytest.raises(JobExtractionError):
        validate_public_url("http://127.0.0.1/")


def test_rejects_non_http_scheme():
    with pytest.raises(JobExtractionError):
        validate_public_url("file:///etc/passwd")


def test_rejects_url_with_credentials():
    with pytest.raises(JobExtractionError):
        validate_public_url("https://user:password@example.com/")


def test_rejects_unsupported_port():
    with pytest.raises(JobExtractionError):
        validate_public_url("https://example.com:8080/")


def test_rejects_hostname_resolving_to_private_ip(monkeypatch):
    def fake_getaddrinfo(*args, **kwargs):
        return [
            (
                socket.AF_INET,
                socket.SOCK_STREAM,
                socket.IPPROTO_TCP,
                "",
                ("127.0.0.1", 443),
            )
        ]

    monkeypatch.setattr(socket, "getaddrinfo", fake_getaddrinfo)

    with pytest.raises(JobExtractionError):
        validate_public_url("https://example.com/")


def test_rejects_hostname_with_mixed_public_and_private_ips(monkeypatch):
    def fake_getaddrinfo(*args, **kwargs):
        return [
            (
                socket.AF_INET,
                socket.SOCK_STREAM,
                socket.IPPROTO_TCP,
                "",
                ("93.184.216.34", 443),
            ),
            (
                socket.AF_INET,
                socket.SOCK_STREAM,
                socket.IPPROTO_TCP,
                "",
                ("127.0.0.1", 443),
            ),
        ]

    monkeypatch.setattr(socket, "getaddrinfo", fake_getaddrinfo)

    with pytest.raises(JobExtractionError):
        validate_public_url("https://example.com/")


def test_fetch_pins_ip_and_preserves_original_hostname(monkeypatch):
    requested = {}

    def fake_getaddrinfo(*args, **kwargs):
        return [
            (
                socket.AF_INET,
                socket.SOCK_STREAM,
                socket.IPPROTO_TCP,
                "",
                ("93.184.216.34", 443),
            )
        ]

    class FakeResponse:
        is_redirect = False
        status_code = 200
        headers = {"content-type": "text/html; charset=utf-8"}
        encoding = "utf-8"

        def iter_bytes(self):
            yield b"<html><title>Example Job</title></html>"

    class FakeClient:
        def __init__(self, **kwargs):
            requested["client_options"] = kwargs

        def __enter__(self):
            return self

        def __exit__(self, exc_type, exc_value, traceback):
            return False

        @contextmanager
        def stream(self, method, url, *, headers, extensions):
            requested["method"] = method
            requested["url"] = str(url)
            requested["headers"] = headers
            requested["extensions"] = extensions
            yield FakeResponse()

    monkeypatch.setattr(socket, "getaddrinfo", fake_getaddrinfo)
    monkeypatch.setattr(
        "app.services.job_extractor.httpx.Client",
        FakeClient,
    )

    html, final_url = fetch_public_html("https://jobs.example.com/intern")

    assert "Example Job" in html
    assert final_url == "https://jobs.example.com/intern"
    assert requested["method"] == "GET"
    assert requested["url"] == "https://93.184.216.34/intern"
    assert requested["headers"]["Host"] == "jobs.example.com"
    assert requested["extensions"]["sni_hostname"] == "jobs.example.com"
    assert requested["client_options"]["trust_env"] is False


def test_redirect_to_private_ip_is_rejected_before_second_request(monkeypatch):
    requests = []

    def fake_getaddrinfo(*args, **kwargs):
        return [
            (
                socket.AF_INET,
                socket.SOCK_STREAM,
                socket.IPPROTO_TCP,
                "",
                ("93.184.216.34", 443),
            )
        ]

    class FakeResponse:
        is_redirect = True
        status_code = 302
        headers = {"location": "http://127.0.0.1/admin"}

    class FakeClient:
        def __init__(self, **kwargs):
            pass

        def __enter__(self):
            return self

        def __exit__(self, exc_type, exc_value, traceback):
            return False

        @contextmanager
        def stream(self, method, url, *, headers, extensions):
            requests.append(str(url))
            yield FakeResponse()

    monkeypatch.setattr(socket, "getaddrinfo", fake_getaddrinfo)
    monkeypatch.setattr(
        "app.services.job_extractor.httpx.Client",
        FakeClient,
    )

    with pytest.raises(JobExtractionError):
        fetch_public_html("https://jobs.example.com/intern")

    assert len(requests) == 1
    assert requests[0] == "https://93.184.216.34/intern"
