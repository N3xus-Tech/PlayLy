"""API router modules."""

from __future__ import annotations

from .certificates import (
    get_certificate,
    router as certificates_router,
    verify_certificate_page,
)
from .jobs import (
    get_job,
    list_jobs,
    request_job_accommodation,
    router as jobs_router,
)
from .lessons import (
    create_lesson,
    get_lesson,
    get_transcript,
    list_lessons,
    offline_pack,
    router as lessons_router,
    upload_caption_correction,
)
from .webhooks import (
    list_webhooks,
    register_webhook,
    router as webhooks_router,
)

__all__ = [
    "lessons_router",
    "jobs_router",
    "certificates_router",
    "webhooks_router",
    "list_lessons",
    "create_lesson",
    "get_lesson",
    "get_transcript",
    "offline_pack",
    "upload_caption_correction",
    "list_jobs",
    "get_job",
    "request_job_accommodation",
    "get_certificate",
    "verify_certificate_page",
    "register_webhook",
    "list_webhooks",
]
