"""Career Gateway job opportunities and accommodation request management."""

from __future__ import annotations

import json
from datetime import datetime, timezone

from fastapi import HTTPException

from ..core.config import ACCOMMODATIONS_FILE, DATA_DIRECTORY
from ..schemas.jobs import AccommodationRequest
from .webhooks import fire_webhooks

JOBS = {
    "accessible-va": {
        "en": {
            "id": "accessible-va",
            "title": "Junior Virtual Assistant",
            "organization": "Safaricom Telecommunications Ethiopia",
            "location": "Addis Ababa or remote",
            "summary": (
                "Support a distributed team with scheduling and accessible digital "
                "documents. The employer provides an Ethiopian Sign Language "
                "interpreter and offers remote interview accommodations."
            ),
            "accommodations": [
                "Screen-reader compatible application process (NVDA / TalkBack)",
                "Ethiopian Sign Language (EthSL) interpreter on request",
                "Remote or asynchronous written interview option",
            ],
            "certificate_url": "/certificates/va-2026-001",
        },
        "am": {
            "id": "accessible-va",
            "title": "ጀማሪ ቨርቹዋል ረዳት (Junior Virtual Assistant)",
            "organization": "Safaricom Telecommunications Ethiopia",
            "location": "አዲስ አበባ ወይም በርቀት (Remote)",
            "summary": (
                "የርቀት ቡድንን በቀጠሮ ማስያዝ እና በተደራሽ ዲጂታል ሰነዶች ያግዙ። "
                "ቀጣሪው የኢትዮጵያ የምልክት ቋንቋ አስተርጓሚ እና ለቃለ መጠይቅ ልዩ ድጋፍ ያቀርባል።"
            ),
            "accommodations": [
                "ለስክሪን አንባቢ (NVDA / TalkBack) ተስማሚ የሆነ የማመልከቻ ሂደት",
                "በጥያቄ የሚቀርብ የኢትዮጵያ የምልክት ቋንቋ (EthSL) አስተርጓሚ",
                "በርቀት ወይም በጽሑፍ የሚከናወን የቃለ መጠይቅ አማራጭ",
            ],
            "certificate_url": "/certificates/va-2026-001",
        },
    }
}


def list_jobs(lang: str = "en") -> list[dict]:
    key = "am" if lang == "am" else "en"
    return [job[key] for job in JOBS.values()]


def get_job_or_404(job_id: str, lang: str = "en") -> dict:
    job_entry = JOBS.get(job_id)
    if not job_entry:
        raise HTTPException(status_code=404, detail="Job not found.")
    key = "am" if lang == "am" else "en"
    return job_entry[key]


def record_accommodation_request(job_id: str, req: AccommodationRequest) -> dict:
    if job_id not in JOBS:
        raise HTTPException(status_code=404, detail="Job not found.")
    DATA_DIRECTORY.mkdir(parents=True, exist_ok=True)
    existing = []
    if ACCOMMODATIONS_FILE.is_file():
        try:
            existing = json.loads(ACCOMMODATIONS_FILE.read_text(encoding="utf-8"))
        except Exception:
            existing = []
    entry = {
        "id": f"acc-{len(existing) + 1:03d}",
        "job_id": job_id,
        "accommodations": req.accommodations,
        "language": req.language,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    existing.append(entry)
    ACCOMMODATIONS_FILE.write_text(json.dumps(existing, indent=2), encoding="utf-8")
    fire_webhooks("job.accommodation_requested", entry)
    return entry
