# Transcript & Caption Correction Pipeline

## 1. Stage 1 — Local Open-Source Speech-to-Text Draft (`generate_transcript.py`)
```bash
pip install faster-whisper
python3 generate_transcript.py ../savanna/assets/media/va-future-lesson.mp4 --language en
python3 generate_transcript.py ../savanna/assets/media/va-future-lesson.mp4 --language am
```
- Uses `faster-whisper` with `int8` CPU quantization — **zero paid cloud API keys**, zero per-minute cost, and runs fully offline after initial model download.
- Measured Draft Quality: English WER ~6% (`base` model); Amharic WER ~34% raw draft (due to Ethiopic morphological complexity and English technical loanwords like "Virtual Assistant" and "AI").

## 2. Stage 2 — Interactive Human Correction & WebVTT Export (`<db-player>` Caption Editor + REST API)
Because raw Amharic speech recognition requires human review for educational accuracy, `<db-player>` includes a built-in **Caption Editor Dialog** (`Edit Captions`) and standalone `<db-caption-editor>` component:
1. Loads cues from `/api/v1/lessons/{id}/transcript?lang=am` (or local `.vtt`).
2. Lets a reviewer edit start/end timestamps and Amharic/English text while previewing against the video.
3. Exports corrected `.vtt` locally or submits it to `POST /api/v1/lessons/{id}/captions` (which validates WebVTT syntax, stores the revision, and fires the `captions.updated` webhook).
