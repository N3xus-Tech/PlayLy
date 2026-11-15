"""Router for lesson metadata, transcripts, 3G offline pack, dual-video lesson creation, and caption pipeline."""

from __future__ import annotations

import re
from pathlib import Path
from typing import Annotated

from fastapi import APIRouter, Form, HTTPException, Response, UploadFile
from fastapi.responses import JSONResponse

from ..core.config import UPLOAD_DIRECTORY
from ..schemas.captions import CaptionCorrection
from ..services.lessons import (
    build_offline_pack_zip,
    get_lesson_or_404,
    load_lessons,
    parse_vtt,
    save_caption_correction,
    save_lesson,
    transcript_text,
)

router = APIRouter()


@router.get("/api/v1/lessons", tags=["lessons"])
def list_lessons() -> list[dict]:
    """Lists all published tutorial lessons."""
    lessons = load_lessons()
    return [
        {
            "id": lesson["id"],
            "title": lesson["title"],
            "video": lesson["video"],
            "sign": lesson.get("sign"),
            "audio": lesson.get("audio"),
            "captions": lesson.get("captions", {}),
            "descriptions": lesson.get("descriptions", {}),
            "offline_pack_bytes": lesson.get("offline_pack_bytes", 285000),
            "viewer_url": f"/savanna/pages/concept-with-navigation.html?lesson={lesson['id']}",
        }
        for lesson in lessons.values()
    ]


@router.get("/api/v1/lessons/{lesson_id}", tags=["lessons"])
def get_lesson(lesson_id: str) -> dict:
    lesson = get_lesson_or_404(lesson_id)
    return {
        "id": lesson["id"],
        "title": lesson["title"],
        "video": lesson["video"],
        "sign": lesson.get("sign"),
        "audio": lesson["audio"],
        "captions": lesson["captions"],
        "descriptions": lesson.get("descriptions"),
        "offline_pack_bytes": lesson.get("offline_pack_bytes", 285000),
        "viewer_url": f"/savanna/pages/concept-with-navigation.html?lesson={lesson['id']}",
    }


@router.post("/api/v1/lessons", status_code=201, tags=["lessons"])
async def create_lesson(
    title: Annotated[str, Form(description="Lesson tutorial title (e.g. What is the H1 tag on HTML)")],
    lesson_id: Annotated[str | None, Form(description="Optional custom lesson slug ID")] = None,
    video_url: Annotated[str | None, Form(description="URL to the main course video")] = None,
    sign_url: Annotated[str | None, Form(description="URL to the synchronized EthSL sign video")] = None,
    audio_url: Annotated[str | None, Form(description="URL to the lesson audio track")] = None,
    captions_en_url: Annotated[str | None, Form(description="English WebVTT caption URL")] = None,
    captions_am_url: Annotated[str | None, Form(description="Amharic WebVTT caption URL")] = None,
    video_file: UploadFile | None = None,
    sign_file: UploadFile | None = None,
    audio_file: UploadFile | None = None,
) -> JSONResponse:
    """Uploads or registers a new tutorial lesson with dual synchronized videos:
    1. Main Course Video (the tutorial / lecture)
    2. EthSL Sign Language Video (authentic human interpretation)
    Both play in exact lockstep synchronization in <db-player>.
    """
    clean_id = (lesson_id or "").strip()
    if not clean_id:
        clean_id = re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")
    if not clean_id:
        clean_id = "custom-tutorial"

    UPLOAD_DIRECTORY.mkdir(parents=True, exist_ok=True)

    # Main course video
    main_video_path = (video_url or "").strip() or "/savanna/assets/media/va-future-lesson.mp4"
    if video_file and video_file.filename:
        ext = Path(video_file.filename).suffix or ".mp4"
        dest = UPLOAD_DIRECTORY / f"{clean_id}_main{ext}"
        dest.write_bytes(await video_file.read())
        main_video_path = f"/uploads/{dest.name}"

    # Synchronized EthSL sign video
    sign_video_path = (sign_url or "").strip() or "/savanna/assets/media/va-future-ethsl.mp4"
    if sign_file and sign_file.filename:
        ext = Path(sign_file.filename).suffix or ".mp4"
        dest = UPLOAD_DIRECTORY / f"{clean_id}_sign{ext}"
        dest.write_bytes(await sign_file.read())
        sign_video_path = f"/uploads/{dest.name}"

    # Audio track
    audio_path = (audio_url or "").strip() or "/savanna/assets/media/va-future-audio.mp3"
    if audio_file and audio_file.filename:
        ext = Path(audio_file.filename).suffix or ".mp3"
        dest = UPLOAD_DIRECTORY / f"{clean_id}_audio{ext}"
        dest.write_bytes(await audio_file.read())
        audio_path = f"/uploads/{dest.name}"

    new_lesson = {
        "id": clean_id,
        "title": title.strip(),
        "video": main_video_path,
        "sign": sign_video_path,
        "audio": audio_path,
        "captions": {
            "en": (captions_en_url or "").strip() or "/savanna/assets/captions/va-future-en.vtt",
            "am": (captions_am_url or "").strip() or "/savanna/assets/captions/va-future-am.vtt",
        },
        "descriptions": {
            "en": "/savanna/assets/captions/va-future-ad-en.vtt",
            "am": "/savanna/assets/captions/va-future-ad-am.vtt",
        },
        "offline_pack_bytes": 285000,
        "viewer_url": f"/savanna/pages/concept-with-navigation.html?lesson={clean_id}",
    }

    saved = save_lesson(new_lesson)
    return JSONResponse(status_code=201, content=saved)


@router.get("/api/v1/lessons/{lesson_id}/transcript", tags=["lessons"])
def get_transcript(lesson_id: str, lang: str = "en") -> dict:
    lesson = get_lesson_or_404(lesson_id)
    selected_language = lang if lang in lesson["captions"] else "en"
    text = transcript_text(lesson, selected_language)
    return {
        "lesson_id": lesson_id,
        "language": selected_language,
        "cues": parse_vtt(text),
        "download_url": lesson["captions"][selected_language],
    }


@router.get("/api/v1/lessons/{lesson_id}/offline-pack", tags=["offline"])
def offline_pack(lesson_id: str) -> Response:
    """Builds a 3G-optimized offline ZIP (<300 KB) containing low-bitrate MP3 audio,
    bilingual English & Amharic transcripts, Grade 1 Braille (.brf), and light HTML.
    Intentionally excludes the heavy MP4 video stream to save mobile data on 3G.
    """
    output_bytes, filename = build_offline_pack_zip(lesson_id)
    return Response(
        content=output_bytes,
        media_type="application/zip",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Content-Length": str(len(output_bytes)),
        },
    )


@router.post("/api/v1/lessons/{lesson_id}/captions", status_code=201, tags=["captions"])
async def upload_caption_correction(
    lesson_id: str,
    metadata: Annotated[str, Form(description="JSON metadata for the correction")],
    caption_file: UploadFile,
) -> JSONResponse:
    get_lesson_or_404(lesson_id)
    try:
        correction = CaptionCorrection.model_validate_json(metadata)
    except Exception as error:
        raise HTTPException(status_code=400, detail="Caption metadata is not valid JSON.") from error
    contents = await caption_file.read()
    result = save_caption_correction(lesson_id, correction, contents)
    return JSONResponse(status_code=201, content=result)
