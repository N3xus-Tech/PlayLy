"""Core configuration and settings module."""

from __future__ import annotations

from .config import (
    ACCOMMODATIONS_FILE,
    API_DIRECTORY,
    CERTIFICATE_SECRET,
    DATA_DIRECTORY,
    LESSONS_FILE,
    REPOSITORY_ROOT,
    UPLOAD_DIRECTORY,
    WEBHOOKS_FILE,
)

__all__ = [
    "REPOSITORY_ROOT",
    "API_DIRECTORY",
    "DATA_DIRECTORY",
    "LESSONS_FILE",
    "UPLOAD_DIRECTORY",
    "WEBHOOKS_FILE",
    "ACCOMMODATIONS_FILE",
    "CERTIFICATE_SECRET",
]
