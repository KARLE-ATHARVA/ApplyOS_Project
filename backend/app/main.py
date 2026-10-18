
import os

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.schemas import ExtractJobRequest, ExtractedJob
from app.services.job_extractor import JobExtractionError, extract_job


def get_allowed_origins() -> list[str]:
    configured_origins = os.getenv(
        "FRONTEND_ORIGIN",
        "http://localhost:5173",
    )
    origins = [
        origin.strip().rstrip("/")
        for origin in configured_origins.split(",")
        if origin.strip()
    ]

    if not origins:
        raise RuntimeError(
            "FRONTEND_ORIGIN must contain at least one allowed origin."
        )

    if "*" in origins:
        raise RuntimeError("Wildcard CORS origins are not allowed.")

    return origins


limiter = Limiter(
    key_func=get_remote_address,
    default_limits=[],
)

app = FastAPI(
    title="ApplyOS API",
    description="Backend API for the ApplyOS job-search workspace.",
    version="0.1.0",
)

app.state.limiter = limiter
app.add_exception_handler(
    RateLimitExceeded,
    _rate_limit_exceeded_handler,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_allowed_origins(),
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok", "service": "applyos-api"}


@app.post("/api/v1/jobs/extract", response_model=ExtractedJob)
@limiter.limit("10/minute")
def extract_job_endpoint(
    request: Request,
    payload: ExtractJobRequest,
) -> ExtractedJob:
    try:
        result = extract_job(str(payload.url))
        return ExtractedJob(**result)
    except JobExtractionError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
