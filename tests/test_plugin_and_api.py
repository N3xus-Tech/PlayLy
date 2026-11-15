"""Automated test suite for Digital Bridge Track 2 Accessible Learning Media Plugin & API.

Run with:
    python3 -m unittest discover -s tests -v
"""

from __future__ import annotations

import io
import sys
import unittest
import zipfile
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from api.app.main import (
    AccommodationRequest,
    WebhookRegistration,
    build_offline_pack_zip,
    get_certificate,
    get_job,
    create_lesson,
    get_lesson,
    list_lessons,
    get_transcript,
    parse_vtt,
    register_webhook,
    request_job_accommodation,
    text_to_braille_ascii,
)


class Track2PluginTests(unittest.TestCase):
    def test_vtt_parser_and_sound_off_cues(self) -> None:
        res = get_transcript("va-future", lang="en")
        self.assertEqual(res["language"], "en")
        self.assertGreaterEqual(len(res["cues"]), 6)
        self.assertIn("[Introductory chime]", res["cues"][0]["text"])

    def test_amharic_transcript_and_ethiopic_script(self) -> None:
        res = get_transcript("va-future", lang="am")
        self.assertEqual(res["language"], "am")
        self.assertIn("ሞጁል", res["cues"][0]["text"])

    def test_braille_brf_38_cell_line_wrapping(self) -> None:
        sample = "Accessible learning media for everyone in Ethiopia with Braille export."
        brf = text_to_braille_ascii(sample)
        for line in brf.splitlines():
            self.assertLessEqual(len(line), 38)
        self.assertTrue(brf.startswith(",accessible"))

    def test_3g_offline_pack_excludes_heavy_video(self) -> None:
        zip_bytes, filename = build_offline_pack_zip("va-future")
        self.assertEqual(filename, "va-future-3g-offline-pack.zip")
        self.assertLess(len(zip_bytes), 300_000, "3G offline pack must stay under 300 KB")
        with zipfile.ZipFile(io.BytesIO(zip_bytes), "r") as zf:
            names = set(zf.namelist())
            self.assertIn("lesson-offline.html", names)
            self.assertIn("media/lesson-audio.mp3", names)
            self.assertIn("captions/lesson.en.vtt", names)
            self.assertIn("captions/lesson.am.vtt", names)
            self.assertIn("transcript.brf", names)
            self.assertNotIn("media/lesson.mp4", names)

    def test_open_badges_valid_and_tampered_verification(self) -> None:
        valid_res = get_certificate("va-2026-001")
        self.assertTrue(valid_res["valid"])
        self.assertEqual(valid_res["status"], "valid")

        tampered_res = get_certificate("va-2026-001", sig="tampered_signature")
        self.assertFalse(tampered_res["valid"])
        self.assertEqual(tampered_res["status"], "not_valid")

    def test_bilingual_job_card_and_accommodation_request(self) -> None:
        job_am = get_job("accessible-va", lang="am")
        self.assertIn("ቨርቹዋል", job_am["title"])
        resp = request_job_accommodation(
            "accessible-va",
            AccommodationRequest(accommodations=["ethsl_interpreter"], language="am"),
        )
        self.assertEqual(resp.status_code, 201)


    def test_list_lessons_and_html_h1_tutorial(self) -> None:
        lessons = list_lessons()
        lesson_ids = {l["id"] for l in lessons}
        self.assertIn("html-h1-tag", lesson_ids)
        h1_lesson = next(l for l in lessons if l["id"] == "html-h1-tag")
        self.assertEqual(h1_lesson["title"], "What is the H1 tag on HTML")
        self.assertIsNotNone(h1_lesson["video"], "Main course video must be present")
        self.assertIsNotNone(h1_lesson["sign"], "EthSL sign video must be present")

    def test_create_lesson_dual_video_sync(self) -> None:
        import asyncio
        resp = asyncio.run(create_lesson(
            title="Introduction to HTML Divs",
            lesson_id="html-div-intro",
            video_url="/savanna/assets/media/va-future-lesson.mp4",
            sign_url="/savanna/assets/media/va-future-ethsl.mp4"
        ))
        self.assertEqual(resp.status_code, 201)
        data = get_lesson("html-div-intro")
        self.assertEqual(data["title"], "Introduction to HTML Divs")
        self.assertIn("va-future-lesson.mp4", data["video"])
        self.assertIn("va-future-ethsl.mp4", data["sign"])

if __name__ == "__main__":
    unittest.main()
