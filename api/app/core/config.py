"""Configuration settings and filesystem paths for Savanna API."""

from __future__ import annotations

import os
import sys
from pathlib import Path

# Repository root (Savanna-static-pages)
REPOSITORY_ROOT = Path(__file__).resolve().parents[3]
if str(REPOSITORY_ROOT) not in sys.path:
    sys.path.insert(0, str(REPOSITORY_ROOT))

API_DIRECTORY = REPOSITORY_ROOT / "api"
if str(API_DIRECTORY) not in sys.path:
    sys.path.insert(0, str(API_DIRECTORY))

DATA_DIRECTORY = REPOSITORY_ROOT / "api" / "data"
LESSONS_FILE = DATA_DIRECTORY / "lessons.json"
UPLOAD_DIRECTORY = DATA_DIRECTORY / "uploads"
WEBHOOKS_FILE = DATA_DIRECTORY / "webhooks.json"
ACCOMMODATIONS_FILE = DATA_DIRECTORY / "accommodations.json"

CERTIFICATE_SECRET = os.environ.get(
    "CERTIFICATE_SECRET", "development-only-change-me-before-production"
).encode("utf-8")

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
