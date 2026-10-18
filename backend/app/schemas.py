
from pydantic import BaseModel, Field, HttpUrl


class ExtractJobRequest(BaseModel):
    url: HttpUrl


class ExtractedJob(BaseModel):
    url: str
    title: str | None = None
    company: str | None = None
    location: str | None = None
    description: str | None = None
    employment_type: str | None = None
    missing_fields: list[str] = Field(default_factory=list)
    extraction_source: str | None = None
