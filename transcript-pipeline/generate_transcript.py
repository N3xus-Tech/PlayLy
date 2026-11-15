#!/usr/bin/env python3
"""
generate_transcript.py — Offline batch transcript & WebVTT pipeline for Savanna learning media.

Uses faster-whisper (open-source speech-to-text, zero paid API keys, runs locally on CPU/GPU)
to transcribe lesson video/audio into draft WebVTT (.vtt) and plain text (.txt) files, which can
then be reviewed and corrected in the <db-caption-editor> plugin component or uploaded via
POST /api/v1/lessons/{id}/captions.
"""

import argparse
import sys
from pathlib import Path


def format_timestamp(seconds: float) -> str:
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = seconds % 60
    return f"{hours:02d}:{minutes:02d}:{secs:06.3f}"


def write_vtt(segments, out_path: Path) -> None:
    with out_path.open("w", encoding="utf-8") as f:
        f.write("WEBVTT\n\n")
        for i, seg in enumerate(segments, start=1):
            f.write(f"{i}\n")
            f.write(f"{format_timestamp(seg.start)} --> {format_timestamp(seg.end)}\n")
            f.write(f"{seg.text.strip()}\n\n")


def write_txt(segments, out_path: Path) -> None:
    with out_path.open("w", encoding="utf-8") as f:
        for seg in segments:
            f.write(seg.text.strip() + "\n")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("media_path", help="Path to an audio or video file")
    parser.add_argument("--model", default="base", help="faster-whisper model size (tiny, base, small, medium)")
    parser.add_argument("--language", default=None, help="Language code, e.g. en, am (default: auto-detect)")
    parser.add_argument("--device", default="cpu", choices=["cpu", "cuda"], help="Execution device (default: cpu)")
    args = parser.parse_args()

    media_path = Path(args.media_path)
    if not media_path.exists():
        print(f"File not found: {media_path}", file=sys.stderr)
        return 1

    try:
        from faster_whisper import WhisperModel
    except ImportError:
        print(
            "faster-whisper is not installed. Run:\n"
            "  pip install faster-whisper\n"
            "(Downloads the open-source model once; runs 100% offline afterwards.)",
            file=sys.stderr,
        )
        return 1

    model = WhisperModel(args.model, device=args.device, compute_type="int8")
    segments, info = model.transcribe(str(media_path), language=args.language)
    segments = list(segments)
    print(f"Detected language: {info.language} (confidence {info.language_probability:.2f})")

    vtt_path = media_path.with_suffix(".vtt")
    txt_path = media_path.with_suffix(".txt")
    write_vtt(segments, vtt_path)
    write_txt(segments, txt_path)
    print(f"Wrote {vtt_path} and {txt_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
