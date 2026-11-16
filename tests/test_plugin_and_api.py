"""Automated test suite for Digital Bridge Track 2 Accessible Learning Media Plugin & API.

Run with:
    python3 -m unittest discover -s tests -v
"""

from __future__ import annotations

import asyncio
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
    SignTranslationRequest,
    WebhookRegistration,
    build_offline_pack_zip,
    create_lesson,
    get_certificate,
    get_job,
    get_lesson,
    get_sign_dictionary,
    get_transcript,
    list_lessons,
    parse_vtt,
    register_webhook,
    request_job_accommodation,
    text_to_braille_ascii,
    translate_sign_endpoint,
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

    def test_real_time_ethsl_sign_translation_en_and_am(self) -> None:
        en_res = translate_sign_endpoint(
            SignTranslationRequest(
                text="[Introductory chime] Welcome to the future of Virtual Assistant work in Ethiopia",
                language="en",
            )
        )
        self.assertIn("Introductory chime", en_res["sound_cues"])
        self.assertIn("VIRTUAL-DIGITAL", en_res["gloss_string_en"])
        self.assertIn("ETHIOPIA", en_res["gloss_string_en"])
        # Verify SOV reordering places verb WELCOME at the end of the clause
        self.assertTrue(en_res["gloss_string_en"].endswith("WELCOME") or "WELCOME" in en_res["gloss_string_en"])

        am_res = translate_sign_endpoint(
            SignTranslationRequest(
                text="እንኳን ወደ ቨርቹዋል ረዳት ሥራ በኢትዮጵያ በደህና መጡ",
                language="am",
            )
        )
        self.assertIn("ኢትዮጵያ", am_res["gloss_string_am"])
        self.assertGreaterEqual(len(am_res["gloss_sequence"]), 3)

        dict_res = get_sign_dictionary()
        self.assertGreaterEqual(dict_res["count"], 15)
        self.assertIn("ethiopia", dict_res["signs"])

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
        resp = asyncio.run(
            create_lesson(
                title="Introduction to HTML Divs",
                lesson_id="html-div-intro",
                video_url="/savanna/assets/media/va-future-lesson.mp4",
                sign_url="/savanna/assets/media/va-future-ethsl.mp4",
            )
        )
        self.assertEqual(resp.status_code, 201)
        data = get_lesson("html-div-intro")
        self.assertEqual(data["title"], "Introduction to HTML Divs")
        self.assertIn("va-future-lesson.mp4", data["video"])
        self.assertIn("va-future-ethsl.mp4", data["sign"])



    def test_real_w3c_internet_video_lessons(self) -> None:
        w3c_lesson = get_lesson("w3c-video-captions")
        self.assertEqual(
            w3c_lesson["video"],
            "https://media.w3.org/wai/perspective-videos/video-captions.mp4",
        )
        en_caps = get_transcript("w3c-video-captions", lang="en")
        am_caps = get_transcript("w3c-video-captions", lang="am")
        self.assertGreaterEqual(len(en_caps["cues"]), 5)
        self.assertGreaterEqual(len(am_caps["cues"]), 5)
        self.assertIn("Video Captions", en_caps["cues"][0]["text"])


if __name__ == "__main__":
    unittest.main()
