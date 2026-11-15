"""Lesson data management, VTT parsing, Braille ASCII conversion, and 3G offline pack packaging."""

from __future__ import annotations

import html as html_module
import io
import json
import re
import zipfile
from pathlib import Path

from fastapi import HTTPException

from ..core.config import DATA_DIRECTORY, LESSONS_FILE, REPOSITORY_ROOT, UPLOAD_DIRECTORY
from ..schemas.captions import CaptionCorrection
from .webhooks import fire_webhooks


def load_lessons() -> dict[str, dict]:
    return json.loads(LESSONS_FILE.read_text(encoding="utf-8"))


def get_lesson_or_404(lesson_id: str) -> dict:
    lesson = load_lessons().get(lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found.")
    return lesson


def resolve_static_path(url_path: str) -> Path:
    clean = url_path.lstrip("/")
    candidate = (REPOSITORY_ROOT / clean).resolve()
    if REPOSITORY_ROOT in candidate.parents and candidate.is_file():
        return candidate
    # Fallback lookup inside savanna/ if requested via /assets/...
    alt = (REPOSITORY_ROOT / "savanna" / clean).resolve()
    if REPOSITORY_ROOT in alt.parents and alt.is_file():
        return alt
    raise HTTPException(status_code=404, detail=f"Asset not found: {url_path}")


def time_to_seconds(value: str) -> float:
    parts = value.replace(",", ".").split(":")
    seconds = 0.0
    for part in parts:
        seconds = seconds * 60 + float(part)
    return seconds


def parse_vtt(vtt_text: str) -> list[dict]:
    cues: list[dict] = []
    blocks = re.split(r"\r?\n\s*\r?\n", vtt_text.replace("\ufeff", "").strip())
    for block in blocks:
        lines = [line.strip() for line in block.splitlines() if line.strip()]
        timing_index = next((i for i, line in enumerate(lines) if "-->" in line), None)
        if timing_index is None:
            continue
        start, end = [part.strip().split(" ")[0] for part in lines[timing_index].split("-->", 1)]
        text = " ".join(lines[timing_index + 1 :])
        if text:
            cues.append(
                {
                    "start": time_to_seconds(start),
                    "end": time_to_seconds(end),
                    "text": text,
                }
            )
    return cues


def transcript_text(lesson: dict, language: str) -> str:
    # Check if a reviewer-corrected VTT exists first
    corrected_path = UPLOAD_DIRECTORY / f"{lesson['id']}.{language}.vtt"
    if corrected_path.is_file():
        return corrected_path.read_text(encoding="utf-8")
    captions = lesson["captions"]
    caption_url = captions.get(language) or captions.get("en")
    return resolve_static_path(caption_url).read_text(encoding="utf-8")


def text_to_braille_ascii(text: str) -> str:
    braille_map = {
        "a": "a", "b": "b", "c": "c", "d": "d", "e": "e", "f": "f", "g": "g", "h": "h", "i": "i", "j": "j",
        "k": "k", "l": "l", "m": "m", "n": "n", "o": "o", "p": "p", "q": "q", "r": "r", "s": "s", "t": "t",
        "u": "u", "v": "v", "w": "w", "x": "x", "y": "y", "z": "z",
        "1": "#a", "2": "#b", "3": "#c", "4": "#d", "5": "#e", "6": "#f", "7": "#g", "8": "#h", "9": "#i", "0": "#j",
        ",": "1", ";": "2", ":": "3", ".": "4", "!": "6", "(": "7", ")": "7", "?": "8", '"': "8", "-": "-", " ": " "
    }
    words = text.split()
    lines = []
    cur = ""
    for w in words:
        bw = ""
        for ch in w:
            if ch.isupper():
                bw += ","
            bw += braille_map.get(ch.lower(), ch.lower())
        if len((cur + " " + bw).strip()) <= 38:
            cur = (cur + " " + bw).strip()
        else:
            if cur:
                lines.append(cur)
            cur = bw
    if cur:
        lines.append(cur)
    return "\r\n".join(lines)


def build_offline_pack_zip(lesson_id: str) -> tuple[bytes, str]:
    lesson = get_lesson_or_404(lesson_id)
    en_vtt = transcript_text(lesson, "en")
    am_vtt = transcript_text(lesson, "am")
    en_cues = parse_vtt(en_vtt)
    am_cues = parse_vtt(am_vtt)
    readable_en = "\n\n".join(f"[{int(c['start']//60)}:{int(c['start']%60):02d}] {c['text']}" for c in en_cues)
    readable_am = "\n\n".join(f"[{int(c['start']//60)}:{int(c['start']%60):02d}] {c['text']}" for c in am_cues)

    output = io.BytesIO()
    with zipfile.ZipFile(output, mode="w", compression=zipfile.ZIP_DEFLATED) as archive:
        archive.writestr(
            "lesson-offline.html",
            f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{html_module.escape(lesson['title'])} — 3G Offline Pack</title>
  <style>
    body {{ font-family: system-ui, "Noto Sans Ethiopic", sans-serif; max-width: 46rem; margin: 1.5rem auto; padding: 0 1rem; line-height: 1.6; color: #101828; }}
    h1, h2 {{ color: #05192d; }}
    .card {{ border: 2px solid #05192d; border-radius: 8px; padding: 1rem; margin: 1rem 0; background: #f8fafc; }}
    audio {{ width: 100%; margin-top: 0.5rem; }}
    pre {{ white-space: pre-wrap; background: #ffffff; border: 1px solid #cbd5e1; padding: 1rem; border-radius: 6px; font-family: inherit; }}
  </style>
</head>
<body>
  <main>
    <h1>{html_module.escape(lesson['title'])} (3G Offline Edition)</h1>
    <p>Designed for 3G mobile connections in Ethiopia: video is omitted to save mobile data. Includes full lesson audio, English and Amharic transcripts, and Grade 1 Braille (.brf).</p>
    <div class="card">
      <h2>Low-Bitrate Audio Lesson (MP3)</h2>
      <audio controls src="media/lesson-audio.mp3"></audio>
    </div>
    <h2>English Transcript</h2>
    <pre>{html_module.escape(readable_en)}</pre>
    <h2 lang="am">የአማርኛ ሙሉ ጽሑፍ (Amharic Transcript)</h2>
    <pre lang="am">{html_module.escape(readable_am)}</pre>
  </main>
</body>
</html>""",
        )
        archive.writestr("captions/lesson.en.vtt", en_vtt.encode("utf-8"))
        archive.writestr("captions/lesson.am.vtt", am_vtt.encode("utf-8"))
        archive.writestr("transcript-en.txt", readable_en.encode("utf-8"))
        archive.writestr("transcript-am.txt", readable_am.encode("utf-8"))
        archive.writestr(
            "transcript.brf",
            f",lesson: {lesson_id}\r\n======================================\r\n\r\n"
            + text_to_braille_ascii(readable_en)
            + "\r\n\x0C",
        )
        audio_path = resolve_static_path(lesson["audio"])
        archive.write(audio_path, "media/lesson-audio.mp3")

    output_bytes = output.getvalue()
    filename = f"{lesson_id}-3g-offline-pack.zip"
    return output_bytes, filename


def save_caption_correction(lesson_id: str, correction: CaptionCorrection, contents: bytes) -> dict:
    get_lesson_or_404(lesson_id)
    if correction.lesson_id != lesson_id:
        raise HTTPException(status_code=400, detail="The lesson id does not match the URL.")
    text_body = contents.decode("utf-8", errors="ignore").lstrip()
    if not text_body.startswith("WEBVTT"):
        raise HTTPException(status_code=400, detail="Upload a valid WebVTT caption file starting with WEBVTT.")
    UPLOAD_DIRECTORY.mkdir(parents=True, exist_ok=True)
    destination = UPLOAD_DIRECTORY / f"{lesson_id}.{correction.language}.vtt"
    destination.write_bytes(contents)
    result = {
        "status": "stored_and_active",
        "lesson_id": lesson_id,
        "language": correction.language,
        "reviewer": correction.reviewer,
        "stored_as": str(destination.name),
    }
    fire_webhooks("captions.updated", result)
    return result


def save_lesson(lesson_data: dict) -> dict:
    lessons = load_lessons()
    lesson_id = lesson_data["id"]
    lessons[lesson_id] = lesson_data
    LESSONS_FILE.parent.mkdir(parents=True, exist_ok=True)
    LESSONS_FILE.write_text(json.dumps(lessons, indent=2, ensure_ascii=False), encoding="utf-8")
    fire_webhooks("lesson.created", {"lesson_id": lesson_id, "title": lesson_data.get("title")})
    return lesson_data
