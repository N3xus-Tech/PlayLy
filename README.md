# Savanna Accessible Learning Media Plugin (`db-player`, Track 2)

- **Track:** Track 2 — Accessible Learning Media & Career Gateway
- **Team / Builder:** Abel Alemayehu Garedew (Digital Bridge Ethiopia 2026)
- **Co-Designer Testing Profile:** Tested for Deaf (Ethiopian Sign Language + bilingual captions), blind/low-vision (NVDA / TalkBack screen readers + audio description + Grade 1 Braille `.brf` + 200% zoom), and 3G low-bandwidth learners.

## What it does
This module is a zero-dependency Web Component plugin (`<db-player>`, `<db-job-card>`, and `<db-live-viewer>`) and FastAPI backend (`/api/v1/*`) that adds accessible video playback, synchronized Ethiopian Sign Language (EthSL) prerecorded video player (authentic human interpretation, not AI-supported sign translation), restyleable English and Amharic captions, spoken audio descriptions, an interactive caption editor, Grade 1 Braille (`.brf`) export, and a 3G offline pack to ALX Savanna or any other learning platform. It also provides an accessible career gateway with spoken audio job summaries, private interview accommodation requests, `schema.org/JobPosting` metadata, and Open Badges 3.0 cryptographic credential verification. It installs on any host site with a single `<script>` tag without altering the host's stylesheets.

## The main task we tested
"A Deaf, blind, or 3G-constrained learner opens a Savanna lesson or external host page, plays the lesson with keyboard or screen reader alone using synchronized Ethiopian Sign Language, resized Amharic captions, or spoken audio description, downloads the `< 300 KB` 3G offline pack or `.brf` Braille transcript, and requests an interview accommodation on the Career Gateway with a verifiable Open Badges 3.0 certificate—completely unaided."

## Run it
Run the entire stack with one command:
```bash
docker compose up --build
```
*(Or without Docker using Python 3.10+)*:
```bash
pip install -r api/requirements.txt
uvicorn api.app.main:app --host 0.0.0.0 --port 8080
```
Then open these addresses in your browser:
- **Inside Savanna Host (Lesson + EthSL Video Player `<db-player>`):** `http://localhost:8080/savanna/pages/concept-with-navigation.html`
- **Outside Savanna Proof (`demo/blank.html`, zero Bootstrap/Savanna CSS):** `http://localhost:8080/demo/blank.html`
- **Accessible Career Gateway (`<db-job-card>`):** `http://localhost:8080/savanna/pages/jobs.html`
- **Admin Dual-Video Upload Studio (`admin-upload.html`):** `http://localhost:8080/savanna/pages/admin-upload.html` (or `/admin`)
- **Recorded Live Session Viewer (`<db-live-viewer>`, Extra Credit):** `http://localhost:8080/savanna/pages/live-session-viewer.html`
- **Accessible Lesson HTML & Tagged PDF:** `http://localhost:8080/documents/lesson-document.html` and `http://localhost:8080/documents/lesson-document.pdf`
- **Interactive Swagger API Docs (Level 2):** `http://localhost:8080/docs`

## Install, Level 1
Drop these two lines into any HTML page (CMS, Moodle, Canvas, or Savanna):
```html
<!-- 1. Load the single plugin script -->
<script src="/module/db-player.js" defer></script>

<!-- 2. Place the accessible player component -->
<db-player
  title="The Future of the VA Industry"
  src="/savanna/assets/media/va-future-lesson.mp4"
  captions="/savanna/assets/captions/va-future-en.vtt,/savanna/assets/captions/va-future-am.vtt"
  sign="/savanna/assets/media/va-future-ethsl.mp4"
  describe="/savanna/assets/captions/va-future-ad-en.vtt,/savanna/assets/captions/va-future-ad-am.vtt"
  api="/api/v1"
  lesson-id="va-future"
  offline-worker="/service-worker.js"
  lang="am">
</db-player>

<!-- 3. Place the career gateway job card component -->
<db-job-card api="/api/v1" job-id="accessible-va" lang="am"></db-job-card>
```
### Supported Attributes & CustomEvents
- **`<db-player>` attributes:** `src`, `captions` (comma-separated VTT URLs), `sign` (EthSL video URL), `describe` (audio description VTT URLs), `lang` (`"en"` or `"am"`), `api` (`/api/v1`), `lesson-id`, `offline-worker`, `title`.
- **`<db-job-card>` attributes:** `api`, `job-id`, `lang` (`"en"` or `"am"`).
- **`<db-live-viewer>` attributes:** `src`, `captions`, `lang`, `title`.
- **Dispatched Host Events (`bubbles: true, composed: true`):**
  - `db-player:progress` -> `{ seconds, percent }`
  - `db-player:complete` -> `{ lessonId }`
  - `db-player:prefs` -> `{ captionSize, captionColor, captionBackground, captionPosition, signPosition, signSize, language }`
  - `db-job-card:accommodation-requested` -> `{ jobId, accommodations, language }`

## Install, Level 2
The machine-readable OpenAPI 3.1.0 specification is at [`openapi.yaml`](openapi.yaml) and interactive Swagger UI is served at `http://localhost:8080/docs`. Paste any of these `curl` commands to test every endpoint:

```bash
# 1. Get lesson metadata and media track URLs
curl -s http://localhost:8080/api/v1/lessons/va-future

# 2. Get parsed Amharic transcript cues with timestamps
curl -s "http://localhost:8080/api/v1/lessons/va-future/transcript?lang=am"

# 3. Download the 3G offline ZIP pack (<300 KB: MP3 audio + bilingual HTML + VTT + .brf Braille)
curl -s -O -J http://localhost:8080/api/v1/lessons/va-future/offline-pack

# 4. Upload a corrected WebVTT caption file
curl -s -X POST http://localhost:8080/api/v1/lessons/va-future/captions \
  -F 'metadata={"lesson_id":"va-future","language":"am","reviewer":"Kidus","notes":"Fixed Amharic loanwords"}' \
  -F "caption_file=@savanna/assets/captions/va-future-am.vtt"

# 5. Get accessible job listing in Amharic
curl -s "http://localhost:8080/api/v1/jobs/accessible-va?lang=am"

# 6. Submit a private interview accommodation request
curl -s -X POST http://localhost:8080/api/v1/jobs/accessible-va/accommodations \
  -H "Content-Type: application/json" \
  -d '{"accommodations":["ethsl_interpreter","extra_time"],"language":"am"}'

# 7. Verify Open Badges 3.0 credential (valid vs. tampered signature)
curl -s http://localhost:8080/api/v1/certificates/va-2026-001
curl -s "http://localhost:8080/api/v1/certificates/va-2026-001?sig=tampered_invalid_signature"

# 8. Register a host webhook for lesson/caption/accommodation events
curl -s -X POST http://localhost:8080/api/v1/webhooks \
  -H "Content-Type: application/json" \
  -d '{"url":"http://localhost:9000/webhook","events":["lesson.completed","captions.updated","job.accommodation_requested"]}'
```

## Install, Level 3
1. **`schema.org/JobPosting` (JSON-LD):** `<db-job-card>` automatically injects a standard `<script type="application/ld+json">` `JobPosting` block into the host page `<head>` so any search engine or partner Ethiopian job board can index the role and its workplace accommodations with zero custom work.
2. **Open Badges 3.0 / W3C Verifiable Credentials:** Certificates (`/api/v1/certificates/{id}` and `/certificates/{id}`) follow the Open Badges 3.0 JSON-LD schema signed with HMAC-SHA256 (`DataIntegrityProof`). Opening `/certificates/va-2026-001` verifies the cryptographic signature and displays `"valid"`, while `/certificates/va-2026-001?sig=tampered_invalid_signature` demonstrates tamper detection (`"not valid"`).
3. **Grade 1 Braille ASCII (`.brf`):** Client-side and server-side export to 38-cell Grade 1 Braille with embosser form-feed characters (``) for Focus 40 / Braille Sense refreshable displays.

## Languages
English (`en`) and Amharic (`am`) are 100% complete across all buttons, labels, dialogs, transcripts, audio descriptions, and job cards. All UI strings live in `module/i18n/en.json` and `module/i18n/am.json` (zero hardcoded UI sentences inside component logic).
- **How to add a new language (e.g., Afaan Oromo `om`, Tigrinya `ti`, Somali `so`, or Arabic `ar`):** Add one JSON file (`module/i18n/om.json`) copying the keys of `en.json` and pass `lang="om"` on the component tag. CSS logical properties (`padding-inline-start`, `border-inline-start`, `text-align: start`) are used throughout so RTL scripts (`ar`) flow right-to-left automatically.

## Offline and slow connection
- **What stays out of the 3G offline pack:** The heavy `.mp4` video stream (`1.12 MB`) is intentionally excluded from `/api/v1/lessons/{id}/offline-pack`. Instead, the offline ZIP pack (`~255 KB` total) bundles the low-bitrate MP3 audio (`237 KB`), English and Amharic WebVTT captions, plain-text transcripts, Grade 1 Braille (`.brf`), and a self-contained bilingual `lesson-offline.html` player.
- **Measured size & load time on Slow 3G (Chrome DevTools throttling):**
  - `module/db-player.js`: **31 KB** uncompressed (~8 KB gzipped), zero external JS dependencies.
  - `demo/blank.html` initial interactive load on Slow 3G (400 kbps, 400ms RTT): **~1.1 seconds** (video set to `preload="metadata"` so zero video bytes download until the learner presses Play).
  - Offline Service Worker (`service-worker.js`): Caches the plugin script, i18n dictionaries, captions, and MP3 audio for aeroplane-mode playback.

## Data and privacy
- **Minimum collection & local-first storage:** Caption size, color, background, and sign-window position preferences are stored only in the learner's browser (`localStorage` key `db-player-preferences`).
- **Private accommodation requests:** Interview accommodation selections on `<db-job-card>` require no medical proof or diagnosis and are sent over a dedicated endpoint (`POST /api/v1/jobs/{id}/accommodations`) separate from learner profile data.
- **No third-party data leaks:** Zero external analytics, zero external font/CDN calls, and zero cloud AI API keys in the browser.

## Cost to run
- **Monthly cost for 3,000 learners: $0 to ~$5 / month.**
- Because `<db-player>` uses native browser `speechSynthesis` for audio descriptions/job summaries and the batch transcript pipeline uses open-source `faster-whisper` (`int8` on CPU) rather than paid cloud transcription/TTS APIs, per-learner API cost is **$0.00**. Hosting the lightweight FastAPI container and static assets for 3,000 learners fits comfortably on a single 1-vCPU / 1 GB RAM VPS or local university server.

## Finished and not finished
- **Finished (100% Working):**
  - `<db-player>` Web Component with full keyboard operation, fullscreen controls inside the shell, custom restyleable English & Amharic captions, sound-off cues, spoken audio descriptions (`en` and `am`), synchronized movable/resizable EthSL Sign Language video player (`va-future-ethsl.mp4`) with authentic prerecorded human interpretation (not AI-generated sign translation) and 6 keyboard buttons + pointer drag, interactive transcript seek list, built-in Caption Pipeline Editor modal, `.txt` / `.vtt` / `.brf` Braille downloads, and `< 300 KB` 3G offline ZIP pack.
  - `<db-job-card>` Career Gateway working at 200% zoom and 320px width, bilingual audio summary, private accommodation request dialog + API, `schema.org/JobPosting` JSON-LD, and Open Badges 3.0 verification (`valid` and `not_valid` states).
  - `<db-live-viewer>` Recorded Live Session Viewer with synchronized click-to-seek chat log and search filter.
  - Accessible text-first HTML (`documents/lesson-document.html`) and 3-page tagged PDF (`documents/lesson-document.pdf`) with complete image descriptions.
- **Honest Limitations:**
  - Raw `faster-whisper` (`base` model) speech recognition achieves ~6% Word Error Rate (WER) on English audio but ~34% WER on unedited Amharic technical audio; human review via our built-in Caption Editor dialog is required before publishing Amharic captions.
  - Browser `speechSynthesis` Amharic voice availability depends on the operating system; when an Android device lacks a native `am-ET` TTS voice, learners can play the bundled human/recorded audio track (`va-future-audio.mp3`) or read the high-contrast Amharic captions/transcript.

## Libraries and their licences
- **Frontend (`module/db-player.js`):** Zero external libraries (100% vanilla ES2022 Web Components, MIT/Open Licence).
- **Backend (`api/`):** FastAPI (MIT), Uvicorn (BSD-3-Clause), Pydantic (MIT), PyYAML (MIT), python-multipart (Apache-2.0).
- **Offline Transcript CLI (`transcript-pipeline/`):** `faster-whisper` (MIT).
