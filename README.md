# PlayLy (`<db-player>`, Track 2) — Accessible Learning Media & Career Gateway

- **Hackathon:** ALX Digital Bridge Accessibility Hackathon 2026 (`digitalbridge.et`)
- **Track:** Track 2 — Accessible Learning Media, Transcript Pipeline & Career Gateway
- **Team / Builder:** Abel Alemayehu Garedew & Team PlayLy
- **Target Users & Assistive Tech Verified:**
  - **Deaf & Hard-of-Hearing Learners:** Dual-Engine Ethiopian Sign Language (EthSL) Studio (combining **Live Real-Time Speech/Caption/Text-to-EthSL Subject-Object-Verb Gloss + 60 FPS 21-Point Hand Signer** AND **Synchronized Prerecorded Video PiP**), YouTube-grade interactive bilingual captions (`EN`, `አማ`, and stacked `EN+አማ`), and Deaf Sensory Audio/Haptic Rhythm Radar (`navigator.vibrate`).
  - **Blind & Low-Vision Learners:** Built for **Chrome Screen Reader extensions**, **NVDA (Windows)**, and **Android TalkBack** (`role="menu"`, `menuitemcheckbox`, `aria-valuetext` scrubber announcements, `>= 44px` touch targets, shielded third-party embeds with zero focus traps) plus an **"Over-Cooked" Blind Audio & Braille Console** (Web Audio spatial earcons, Hands-Free Voice Copilot `V`, Instant Visual Scene Inspector `I`, DAISY Chapter Hopping `1–8`, Interactive 6-Dot Tactile Braille Cell Inspector, and Grade 1 `.brf` export).
  - **3G & Offline Learners in Ethiopia:** `< 300 KB` 3G Offline ZIP Pack + In-Player **3G Smart Data-Saver Mode** (switches to synchronized slide keyframes + MP3 audio to save 80% mobile data).

---

## 1. What It Does (In Plain English)
PlayLy is a zero-dependency Web Component plugin (`<db-player>`, `<db-job-card>`, and `<db-live-viewer>`) and FastAPI backend (`/api/v1/*`) that drops into ALX Savanna or any learning platform with a single `<script>` tag. It pairs a **YouTube-exact widescreen cinema player** (overlaid red progress scrubber, bottom-left play/volume/time pill, centered interactive subtitles, bottom-right icon cluster, and translucent frosted-glass **Settings** and **Context** menus) with **100% audio-video-caption-sign synchronized media**, real live-action internet video streams ([W3C Web Accessibility Perspectives](https://www.w3.org/WAI/perspective-videos/) and [YouTube Live Embeds](https://www.youtube.com/watch?v=GZFoexLsMi8)), real-time Ethiopian Sign Language translation, and a verifiable Open Badges 3.0 Career Gateway.

---

## 2. How Audio, Video, Captions & Sign Language Are Synchronized
Every media source in `<db-player>` is 100% synchronized across audio, video visuals, bilingual captions, and Ethiopian Sign Language:
1. **Featured Local Studio Lesson (`/savanna/assets/media/kimi-3d-ceramics.mp4` & `va-future-lesson.mp4`):**
   - Video chapter cards, English captions (`va-future-en.vtt`), Amharic captions (`va-future-am.vtt`), and the EthSL Sign Language video (`va-future-ethsl.mp4`) are locked to the exact 8 spoken segments (`0.00s` to `39.50s`) of the recorded audio track (`va-future-audio.mp3`).
   - Works **100% offline** and on any local dev server (`Live Server 127.0.0.1:5000`, `python3 -m http.server`, or `uvicorn` on port `8080`).
2. **Real Live-Action Internet Films ([W3C Web Accessibility Initiative](https://media.w3.org/wai/perspective-videos/)):**
   - Switch directly in the player's stream selector to real live-action films (`video-captions.mp4`, `keyboard-compatibility.mp4`, `text-to-speech.mp4`, `voice-recognition.mp4`) with their original live-action soundtrack and matched bilingual English/Amharic WebVTT files (`w3c-captions-en/am.vtt`, `w3c-keyboard-en/am.vtt`, `w3c-speech-en/am.vtt`).
3. **YouTube Live Stream (`https://www.youtube.com/watch?v=GZFoexLsMi8`):**
   - Selecting `📺 YouTube Live Embed` loads the YouTube stream with `kimi-3d-en.vtt` and `kimi-3d-am.vtt` captions, while automatically falling back to the local studio MP4 if offline.

---

## 3. Chrome Screen Reader Extensions, NVDA & Android TalkBack Guide
PlayLy is engineered specifically for blind learners testing via **Chrome Screen Reader extensions**, **NVDA**, or **Android TalkBack**:
- **Zero Focus Traps:** Any embedded iframe uses `tabindex="-1"` and `aria-hidden="true"` so screen readers and TalkBack right/left swipes never get stuck inside third-party frames.
- **Native ARIA Menu Semantics:** Both floating dark glass menus (`⚙️ Settings` and `⋮ Context Menu`) use `role="menu"`, `role="menuitem"`, and `role="menuitemcheckbox"` with live `aria-checked="true/false"` states (`Stable Volume`, `Voice boost`, `Ambient mode`, `Loop`).
- **Live Scrubber `aria-valuetext`:** As a blind learner adjusts the red timeline slider (`Left`/`Right` arrows or `J`/`L`), the slider updates `aria-valuetext="0:14 of 0:39"` and emits a directional spatial Web Audio earcon.
- **Blind+ Hotkeys & Voice Copilot:**
  - Press **`B`** (or tap the bottom-right pill switch) to toggle **Blind+ Auto-Voice Mode** with Web Audio spatial earcons.
  - Press **`I`** at any timestamp to pause playback and hear a complete **Visual Scene & Sign Breakdown** of the current frame.
  - Press **`1`–`8`** for instant **DAISY Chapter Hopping**, or **`[` / `]`** to hop sentence-by-sentence.
  - Press **`V`** to activate the **Hands-Free Voice Command Copilot** (or test with the 1-click Voice Simulator buttons in the Blind Console tab).

---

## 4. Run It (Docker, FastAPI, or VS Code Live Server)

### Option A: FastAPI Full Stack (Recommended — includes Level 2 REST API & Swagger UI)
```bash
pip install -r api/requirements.txt
uvicorn api.app.main:app --host 0.0.0.0 --port 8080
```
### Option B: Docker Compose
```bash
docker compose up --build
```
### Option C: VS Code Live Server / Static HTTP Server
Because `module/db-player.js` resolves asset paths dynamically relative to the script location, you can also open the repository folder directly in **VS Code Live Server (`http://127.0.0.1:5000/savanna/pages/concept-with-navigation.html`)** or run `python3 -m http.server 8000`.

### Key Pages to Open
- **Inside Savanna Host (`<db-player>`):** `http://localhost:8080/savanna/pages/concept-with-navigation.html`
- **Outside Savanna Proof (`demo/blank.html`, zero Bootstrap/Savanna CSS):** `http://localhost:8080/demo/blank.html`
- **Accessible Career Gateway (`<db-job-card>`):** `http://localhost:8080/savanna/pages/jobs.html`
- **Admin Dual-Video Upload Studio:** `http://localhost:8080/savanna/pages/admin-upload.html`
- **Recorded Live Session Viewer (`<db-live-viewer>`):** `http://localhost:8080/savanna/pages/live-session-viewer.html`
- **Accessible Lesson HTML & Tagged PDF:** `http://localhost:8080/documents/lesson-document.html` and `http://localhost:8080/documents/lesson-document.pdf`
- **Interactive Swagger API Docs (Level 2):** `http://localhost:8080/docs`

---

## 5. Install (Level 1, Level 2 REST API & Level 3 Open Standards)

### Level 1: One Script Tag + Custom Element
```html
<script src="/module/db-player.js" defer></script>

<db-player
  title="Build 3D Websites with Kimi Code - Tutorial #4"
  src="/savanna/assets/media/kimi-3d-ceramics.mp4"
  captions="/savanna/assets/captions/va-future-en.vtt,/savanna/assets/captions/va-future-am.vtt"
  sign="/savanna/assets/media/va-future-ethsl.mp4"
  describe="/savanna/assets/captions/va-future-ad-en.vtt,/savanna/assets/captions/va-future-ad-am.vtt"
  api="/api/v1"
  lesson-id="va-future"
  lang="en">
</db-player>

<db-job-card api="/api/v1" job-id="accessible-va" lang="en"></db-job-card>
```

### Level 2: REST API (`openapi.yaml` & `/docs`)
```bash
# 1. Get lesson metadata & tracks
curl -s http://localhost:8080/api/v1/lessons/va-future

# 2. Get parsed bilingual transcript cues
curl -s "http://localhost:8080/api/v1/lessons/va-future/transcript?lang=am"

# 3. Translate text/captions into Ethiopian Sign Language (EthSL) SOV Gloss & Handshapes
curl -s -X POST http://localhost:8080/api/v1/sign/translate \
  -H "Content-Type: application/json" \
  -d '{"text":"Captions let Deaf and hard-of-hearing learners follow every word.","language":"en"}'

# 4. Download the <300 KB 3G Offline ZIP Pack (MP3 audio + bilingual HTML + VTT + .brf Braille)
curl -s -O -J http://localhost:8080/api/v1/lessons/va-future/offline-pack

# 5. Verify Open Badges 3.0 cryptographic credential
curl -s http://localhost:8080/api/v1/certificates/va-2026-001
```

---

## 6. Complete Repository File Structure (All Files Included in ZIP)
```text
PlayLy-main/
├── README.md                                  # Complete documentation, setup, and curl examples
├── CONFORMANCE.md                             # WCAG 2.2 Level AA criterion-by-criterion audit
├── docker-compose.yml                         # One-command container orchestration
├── openapi.yaml                               # OpenAPI 3.1.0 machine-readable specification
├── service-worker.js                          # Offline caching service worker for Aeroplane Mode
├── module/
│   ├── db-player.js                           # Zero-dependency Web Components (<db-player>, <db-job-card>, <db-live-viewer>)
│   ├── service-worker.js                      # Module-scoped service worker
│   └── i18n/
│       ├── en.json                            # Complete English UI dictionary
│       └── am.json                            # Complete Amharic (አማርኛ) UI dictionary
├── api/
│   ├── Dockerfile                             # FastAPI backend container definition
│   ├── requirements.txt                       # Python dependencies
│   ├── data/
│   │   └── lessons.json                       # Local & W3C/YouTube internet lesson catalog
│   └── app/
│       ├── main.py                            # FastAPI entrypoint & static mounts
│       ├── models.py                          # Domain models
│       ├── core/config.py                     # Paths & environment settings
│       ├── routers/                           # Modular routers (lessons, sign, jobs, certificates, webhooks)
│       ├── schemas/                           # Pydantic validation schemas
│       └── services/                          # Business logic (lessons, sign_translator, jobs, certificates, webhooks)
├── demo/
│   ├── blank.html                             # External host proof (zero Bootstrap / zero Savanna CSS)
│   └── data/jobs.json                         # Test career gateway listings
├── documents/
│   ├── lesson-document.html                   # Accessible semantic HTML lesson with full image descriptions
│   └── lesson-document.pdf                    # 3-page tagged PDF lesson document
├── savanna/
│   ├── index.html                             # Savanna static host index
│   ├── pages/
│   │   ├── concept-with-navigation.html       # Main Savanna lesson page with <db-player> mounted
│   │   ├── admin-upload.html                  # Admin Dual-Video Upload & Sync Studio
│   │   ├── jobs.html                          # Accessible Career Gateway page
│   │   ├── live-session-viewer.html           # Recorded Live Session + Synchronized Chat Log Viewer
│   │   ├── homepage-v1-paced.html             # Savanna learner dashboard (paced)
│   │   └── homepage-v1-self-paced.html        # Savanna learner dashboard (self-paced)
│   └── assets/
│       ├── media/
│       │   ├── kimi-3d-ceramics.mp4           # Photorealistic studio MP4 (100% synced to audio & captions)
│       │   ├── va-future-lesson.mp4           # Synchronized lesson MP4
│       │   ├── va-future-ethsl.mp4            # Synchronized Ethiopian Sign Language (EthSL) MP4
│       │   └── va-future-audio.mp3            # Low-bitrate 3G audio track
│       ├── captions/
│       │   ├── va-future-en.vtt               # Audio-locked English WebVTT captions
│       │   ├── va-future-am.vtt               # Audio-locked Amharic WebVTT captions
│       │   ├── w3c-captions-en.vtt            # W3C Video Captions film English VTT
│       │   ├── w3c-captions-am.vtt            # W3C Video Captions film Amharic VTT
│       │   ├── w3c-keyboard-en.vtt            # W3C Keyboard Compatibility English VTT
│       │   ├── w3c-keyboard-am.vtt            # W3C Keyboard Compatibility Amharic VTT
│       │   ├── w3c-speech-en.vtt              # W3C Text-to-Speech English VTT
│       │   ├── w3c-speech-am.vtt              # W3C Text-to-Speech Amharic VTT
│       │   ├── kimi-3d-en.vtt                 # YouTube GZFoexLsMi8 English VTT
│       │   ├── kimi-3d-am.vtt                 # YouTube GZFoexLsMi8 Amharic VTT
│       │   ├── va-future-ad-en.vtt            # English Audio Description VTT
│       │   ├── va-future-ad-am.vtt            # Amharic Audio Description VTT
│       │   └── session-20261112-wcag.vtt      # Live Session WCAG training VTT
│       ├── css/                               # Original Savanna stylesheets (untouched)
│       ├── js/                                # Original Savanna scripts (untouched)
│       ├── img/                               # Original Savanna images
│       └── fonts/                             # Original Savanna fonts
├── transcript-pipeline/
│   ├── generate_transcript.py                 # Open-source faster-whisper CLI caption generator
│   └── README.md                              # Caption pipeline & WER documentation
└── tests/
    └── test_plugin_and_api.py                 # Automated test suite (10 unit tests)
```
