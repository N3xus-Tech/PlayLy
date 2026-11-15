"""Router for Career Gateway jobs and accommodation requests."""

from __future__ import annotations

from fastapi import APIRouter
from fastapi.responses import JSONResponse

from ..schemas.jobs import AccommodationRequest
from ..services.jobs import get_job_or_404, list_jobs as service_list_jobs, record_accommodation_request

router = APIRouter(tags=["career"])


@router.get("/api/v1/jobs")
def list_jobs(lang: str = "en") -> list[dict]:
    return service_list_jobs(lang=lang)


@router.get("/api/v1/jobs/{job_id}")
def get_job(job_id: str, lang: str = "en") -> dict:
    return get_job_or_404(job_id, lang=lang)


@router.post("/api/v1/jobs/{job_id}/accommodations", status_code=201)
def request_job_accommodation(job_id: str, req: AccommodationRequest) -> JSONResponse:
    entry = record_accommodation_request(job_id, req)
    return JSONResponse(status_code=201, content={"status": "confirmed", "request": entry})
