"""FastAPI service for the Digital Bridge Track 2 Accessible Learning Media Plugin.

Exposes Level 2 REST API endpoints (/api/v1/*), interactive Swagger UI (/docs),
lightweight 3G offline pack builder (audio + bilingual HTML + VTT + .brf Braille, excluding heavy video),
real-time Ethiopian Sign Language (EthSL) SOV gloss & kinematic translation engine,
caption correction pipeline, accessible career gateway with Schema.org JobPosting metadata,
Open Badges 3.0 cryptographic signature verification (valid & invalid states), and host webhooks.
"""

from __future__ import annotations

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from fastapi.staticfiles import StaticFiles

from .core.config import (
    ACCOMMODATIONS_FILE,
    API_DIRECTORY,
    CERTIFICATE_SECRET,
    DATA_DIRECTORY,
    LESSONS_FILE,
    REPOSITORY_ROOT,
    UPLOAD_DIRECTORY,
    WEBHOOKS_FILE,
)
from .routers import (
    SignTranslationRequest,
    certificates_router,
    create_lesson,
    get_certificate,
    get_job,
    get_lesson,
    get_sign_dictionary,
    get_transcript,
    jobs_router,
    lessons_router,
    list_jobs,
    list_lessons,
    list_webhooks,
    offline_pack,
    register_webhook,
    request_job_accommodation,
    sign_router,
    translate_sign_endpoint,
    upload_caption_correction,
    verify_certificate_page,
    webhooks_router,
)
from .schemas import (
    AccommodationRequest,
    CaptionCorrection,
    WebhookRegistration,
)
from .services.certificates import (
    ISSUED_CREDENTIALS,
    make_certificate,
    render_certificate_html,
    verify_certificate_signature,
)
from .services.jobs import (
    JOBS,
    get_job_or_404,
    record_accommodation_request,
)
from .services.lessons import (
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
from .services.sign_translator import (
    ETHSL_LEXICON,
    translate_to_ethsl_gloss,
)
from .services.webhooks import (
    fire_webhooks,
)

app = FastAPI(
    title="Savanna Accessible Learning Media Plugin API",
    description=(
        "Level 2 & Level 3 REST API for the Digital Bridge Track 2 Accessible Learning Media Plugin. "
        "Serves lesson metadata, parsed bilingual transcripts, real-time EthSL sign language translation, "
        "ultra-light 3G offline packs (<300 KB), caption correction workflows, accessible career gateway "
        "listings with Schema.org JobPosting, Open Badges 3.0 cryptographic verification, and host webhooks."
    ),
    version="2.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def handle_head_requests(request: Request, call_next):
    if request.method == "HEAD":
        request.scope["method"] = "GET"
        response = await call_next(request)
        return Response(content=b"", status_code=response.status_code, headers=dict(response.headers))
    return await call_next(request)


@app.get("/healthz", tags=["meta"])
def health_check() -> dict[str, str]:
    return {"status": "ok"}


# Include decoupled routers
app.include_router(lessons_router)
app.include_router(sign_router)
app.include_router(jobs_router)
app.include_router(certificates_router)
app.include_router(webhooks_router)


# Convenience redirects so both /pages/... and /savanna/pages/... work seamlessly
@app.get("/", include_in_schema=False)
def root_redirect() -> RedirectResponse:
    return RedirectResponse(url="/savanna/pages/concept-with-navigation.html")


@app.get("/admin", include_in_schema=False)
def admin_redirect() -> RedirectResponse:
    return RedirectResponse(url="/savanna/pages/admin-upload.html")


app.mount("/savanna", StaticFiles(directory=REPOSITORY_ROOT / "savanna", html=True), name="savanna")
app.mount("/pages", StaticFiles(directory=REPOSITORY_ROOT / "savanna" / "pages", html=True), name="pages_alias")
app.mount("/assets", StaticFiles(directory=REPOSITORY_ROOT / "savanna" / "assets"), name="assets_alias")
app.mount("/module", StaticFiles(directory=REPOSITORY_ROOT / "module"), name="module")
app.mount("/demo", StaticFiles(directory=REPOSITORY_ROOT / "demo", html=True), name="demo")
UPLOAD_DIRECTORY.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIRECTORY), name="uploads")
app.mount("/documents", StaticFiles(directory=REPOSITORY_ROOT / "documents", html=True), name="documents")
app.mount("/", StaticFiles(directory=REPOSITORY_ROOT, html=True), name="root")

__all__ = [
    "app",
    "handle_head_requests",
    "health_check",
    "root_redirect",
    "lessons_router",
    "sign_router",
    "jobs_router",
    "certificates_router",
    "webhooks_router",
    "get_lesson",
    "list_lessons",
    "create_lesson",
    "get_transcript",
    "offline_pack",
    "upload_caption_correction",
    "SignTranslationRequest",
    "translate_sign_endpoint",
    "get_sign_dictionary",
    "translate_to_ethsl_gloss",
    "ETHSL_LEXICON",
    "list_jobs",
    "get_job",
    "request_job_accommodation",
    "get_certificate",
    "verify_certificate_page",
    "register_webhook",
    "list_webhooks",
    "REPOSITORY_ROOT",
    "API_DIRECTORY",
    "DATA_DIRECTORY",
    "LESSONS_FILE",
    "UPLOAD_DIRECTORY",
    "WEBHOOKS_FILE",
    "ACCOMMODATIONS_FILE",
    "CERTIFICATE_SECRET",
    "ISSUED_CREDENTIALS",
    "JOBS",
    "CaptionCorrection",
    "AccommodationRequest",
    "WebhookRegistration",
    "load_lessons",
    "get_lesson_or_404",
    "get_job_or_404",
    "resolve_static_path",
    "time_to_seconds",
    "parse_vtt",
    "transcript_text",
    "text_to_braille_ascii",
    "build_offline_pack_zip",
    "save_caption_correction",
    "save_lesson",
    "make_certificate",
    "verify_certificate_signature",
    "render_certificate_html",
    "record_accommodation_request",
    "fire_webhooks",
]
