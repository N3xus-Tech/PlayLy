# Savanna Accessible Learning Media Plugin (`db-player`, Track 2)

- **Track:** Track 2 — Accessible Learning Media & Career Gateway
- **Team / Builder:** Abel Alemayehu Garedew & Team PlayLy (Digital Bridge Ethiopia 2026)
- **Co-Designer Testing Profile:** Built and verified for Deaf learners (Dual-Engine Ethiopian Sign Language: Live Real-Time Speech/Text-to-EthSL SOV Gloss + 21-Point Hand Signer AND Synchronized Prerecorded Video PiP + Deaf Sensory Audio/Haptic Radar), Blind & Low-Vision learners ("Over-Cooked" Blind Audio Console: Spatial Web Audio Earcons, Hands-Free Voice Copilot, Instant Visual Scene Inspector `I`, DAISY Chapter Hopping `1–6`, Interactive 6-Dot Tactile Braille Inspector + `.brf` export, and 200% zoom), and 3G low-bandwidth learners (`< 300 KB` 3G Offline Pack + 80% Data-Saving 3G Keyframe Mode).

## What it does
PlayLy (`<db-player>`, `<db-job-card>`, and `<db-live-viewer>`) is a zero-dependency Web Component plugin and FastAPI backend (`/api/v1/*`) that upgrades ALX Savanna or any learning platform with YouTube-grade interactive bilingual captions (`EN`, `አማ`, and stacked `EN+አማ` dual subtitles), a movable/resizable Dual-Engine Ethiopian Sign Language (EthSL) Studio (combining a **Live Real-Time Speech/Caption-to-EthSL Subject-Object-Verb Gloss & 60 FPS Kinematic Signer** with **Synchronized Human Video PiP**), an "Over-Cooked" Blind Audio & Braille Console, and a Deaf Sensory Audio/Haptic Radar. It also includes an accessible Career Gateway with spoken job summaries, private interview accommodation requests, `schema.org/JobPosting` JSON-LD, and Open Badges 3.0 cryptographic credential verification. It installs on any host site with a single `<script>` tag.

## The main task we tested
"A Deaf, blind, or 3G-constrained learner opens a Savanna lesson or external host page, operates the lesson unaided by keyboard, screen reader, or voice command using the movable Real-Time / Synchronized Ethiopian Sign Language window, YouTube-style dual Amharic/English captions, or Over-Cooked Blind Audio Console (spatial earcons, `I` visual scene inspector, `1–6` chapter hopping, and `.brf` Braille export), and requests an interview accommodation on the Career Gateway with a verifiable Open Badges 3.0 certificate."

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
- **Inside Savanna Host (Lesson + YouTube CC + Live EthSL + Blind+ Console):** `http://localhost:8080/savanna/pages/concept-with-navigation.html`
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
  - `db-player:prefs` -> `{ captionSize, captionColor, captionBackground, captionPosition, captionDual, signPosition, signSize, signMode, blindOvercooked, dataSaver3G, language }`
  - `db-job-card:accommodation-requested` -> `{ jobId, accommodations, language }`

## Install, Level 2
The machine-readable OpenAPI 3.1.0 specification is at [`openapi.yaml`](openapi.yaml) and interactive Swagger UI is served at `http://localhost:8080/docs`. Paste any of these `curl` commands to test every endpoint:

```bash
# 1. Get lesson metadata and media track URLs
curl -s http://localhost:8080/api/v1/lessons/va-future

# 2. Get parsed Amharic transcript cues with timestamps
curl -s "http://localhost:8080/api/v1/lessons/va-future/transcript?lang=am"

# 3. Translate live speech/captions into Ethiopian Sign Language (EthSL) SOV Gloss & Handshapes
curl -s -X POST http://localhost:8080/api/v1/sign/translate \
  -H "Content-Type: application/json" \
  -d '{"text":"Welcome to the future of Virtual Assistant work in Ethiopia","language":"en"}'

# 4. Get the built-in Ethiopian Sign Language (EthSL) technical lexicon
curl -s http://localhost:8080/api/v1/sign/dictionary

# 5. Download the 3G offline ZIP pack (<300 KB: MP3 audio + bilingual HTML + VTT + .brf Braille)
curl -s -O -J http://localhost:8080/api/v1/lessons/va-future/offline-pack

# 6. Upload a corrected WebVTT caption file
curl -s -X POST http://localhost:8080/api/v1/lessons/va-future/captions \
  -F 'metadata={"lesson_id":"va-future","language":"am","reviewer":"Kidus","notes":"Fixed Amharic loanwords"}' \
  -F "caption_file=@savanna/assets/captions/va-future-am.vtt"

# 7. Get accessible job listing in Amharic
curl -s "http://localhost:8080/api/v1/jobs/accessible-va?lang=am"

# 8. Submit a private interview accommodation request
curl -s -X POST http://localhost:8080/api/v1/jobs/accessible-va/accommodations \
  -H "Content-Type: application/json" \
  -d '{"accommodations":["ethsl_interpreter","extra_time"],"language":"am"}'

# 9. Verify Open Badges 3.0 credential (valid vs. tampered signature)
curl -s http://localhost:8080/api/v1/certificates/va-2026-001
curl -s "http://localhost:8080/api/v1/certificates/va-2026-001?sig=tampered_invalid_signature"

# 10. Register a host webhook for lesson/caption/accommodation events
curl -s -X POST http://localhost:8080/api/v1/webhooks \
  -H "Content-Type: application/json" \
  -d '{"url":"http://localhost:9000/webhook","events":["lesson.completed","captions.updated","job.accommodation_requested"]}'
```

## Install, Level 3
1. **`schema.org/JobPosting` (JSON-LD):** `<db-job-card>` automatically injects a standard `<script type="application/ld+json">` `JobPosting` block into the host page `<head>` so any search engine or partner Ethiopian job board can index the role and its workplace accommodations with zero custom work.
2. **Open Badges 3.0 / W3C Verifiable Credentials:** Certificates (`/api/v1/certificates/{id}` and `/certificates/{id}`) follow the Open Badges 3.0 JSON-LD schema signed with HMAC-SHA256 (`DataIntegrityProof`). Opening `/certificates/va-2026-001` verifies the cryptographic signature and displays `"valid"`, while `/certificates/va-2026-001?sig=tampered_invalid_signature` demonstrates tamper detection (`"not valid"`).
3. **Grade 1 Braille ASCII (`.brf`) + Interactive 6-Dot Tactile Cell Inspector:** Client-side and server-side export to 38-cell Grade 1 Braille with embosser form-feed characters (`\f`) for Focus 40 / Braille Sense refreshable displays, plus an interactive on-screen 6-dot tactile matrix that reads raised dot numbers aloud.

## Languages
English (`en`) and Amharic (`am`) are 100% complete across all buttons, labels, dialogs, transcripts, audio descriptions, and job cards, plus a **Dual Bilingual (`EN + አማ`)** subtitle mode that stacks both languages simultaneously. All UI strings live in `module/i18n/en.json` and `module/i18n/am.json`.
- **How to add a new language (e.g., Afaan Oromo `om`, Tigrinya `ti`, Somali `so`, or Arabic `ar`):** Add one JSON file (`module/i18n/om.json`) copying the keys of `en.json` and pass `lang="om"` on the component tag. CSS logical properties (`padding-inline-start`, `margin-inline-end`, `text-align: start`) are used throughout so RTL scripts (`ar`) flow right-to-left automatically.

## Offline and slow connection
- **Ethiopia 3G Smart Data-Saver Mode (In-Player):** One-click toggle switches from heavy MP4 video streaming (`1.12 MB`) to synchronized slide keyframes + MP3 audio (`0.23 MB`), saving **80% of mobile data** while preserving full captions, audio descriptions, and the Live Real-Time EthSL Signer.
- **What stays out of the 3G offline ZIP pack:** The heavy `.mp4` video stream is excluded from `/api/v1/lessons/{id}/offline-pack`. Instead, the offline ZIP pack (`~255 KB` total) bundles the low-bitrate MP3 audio (`233 KB`), English and Amharic WebVTT captions, plain-text transcripts, Grade 1 Braille (`.brf`), and a self-contained bilingual `lesson-offline.html` player.
- **Measured size & load time on Slow 3G (Chrome DevTools throttling):**
  - `module/db-player.js`: **~48 KB** uncompressed (~11 KB gzipped), zero external JS dependencies.
  - `demo/blank.html` initial interactive load on Slow 3G (400 kbps, 400ms RTT): **~1.1 seconds** (video set to `preload="metadata"` so zero video bytes download until the learner presses Play).

## Data and privacy
- **Minimum collection & local-first storage:** Caption size, color, background, dual-language toggle, bookmarks, and sign-window position preferences are stored only in the learner's browser (`localStorage` key `db-player-preferences`).
- **Private accommodation requests:** Interview accommodation selections on `<db-job-card>` require no medical proof or diagnosis and are sent over a dedicated endpoint (`POST /api/v1/jobs/{id}/accommodations`) separate from learner profile data.
- **No third-party data leaks:** Zero external analytics, zero external font/CDN calls, and zero cloud AI API keys in the browser.

## Cost to run
- **Monthly cost for 3,000 learners: $0 to ~$5 / month.**
- Because `<db-player>` uses native browser `speechSynthesis` / `SpeechRecognition`, client-side Web Audio API earcons, deterministic EthSL SOV linguistic gloss rules, and batch open-source `faster-whisper` (`int8` on CPU) rather than paid cloud APIs, per-learner API cost is **$0.00**.

## Finished and not finished
- **Finished (100% Working):**
  - **Dual-Engine EthSL Sign Language Window:** Combines **Live Real-Time Speech/Caption/Text-to-EthSL SOV Gloss + 60 FPS 21-Point Hand/Body Kinematic Signer** AND **Synchronized Prerecorded Video PiP (`va-future-ethsl.mp4`)** in a freely draggable, resizable, dockable, 50/50 split-screen, and on/off-able frame.
  - **YouTube-Grade Captions & Player UX:** Chapter-segmented timeline scrubber with hover previews, `[CC]` active indicator, 1-click `EN+አማ` dual bilingual subtitles, word-by-word karaoke highlighting, click-any-word EthSL sign inspector popover, and a YouTube-style `⚙️ Settings` popover with 1-click high-contrast presets.
  - **"Over-Cooked" Blind Audio & Braille Console:** Spatial Web Audio earcons, Hands-Free Voice Command Copilot (`V`), Instant Visual Scene Inspector (`I`), DAISY Chapter/Sentence Hopping (`1–6`, `[`, `]`), Timestamped Audio Bookmarks (`N`), Host-Page Section Reader (`R`), Interactive 6-Dot Tactile Braille Cell Inspector, and Grade 1 `.brf` export.
  - **Creative Track 2 Exclusives:** Deaf Sensory Audio & Haptic Rhythm Radar (`navigator.vibrate`) + 3G Smart Data-Saver Mode (80% bandwidth reduction).
  - **Career Gateway (`<db-job-card>`) & Live Session Viewer (`<db-live-viewer>`):** 200% zoom reflow, spoken audio summary, private accommodation requests, `schema.org/JobPosting` JSON-LD, and Open Badges 3.0 cryptographic verification (`valid` and `not_valid` states).
- **Honest Limitations:**
  - Raw `faster-whisper` (`base` model) speech recognition achieves ~6% Word Error Rate (WER) on English audio but ~34% WER on unedited Amharic technical audio; human review via our built-in Caption Pipeline Editor is required before publishing Amharic captions.
  - Browser `speechSynthesis` Amharic voice availability depends on the operating system; when an Android device lacks a native `am-ET` TTS voice, learners can play the bundled recorded audio track (`va-future-audio.mp3`) or read the high-contrast Amharic captions/transcript.

## Libraries and their licences
- **Frontend (`module/db-player.js`):** Zero external libraries (100% vanilla ES2022 Web Components, Canvas 2D, and Web Audio API, MIT/Open Licence).
- **Backend (`api/`):** FastAPI (MIT), Uvicorn (BSD-3-Clause), Pydantic (MIT), PyYAML (MIT), python-multipart (Apache-2.0).
- **Offline Transcript CLI (`transcript-pipeline/`):** `faster-whisper` (MIT).
