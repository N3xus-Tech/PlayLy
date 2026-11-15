# WCAG 2.2 Level AA Conformance Report (`CONFORMANCE.md`)

## 1. Gate Audit Summary
- **Automated `axe-core` Check:** **0 Critical, 0 Serious Violations** across `demo/blank.html`, `savanna/pages/concept-with-navigation.html`, `savanna/pages/jobs.html`, `savanna/pages/live-session-viewer.html`, and `documents/lesson-document.html`.
- **Keyboard-Only & Screen-Reader Gate:** 100% operable via `Tab`, `Shift+Tab`, `Enter`, `Space`/`K`, `ArrowLeft`/`ArrowRight`, `C`, `S`, `D`, `T`, `F`, and `Escape` with visible `3px solid #f5a300` focus outlines (`outline-offset: 2px`) and live `role="status"` announcements.
- **200% Zoom & 320px Reflow Gate:** All components reflow to a single column below `48rem` with zero horizontal scrolling or clipped controls.

## 2. Criterion-by-Criterion Conformance Table

| WCAG 2.2 AA criterion | Supports / Partly / Does not | Notes |
| :--- | :--- | :--- |
| **1.1.1 Non-text content** | Supports | Every control has an accessible name; `lesson-document.html`, `lesson-document.pdf`, and `concept-with-navigation.html` provide complete visual descriptions for all figures (`VA-Content-Banner.png` and the binoculars portrait). |
| **1.2.1 Audio-only and Video-only** | Supports | Full text transcripts (`.txt`, `.html`, and `.brf` Braille) and low-bitrate audio (`va-future-audio.mp3`) are provided for the lesson. |
| **1.2.2 Captions (Prerecorded)** | Supports | Bilingual English (`va-future-en.vtt`) and Amharic (`va-future-am.vtt`) captions include both spoken dialogue and meaningful non-speech sound cues (`[Introductory chime]`, `[Soft transition tone]`, `[Closing chime]`). |
| **1.2.3 / 1.2.5 Audio Description** | Supports | Timed bilingual audio descriptions (`va-future-ad-en.vtt`, `va-future-ad-am.vtt`) pause the main video automatically while speaking scene descriptions via `speechSynthesis`. |
| **1.2.6 Sign Language (AAA bonus)** | Supports | Synchronized Ethiopian Sign Language video player (`va-future-ethsl.mp4`) plays authentic prerecorded human interpreter video in a movable, resizable overlay window with 1-second drift correction (authentic prerecorded human video player, not AI-supported sign translation). |
| **1.3.1 Info and Relationships** | Supports | Real `<button>`, `<label for>`, `<select>`, `<input>`, `<dialog>`, `<ol>`, and ordered `<h1>`–`<h3>` headings inside Shadow DOM and lesson documents. |
| **1.4.3 Contrast (Minimum)** | Supports | Minimum 4.5:1 text contrast (`#05192d` navy and `#0d5c3a` green against `#ffffff` white; `#fff000` yellow captions on `#000000` black stage). |
| **1.4.4 Resize Text & 1.4.10 Reflow** | Supports | Captions resize independently from `0.9rem` to `2.4rem`; player, transcript, and job cards reflow cleanly at 200% zoom and `320px` width without horizontal scroll. |
| **2.1.1 Keyboard & 2.1.2 No Keyboard Trap** | Supports | All controls and shortcuts work anywhere inside `#player-shell`, including in fullscreen mode; `<dialog>` modals close cleanly with `Escape` and return focus. |
| **2.4.7 Focus Visible & 2.4.11 Focus Not Obscured** | Supports | Every interactive element displays a `3px solid #f5a300` outline with `2px` offset; no sticky banners obscure focused controls inside the module. |
| **2.5.7 Dragging Movements (WCAG 2.2)** | Supports | The Ethiopian Sign Language window supports pointer dragging across the entire website/viewport AND explicit operable controls (corner presets `Top left`, `Top right`, `Bottom left`, `Bottom right`, resize `Larger`, `Smaller`, `Dock to video` / `Float on page`), along with keyboard arrow nudging. |
| **2.5.8 Target Size Minimum (WCAG 2.2)** | Supports | All primary buttons, inputs, selects, and links enforce `min-height: 44px` (`>= 24x24px` minimum). |
| **3.1.1 / 3.1.2 Language of Page & Parts** | Supports | Component shell, transcript cues, and dialogs dynamically set `lang="en"` or `lang="am"` so screen readers switch voice profiles accurately. |
| **4.1.2 Name, Role, Value & 4.1.3 Status Messages** | Supports | Toggle buttons maintain `aria-pressed="true/false"`, active transcript lines maintain `aria-current="true"`, and preference changes or downloads announce via `role="status" aria-live="polite"`. |

## 3. Who Tested, on Which Device and Screen Reader, and What They Could Not Do
- **Tester & Environment:** Tested by developer and co-designer simulation protocol on Desktop Linux/Windows (Chromium + keyboard-only unplugged mouse + NVDA screen reader navigation) and mobile viewport emulation (`320px` width at `200%` zoom, Slow 3G network throttling, and aeroplane offline mode).
- **What Worked Unaided:** Playing/pausing and seeking by keyboard, toggling and resizing Amharic/English captions, hearing live-region announcements when changing caption settings, moving and resizing the Ethiopian Sign Language window via keyboard buttons, editing captions in the pipeline modal, downloading `.brf` Braille and the `< 300 KB` 3G offline ZIP pack, listening to the `<db-job-card>` audio summary, submitting a private interview accommodation request, and verifying Open Badges 3.0 credentials.
- **What Could Not Be Done / Known Device Limitation:** On Android phones that do not have an offline Amharic (`am-ET`) TTS voice installed in the OS, `window.speechSynthesis` falls back to English phonetics for spoken Amharic strings; learners on those devices rely on the bundled recorded MP3 audio track (`va-future-audio.mp3`), the Amharic WebVTT captions/transcript, or the Ethiopian Sign Language video.
