
import ipaddress
import json
import socket
from urllib.parse import urljoin, urlparse

import httpx
from bs4 import BeautifulSoup

MAX_RESPONSE_BYTES = 2_000_000
REQUEST_TIMEOUT_SECONDS = 10.0
MAX_REDIRECTS = 3

USER_AGENT = (
    "ApplyOSJobExtractor/0.1 "
    "(personal job tracker; public job-page metadata only)"
)


class JobExtractionError(Exception):
    """An expected failure while retrieving or parsing a job posting."""


def _is_public_address(address: ipaddress.IPv4Address | ipaddress.IPv6Address) -> bool:
    return (
        address.is_global
        and not address.is_private
        and not address.is_loopback
        and not address.is_link_local
        and not address.is_multicast
        and not address.is_reserved
        and not address.is_unspecified
    )


def _resolve_public_addresses(url: str) -> tuple[object, list[ipaddress.IPv4Address | ipaddress.IPv6Address]]:
    """Parse a URL and resolve its hostname, rejecting non-public addresses."""
    try:
        parsed = urlparse(url)
        hostname = parsed.hostname
        port = parsed.port
    except ValueError as exc:
        raise JobExtractionError("Invalid URL.") from exc

    if parsed.scheme not in {"http", "https"}:
        raise JobExtractionError("Only HTTP and HTTPS URLs are supported.")

    if not hostname or parsed.username or parsed.password:
        raise JobExtractionError("The URL must contain a valid public hostname.")

    if port is not None and port not in {80, 443}:
        raise JobExtractionError("This endpoint only supports ports 80 and 443.")

    if hostname.lower() == "localhost" or hostname.lower().endswith(".localhost"):
        raise JobExtractionError("Localhost URLs are not allowed.")

    try:
        literal_address = ipaddress.ip_address(hostname.strip("[]"))
        addresses = [literal_address]
    except ValueError:
        try:
            records = socket.getaddrinfo(
                hostname,
                port or (443 if parsed.scheme == "https" else 80),
                type=socket.SOCK_STREAM,
            )
        except OSError as exc:
            raise JobExtractionError("The hostname could not be resolved.") from exc

        addresses = []
        for record in records:
            try:
                address = ipaddress.ip_address(record[4][0].split("%")[0])
            except ValueError as exc:
                raise JobExtractionError(
                    "The hostname resolved to an invalid IP address."
                ) from exc

            if address not in addresses:
                addresses.append(address)

    if not addresses:
        raise JobExtractionError("The hostname has no usable IP addresses.")

    # Reject the whole hostname if any answer is unsafe.
    # This prevents an unsafe DNS answer from being hidden among public answers.
    if any(not _is_public_address(address) for address in addresses):
        raise JobExtractionError(
            "URLs resolving to non-public IP addresses are not allowed."
        )

    return parsed, addresses


def validate_public_url(url: str) -> str:
    """Validate a public HTTP(S) URL and reject unsafe destinations."""
    _resolve_public_addresses(url)
    return url


def _clean_text(value: object) -> str | None:
    if not isinstance(value, str):
        return None

    cleaned = " ".join(value.split())
    return cleaned or None


def _first_text(*values: object) -> str | None:
    for value in values:
        cleaned = _clean_text(value)
        if cleaned:
            return cleaned

    return None


def _get_company(value: object) -> str | None:
    if isinstance(value, str):
        return _clean_text(value)

    if isinstance(value, dict):
        return _first_text(value.get("name"))

    if isinstance(value, list):
        for item in value:
            company = _get_company(item)
            if company:
                return company

    return None


def _get_location(value: object) -> str | None:
    """Extract a readable location from common JobPosting structures."""
    if isinstance(value, str):
        return _clean_text(value)

    if isinstance(value, list):
        locations = [_get_location(item) for item in value]
        return "; ".join(item for item in locations if item) or None

    if not isinstance(value, dict):
        return None

    address = value.get("address")
    if isinstance(address, list):
        locations = [_get_location(item) for item in address]
        return "; ".join(item for item in locations if item) or None

    if isinstance(address, dict):
        country = address.get("addressCountry")
        if isinstance(country, str):
            country_name = _clean_text(country)
        elif isinstance(country, dict):
            country_name = _clean_text(country.get("name"))
        else:
            country_name = None

        parts = [
            _clean_text(address.get("addressLocality")),
            _clean_text(address.get("addressRegion")),
            country_name,
        ]
        result = ", ".join(part for part in parts if part)
        if result:
            return result

    return _first_text(value.get("name"))


def _get_description(value: object) -> str | None:
    if not isinstance(value, str):
        return None

    # JobPosting descriptions commonly contain HTML.
    text = BeautifulSoup(value, "html.parser").get_text(" ", strip=True)
    return _clean_text(text)


def _find_job_posting(data: object) -> dict | None:
    """Find a JobPosting object in JSON-LD, including @graph arrays."""
    if isinstance(data, list):
        for item in data:
            result = _find_job_posting(item)
            if result:
                return result

    if not isinstance(data, dict):
        return None

    type_value = data.get("@type")
    types = type_value if isinstance(type_value, list) else [type_value]

    if "JobPosting" in types:
        return data

    graph = data.get("@graph")
    if graph is not None:
        result = _find_job_posting(graph)
        if result:
            return result

    return None


def _parse_json_ld(soup: BeautifulSoup) -> dict | None:
    for script in soup.find_all("script", type="application/ld+json"):
        raw = script.string or script.get_text()

        if not raw.strip():
            continue

        try:
            data = json.loads(raw)
        except (json.JSONDecodeError, TypeError):
            continue

        result = _find_job_posting(data)
        if result:
            return result

    return None


def parse_job_html(html: str, url: str) -> dict:
    """Extract supported job fields from JSON-LD and page metadata."""
    soup = BeautifulSoup(html, "html.parser")
    job = _parse_json_ld(soup) or {}

    title = _first_text(
        job.get("title"),
        soup.find("meta", property="og:title").get("content")
        if soup.find("meta", property="og:title")
        else None,
        soup.title.get_text(" ", strip=True) if soup.title else None,
    )

    company = _get_company(job.get("hiringOrganization"))

    location = _get_location(job.get("jobLocation"))
    if not location and isinstance(job.get("jobLocationType"), str):
        location = _clean_text(job.get("jobLocationType"))

    description = _get_description(job.get("description"))

    employment_type = job.get("employmentType")
    if isinstance(employment_type, list):
        employment_type = ", ".join(
            item for item in employment_type if isinstance(item, str)
        )
    employment_type = _clean_text(employment_type)

    if not company:
        company_meta = soup.find("meta", property="og:site_name")
        if company_meta:
            company = _clean_text(company_meta.get("content"))

    missing_fields = [
        field
        for field, value in {
            "title": title,
            "company": company,
            "location": location,
            "description": description,
            "employment_type": employment_type,
        }.items()
        if not value
    ]

    return {
        "url": url,
        "title": title,
        "company": company,
        "location": location,
        "description": description,
        "employment_type": employment_type,
        "missing_fields": missing_fields,
        "extraction_source": "json-ld" if job else "page-metadata",
    }


def _host_header(hostname: str, port: int | None, scheme: str) -> str:
    """Build the Host header for the original hostname and effective port."""
    try:
        address = ipaddress.ip_address(hostname)
        host = f"[{address.compressed}]" if address.version == 6 else address.compressed
    except ValueError:
        host = hostname

    default_port = 443 if scheme == "https" else 80
    if port is not None and port != default_port:
        return f"{host}:{port}"

    return host


def fetch_public_html(url: str) -> tuple[str, str]:
    """Fetch public HTML while pinning each connection to a validated IP."""
    current_url = url

    try:
        # Do not inherit environment proxies: they could change where the
        # outbound request is sent and bypass our direct-connection policy.
        with httpx.Client(
            timeout=REQUEST_TIMEOUT_SECONDS,
            follow_redirects=False,
            trust_env=False,
            headers={"User-Agent": USER_AGENT},
        ) as client:
            for redirect_count in range(MAX_REDIRECTS + 1):
                parsed, addresses = _resolve_public_addresses(current_url)
                hostname = parsed.hostname
                if hostname is None:
                    raise JobExtractionError(
                        "The URL must contain a valid public hostname."
                    )

                # Connect directly to a validated IP. Never ask HTTPX to
                # resolve the original hostname a second time.
                address = addresses[0]
                pinned_url = str(
                    httpx.URL(current_url).copy_with(host=address.compressed)
                )

                headers = {
                    "Host": _host_header(hostname, parsed.port, parsed.scheme)
                }
                extensions = {}

                # For DNS hostnames, keep TLS SNI and certificate verification
                # tied to the original hostname, not the pinned IP.
                try:
                    ipaddress.ip_address(hostname.strip("[]"))
                    is_ip_literal = True
                except ValueError:
                    is_ip_literal = False

                if parsed.scheme == "https" and not is_ip_literal:
                    extensions["sni_hostname"] = hostname.encode("idna").decode("ascii")

                with client.stream(
                    "GET",
                    pinned_url,
                    headers=headers,
                    extensions=extensions,
                ) as response:
                    if response.is_redirect:
                        location = response.headers.get("location")
                        if not location:
                            raise JobExtractionError(
                                "The page returned an invalid redirect."
                            )

                        if redirect_count >= MAX_REDIRECTS:
                            raise JobExtractionError(
                                "The job page exceeded the redirect limit."
                            )

                        # The next iteration resolves and validates this URL
                        # before opening any connection to its destination.
                        current_url = urljoin(current_url, location)
                        continue

                    if response.status_code >= 400:
                        raise JobExtractionError(
                            f"The job page returned HTTP {response.status_code}."
                        )

                    content_type = response.headers.get("content-type", "")
                    if "text/html" not in content_type.lower():
                        raise JobExtractionError(
                            "The URL did not return an HTML page."
                        )

                    content_length = response.headers.get("content-length")
                    if content_length:
                        try:
                            if int(content_length) > MAX_RESPONSE_BYTES:
                                raise JobExtractionError(
                                    "The job page is too large to process."
                                )
                        except ValueError:
                            pass

                    chunks: list[bytes] = []
                    total_bytes = 0

                    for chunk in response.iter_bytes():
                        total_bytes += len(chunk)

                        if total_bytes > MAX_RESPONSE_BYTES:
                            raise JobExtractionError(
                                "The job page exceeded the size limit."
                            )

                        chunks.append(chunk)

                    encoding = response.encoding or "utf-8"
                    html = b"".join(chunks).decode(encoding, errors="replace")
                    return html, current_url

    except JobExtractionError:
        raise
    except httpx.TimeoutException as exc:
        raise JobExtractionError("The job page request timed out.") from exc
    except httpx.HTTPError as exc:
        raise JobExtractionError("Unable to retrieve the job page.") from exc
    except OSError as exc:
        raise JobExtractionError("Unable to retrieve the job page.") from exc

    raise JobExtractionError("The job page exceeded the redirect limit.")


def extract_job(url: str) -> dict:
    html, final_url = fetch_public_html(url)
    return parse_job_html(html, final_url)
