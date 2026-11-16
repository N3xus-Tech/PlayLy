"""Service layer for business logic, data persistence, and media processing."""

from __future__ import annotations

from .certificates import (
    ISSUED_CREDENTIALS,
    make_certificate,
    render_certificate_html,
    verify_certificate_signature,
)
from .jobs import (
    JOBS,
    get_job_or_404,
    list_jobs,
    record_accommodation_request,
)
from .lessons import (
    build_offline_pack_zip,
    get_lesson_or_404,
    load_lessons,
    parse_vtt,
    resolve_static_path,
    save_caption_correction,
    save_lesson,
    text_to_braille_ascii,
    time_to_seconds,
    transcript_text,
)
from .sign_translator import (
    ETHSL_LEXICON,
    translate_to_ethsl_gloss,
)
from .webhooks import (
    fire_webhooks,
    list_webhooks,
    register_webhook,
)

__all__ = [
    "ISSUED_CREDENTIALS",
    "make_certificate",
    "render_certificate_html",
    "verify_certificate_signature",
    "JOBS",
    "get_job_or_404",
    "list_jobs",
    "record_accommodation_request",
    "load_lessons",
    "get_lesson_or_404",
    "resolve_static_path",
    "time_to_seconds",
    "parse_vtt",
    "transcript_text",
    "text_to_braille_ascii",
    "build_offline_pack_zip",
    "save_caption_correction",
    "save_lesson",
    "ETHSL_LEXICON",
    "translate_to_ethsl_gloss",
    "fire_webhooks",
    "list_webhooks",
    "register_webhook",
]
