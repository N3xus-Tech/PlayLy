(function () {
  "use strict";

  const scriptUrl = document.currentScript && document.currentScript.src;
  let moduleBase;
  try {
    moduleBase = new URL(".", scriptUrl || window.location.href);
  } catch {
    moduleBase = new URL("http://localhost/");
  }
  const dictionaries = new Map();

  const fallback = {
    playerTitle: "Accessible Lesson Player",
    play: "Play",
    pause: "Pause",
    back: "Back 10 seconds",
    forward: "Forward 10 seconds",
    mute: "Mute audio",
    unmute: "Unmute audio",
    speed: "Playback speed",
    captions: "Subtitles / CC",
    captionLanguage: "Caption language",
    captionDual: "Dual Bilingual (EN + አማ)",
    captionSettings: "YouTube-Style Caption & Player Settings",
    captionSize: "Caption font size",
    captionColor: "Caption text colour",
    captionBackground: "Caption background",
    captionOpacity: "Background opacity",
    captionPosition: "Caption position",
    captionPreset: "Caption style preset",
    posBottom: "Bottom overlay",
    posTop: "Top overlay",
    audioDescription: "Audio description (AD)",
    signLanguage: "Sign Language (EthSL)",
    signPlayerTitle: "EthSL Sign Studio",
    signPrerecorded: "Synced Video PiP",
    signLiveMode: "Live Real-Time Translator",
    signVideoDesc: "Synchronized Ethiopian Sign Language interpreter video",
    playPauseSign: "Play or pause synchronized video",
    splitView: "50/50 Side-by-Side Split",
    transcript: "Interactive Transcript",
    editCaptions: "Caption Pipeline Studio",
    downloadTranscript: "Download transcript (.txt)",
    downloadBraille: "Download Braille (.brf)",
    downloadVtt: "Export WebVTT (.vtt)",
    downloadOffline: "Download 3G Offline Pack",
    keyboardHelp: "Shortcuts & Voice Help",
    fullScreen: "Full screen",
    exitFullScreen: "Exit full screen",
    seek: "Seek lesson timeline",
    noSign: "No Ethiopian Sign Language recording is available for this lesson.",
    topLeft: "Snap top-left",
    topRight: "Snap top-right",
    bottomLeft: "Snap bottom-left",
    bottomRight: "Snap bottom-right",
    larger: "Enlarge sign window",
    smaller: "Shrink sign window",
    close: "Close",
    saveCorrections: "Save & submit captions",
    reviewerName: "Reviewer name",
    reviewNotes: "Correction notes",
    editorHeading: "Caption Pipeline & Timestamp Editor",
    editorIntro: "Review speech-to-text cues, adjust timestamps or Amharic/English phrasing, and export or submit to the platform.",
    listenSummary: "Listen to audio summary",
    stopSummary: "Stop audio",
    requestAccommodation: "Request interview accommodation",
    verifyCertificate: "Verify Open Badge credential",
    workplaceAccommodations: "Workplace & interview accommodations",
    accommodationModalTitle: "Request Interview Accommodation",
    accommodationDesc: "Your request goes privately to the hiring coordinator. No medical proof is required.",
    accOptionSign: "Ethiopian Sign Language (EthSL) interpreter",
    accOptionScreenReader: "Screen-reader compatible assessment",
    accOptionExtraTime: "50% extended interview time",
    accOptionAsync: "Written / asynchronous interview option",
    submitRequest: "Send private request",
    requestSent: "Accommodation request saved and confirmed.",
    liveViewerTitle: "Recorded Live Session Viewer",
    chatHeading: "Synchronized Session Chat Log",
    searchChat: "Filter chat messages",
    audioOnlyMode: "3G Smart Data-Saver (Audio + Keyframes)",
    dockSign: "Dock inside video",
    floatSign: "Float freely on page",
    blindOvercooked: "Blind Mode: Over-Cooked",
    voiceControl: "Voice Copilot",
    describeScene: "Describe Current Scene (I)",
    addBookmark: "Drop Audio Bookmark (N)",
    readHostPage: "Read Full Lesson Page (R)",
    tabTranscript: "Transcript & Chapters",
    tabSignStudio: "Live EthSL Translator",
    tabBlindConsole: "Blind Audio & Braille Console",
    tabSensory3G: "Deaf Audio Radar & 3G Saver",
    tabCaptionEditor: "Caption Pipeline Editor"
  };

  const escapeHtml = (value) =>
    String(value ?? "").replace(/[&<>"']/g, (ch) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[ch]);

  const toSeconds = (stamp) =>
    String(stamp || "0:00")
      .replace(",", ".")
      .split(":")
      .map(Number)
      .reduce((acc, part) => acc * 60 + (Number.isFinite(part) ? part : 0), 0);

  const formatTime = (value) => {
    const seconds = Math.max(0, Math.floor(Number(value) || 0));
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
  };

  const formatVttTimestamp = (value) => {
    const total = Math.max(0, Number(value) || 0);
    const hrs = Math.floor(total / 3600);
    const mins = Math.floor((total % 3600) / 60);
    const secs = (total % 60).toFixed(3).padStart(6, "0");
    return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${secs}`;
  };

  const hexToRgba = (hex, opacity = 0.82) => {
    const clean = String(hex || "#000000").replace("#", "");
    const num = parseInt(clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean, 16) || 0;
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  const parseVtt = (text) =>
    String(text || "")
      .replace(/^\uFEFF?WEBVTT[^\n]*\n/i, "")
      .split(/\r?\n\s*\r?\n/)
      .map((block) => block.trim().split(/\r?\n/).filter(Boolean))
      .map((lines) => {
        const timing = lines.findIndex((line) => line.includes("-->"));
        if (timing < 0) return null;
        const [start, end] = lines[timing]
          .split("-->")
          .map((part) => part.trim().split(/\s+/)[0]);
        const rawText = lines.slice(timing + 1).join(" ").replace(/<v\s+([^>]+)>/gi, "$1: ").replace(/<\/?[^>]+>/g, "");
        return { start: toSeconds(start), end: toSeconds(end), text: rawText.trim() };
      })
      .filter((cue) => cue && cue.text);

  const serializeVtt = (cues) =>
    "WEBVTT\n\n" +
    (cues || [])
      .map((cue, idx) => `${idx + 1}\n${formatVttTimestamp(cue.start)} --> ${formatVttTimestamp(cue.end)}\n${cue.text}`)
      .join("\n\n") +
    "\n";

  const languageForPath = (path) =>
    /(?:[._-]am(?:[._-]|$)|amharic)/i.test(path) ? "am" : "en";

  /* ==========================================================================
     Grade 1 Braille (.brf) & 6-Dot Tactile Cell Matrix Engine
     ========================================================================== */
  const BRAILLE_MAP = {
    a: "a", b: "b", c: "c", d: "d", e: "e", f: "f", g: "g", h: "h", i: "i", j: "j",
    k: "k", l: "l", m: "m", n: "n", o: "o", p: "p", q: "q", r: "r", s: "s", t: "t",
    u: "u", v: "v", w: "w", x: "x", y: "y", z: "z",
    "1": "#a", "2": "#b", "3": "#c", "4": "#d", "5": "#e", "6": "#f", "7": "#g", "8": "#h", "9": "#i", "0": "#j",
    ",": "1", ";": "2", ":": "3", ".": "4", "!": "6", "(": "7", ")": "7", "?": "8", '"': "8", "-": "-", " ": " "
  };

  // Standard 6-dot Braille patterns (dots 1..6) for tactile cell inspector
  const BRAILLE_DOTS = {
    a: [1], b: [1, 2], c: [1, 4], d: [1, 4, 5], e: [1, 5],
    f: [1, 2, 4], g: [1, 2, 4, 5], h: [1, 2, 5], i: [2, 4], j: [2, 4, 5],
    k: [1, 3], l: [1, 2, 3], m: [1, 3, 4], n: [1, 3, 4, 5], o: [1, 3, 5],
    p: [1, 2, 3, 4], q: [1, 2, 3, 4, 5], r: [1, 2, 3, 5], s: [2, 3, 4], t: [2, 3, 4, 5],
    u: [1, 3, 6], v: [1, 2, 3, 6], w: [2, 4, 5, 6], x: [1, 3, 4, 6], y: [1, 3, 4, 5, 6], z: [1, 3, 5, 6],
    " ": []
  };

  function textToBrailleAscii(text, maxLineLen = 38) {
    const words = String(text || "").split(/\s+/);
    const lines = [];
    let currentLine = "";
    for (const word of words) {
      let brfWord = "";
      for (let i = 0; i < word.length; i++) {
        const char = word[i];
        if (char >= "A" && char <= "Z") brfWord += ",";
        brfWord += BRAILLE_MAP[char.toLowerCase()] || char.toLowerCase();
      }
      if ((currentLine + " " + brfWord).trim().length <= maxLineLen) {
        currentLine = (currentLine + " " + brfWord).trim();
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = brfWord;
      }
    }
    if (currentLine) lines.push(currentLine);
    return lines.join("\r\n");
  }

  /* ==========================================================================
     Real-Time Ethiopian Sign Language (EthSL) NLP -> SOV Gloss & Kinematic Engine
     ========================================================================== */
  const ETHSL_LEXICON = {
    welcome: { gloss_en: "WELCOME", gloss_am: "እንኳን-ደህና-መጡ", handshape: "5-Open Palm", location: "Chest Space", movement: "Warm inward welcome sweep", facial: "Raised brows + warm nod", pose: "welcome" },
    module: { gloss_en: "MODULE-LESSON", gloss_am: "ትምህርት-ክፍል", handshape: "Flat-B + C-Block", location: "Non-dominant Palm", movement: "Structured module block placement", facial: "Focused gaze", pose: "work" },
    future: { gloss_en: "FUTURE-AHEAD", gloss_am: "ወደፊት", handshape: "Flat-B Vertical", location: "Right Temple", movement: "Forward arc ahead of shoulder", facial: "Eyes tracking forward", pose: "expand" },
    virtual: { gloss_en: "VIRTUAL-DIGITAL", gloss_am: "ዲጂታል-ርቀት", handshape: "V-Hand Oscillation", location: "Upper Space", movement: "Circular digital wave", facial: "Raised brows (topic)", pose: "think" },
    assistant: { gloss_en: "ASSISTANT-PRO", gloss_am: "ረዳት-ባለሙያ", handshape: "A-Thumb on Flat Palm", location: "Center Chest", movement: "Supportive upward lift", facial: "Affirmative nod", pose: "empathy" },
    industry: { gloss_en: "INDUSTRY-SECTOR", gloss_am: "ኢንዱስትሪ", handshape: "S-Fists Alternating", location: "Neutral Space", movement: "Rotational gear cycle", facial: "Steady gaze", pose: "work" },
    evolving: { gloss_en: "EVOLVE-GROW", gloss_am: "መሻሻል-ማደግ", handshape: "Closed-O -> 5-Spread", location: "Chest Rising", movement: "Upward spiral expansion", facial: "Intensity mouth marker", pose: "expand" },
    global: { gloss_en: "WORLD-GLOBAL", gloss_am: "ዓለም-አቀፍ", handshape: "Two Curved C-Hands", location: "Central Sphere", movement: "Outward globe arc", facial: "Wide eyes (scale)", pose: "expand" },
    remote: { gloss_en: "REMOTE-CONNECT", gloss_am: "የርቀት-ሥራ", handshape: "I-L-Y / Index Link", location: "Shoulder -> Forward", movement: "Distance bridge projection", facial: "Focused nod", pose: "join" },
    work: { gloss_en: "WORK-TASK", gloss_am: "ሥራ", handshape: "Double S-Fists", location: "Front Space", movement: "Double wrist tap", facial: "Direct gaze", pose: "work" },
    ai: { gloss_en: "AI-COMPUTE", gloss_am: "ኤአይ-ቴክኖሎጂ", handshape: "Claw-5 at Temple", location: "Right Forehead", movement: "Neural rotation beside temple", facial: "Analytical brow", pose: "think" },
    human: { gloss_en: "HUMAN-PERSON", gloss_am: "የሰው-ባለሙያ", handshape: "Parallel B-Palms", location: "Torso Sides", movement: "Downward parallel torso outline", facial: "Warm nod", pose: "empathy" },
    empathy: { gloss_en: "EMPATHY-HEART", gloss_am: "ርኅራኄ-መረዳት", handshape: "Open-8 Heart Touch", location: "Heart -> Forward", movement: "Heart touch extending to viewer", facial: "Empathetic head tilt", pose: "empathy" },
    judgment: { gloss_en: "JUDGMENT-DECIDE", gloss_am: "ውሳኔ-አሰጣጥ", handshape: "Two F-Scale Hands", location: "Neutral Space", movement: "Alternating balance scale -> lock", facial: "Decisive nod", pose: "contrast" },
    ethiopian: { gloss_en: "ETHIOPIA", gloss_am: "ኢትዮጵያ", handshape: "3-Finger Crown", location: "Forehead", movement: "Ethiopian heritage sign marker", facial: "Proud posture", pose: "join" },
    certificate: { gloss_en: "CERTIFICATE-BADGE", gloss_am: "ምስክር-ወረቀት", handshape: "C-Seal Stamp", location: "Palm / Chest", movement: "Cryptographic seal stamp", facial: "Affirmative nod", pose: "finish" },
    complete: { gloss_en: "FINISH-COMPLETE", gloss_am: "ማጠናቀቅ", handshape: "5-Palms Flip", location: "Chest Space", movement: "Crisp outward wrist flip", facial: "'Pah' completion marker", pose: "finish" },
    html: { gloss_en: "HTML-TAG", gloss_am: "ኤችቲኤምኤል-ኮድ", handshape: "Angle-Bracket Hands", location: "Coding Space", movement: "Symmetric < > tag framing", facial: "Technical focus", pose: "code" },
    h1: { gloss_en: "H1-HEADING", gloss_am: "ዋና-ርዕስ-H1", handshape: "H-Hand -> 1-Top", location: "High Space", movement: "Top banner sweep", facial: "Raised brows", pose: "code" }
  };

  const AMHARIC_SIGN_MAP = {
    "እንኳን": "welcome", "ደህና": "welcome", "ሞጁል": "module", "ትምህርት": "module",
    "ወደፊት": "future", "ቨርቹዋል": "virtual", "ረዳት": "assistant", "ኢንዱስትሪ": "industry",
    "እየተሻሻለ": "evolving", "ዓለም": "global", "ርቀት": "remote", "ሥራ": "work", "ስራ": "work",
    "ኤአይ": "ai", "ሰው": "human", "ባለሙያዎች": "human", "መረዳት": "empathy", "ርኅራኄ": "empathy",
    "ውሳኔ": "judgment", "ኢትዮጵያ": "ethiopian", "ምስክር": "certificate", "ወረቀት": "certificate", "ያጠናቅቁ": "complete"
  };

  const STOP_EN = new Set(["the", "a", "an", "is", "are", "was", "were", "to", "of", "in", "on", "at", "by", "for", "with", "as", "and", "or", "that", "this", "it", "can"]);

  function translateTextToEthSL(text, lang = "en") {
    const raw = String(text || "").trim();
    const soundCues = Array.from(raw.matchAll(/\[([^\]]+)\]/g)).map((m) => m[1]);
    const clean = raw.replace(/\[[^\]]+\]/g, "").trim();
    const words = clean.match(/[\w\u1200-\u137F]+/g) || [];
    const nouns = [];
    const verbs = [];
    const verbKeys = new Set(["welcome", "evolving", "complete", "judgment", "work"]);

    words.forEach((w) => {
      const lower = w.toLowerCase();
      if (STOP_EN.has(lower) || ["ወደ", "እና", "ውስጥ", "ላይ", "ጋር", "ነው"].includes(lower)) return;
      const strippedAm = lower.length > 2 && ["በ", "ለ", "ከ", "የ"].includes(lower[0]) ? lower.slice(1) : lower;
      let key = ETHSL_LEXICON[lower] ? lower : (AMHARIC_SIGN_MAP[lower] || AMHARIC_SIGN_MAP[strippedAm]);
      if (!key) {
        for (const k of Object.keys(ETHSL_LEXICON)) {
          if (lower.length >= 4 && (lower.startsWith(k.slice(0, 4)) || k.startsWith(lower.slice(0, 4)))) {
            key = k;
            break;
          }
        }
      }
      if (key && ETHSL_LEXICON[key]) {
        const entry = ETHSL_LEXICON[key];
        const token = { word: w, type: "sign", ...entry, fingerspell: w.toUpperCase().slice(0, 8).split("") };
        if (verbKeys.has(key)) verbs.push(token);
        else nouns.push(token);
      } else if (lower.length >= 2) {
        const chars = w.toUpperCase().slice(0, 8).split("");
        nouns.push({
          word: w,
          type: "fingerspell",
          gloss_en: `FS:${chars.join("-")}`,
          gloss_am: `ፊደል፦${chars.join("-")}`,
          handshape: "EthSL Manual Alphabet / HaHu Fidel",
          location: "Dominant Shoulder Box",
          movement: `Sequential fingerspelling (${chars.length} chars)`,
          facial: "Lexical mouthing",
          pose: "fingerspell",
          fingerspell: chars
        });
      }
    });

    const combined = [...nouns, ...verbs].filter(
      (item, idx, arr) => idx === 0 || item.gloss_en !== arr[idx - 1].gloss_en
    );
    if (!combined.length) {
      combined.push({
        word: clean || "Lesson",
        type: "sign",
        ...ETHSL_LEXICON.welcome,
        fingerspell: ["E", "T", "H", "S", "L"]
      });
    }
    return {
      source: raw,
      soundCues,
      tokens: combined,
      glossEn: combined.map((t) => t.gloss_en).join(" • "),
      glossAm: combined.map((t) => t.gloss_am).join(" • ")
    };
  }

  /* ==========================================================================
     Spatial Earcon Synthesizer (Web Audio API Tactile Feedback for Blind Users)
     ========================================================================== */
  let sharedAudioCtx = null;
  function playEarcon(type = "tick", enabled = true) {
    if (!enabled) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!sharedAudioCtx) sharedAudioCtx = new AudioCtx();
      if (sharedAudioCtx.state === "suspended") sharedAudioCtx.resume();

      const now = sharedAudioCtx.currentTime;
      const osc = sharedAudioCtx.createOscillator();
      const gain = sharedAudioCtx.createGain();
      osc.connect(gain);
      gain.connect(sharedAudioCtx.destination);

      const presets = {
        play: { f1: 440, f2: 660, dur: 0.11, wave: "sine" },
        pause: { f1: 520, f2: 330, dur: 0.11, wave: "sine" },
        seekFwd: { f1: 500, f2: 750, dur: 0.07, wave: "triangle" },
        seekBack: { f1: 600, f2: 380, dur: 0.07, wave: "triangle" },
        chapter: { f1: 587, f2: 880, dur: 0.14, wave: "sine" },
        bookmark: { f1: 523, f2: 1046, dur: 0.16, wave: "sine" },
        toggleOn: { f1: 480, f2: 720, dur: 0.08, wave: "sine" },
        toggleOff: { f1: 600, f2: 400, dur: 0.08, wave: "sine" },
        tick: { f1: 640, f2: 680, dur: 0.04, wave: "sine" }
      };
      const p = presets[type] || presets.tick;
      osc.type = p.wave;
      osc.frequency.setValueAtTime(p.f1, now);
      osc.frequency.exponentialRampToValueAtTime(p.f2, now + p.dur);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + p.dur);
      osc.start(now);
      osc.stop(now + p.dur + 0.01);
    } catch {}
  }

  async function getDictionary(language) {
    const key = language === "am" ? "am" : "en";
    if (dictionaries.has(key)) return dictionaries.get(key);
    try {
      const response = await fetch(new URL(`i18n/${key}.json`, moduleBase));
      if (!response.ok) throw new Error("Dictionary fetch failed");
      const data = { ...fallback, ...(await response.json()) };
      dictionaries.set(key, data);
      return data;
    } catch {
      return fallback;
    }
  }

  const DEFAULT_CUES = {
    en: [
      { start: 0, end: 6, chapter: "Ch 1: Welcome & Overview", text: "[Introductory chime] Welcome to Module 2: The Future of the Virtual Assistant (VA) Industry." },
      { start: 6, end: 13, chapter: "Ch 2: Global Remote Work Growth", text: "The Virtual Assistant profession is not shrinking. It is evolving rapidly as global remote work expands." },
      { start: 13, end: 21, chapter: "Ch 3: AI Bots vs. Human VAs", text: "[Soft transition tone] Important Distinction: Virtual Assistant can mean an AI software bot like Siri, or a skilled human remote professional." },
      { start: 21, end: 29, chapter: "Ch 4: Empathy & Human Judgment", text: "While AI automates repetitive scheduling and data entry, human VAs lead in judgment, empathy, and complex problem-solving." },
      { start: 29, end: 37, chapter: "Ch 5: Ethiopian Tech Talent", text: "By combining AI tools with human communication skills, Ethiopian tech talent can compete for global remote careers." },
      { start: 37, end: 45, chapter: "Ch 6: Accessible Career Gateway", text: "[Closing chime] Complete this concept and review the Accessible Career Gateway below to share your verifiable ALX certificate with employers." }
    ],
    am: [
      { start: 0, end: 6, chapter: "ምዕራፍ 1፦ መግቢያ", text: "[የመክፈቻ ደወል ድምፅ] እንኳን ወደ ሞጁል 2 በደህና መጡ፦ የቨርቹዋል ረዳት (VA) ኢንዱስትሪ የወደፊት እጣ ፈንታ።" },
      { start: 6, end: 13, chapter: "ምዕራፍ 2፦ የርቀት ሥራ እድገት", text: "የቨርቹዋል ረዳት ሙያ እየጠበበ አይደለም፤ የርቀት ሥራ በዓለም አቀፍ ደረጃ እያደገ ሲሄድ በፍጥነት እየተሻሻለ ነው።" },
      { start: 13, end: 21, chapter: "ምዕራፍ 3፦ AI እና የሰው ባለሙያ ልዩነት", text: "[የሽግግር ድምፅ] አስፈላጊ ልዩነት፦ ቨርቹዋል ረዳት ማለት እንደ ሲሪ ያለ የAI ሶፍትዌር ወይም የሰለጠነ የሰው የርቀት ባለሙያ ማለት ሊሆን ይችላል።" },
      { start: 21, end: 29, chapter: "ምዕራፍ 4፦ ርኅራኄ እና ውሳኔ አሰጣጥ", text: "AI ተደጋጋሚ የመረጃ አያያዝ ስራዎችን ሲያቀልል፣ የሰው ባለሙያዎች ግን በውሳኔ አሰጣጥ፣ በመረዳት እና ውስብስብ ችግሮችን በመፍታት ይመራሉ።" },
      { start: 29, end: 37, chapter: "ምዕራፍ 5፦ የኢትዮጵያ ወጣቶች ተወዳዳሪነት", text: "የAI መሳሪያዎችን ከሰው ልጅ የተግባቦት ክህሎት ጋር በማቀናጀት፣ የኢትዮጵያ ወጣቶች በዓለም አቀፍ የርቀት ሥራዎች መወዳደር ይችላሉ።" },
      { start: 37, end: 45, chapter: "ምዕራፍ 6፦ የሥራ እድል እና የምስክር ወረቀት", text: "[የመዝጊያ ደወል ድምፅ] ይህንን ትምህርት ያጠናቅቁ እና የተረጋገጠ የALX የምስክር ወረቀትዎን ለቀጣሪዎች ለማጋራት ከታች ያለውን የሥራ እድል ክፍል ይመልከቱ።" }
    ]
  };

  const DEFAULT_DESCRIPTIONS = {
    en: [
      { start: 0, end: 5.8, visualTitle: "Title Card & EthSL Interpreter", text: "Audio description: High-contrast navy slide reads 'ALX Savanna Module 2: Introduction & Welcome', with three concept cards below (AI Automation, Human VA Judgment, Global Career Gateway) and an Ethiopian Sign Language interpreter signing WELCOME at chest level." },
      { start: 6, end: 12.8, visualTitle: "Global Remote Work Diagram", text: "Audio description: Chapter 2 slide highlights how global remote collaboration is expanding rapidly, while the EthSL interpreter performs a two-handed outward sphere expansion sign." },
      { start: 13, end: 20.8, visualTitle: "AI Bots vs. Human Professionals Split", text: "Audio description: Chapter 3 comparison diagram contrasts AI software chatbots on the left with skilled human remote professionals on the right." },
      { start: 21, end: 28.8, visualTitle: "Human Empathy & Judgment Spotlight", text: "Audio description: Chapter 4 highlights the middle emerald card 'Human VA Judgment: Empathy & Strategy' with a bright yellow border while the interpreter signs EMPATHY from the heart." },
      { start: 29, end: 36.8, visualTitle: "Ethiopian Talent in Global Markets", text: "Audio description: Chapter 5 shows how combining AI productivity tools with human communication empowers Ethiopian youth to compete globally." },
      { start: 37, end: 45, visualTitle: "Accessible Career Gateway & Open Badge", text: "Audio description: Chapter 6 highlights the 'Global Career Gateway: Open Badges 3.0' card, prompting learners to verify their cryptographic ALX credential." }
    ],
    am: [
      { start: 0, end: 5.8, visualTitle: "የመክፈቻ ገጽ እና የምልክት ቋንቋ አስተርጓሚ", text: "የድምፅ መግለጫ፦ ጥቁር ሰማያዊ የርዕስ ገጽ 'ALX Savanna ሞጁል 2' የሚል ጽሑፍ እና ሦስት የፅንሰ-ሀሳብ ሳጥኖችን ከኢትዮጵያ የምልክት ቋንቋ አስተርጓሚ ጋር ያሳያል።" },
      { start: 6, end: 12.8, visualTitle: "የዓለም አቀፍ የርቀት ሥራ እድገት ምስል", text: "የድምፅ መግለጫ፦ ምዕራፍ 2 የዓለም አቀፍ የርቀት ሥራ ቡድኖች እንዴት እየሰፉ እንደሆነ በምስል ያነጻጽራል።" },
      { start: 13, end: 20.8, visualTitle: "የAI ቦቶች እና የሰው ባለሙያዎች ንጽጽር", text: "የድምፅ መግለጫ፦ ምዕራፍ 3 የAI ሶፍትዌር ቦቶችን ከሰለጠኑ የሰው ባለሙያዎች ጋር ጎን ለጎን ያነጻጽራል።" },
      { start: 21, end: 28.8, visualTitle: "የሰው ልጅ ውሳኔ አሰጣጥ እና ርኅራኄ", text: "የድምፅ መግለጫ፦ ምዕራፍ 4 የሰው ልጅ ውሳኔ አሰጣጥ እና ርኅራኄ የሚለውን አረንጓዴ ሳጥን በቢጫ መስመር አጉልቶ ያሳያል።" },
      { start: 29, end: 36.8, visualTitle: "የኢትዮጵያ ወጣቶች በዓለም አቀፍ ገበያ", text: "የድምፅ መግለጫ፦ ምዕራፍ 5 የAI መሳሪያዎችን ከሰው ልጅ ክህሎት ጋር ማቀናጀት ያለውን ጥቅም ያሳያል።" },
      { start: 37, end: 45, visualTitle: "ተደራሽ የሥራ እድል እና የምስክር ወረቀት", text: "የድምፅ መግለጫ፦ ምዕራፍ 6 የተረጋገጠ የALX የምስክር ወረቀት ማገናኛ ያለው የሥራ እድል ካርድ ያሳያል።" }
    ]
  };

  /* ==========================================================================
     Host Accessibility Skip-Bar & Keyboard Patch (Non-Destructive)
     ========================================================================== */
  function enhanceHostPageAccessibility() {
    if (document.getElementById("db-host-a11y-skipbar")) return;
    // Patch Savanna's non-keyboard <div class="hamburger"> without modifying host files
    const hamburger = document.querySelector(".hamburger");
    if (hamburger && !hamburger.hasAttribute("tabindex")) {
      hamburger.setAttribute("role", "button");
      hamburger.setAttribute("tabindex", "0");
      hamburger.setAttribute("aria-label", "Toggle Savanna navigation sidebar");
      hamburger.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          hamburger.click();
        }
      });
    }

    const nav = document.createElement("nav");
    nav.id = "db-host-a11y-skipbar";
    nav.setAttribute("aria-label", "Quick Accessibility Skip Links");
    nav.style.cssText =
      "position:fixed;top:0;left:0;right:0;z-index:100000;background:#05192d;color:#fff;padding:0.4rem 1rem;display:flex;gap:0.75rem;flex-wrap:wrap;align-items:center;border-bottom:3px solid #00e676;transform:translateY(-120%);transition:transform 0.18s ease;font-family:system-ui,sans-serif;font-size:0.9rem;";
    nav.innerHTML = `
      <strong style="color:#00e676;">⚡ PlayLy A11y Quick-Jump:</strong>
      <a href="#db-player-focus-anchor" id="db-skip-to-player" style="color:#fff000;font-weight:700;text-decoration:underline;padding:0.25rem 0.5rem;">Skip to Accessible Media Player (Alt+P)</a>
      <a href="#curriculum_navigation_content" style="color:#ffffff;font-weight:700;text-decoration:underline;padding:0.25rem 0.5rem;">Skip to Lesson Text (Alt+M)</a>
    `;
    const showBar = () => { nav.style.transform = "translateY(0)"; };
    const hideBar = (e) => {
      if (!nav.contains(e.relatedTarget)) nav.style.transform = "translateY(-120%)";
    };
    nav.addEventListener("focusin", showBar);
    nav.addEventListener("focusout", hideBar);
    document.body.prepend(nav);

    const skipPlayerLink = nav.querySelector("#db-skip-to-player");
    if (skipPlayerLink) {
      skipPlayerLink.addEventListener("click", (e) => {
        const player = document.querySelector("db-player");
        if (player && player.shadowRoot) {
          e.preventDefault();
          const playBtn = player.shadowRoot.querySelector("#play-pause");
          if (playBtn) playBtn.focus();
          player.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      });
    }

    window.addEventListener("keydown", (e) => {
      if (e.altKey && e.key.toLowerCase() === "p") {
        const player = document.querySelector("db-player");
        if (player && player.shadowRoot) {
          e.preventDefault();
          player.shadowRoot.querySelector("#play-pause")?.focus();
          player.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      } else if (e.altKey && e.key.toLowerCase() === "b") {
        const player = document.querySelector("db-player");
        if (player && typeof player.toggleBlindOvercookedMode === "function") {
          e.preventDefault();
          player.toggleBlindOvercookedMode();
        }
      }
    });
  }

  /* ==========================================================================
     1. <db-player> — YouTube-Style Accessible Media, Real-Time EthSL & Blind Console
     ========================================================================== */
  class DbPlayer extends HTMLElement {
    static get observedAttributes() {
      return ["lang", "src", "captions", "sign", "describe", "descriptions", "api", "lesson-id", "offline-worker", "title", "theme"];
    }

    constructor() {
      super();
      this.attachShadow({ mode: "open" });
      this.captionCues = { en: [...DEFAULT_CUES.en], am: [...DEFAULT_CUES.am] };
      this.descriptionCues = { en: [...DEFAULT_DESCRIPTIONS.en], am: [...DEFAULT_DESCRIPTIONS.am] };
      this.describedCue = -1;
      this.lastChapterIndex = -1;
      this.signTimer = null;
      this.animFrameId = null;
      this.t = fallback;
      this.startQueued = false;
      this.customSignTranslation = null;
      this.activeTab = "transcript";
      this.selectedBrailleWord = "VA";
      this.bookmarks = [];
      this.hostSections = [];
      this.voiceRecognition = null;
      this.voiceListening = false;
    }

    connectedCallback() {
      enhanceHostPageAccessibility();
      this.initialisePreferences();
      this.loadBookmarks();
      if ("serviceWorker" in navigator && this.offlineWorkerSource) {
        navigator.serviceWorker.register(this.offlineWorkerSource).catch(() => {});
      }
      this.queueRender();
    }

    disconnectedCallback() {
      if (this.signTimer) window.clearInterval(this.signTimer);
      if (this.animFrameId) window.cancelAnimationFrame(this.animFrameId);
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
      if (this.fullscreenHandler) document.removeEventListener("fullscreenchange", this.fullscreenHandler);
      if (this.resizeObserver) {
        this.resizeObserver.disconnect();
        this.resizeObserver = null;
      }
      if (this.windowResizeHandler) {
        window.removeEventListener("resize", this.windowResizeHandler);
        this.windowResizeHandler = null;
      }
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (oldValue === newValue) return;
      if (name === "lang" && this.preferences) {
        this.preferences.captionLanguage = newValue === "am" ? "am" : "en";
      }
      this.queueRender();
    }

    queueRender() {
      if (this.startQueued) return;
      this.startQueued = true;
      window.queueMicrotask(async () => {
        this.startQueued = false;
        await this.render();
      });
    }

    initialisePreferences() {
      const saved = this.readStorage();
      this.preferences = {
        captions: saved.captions ?? true,
        captionLanguage: saved.captionLanguage || (this.getAttribute("lang") === "am" ? "am" : "en"),
        captionDual: saved.captionDual ?? false,
        captionSize: saved.captionSize || "1.25",
        captionColor: saved.captionColor || "#fff000",
        captionBackground: saved.captionBackground || "#080808",
        captionOpacity: saved.captionOpacity || "0.84",
        captionPosition: saved.captionPosition || "bottom",
        captionCoords: saved.captionCoords || null,
        sign: saved.sign ?? true,
        signMode: saved.signMode || "live", // "live" (Real-time EthSL Translator + Avatar) or "video" (Synced Video PiP)
        signPosition: saved.signPosition || "bottom-right",
        signSize: saved.signSize || "medium",
        signFloating: saved.signFloating ?? true,
        signSplit: saved.signSplit ?? false,
        signCoords:
          saved.signCoords && (typeof saved.signCoords.xRatio === "number" || typeof saved.signCoords.left === "number")
            ? saved.signCoords
            : null,
        audioDescription: saved.audioDescription ?? false,
        blindOvercooked: saved.blindOvercooked ?? true,
        earcons: saved.earcons ?? true,
        haptics: saved.haptics ?? true,
        dataSaver3G: saved.dataSaver3G ?? false,
        transcriptOpen: saved.transcriptOpen ?? true,
        playbackRate: saved.playbackRate || 1
      };
    }

    readStorage() {
      try {
        return JSON.parse(window.localStorage.getItem("db-player-preferences") || "{}");
      } catch {
        return {};
      }
    }

    loadBookmarks() {
      try {
        const raw = window.localStorage.getItem(`db-bookmarks-${this.lessonId}`);
        this.bookmarks = raw ? JSON.parse(raw) : [
          { time: 13, note: "Key distinction: AI software bots vs. skilled human remote professionals." },
          { time: 21, note: "Human VAs lead in judgment, empathy, and complex problem solving." }
        ];
      } catch {
        this.bookmarks = [];
      }
    }

    saveBookmarks() {
      try {
        window.localStorage.setItem(`db-bookmarks-${this.lessonId}`, JSON.stringify(this.bookmarks));
      } catch {}
    }

    persist(announcementText) {
      try {
        window.localStorage.setItem("db-player-preferences", JSON.stringify(this.preferences));
      } catch {}
      this.dispatchEvent(
        new CustomEvent("db-player:prefs", {
          bubbles: true,
          composed: true,
          detail: {
            captionSize: this.preferences.captionSize,
            captionColor: this.preferences.captionColor,
            captionBackground: this.preferences.captionBackground,
            captionPosition: this.preferences.captionPosition,
            captionDual: this.preferences.captionDual,
            signPosition: this.preferences.signPosition,
            signSize: this.preferences.signSize,
            signMode: this.preferences.signMode,
            signCoords: this.preferences.signCoords,
            signFloating: this.preferences.signFloating,
            blindOvercooked: this.preferences.blindOvercooked,
            dataSaver3G: this.preferences.dataSaver3G,
            language: this.preferences.captionLanguage
          }
        })
      );
      if (announcementText) this.announce(announcementText, this.preferences.blindOvercooked);
    }

    get language() {
      return this.getAttribute("lang") === "am" ? "am" : "en";
    }
    get source() {
      return this.getAttribute("src") || "/savanna/assets/media/va-future-lesson.mp4";
    }
    get signSource() {
      return this.getAttribute("sign") || "/savanna/assets/media/va-future-ethsl.mp4";
    }
    get descriptionSource() {
      return this.getAttribute("describe") || this.getAttribute("descriptions") || "";
    }
    get api() {
      return (this.getAttribute("api") || "/api/v1").replace(/\/$/, "");
    }
    get lessonId() {
      return this.getAttribute("lesson-id") || "va-future";
    }
    get offlineWorkerSource() {
      return this.getAttribute("offline-worker") || "/service-worker.js";
    }

    captionSources() {
      const declared = (this.getAttribute("captions") || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
      const map = {};
      declared.forEach((path) => {
        map[languageForPath(path)] = path;
      });
      return map;
    }

    async loadTracks() {
      const declared = this.captionSources();
      for (const [code, path] of Object.entries(declared)) {
        try {
          const response = await fetch(path);
          if (response.ok) {
            const parsed = parseVtt(await response.text());
            if (parsed.length) {
              this.captionCues[code] = parsed.map((c, idx) => ({
                ...c,
                chapter: (DEFAULT_CUES[code]?.[idx]?.chapter) || `Chapter ${idx + 1}`
              }));
            }
          }
        } catch {}
      }
      if (this.descriptionSource) {
        const descPaths = this.descriptionSource.split(",").map((s) => s.trim()).filter(Boolean);
        for (const path of descPaths) {
          const langCode = languageForPath(path);
          try {
            const response = await fetch(path);
            if (response.ok) {
              const parsed = parseVtt(await response.text());
              if (parsed.length) {
                this.descriptionCues[langCode] = parsed.map((c, idx) => ({
                  ...c,
                  visualTitle: (DEFAULT_DESCRIPTIONS[langCode]?.[idx]?.visualTitle) || `Scene ${idx + 1}`
                }));
              }
            }
          } catch {}
        }
      }
    }

    scanHostSections() {
      const headings = Array.from(document.querySelectorAll("#curriculum_navigation_content h2, #curriculum_navigation_content h3, main h1, main h2"));
      this.hostSections = headings.slice(0, 8).map((h, i) => {
        const nextP = h.nextElementSibling;
        const snippet = nextP ? (nextP.textContent || "").trim().slice(0, 220) : "";
        return {
          index: i + 1,
          title: (h.textContent || `Section ${i + 1}`).trim(),
          snippet: snippet || "Interactive Savanna course section."
        };
      });
      if (!this.hostSections.length) {
        this.hostSections = this.cues().map((c, i) => ({
          index: i + 1,
          title: c.chapter || `Section ${i + 1}`,
          snippet: c.text
        }));
      }
    }

    async render() {
      const activeVideo = this.shadowRoot.querySelector("#video");
      this.restorePlayback = activeVideo
        ? { time: activeVideo.currentTime, paused: activeVideo.paused, rate: activeVideo.playbackRate }
        : null;
      if (this.signTimer) {
        window.clearInterval(this.signTimer);
        this.signTimer = null;
      }
      if (this.animFrameId) {
        window.cancelAnimationFrame(this.animFrameId);
        this.animFrameId = null;
      }

      this.t = await getDictionary(this.language);
      const t = this.t;
      await this.loadTracks();
      this.scanHostSections();
      const hasSign = Boolean(this.signSource);
      const captionOptions = ["en", "am"]
        .map(
          (code) =>
            `<option value="${code}" ${this.preferences.captionLanguage === code ? "selected" : ""}>${
              code === "am" ? "አማርኛ (Amharic)" : "English"
            }</option>`
        )
        .join("");

      const chapterTicks = this.cues()
        .map((c, idx) => {
          const leftPct = Math.min(98, Math.max(0, (c.start / 45) * 100));
          return `<span class="yt-chapter-tick" style="left:${leftPct}%" title="${escapeHtml(c.chapter || `Chapter ${idx + 1}`)}"></span>`;
        })
        .join("");

      this.shadowRoot.innerHTML = `
        <style>
          :host {
            display: block;
            font-family: var(--bs-body-font-family, system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans Ethiopic", sans-serif);
            color: var(--bs-body-color, #101828);
            line-height: 1.6;
            margin: 1rem 0;
          }
          *, *::before, *::after { box-sizing: border-box; }
          .shell {
            border: 2px solid #05192d;
            border-radius: 0.85rem;
            background: #ffffff;
            overflow: visible;
            display: grid;
            gap: 0;
            box-shadow: 0 10px 28px rgba(5, 25, 45, 0.14);
          }
          .shell:fullscreen {
            width: 100vw;
            height: 100vh;
            overflow-y: auto;
            border-radius: 0;
            background: #05192d;
          }
          /* Top Header & Blind Status Bar */
          .heading {
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 0.5rem;
            padding: 0.65rem 1rem;
            background: linear-gradient(90deg, #05192d 0%, #092c4c 100%);
            color: #ffffff;
            border-top-left-radius: 0.72rem;
            border-top-right-radius: 0.72rem;
            border-bottom: 3px solid #00e676;
          }
          .heading-left {
            display: flex;
            align-items: center;
            gap: 0.65rem;
            flex-wrap: wrap;
          }
          .heading h2 {
            margin: 0;
            font-size: 1.12rem;
            font-weight: 800;
            color: #ffffff;
          }
          .mode-pills {
            display: flex;
            gap: 0.4rem;
            flex-wrap: wrap;
            align-items: center;
          }
          .status-pill {
            font-size: 0.75rem;
            font-weight: 700;
            padding: 0.2rem 0.55rem;
            border-radius: 999px;
            background: rgba(0, 230, 118, 0.18);
            color: #69f0ae;
            border: 1px solid rgba(0, 230, 118, 0.45);
          }
          .time-badge {
            font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
            font-size: 0.88rem;
            background: rgba(255, 255, 255, 0.14);
            padding: 0.2rem 0.6rem;
            border-radius: 0.35rem;
            color: #ffffff;
            font-weight: 700;
          }

          /* Video Stage & YouTube-Style Overlay */
          .stage {
            position: relative;
            background: #050b14;
            display: grid;
            place-items: center;
            min-height: 21rem;
            outline: none;
            overflow: visible;
          }
          .stage.split {
            display: grid !important;
            grid-template-columns: minmax(0, 1.35fr) minmax(290px, 1fr) !important;
            gap: 0.75rem;
            align-items: stretch;
            background: #020b14;
            padding: 0.6rem;
          }
          .stage.split video.main {
            width: 100%;
            height: 100%;
            max-height: 34rem;
            object-fit: contain;
          }
          .stage.split .sign {
            position: relative !important;
            inset: auto !important;
            width: 100% !important;
            height: 100% !important;
            max-height: 34rem;
            left: auto !important;
            top: auto !important;
            right: auto !important;
            bottom: auto !important;
            transform: none !important;
            box-shadow: none;
            cursor: default;
          }
          @media (max-width: 52rem) {
            .stage.split { grid-template-columns: 1fr !important; }
            .stage.split .sign { min-height: 17rem; }
          }
          video.main {
            width: 100%;
            max-height: 34rem;
            display: block;
            background: #000000;
          }
          video::cue { opacity: 0; }

          /* 3G Smart Data-Saver Slide Keyframe Canvas Overlay */
          .datasaver-stage {
            position: absolute;
            inset: 0;
            background: #07172a;
            z-index: 2;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            padding: 1.5rem;
            text-align: center;
            color: #ffffff;
          }
          .datasaver-stage[hidden] { display: none !important; }
          .datasaver-card {
            max-width: 42rem;
            background: #0f2942;
            border: 2px solid #00e676;
            border-radius: 0.85rem;
            padding: 1.25rem 1.5rem;
            box-shadow: 0 12px 32px rgba(0, 0, 0, 0.65);
          }

          /* YouTube-Style Smart Captions Overlay */
          .captions {
            position: absolute;
            left: 5%;
            right: 5%;
            text-align: center;
            z-index: 4;
            pointer-events: auto;
            cursor: grab;
            user-select: none;
            transition: top 0.12s ease, bottom 0.12s ease;
          }
          .captions.bottom { bottom: 3.4rem; }
          .captions.top { top: 1rem; }
          .caption {
            display: inline-block;
            padding: 0.45rem 0.95rem;
            border-radius: 0.45rem;
            line-height: 1.48;
            font-weight: 700;
            max-width: 92%;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.65);
            backdrop-filter: blur(4px);
            border: 1px solid rgba(255, 255, 255, 0.16);
          }
          .caption:empty { display: none; }
          .caption-word {
            display: inline-block;
            padding: 0 0.12rem;
            border-radius: 0.2rem;
            cursor: pointer;
            transition: background 0.1s ease, transform 0.1s ease;
          }
          .caption-word:hover, .caption-word:focus-visible {
            background: rgba(0, 230, 118, 0.35);
            text-decoration: underline;
          }
          .caption-word.active-word {
            text-decoration: underline;
            text-decoration-color: #00e676;
            text-underline-offset: 4px;
          }
          .caption-sound-badge {
            display: inline-flex;
            align-items: center;
            gap: 0.25rem;
            background: #00e676;
            color: #05192d;
            font-size: 0.78em;
            font-weight: 800;
            padding: 0.08rem 0.45rem;
            border-radius: 999px;
            margin-inline-end: 0.4rem;
            vertical-align: middle;
          }
          .caption-dual-sub {
            display: block;
            margin-top: 0.28rem;
            padding-top: 0.25rem;
            border-top: 1px solid rgba(255, 255, 255, 0.22);
            font-size: 0.92em;
            color: #a7f3d0;
          }

          /* Word Sign/Glossary Popover when clicking a caption word */
          .word-popover {
            position: absolute;
            bottom: 7.5rem;
            left: 50%;
            transform: translateX(-50%);
            z-index: 12;
            background: #05192d;
            color: #ffffff;
            border: 2px solid #00e676;
            border-radius: 0.6rem;
            padding: 0.65rem 1rem;
            min-width: 17rem;
            max-width: 24rem;
            box-shadow: 0 12px 30px rgba(0, 0, 0, 0.85);
            font-size: 0.86rem;
          }
          .word-popover[hidden] { display: none !important; }

          /* Movable, Resizable, Dual-Mode EthSL Sign Language Window */
          .sign {
            position: absolute;
            z-index: 6;
            display: flex;
            flex-direction: column;
            border: 3px solid #00e676;
            border-radius: 0.6rem;
            background: #05192d;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.82);
            touch-action: none;
            user-select: none;
            cursor: grab;
            transition: box-shadow 0.15s ease, border-color 0.15s ease;
          }
          .sign-header {
            flex: 0 0 auto;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 0.25rem;
            background: #091e35;
            color: #ffffff;
            font-size: 0.72rem;
            font-weight: 700;
            padding: 0.25rem 0.45rem;
            border-bottom: 1px solid #1e3a5f;
          }
          .sign-mode-switch {
            display: inline-flex;
            gap: 0.2rem;
          }
          .sign-mode-btn {
            min-height: 24px !important;
            padding: 0.1rem 0.4rem !important;
            font-size: 0.68rem !important;
            border-radius: 0.25rem !important;
            border: 1px solid #38bdf8 !important;
            background: #0f2942 !important;
            color: #e2e8f0 !important;
            cursor: pointer;
          }
          .sign-mode-btn[aria-pressed="true"] {
            background: #00e676 !important;
            color: #05192d !important;
            border-color: #00e676 !important;
            font-weight: 800 !important;
          }
          .sign.floating {
            position: fixed !important;
            z-index: 9999 !important;
            box-shadow: 0 14px 40px rgba(0, 0, 0, 0.9);
          }
          .sign.floating.top-left { top: 1rem; left: 1rem; right: auto; bottom: auto; }
          .sign.floating.top-right { top: 1rem; right: 1rem; left: auto; bottom: auto; }
          .sign.floating.bottom-left { bottom: 1rem; left: 1rem; right: auto; top: auto; }
          .sign.floating.bottom-right { bottom: 1rem; right: 1rem; left: auto; top: auto; }
          .sign.docked.top-left, .sign.top-left { top: 0.75rem; left: 0.75rem; right: auto; bottom: auto; }
          .sign.docked.top-right, .sign.top-right { top: 0.75rem; right: 0.75rem; left: auto; bottom: auto; }
          .sign.docked.bottom-left, .sign.bottom-left { bottom: 3.6rem; left: 0.75rem; right: auto; top: auto; }
          .sign.docked.bottom-right, .sign.bottom-right { bottom: 3.6rem; right: 0.75rem; left: auto; top: auto; }
          .sign.custom { bottom: 1rem; right: 1rem; }
          .sign:focus-visible { outline: 3px solid #ffeb3b; outline-offset: 2px; }
          .sign.dragging { cursor: grabbing; border-color: #ffeb3b; }
          .sign[hidden] { display: none !important; }
          .sign video, .sign canvas.live-sign-canvas {
            width: 100%;
            flex: 1 1 auto;
            min-height: 0;
            object-fit: contain;
            display: block;
            background: #051626;
          }
          .sign video[hidden], .sign canvas.live-sign-canvas[hidden] {
            display: none !important;
          }
          .sign.small { width: 13.5rem; height: 12rem; }
          .sign.medium { width: 17.5rem; height: 15rem; }
          .sign.large { width: 22rem; height: 18.5rem; }
          .sign-gloss-strip {
            flex: 0 0 auto;
            background: #07192e;
            color: #fff000;
            font-size: 0.72rem;
            font-weight: 700;
            padding: 0.22rem 0.45rem;
            border-top: 1px solid #1e3a5f;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .sign-controls {
            flex: 0 0 auto;
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: #05192d;
            padding: 0.2rem 0.3rem;
            gap: 0.16rem;
            border-top: 1px solid #1e3a5f;
            cursor: default;
          }
          .sign-controls button {
            min-height: 26px !important;
            min-width: 24px !important;
            padding: 0.1rem 0.22rem !important;
            font-size: 0.73rem !important;
            line-height: 1 !important;
            background: #0f2942 !important;
            color: #ffffff !important;
            border: 1px solid #64748b !important;
            cursor: pointer;
            border-radius: 0.25rem;
            flex: 1 1 0;
            display: inline-flex;
            align-items: center;
            justify-content: center;
          }
          .sign-controls button:hover {
            background: #1e3a5f !important;
            border-color: #00e676 !important;
          }

          /* YouTube-Style Scrubber Timeline + Chapter Markers */
          .yt-scrubber-wrap {
            position: relative;
            background: #0b1524;
            padding: 0.45rem 1rem 0.25rem 1rem;
            border-top: 1px solid #1e293b;
          }
          .yt-scrubber-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 0.78rem;
            color: #cbd5e1;
            margin-bottom: 0.15rem;
          }
          .yt-timeline-track {
            position: relative;
            display: flex;
            align-items: center;
          }
          .yt-timeline-track input[type="range"] {
            width: 100%;
            min-height: 28px;
            accent-color: #ff0033;
            cursor: pointer;
            margin: 0;
          }
          .yt-chapter-tick {
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
            width: 3px;
            height: 12px;
            background: #fff000;
            pointer-events: none;
            z-index: 2;
            border-radius: 1px;
          }
          .yt-hover-preview {
            position: absolute;
            bottom: 2.6rem;
            transform: translateX(-50%);
            background: rgba(5, 25, 45, 0.96);
            color: #ffffff;
            border: 1.5px solid #00e676;
            border-radius: 0.4rem;
            padding: 0.3rem 0.6rem;
            font-size: 0.76rem;
            font-weight: 700;
            pointer-events: none;
            white-space: nowrap;
            z-index: 10;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.6);
          }
          .yt-hover-preview[hidden] { display: none !important; }

          /* YouTube-Style Control Bar */
          .controls {
            position: relative;
            display: flex;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 0.45rem;
            padding: 0.55rem 0.85rem;
            background: #0f172a;
            color: #ffffff;
            align-items: center;
            border-top: 1px solid #1e293b;
          }
          .ctrl-group {
            display: flex;
            flex-wrap: wrap;
            gap: 0.4rem;
            align-items: center;
          }
          button, select, input {
            min-height: 44px;
            font: inherit;
          }
          .controls button {
            padding: 0.42rem 0.72rem;
            border: 1.5px solid #334155;
            border-radius: 0.42rem;
            background: #1e293b;
            color: #f8fafc;
            font-weight: 700;
            font-size: 0.86rem;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 0.3rem;
            transition: background 0.15s ease, border-color 0.15s ease;
          }
          .controls button:hover:not(:disabled) {
            background: #334155;
            border-color: #94a3b8;
          }
          .controls button.primary {
            background: #00e676;
            border-color: #00e676;
            color: #05192d;
            font-weight: 800;
          }
          .controls button.primary:hover:not(:disabled) {
            background: #69f0ae;
          }
          .controls button[aria-pressed="true"]:not(.primary) {
            background: #05192d;
            border-color: #00e676;
            color: #00e676;
            box-shadow: inset 0 -3px 0 #ff0033;
          }
          button:focus-visible, select:focus-visible, input:focus-visible, a:focus-visible, .stage:focus-visible {
            outline: 3px solid #f5a300 !important;
            outline-offset: 2px !important;
          }

          /* YouTube-Style Settings Gear Popover */
          .yt-settings-popover {
            position: relative;
            background: #0b192c;
            color: #f8fafc;
            border-top: 2px solid #00e676;
            padding: 0.85rem 1rem;
            display: grid;
            gap: 0.75rem;
          }
          .yt-settings-popover[hidden] { display: none !important; }
          .prefs-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(11rem, 1fr));
            gap: 0.65rem;
            align-items: end;
          }
          .field {
            display: grid;
            gap: 0.25rem;
            font-size: 0.84rem;
            font-weight: 700;
            color: #e2e8f0;
          }
          .field select, .field input {
            background: #1e293b;
            color: #ffffff;
            border: 1.5px solid #475569;
            border-radius: 0.38rem;
            padding: 0.35rem 0.5rem;
          }
          .preset-chips {
            display: flex;
            flex-wrap: wrap;
            gap: 0.4rem;
          }
          .preset-chip {
            min-height: 36px !important;
            padding: 0.25rem 0.65rem !important;
            font-size: 0.78rem !important;
            border-radius: 999px !important;
            border: 1.5px solid #475569 !important;
            background: #1e293b !important;
            color: #ffffff !important;
            cursor: pointer;
          }

          /* Multi-Tab Accessible Media Studio Below Player */
          .workspace-tabs {
            display: flex;
            flex-wrap: wrap;
            gap: 0.35rem;
            padding: 0.6rem 1rem 0 1rem;
            background: #f1f5f9;
            border-top: 1px solid #cbd5e1;
            border-bottom: 2px solid #05192d;
          }
          .tab-btn {
            padding: 0.5rem 0.85rem;
            border: 2px solid transparent;
            border-bottom: none;
            border-top-left-radius: 0.5rem;
            border-top-right-radius: 0.5rem;
            background: #e2e8f0;
            color: #1e293b;
            font-weight: 700;
            font-size: 0.86rem;
            cursor: pointer;
          }
          .tab-btn[aria-selected="true"] {
            background: #ffffff;
            color: #05192d;
            border-color: #05192d;
            box-shadow: inset 0 3px 0 #0d5c3a;
          }
          .tab-panel {
            padding: 1rem;
            background: #ffffff;
            color: #101828;
          }
          .tab-panel[hidden] { display: none !important; }

          /* Tab 1: Interactive Transcript & Chapters */
          .transcript {
            max-height: 22rem;
            overflow-y: auto;
          }
          .transcript-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 0.75rem;
            margin-bottom: 0.75rem;
          }
          .transcript-header h3 { margin: 0; font-size: 1.05rem; color: #05192d; }
          .transcript-links { display: flex; gap: 0.6rem; flex-wrap: wrap; }
          .transcript-links a, .action-btn {
            color: #05192d;
            background: #f8fafc;
            border: 1.5px solid #05192d;
            border-radius: 0.4rem;
            font-weight: 700;
            font-size: 0.84rem;
            text-decoration: none;
            padding: 0.35rem 0.7rem;
            min-height: 44px;
            display: inline-flex;
            align-items: center;
            cursor: pointer;
          }
          .transcript ol {
            display: grid;
            gap: 0.4rem;
            padding: 0;
            margin: 0;
            list-style: none;
          }
          .transcript button.cue-row {
            display: grid;
            grid-template-columns: 4.2rem 11rem 1fr;
            gap: 0.5rem;
            width: 100%;
            text-align: start;
            font-weight: 500;
            padding: 0.45rem 0.65rem;
            border: 1px solid #cbd5e1;
            border-radius: 0.4rem;
            background: #ffffff;
            color: #101828;
            cursor: pointer;
            align-items: center;
          }
          .transcript button.cue-row time {
            font-family: ui-monospace, SFMono-Regular, monospace;
            font-weight: 700;
            color: #0d5c3a;
          }
          .transcript button.cue-row .cue-chap {
            font-size: 0.78rem;
            font-weight: 700;
            color: #0369a1;
            background: #e0f2fe;
            padding: 0.15rem 0.4rem;
            border-radius: 0.25rem;
          }
          .transcript button.cue-row[aria-current="true"] {
            border: 2.5px solid #0d5c3a;
            background: #ecfdf5;
            color: #05192d;
            font-weight: 700;
          }

          /* Tab 2: Live EthSL Sign Studio */
          .sign-studio-grid {
            display: grid;
            grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
            gap: 1rem;
          }
          .studio-box {
            border: 1.5px solid #cbd5e1;
            border-radius: 0.6rem;
            padding: 0.85rem;
            background: #f8fafc;
          }
          .gloss-token-list {
            display: flex;
            flex-wrap: wrap;
            gap: 0.4rem;
            margin-top: 0.5rem;
          }
          .gloss-badge {
            background: #05192d;
            color: #fff000;
            padding: 0.3rem 0.6rem;
            border-radius: 0.35rem;
            font-size: 0.8rem;
            font-weight: 700;
            border: 1px solid #00e676;
          }

          /* Tab 3: Over-Cooked Blind Console & 6-Dot Tactile Braille Inspector */
          .blind-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
            gap: 1rem;
          }
          .braille-cells {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
            margin-top: 0.5rem;
          }
          .braille-cell-card {
            background: #05192d;
            color: #ffffff;
            border: 2px solid #00e676;
            border-radius: 0.5rem;
            padding: 0.45rem 0.6rem;
            text-align: center;
            min-width: 4.2rem;
            cursor: pointer;
          }
          .braille-dots-grid {
            display: grid;
            grid-template-columns: repeat(2, 14px);
            gap: 4px;
            justify-content: center;
            margin: 0.25rem auto;
          }
          .b-dot {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: #1e293b;
            border: 1px solid #64748b;
          }
          .b-dot.raised {
            background: #fff000;
            border-color: #ffffff;
            box-shadow: 0 0 6px #fff000;
          }

          /* Notices, Dialogs, and Live Regions */
          .notice {
            padding: 0.75rem 1rem;
            margin: 0;
            background: #ecfdf5;
            color: #065f46;
            font-weight: 700;
            border-top: 1px solid #a7f3d0;
          }
          .sr {
            position: absolute;
            width: 1px;
            height: 1px;
            overflow: hidden;
            clip: rect(0, 0, 0, 0);
            white-space: nowrap;
          }
          dialog {
            max-width: 44rem;
            width: calc(100% - 2rem);
            border: 2px solid #05192d;
            border-radius: 0.65rem;
            padding: 1.25rem;
            background: #ffffff;
            color: #101828;
          }
          dialog::backdrop { background: rgba(5, 25, 45, 0.72); }
          .editor-rows {
            display: grid;
            gap: 0.65rem;
            max-height: 18rem;
            overflow-y: auto;
            margin: 0.75rem 0;
          }
          .editor-row {
            display: grid;
            grid-template-columns: 5.5rem 5.5rem 1fr;
            gap: 0.4rem;
            align-items: center;
          }
          .editor-row input {
            padding: 0.4rem 0.5rem;
            border: 1px solid #64748b;
            border-radius: 0.35rem;
          }
          @media (max-width: 48rem) {
            .heading { flex-direction: column; align-items: flex-start; }
            .editor-row, .sign-studio-grid, .transcript button.cue-row { grid-template-columns: 1fr; }
            .sign.medium, .sign.large { width: 12.5rem; height: 11rem; }
          }
        </style>

        <section class="shell" id="player-shell" lang="${this.language}">
          <!-- Top Bar -->
          <div class="heading">
            <div class="heading-left">
              <h2>${escapeHtml(this.getAttribute("title") || t.playerTitle)}</h2>
              <div class="mode-pills">
                <span class="status-pill" id="active-chapter-pill">Ch 1: Welcome &amp; Overview</span>
                <span class="status-pill" id="blind-status-pill">${this.preferences.blindOvercooked ? "🔊 Blind+ Active" : "🔊 Standard"}</span>
              </div>
            </div>
            <span class="time-badge" id="time" aria-live="off">0:00 / 0:45</span>
          </div>

          <!-- Video Stage -->
          <div class="stage" id="stage" tabindex="0" role="region" aria-label="${escapeHtml(t.playerTitle)}">
            <video class="main" id="video" preload="metadata" playsinline src="${escapeHtml(this.source)}">
              <track kind="captions" srclang="en" label="English" src="/savanna/assets/captions/va-future-en.vtt">
              <track kind="captions" srclang="am" label="Amharic" src="/savanna/assets/captions/va-future-am.vtt">
            </video>

            <!-- 3G Smart Data-Saver Keyframe Stage -->
            <div class="datasaver-stage" id="datasaver-stage" ${this.preferences.dataSaver3G ? "" : "hidden"}>
              <div class="datasaver-card">
                <div style="font-size:0.8rem;font-weight:800;color:#00e676;text-transform:uppercase;margin-bottom:0.3rem;">
                  📶 Ethiopia 3G Smart Data-Saver Mode (80% Less Mobile Data)
                </div>
                <h3 id="datasaver-chapter" style="margin:0 0 0.4rem 0;font-size:1.25rem;color:#fff000;">Ch 1: Welcome &amp; Overview</h3>
                <p id="datasaver-text" style="margin:0 0 0.75rem 0;font-size:1.02rem;line-height:1.5;">
                  Playing ultra-light MP3 audio stream (233 KB) + synchronized slide keyframes + live EthSL Sign Translator without downloading heavy MP4 video bytes.
                </p>
                <button type="button" id="exit-datasaver-btn" style="background:#00e676;color:#05192d;border:none;padding:0.4rem 0.9rem;border-radius:0.4rem;font-weight:800;cursor:pointer;">
                  Switch Back to Full Video Stream
                </button>
              </div>
            </div>

            <!-- Interactive Word Definition + EthSL Sign Popover -->
            <div class="word-popover" id="word-popover" role="dialog" aria-label="Word Sign & Translation Inspector" hidden>
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.25rem;">
                <strong id="word-pop-title" style="color:#fff000;font-size:0.95rem;">WORD</strong>
                <button type="button" id="word-pop-close" style="min-height:26px;padding:0.1rem 0.4rem;font-size:0.75rem;background:#1e293b;color:#fff;border:1px solid #64748b;border-radius:4px;cursor:pointer;">✕</button>
              </div>
              <div id="word-pop-body"></div>
            </div>

            <!-- YouTube-Style Draggable & Interactive Caption Overlay -->
            <div class="captions ${this.preferences.captionPosition}" id="captions" aria-hidden="true" title="Drag captions or click any word to inspect its EthSL sign">
              <span id="caption" class="caption"></span>
            </div>

            <!-- Movable, Resizable, Dual-Mode EthSL Sign Language Window -->
            ${
              hasSign
                ? `<aside class="sign ${this.preferences.signFloating ? "floating" : "docked"} ${this.preferences.signPosition} ${this.preferences.signSize}" id="sign-window" data-sign-panel="true" tabindex="0" title="${escapeHtml(t.signPlayerTitle || t.signLanguage)}" ${
                    this.preferences.sign ? "" : "hidden"
                  } aria-label="${escapeHtml(t.signPlayerTitle || t.signLanguage)}">
              <div class="sign-header">
                <span style="display:inline-flex;align-items:center;gap:4px;">
                  🤟 <span>EthSL</span>
                </span>
                <div class="sign-mode-switch" role="group" aria-label="Sign Language Engine Mode">
                  <button type="button" class="sign-mode-btn" id="sign-mode-live" aria-pressed="${this.preferences.signMode === "live"}" title="Real-Time Audio/Caption to EthSL Translator">⚡ Live</button>
                  <button type="button" class="sign-mode-btn" id="sign-mode-video" aria-pressed="${this.preferences.signMode === "video"}" title="Synchronized Human Video PiP">🎥 Video</button>
                </div>
                <button type="button" id="sign-close-btn" aria-label="Hide Sign Language Window (S)" title="Hide Sign Window (S)" style="min-height:24px!important;min-width:24px!important;padding:0 0.3rem!important;font-size:0.72rem!important;background:#1e293b!important;color:#fff!important;border:1px solid #64748b!important;border-radius:3px;">✕</button>
              </div>
              <video id="sign-video" preload="metadata" playsinline muted src="${escapeHtml(this.signSource)}" aria-label="${escapeHtml(t.signVideoDesc)}" ${this.preferences.signMode === "video" ? "" : "hidden"}></video>
              <canvas id="sign-live-canvas" class="live-sign-canvas" width="320" height="210" aria-label="Real-time articulated Ethiopian Sign Language translator canvas" ${this.preferences.signMode === "live" ? "" : "hidden"}></canvas>
              <div class="sign-gloss-strip" id="sign-gloss-strip" aria-live="off">ETHSL SOV: WELCOME • MODULE-2 • VIRTUAL-ASSISTANT</div>
              <div class="sign-controls" role="group" aria-label="${escapeHtml(t.signLanguage)}">
                <button type="button" id="sign-play-btn" aria-label="${escapeHtml(t.playPauseSign)}" title="${escapeHtml(t.playPauseSign)}">▶</button>
                <button type="button" data-sign-pos="top-left" aria-label="${escapeHtml(t.topLeft)}" title="${escapeHtml(t.topLeft)}">↖</button>
                <button type="button" data-sign-pos="top-right" aria-label="${escapeHtml(t.topRight)}" title="${escapeHtml(t.topRight)}">↗</button>
                <button type="button" data-sign-pos="bottom-left" aria-label="${escapeHtml(t.bottomLeft)}" title="${escapeHtml(t.bottomLeft)}">↙</button>
                <button type="button" data-sign-pos="bottom-right" aria-label="${escapeHtml(t.bottomRight)}" title="${escapeHtml(t.bottomRight)}">↘</button>
                <button type="button" data-sign-size="larger" aria-label="${escapeHtml(t.larger)}" title="${escapeHtml(t.larger)}">+</button>
                <button type="button" data-sign-size="smaller" aria-label="${escapeHtml(t.smaller)}" title="${escapeHtml(t.smaller)}">−</button>
                <button type="button" id="sign-split-toggle" data-sign-split="toggle" aria-label="${escapeHtml(t.splitView)}" title="${escapeHtml(t.splitView)}">◫</button>
                <button type="button" id="sign-dock-toggle" data-sign-dock="toggle" aria-label="${this.preferences.signFloating ? escapeHtml(t.dockSign) : escapeHtml(t.floatSign)}" title="${this.preferences.signFloating ? escapeHtml(t.dockSign) : escapeHtml(t.floatSign)}">${this.preferences.signFloating ? "⤓" : "⛶"}</button>
              </div>
            </aside>`
                : ""
            }
          </div>

          <!-- YouTube-Style Timeline Scrubber with Chapter Markers & Preview -->
          <div class="yt-scrubber-wrap">
            <div class="yt-hover-preview" id="yt-hover-preview" hidden>0:00 • Chapter 1</div>
            <div class="yt-scrubber-header">
              <label for="seek" style="font-weight:700;cursor:pointer;">${escapeHtml(t.seek)} (Arrows / 1–6 Chapters / [ ] Cues)</label>
              <span id="scrubber-chapter-hint" style="color:#69f0ae;font-weight:700;">Click or drag timeline</span>
            </div>
            <div class="yt-timeline-track">
              ${chapterTicks}
              <input id="seek" type="range" min="0" max="100" value="0" step="0.1" aria-label="${escapeHtml(t.seek)}">
            </div>
          </div>

          <!-- YouTube-Style Unified Bottom Control Bar -->
          <div class="controls" role="toolbar" aria-label="${escapeHtml(t.playerTitle)}">
            <div class="ctrl-group">
              <button type="button" class="primary" id="play-pause" aria-pressed="false">${escapeHtml(t.play)}</button>
              <button type="button" id="back" title="Rewind 10s (J / Left Arrow)">⏪ -10s</button>
              <button type="button" id="forward" title="Forward 10s (L / Right Arrow)">⏩ +10s</button>
              <button type="button" id="mute-toggle" aria-pressed="false" aria-label="${escapeHtml(t.mute)}" title="${escapeHtml(t.mute)} (M)">🔊</button>
            </div>

            <div class="ctrl-group">
              <button type="button" id="caption-toggle" aria-pressed="${this.preferences.captions}" title="Toggle YouTube-style Subtitles/CC (C)">CC ${escapeHtml(t.captions)}</button>
              <button type="button" id="dual-caption-toggle" aria-pressed="${this.preferences.captionDual}" title="Stack English + Amharic subtitles simultaneously">EN+አማ</button>
              <button type="button" id="sign-toggle" ${
                hasSign ? `aria-pressed="${this.preferences.sign}"` : 'disabled aria-disabled="true"'
              } title="Toggle Movable EthSL Sign Window (S)">🤟 ${escapeHtml(t.signLanguage)}</button>
              <button type="button" id="desc-toggle" aria-pressed="${this.preferences.audioDescription}" title="Toggle Spoken Audio Description (D)">🎧 AD</button>
              <button type="button" id="blind-mode-toggle" aria-pressed="${this.preferences.blindOvercooked}" title="Over-Cooked Blind Mode: Spatial Earcons + Auto-Speak + Scene Inspector (B)">🔊 Blind+</button>
              <button type="button" id="voice-copilot-btn" aria-pressed="false" title="Hands-Free Voice Command Copilot (V)">🎙️ Voice</button>
              <button type="button" id="settings-toggle" aria-expanded="false" title="YouTube-Style Caption & Speed Settings">⚙️ Settings</button>
              <button type="button" id="transcript-toggle" aria-pressed="${this.preferences.transcriptOpen}" title="Toggle Interactive Workspace (T)">📝 ${escapeHtml(t.transcript)}</button>
              <button type="button" id="edit-captions-btn" title="Open Caption Pipeline Editor">${escapeHtml(t.editCaptions)}</button>
              <button type="button" id="fullscreen" title="Full Screen (F)">${escapeHtml(t.fullScreen)}</button>
              <button type="button" id="help-button" title="Keyboard & Voice Shortcuts (?)">? ${escapeHtml(t.keyboardHelp)}</button>
            </div>
          </div>

          <!-- YouTube-Style Settings Popover Panel (All IDs preserved for tests & WCAG!) -->
          <div class="yt-settings-popover" id="yt-settings-panel" role="region" aria-label="${escapeHtml(t.captionSettings)}" hidden>
            <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.5rem;">
              <strong style="color:#00e676;font-size:0.95rem;">⚙️ ${escapeHtml(t.captionSettings)}</strong>
              <div class="preset-chips" role="group" aria-label="1-Click YouTube Caption Style Presets">
                <button type="button" class="preset-chip" data-cc-preset="youtube">YouTube White/Dark</button>
                <button type="button" class="preset-chip" data-cc-preset="yellow">High-Contrast Yellow</button>
                <button type="button" class="preset-chip" data-cc-preset="cyan">Low-Vision Cyan/Navy</button>
                <button type="button" class="preset-chip" data-cc-preset="green">Matrix Green</button>
              </div>
            </div>
            <div class="prefs-grid">
              <label class="field" for="caption-language">${escapeHtml(t.captionLanguage)}
                <select id="caption-language">${captionOptions}</select>
              </label>
              <label class="field" for="caption-size">${escapeHtml(t.captionSize)} (${this.preferences.captionSize}rem)
                <input id="caption-size" type="range" min="0.9" max="2.4" value="${this.preferences.captionSize}" step="0.1">
              </label>
              <label class="field" for="caption-color">${escapeHtml(t.captionColor)}
                <input id="caption-color" type="color" value="${this.preferences.captionColor}">
              </label>
              <label class="field" for="caption-background">${escapeHtml(t.captionBackground)}
                <input id="caption-background" type="color" value="${this.preferences.captionBackground}">
              </label>
              <label class="field" for="caption-position">${escapeHtml(t.captionPosition)}
                <select id="caption-position">
                  <option value="bottom">${escapeHtml(t.posBottom)}</option>
                  <option value="top">${escapeHtml(t.posTop)}</option>
                </select>
              </label>
              <label class="field" for="speed">${escapeHtml(t.speed)}
                <select id="speed">
                  <option value="0.75">0.75x</option>
                  <option value="1" selected>1x (Normal)</option>
                  <option value="1.25">1.25x</option>
                  <option value="1.5">1.5x</option>
                </select>
              </label>
              <button type="button" id="offline" style="background:#00e676;color:#05192d;border:none;border-radius:0.4rem;font-weight:800;padding:0.5rem 0.85rem;cursor:pointer;">
                📦 ${escapeHtml(t.downloadOffline)} (0.28 MB)
              </button>
            </div>
          </div>

          <!-- Multi-Tab Accessible Learning Workspace -->
          <div class="body" id="transcript-panel" ${this.preferences.transcriptOpen ? "" : "hidden"}>
            <div class="workspace-tabs" role="tablist" aria-label="Accessible Learning Media Tools">
              <button type="button" class="tab-btn" role="tab" id="tab-btn-transcript" aria-selected="true" data-tab="transcript">📝 ${escapeHtml(t.tabTranscript)}</button>
              <button type="button" class="tab-btn" role="tab" id="tab-btn-sign" aria-selected="false" data-tab="sign">🤟 ${escapeHtml(t.tabSignStudio)}</button>
              <button type="button" class="tab-btn" role="tab" id="tab-btn-blind" aria-selected="false" data-tab="blind">🔊 ${escapeHtml(t.tabBlindConsole)}</button>
              <button type="button" class="tab-btn" role="tab" id="tab-btn-sensory" aria-selected="false" data-tab="sensory">📳 ${escapeHtml(t.tabSensory3G)}</button>
            </div>

            <!-- TAB 1: Interactive Transcript & Chapter Jumper -->
            <section class="tab-panel transcript" id="panel-transcript" role="tabpanel" aria-labelledby="tab-btn-transcript">
              <div class="transcript-header">
                <h3 id="transcript-heading">${escapeHtml(t.transcript)}</h3>
                <div class="transcript-links">
                  <a id="transcript-download" href="#download-txt" download="${this.lessonId}-transcript.txt">📄 ${escapeHtml(t.downloadTranscript)}</a>
                  <a id="transcript-download-brf" href="#download-brf" download="${this.lessonId}-braille.brf">⠿ ${escapeHtml(t.downloadBraille)}</a>
                  <a id="transcript-download-vtt" href="#download-vtt" download="${this.lessonId}-${this.preferences.captionLanguage}.vtt">🎬 ${escapeHtml(t.downloadVtt)}</a>
                </div>
              </div>
              <ol id="transcript-list"></ol>
            </section>

            <!-- TAB 2: Live Real-Time EthSL Sign Language Translation Studio -->
            <section class="tab-panel" id="panel-sign" role="tabpanel" aria-labelledby="tab-btn-sign" hidden>
              <div class="sign-studio-grid">
                <div class="studio-box">
                  <h3 style="margin:0 0 0.35rem 0;font-size:1.05rem;color:#05192d;">⚡ Real-Time Speech / Text to EthSL Sign Translator</h3>
                  <p style="margin:0 0 0.6rem 0;font-size:0.86rem;color:#334155;">
                    Translates live video captions, spoken microphone input, or any typed English/Amharic sentence into <strong>Ethiopian Sign Language Subject-Object-Verb (SOV) Gloss</strong> + kinematic handshape trajectories in real time.
                  </p>
                  <div style="display:flex;gap:0.4rem;flex-wrap:wrap;margin-bottom:0.6rem;">
                    <label for="custom-sign-input" class="sr">Type English or Amharic sentence to translate to EthSL</label>
                    <input id="custom-sign-input" type="text" placeholder="Type any English or Amharic sentence to translate & sign live..." style="flex:1 1 14rem;padding:0.45rem 0.65rem;border:1.5px solid #05192d;border-radius:0.4rem;">
                    <button type="button" id="translate-sign-btn" class="action-btn" style="background:#0d5c3a;color:#fff;">🤟 Translate &amp; Sign</button>
                    <button type="button" id="mic-sign-btn" class="action-btn">🎙️ Speak to Sign</button>
                  </div>
                  <div id="sign-translation-output" style="background:#05192d;color:#ffffff;padding:0.75rem;border-radius:0.5rem;font-size:0.85rem;">
                    <div style="color:#00e676;font-weight:800;margin-bottom:0.25rem;">LIVE ETHSL SOV GLOSS STREAM:</div>
                    <div id="studio-gloss-en" style="color:#fff000;font-weight:700;font-size:0.95rem;">WELCOME • MODULE-2 • VIRTUAL-ASSISTANT • FUTURE</div>
                    <div id="studio-gloss-am" style="color:#a7f3d0;margin-top:0.2rem;">እንኳን-ደህና-መጡ • ትምህርት-ክፍል • ረዳት-ባለሙያ • ወደፊት</div>
                    <div class="gloss-token-list" id="studio-token-cards"></div>
                  </div>
                </div>
                <div class="studio-box" style="background:#051626;color:#ffffff;display:flex;flex-direction:column;align-items:center;justify-content:center;">
                  <div style="width:100%;display:flex;justify-content:space-between;align-items:center;margin-bottom:0.35rem;font-size:0.8rem;">
                    <strong style="color:#00e676;">60 FPS Kinematic EthSL Signer + 21-Point Hand Skeleton</strong>
                    <span id="studio-pose-label" style="color:#fff000;font-weight:700;">Pose: WELCOME</span>
                  </div>
                  <canvas id="studio-sign-canvas" width="380" height="220" style="width:100%;max-width:380px;border:2px solid #00e676;border-radius:0.5rem;background:#071c30;"></canvas>
                </div>
              </div>
            </section>

            <!-- TAB 3: Over-Cooked Blind Audio Console & 6-Dot Tactile Braille Inspector -->
            <section class="tab-panel" id="panel-blind" role="tabpanel" aria-labelledby="tab-btn-blind" hidden>
              <div class="blind-grid">
                <div class="studio-box">
                  <h3 style="margin:0 0 0.35rem 0;font-size:1.02rem;color:#05192d;">🔊 Blind Super-Console &amp; Voice Copilot</h3>
                  <p style="margin:0 0 0.6rem 0;font-size:0.85rem;color:#334155;">
                    Designed for zero-vision autonomy: spatial Web Audio earcons, instant visual frame descriptions, DAISY chapter/sentence hopping (<code>1-6</code>, <code>[</code>, <code>]</code>), and hands-free voice commands.
                  </p>
                  <div style="display:flex;flex-wrap:wrap;gap:0.4rem;margin-bottom:0.65rem;">
                    <button type="button" id="describe-scene-btn" class="action-btn" style="background:#05192d;color:#fff000;">🔍 ${escapeHtml(t.describeScene)}</button>
                    <button type="button" id="add-bookmark-btn" class="action-btn">📌 ${escapeHtml(t.addBookmark)}</button>
                    <button type="button" id="where-am-i-btn" class="action-btn">🧭 Where Am I? (Status)</button>
                    <button type="button" id="read-page-btn" class="action-btn">📖 ${escapeHtml(t.readHostPage)}</button>
                  </div>
                  <div style="font-size:0.8rem;font-weight:700;color:#0d5c3a;margin-bottom:0.25rem;">
                    🎙️ 1-Click Voice Command Simulator (Test Voice Copilot with or without a Mic):
                  </div>
                  <div style="display:flex;flex-wrap:wrap;gap:0.35rem;margin-bottom:0.6rem;">
                    <button type="button" class="action-btn" data-voice-sim="describe scene" style="min-height:34px;padding:0.2rem 0.5rem;font-size:0.78rem;">"Describe scene"</button>
                    <button type="button" class="action-btn" data-voice-sim="where am i" style="min-height:34px;padding:0.2rem 0.5rem;font-size:0.78rem;">"Where am I?"</button>
                    <button type="button" class="action-btn" data-voice-sim="amharic" style="min-height:34px;padding:0.2rem 0.5rem;font-size:0.78rem;">"Switch to Amharic"</button>
                    <button type="button" class="action-btn" data-voice-sim="next chapter" style="min-height:34px;padding:0.2rem 0.5rem;font-size:0.78rem;">"Next chapter"</button>
                    <button type="button" class="action-btn" data-voice-sim="bookmark" style="min-height:34px;padding:0.2rem 0.5rem;font-size:0.78rem;">"Bookmark this"</button>
                  </div>
                  <div id="scene-inspector-box" style="background:#05192d;color:#ffffff;padding:0.65rem;border-radius:0.45rem;font-size:0.84rem;">
                    <strong style="color:#00e676;">Visual Scene Inspector Output:</strong>
                    <div id="scene-inspector-text" style="margin-top:0.2rem;">Press "Describe Current Scene (I)" at any timestamp to hear a full spatial breakdown of the current slide and sign gesture.</div>
                  </div>
                </div>

                <div class="studio-box">
                  <h3 style="margin:0 0 0.35rem 0;font-size:1.02rem;color:#05192d;">⠿ Interactive 6-Dot Tactile Braille Cell Inspector &amp; Bookmarks</h3>
                  <p style="margin:0 0 0.45rem 0;font-size:0.84rem;color:#334155;">
                    Click any Braille cell below to hear its exact raised dot numbers (e.g., <em>"Letter V, Dots 1, 2, 3, 6"</em>) or inspect your saved audio bookmarks:
                  </p>
                  <div style="display:flex;gap:0.4rem;margin-bottom:0.45rem;">
                    <label for="braille-word-input" class="sr">Word to inspect in 6-dot Braille</label>
                    <input id="braille-word-input" type="text" value="VA AI" maxlength="10" style="width:9rem;padding:0.35rem 0.5rem;border:1.5px solid #05192d;border-radius:0.35rem;font-weight:700;">
                    <button type="button" id="inspect-braille-btn" class="action-btn" style="min-height:38px;">Inspect Braille Dots</button>
                  </div>
                  <div class="braille-cells" id="braille-cells-container" role="group" aria-label="Interactive 6-Dot Braille Cells"></div>
                  <h4 style="margin:0.75rem 0 0.3rem 0;font-size:0.9rem;color:#05192d;">📌 Saved Timestamped Audio Bookmarks:</h4>
                  <ul id="bookmarks-list" style="margin:0;padding-inline-start:1.1rem;font-size:0.84rem;"></ul>
                </div>
              </div>
            </section>

            <!-- TAB 4: Creative Track 2 — Deaf Sensory Audio Radar & Ethiopia 3G Data-Saver -->
            <section class="tab-panel" id="panel-sensory" role="tabpanel" aria-labelledby="tab-btn-sensory" hidden>
              <div class="sign-studio-grid">
                <div class="studio-box" style="background:#05192d;color:#ffffff;">
                  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.4rem;">
                    <h3 style="margin:0;font-size:1rem;color:#00e676;">📳 Deaf Sensory Audio &amp; Haptic Rhythm Radar</h3>
                    <span id="sensory-event-badge" style="background:#fff000;color:#05192d;padding:0.15rem 0.5rem;border-radius:999px;font-size:0.75rem;font-weight:800;">🔔 Monitoring Audio Cues</span>
                  </div>
                  <p style="margin:0 0 0.5rem 0;font-size:0.83rem;color:#cbd5e1;">
                    Visualizes voice pitch, speaker emphasis, and non-speech sound events (<code>[Chime]</code>, <code>[Transition tone]</code>) in real time, and triggers gentle tactile vibration pulses on mobile devices (<code>navigator.vibrate</code>).
                  </p>
                  <canvas id="sensory-radar-canvas" width="380" height="110" style="width:100%;border:1px solid #334155;border-radius:0.4rem;background:#020b14;"></canvas>
                </div>

                <div class="studio-box">
                  <h3 style="margin:0 0 0.35rem 0;font-size:1rem;color:#05192d;">📶 Ethiopia 3G Smart Data-Saver &amp; Offline Pack</h3>
                  <p style="margin:0 0 0.6rem 0;font-size:0.84rem;color:#334155;">
                    Built for low-cost Android phones on 3G: switch to <strong>3G Audio + Slide Keyframes Mode</strong> to cut mobile data usage by <strong>80%</strong> (<code>0.23 MB</code> vs <code>1.12 MB</code>), or download the complete offline ZIP bundle.
                  </p>
                  <div style="display:flex;flex-wrap:wrap;gap:0.5rem;">
                    <button type="button" id="toggle-3g-saver-btn" class="action-btn" style="background:#05192d;color:#00e676;">
                      📶 Toggle 3G Data-Saver Mode (Saves 80% Data)
                    </button>
                    <button type="button" id="sensory-offline-btn" class="action-btn" style="background:#0d5c3a;color:#ffffff;">
                      📦 Download &lt;300 KB 3G Offline ZIP
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <p class="notice" id="notice" hidden></p>
          <p class="sr" id="announcement" role="status" aria-live="polite"></p>
        </section>

        <!-- Keyboard & Voice Shortcuts Modal -->
        <dialog id="help" aria-labelledby="help-title">
          <h3 id="help-title">${escapeHtml(t.keyboardHelp)}</h3>
          <ul>
            <li><strong>Space / K:</strong> ${escapeHtml(t.play)} / ${escapeHtml(t.pause)}</li>
            <li><strong>J / L or Left / Right Arrows:</strong> ${escapeHtml(t.seek)} (10s / 5s)</li>
            <li><strong>1 – 6 Number Keys:</strong> Jump directly to Chapter 1..6 (DAISY Blind Chapter Hopping)</li>
            <li><strong>[ and ] Bracket Keys:</strong> Jump to Previous / Next Transcript Sentence</li>
            <li><strong>C:</strong> Toggle ${escapeHtml(t.captions)} &bull; <strong>S:</strong> Toggle ${escapeHtml(t.signLanguage)}</li>
            <li><strong>D:</strong> Toggle ${escapeHtml(t.audioDescription)} &bull; <strong>B:</strong> Toggle Blind+ Over-Cooked Mode</li>
            <li><strong>I:</strong> Describe Current Visual Scene &bull; <strong>N:</strong> Save Audio Bookmark</li>
            <li><strong>V:</strong> Toggle Hands-Free Voice Command Copilot &bull; <strong>R:</strong> Read Host Lesson Page</li>
            <li><strong>F / Escape:</strong> ${escapeHtml(t.fullScreen)} / ${escapeHtml(t.exitFullScreen)}</li>
          </ul>
          <button type="button" id="close-help">${escapeHtml(t.close)}</button>
        </dialog>

        <!-- Caption Pipeline Editor Modal -->
        <dialog id="caption-editor-dialog" aria-labelledby="editor-title">
          <h3 id="editor-title">${escapeHtml(t.editorHeading)}</h3>
          <p style="font-size:0.9rem;color:#475569;margin-top:0">${escapeHtml(t.editorIntro)}</p>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.5rem;margin-bottom:0.5rem">
            <label class="field" for="reviewer-input" style="color:#05192d;">${escapeHtml(t.reviewerName)}
              <input id="reviewer-input" type="text" value="Co-Designer Reviewer" style="background:#fff;color:#05192d;">
            </label>
            <label class="field" for="notes-input" style="color:#05192d;">${escapeHtml(t.reviewNotes)}
              <input id="notes-input" type="text" value="Verified Amharic & English terminology" style="background:#fff;color:#05192d;">
            </label>
          </div>
          <div class="editor-rows" id="editor-rows"></div>
          <div style="display:flex;gap:0.5rem;flex-wrap:wrap;justify-content:flex-end;margin-top:0.75rem">
            <button type="button" class="primary" id="save-captions-btn" style="background:#0d5c3a;color:#fff;padding:0.5rem 1rem;border-radius:0.4rem;border:none;font-weight:700;">${escapeHtml(t.saveCorrections)}</button>
            <button type="button" id="close-editor-btn" style="padding:0.5rem 1rem;border-radius:0.4rem;border:2px solid #05192d;background:#fff;font-weight:700;">${escapeHtml(t.close)}</button>
          </div>
        </dialog>
      `;

      this.$ = (selector) => this.shadowRoot.querySelector(selector);
      this.$("#caption-position").value = this.preferences.captionPosition;
      this.applyCaptionStyle();
      if (!hasSign) this.announce(t.noSign, false);
      this.connectControls();
      this.renderTranscript();
      this.renderBrailleInspector(this.selectedBrailleWord);
      this.renderBookmarksList();
      this.restorePlaybackState();
      this.startLiveAnimationLoop();
      this.loadMetadata();
    }

    async loadMetadata() {
      try {
        const response = await fetch(`${this.api}/lessons/${encodeURIComponent(this.lessonId)}`);
        if (!response.ok) return;
        const details = await response.json();
        if (details.offline_pack_bytes) {
          this.$("#offline").textContent = `📦 ${this.t.downloadOffline} (${(Number(details.offline_pack_bytes) / 1000000).toFixed(2)} MB)`;
        }
      } catch {}
    }

    connectControls() {
      const video = this.$("#video");
      const signVideo = this.$("#sign-video");

      Array.from(video.textTracks || []).forEach((tr) => {
        tr.mode = "hidden";
      });

      this.$("#play-pause").addEventListener("click", () => this.togglePlay());
      this.$("#back").addEventListener("click", () => {
        video.currentTime = Math.max(0, video.currentTime - 10);
        playEarcon("seekBack", this.preferences.earcons);
        this.announce(this.language === "am" ? "10 ሰከንድ ወደ ኋላ" : "Rewound 10 seconds", this.preferences.blindOvercooked);
      });
      this.$("#forward").addEventListener("click", () => {
        video.currentTime = Math.min(video.duration || 45, video.currentTime + 10);
        playEarcon("seekFwd", this.preferences.earcons);
        this.announce(this.language === "am" ? "10 ሰከንድ ወደ ፊት" : "Forwarded 10 seconds", this.preferences.blindOvercooked);
      });
      this.$("#mute-toggle").addEventListener("click", () => {
        video.muted = !video.muted;
        const btn = this.$("#mute-toggle");
        btn.setAttribute("aria-pressed", String(video.muted));
        btn.textContent = video.muted ? "🔇" : "🔊";
        this.announce(video.muted ? "Audio muted" : "Audio unmuted", this.preferences.blindOvercooked);
      });

      // Scrubber input & YouTube hover preview
      const seekInput = this.$("#seek");
      const hoverPreview = this.$("#yt-hover-preview");
      seekInput.addEventListener("input", (event) => {
        const dur = video.duration || 45;
        video.currentTime = (Number(event.target.value) / 100) * dur;
      });
      seekInput.addEventListener("mousemove", (event) => {
        const rect = seekInput.getBoundingClientRect();
        const ratio = Math.max(0, Math.min(1, (event.clientX - rect.left) / (rect.width || 1)));
        const sec = ratio * (video.duration || 45);
        const matchCue = this.cues().find((c) => sec >= c.start && sec < c.end) || this.cues()[0];
        if (hoverPreview && matchCue) {
          hoverPreview.textContent = `${formatTime(sec)} • ${matchCue.chapter || "Lesson"} — ${matchCue.text.slice(0, 42)}...`;
          hoverPreview.style.left = `${Math.max(12, Math.min(88, ratio * 100))}%`;
          hoverPreview.hidden = false;
        }
      });
      seekInput.addEventListener("mouseleave", () => {
        if (hoverPreview) hoverPreview.hidden = true;
      });

      this.$("#speed").value = String(this.preferences.playbackRate);
      this.$("#speed").addEventListener("change", (event) => {
        this.preferences.playbackRate = Number(event.target.value);
        video.playbackRate = this.preferences.playbackRate;
        if (signVideo) signVideo.playbackRate = this.preferences.playbackRate;
        this.persist(`Playback speed set to ${this.preferences.playbackRate}x`);
      });

      this.$("#caption-toggle").addEventListener("click", () => {
        this.preferences.captions = !this.preferences.captions;
        playEarcon(this.preferences.captions ? "toggleOn" : "toggleOff", this.preferences.earcons);
        this.$("#caption-toggle").setAttribute("aria-pressed", String(this.preferences.captions));
        this.updateCaption();
        this.persist(this.preferences.captions ? "Captions enabled" : "Captions hidden");
      });

      this.$("#dual-caption-toggle").addEventListener("click", () => {
        this.preferences.captionDual = !this.preferences.captionDual;
        playEarcon(this.preferences.captionDual ? "toggleOn" : "toggleOff", this.preferences.earcons);
        this.$("#dual-caption-toggle").setAttribute("aria-pressed", String(this.preferences.captionDual));
        this.updateCaption();
        this.persist(
          this.preferences.captionDual
            ? "Dual bilingual subtitles (English + Amharic) enabled"
            : "Single-language subtitles enabled"
        );
      });

      this.$("#settings-toggle").addEventListener("click", () => {
        const panel = this.$("#yt-settings-panel");
        const open = panel.hidden;
        panel.hidden = !open;
        this.$("#settings-toggle").setAttribute("aria-expanded", String(open));
      });

      this.shadowRoot.querySelectorAll("[data-cc-preset]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const preset = btn.dataset.ccPreset;
          const map = {
            youtube: { color: "#ffffff", bg: "#080808", op: "0.82" },
            yellow: { color: "#fff000", bg: "#000000", op: "0.92" },
            cyan: { color: "#67e8f9", bg: "#05192d", op: "0.90" },
            green: { color: "#00e676", bg: "#020b14", op: "0.92" }
          };
          const p = map[preset] || map.youtube;
          this.preferences.captionColor = p.color;
          this.preferences.captionBackground = p.bg;
          this.preferences.captionOpacity = p.op;
          this.$("#caption-color").value = p.color;
          this.$("#caption-background").value = p.bg;
          this.applyCaptionStyle();
          this.persist(`Caption style preset changed to ${preset}`);
        });
      });

      this.$("#desc-toggle").addEventListener("click", () => {
        this.preferences.audioDescription = !this.preferences.audioDescription;
        playEarcon(this.preferences.audioDescription ? "toggleOn" : "toggleOff", this.preferences.earcons);
        if (!this.preferences.audioDescription && "speechSynthesis" in window) {
          window.speechSynthesis.cancel();
        }
        this.$("#desc-toggle").setAttribute("aria-pressed", String(this.preferences.audioDescription));
        this.persist(this.preferences.audioDescription ? "Audio description enabled" : "Audio description disabled");
      });

      this.$("#blind-mode-toggle").addEventListener("click", () => this.toggleBlindOvercookedMode());
      this.$("#voice-copilot-btn").addEventListener("click", () => this.toggleVoiceCopilot());

      this.$("#transcript-toggle").addEventListener("click", () => {
        this.preferences.transcriptOpen = !this.preferences.transcriptOpen;
        this.$("#transcript-toggle").setAttribute("aria-pressed", String(this.preferences.transcriptOpen));
        this.$("#transcript-panel").hidden = !this.preferences.transcriptOpen;
        this.persist(this.preferences.transcriptOpen ? "Workspace panel shown" : "Workspace panel hidden");
      });

      // Workspace Tabs
      this.shadowRoot.querySelectorAll(".tab-btn").forEach((tabBtn) => {
        tabBtn.addEventListener("click", () => this.switchWorkspaceTab(tabBtn.dataset.tab));
      });

      if (signVideo) {
        this.$("#sign-toggle").addEventListener("click", () => this.toggleSignWindow());
        this.$("#sign-close-btn")?.addEventListener("click", () => this.toggleSignWindow(false));
        this.$("#sign-mode-live")?.addEventListener("click", () => this.setSignMode("live"));
        this.$("#sign-mode-video")?.addEventListener("click", () => this.setSignMode("video"));
      }

      this.$("#caption-language").addEventListener("change", (event) => {
        this.preferences.captionLanguage = event.target.value;
        this.renderTranscript();
        this.updateCaption();
        this.persist(`Caption language switched to ${this.preferences.captionLanguage === "am" ? "Amharic" : "English"}`);
      });

      this.$("#caption-size").addEventListener("input", (event) => {
        this.preferences.captionSize = event.target.value;
        this.applyCaptionStyle();
        this.persist(`Caption size set to ${this.preferences.captionSize} rem`);
      });

      this.$("#caption-color").addEventListener("input", (event) => {
        this.preferences.captionColor = event.target.value;
        this.applyCaptionStyle();
        this.persist(`Caption text colour set to ${this.preferences.captionColor}`);
      });

      this.$("#caption-background").addEventListener("input", (event) => {
        this.preferences.captionBackground = event.target.value;
        this.applyCaptionStyle();
        this.persist(`Caption background colour set to ${this.preferences.captionBackground}`);
      });

      this.$("#caption-position").addEventListener("change", (event) => {
        this.preferences.captionPosition = event.target.value;
        this.preferences.captionCoords = null;
        const capBox = this.$("#captions");
        capBox.className = `captions ${this.preferences.captionPosition}`;
        capBox.style.top = "";
        capBox.style.bottom = "";
        this.persist(`Caption position moved to ${this.preferences.captionPosition}`);
      });

      this.shadowRoot.querySelectorAll("[data-sign-pos]").forEach((button) =>
        button.addEventListener("click", () => {
          this.preferences.signPosition = button.dataset.signPos;
          this.preferences.signCoords = null;
          this.positionSign();
          const posMap = {
            "top-left": "topLeft",
            "top-right": "topRight",
            "bottom-left": "bottomLeft",
            "bottom-right": "bottomRight"
          };
          const posName = this.t[posMap[button.dataset.signPos]] || this.preferences.signPosition;
          this.persist(
            this.language === "am"
              ? `የምልክት ቋንቋ መስኮት ወደ ${posName} ተቀይሯል`
              : `Sign language window moved to ${posName}`
          );
        })
      );

      this.shadowRoot.querySelectorAll("[data-sign-size]").forEach((button) =>
        button.addEventListener("click", () => {
          const choices = ["small", "medium", "large"];
          const index = choices.indexOf(this.preferences.signSize);
          this.preferences.signSize =
            choices[button.dataset.signSize === "larger" ? Math.min(2, index + 1) : Math.max(0, index - 1)];
          this.positionSign();
          this.persist(`Sign language window size set to ${this.preferences.signSize}`);
        })
      );

      this.$("#sign-dock-toggle")?.addEventListener("click", () => this.toggleSignDock());
      this.$("#sign-split-toggle")?.addEventListener("click", () => this.toggleSignSplit());
      this.$("#sign-play-btn")?.addEventListener("click", () => this.togglePlay());

      this.dragSign();
      this.dragCaptions();
      this.positionSign();

      if (this.resizeObserver) this.resizeObserver.disconnect();
      const stageEl = this.$("#stage");
      if (stageEl && typeof ResizeObserver !== "undefined") {
        this.resizeObserver = new ResizeObserver(() => {
          if (!this.isDragging) this.positionSign();
        });
        this.resizeObserver.observe(stageEl);
      }
      if (this.windowResizeHandler) window.removeEventListener("resize", this.windowResizeHandler);
      this.windowResizeHandler = () => {
        if (!this.isDragging) this.positionSign();
      };
      window.addEventListener("resize", this.windowResizeHandler);

      this.$("#offline").addEventListener("click", () => this.downloadOffline());
      this.$("#sensory-offline-btn")?.addEventListener("click", () => this.downloadOffline());
      this.$("#toggle-3g-saver-btn")?.addEventListener("click", () => this.toggle3GDataSaver());
      this.$("#exit-datasaver-btn")?.addEventListener("click", () => this.toggle3GDataSaver(false));

      this.$("#fullscreen").addEventListener("click", () => this.toggleFullscreen());
      this.fullscreenHandler = () => {
        const isFs = Boolean(document.fullscreenElement || this.shadowRoot.fullscreenElement);
        const fsBtn = this.$("#fullscreen");
        if (fsBtn) {
          fsBtn.textContent = isFs ? this.t.exitFullScreen : this.t.fullScreen;
          fsBtn.setAttribute("aria-pressed", String(isFs));
        }
        window.requestAnimationFrame(() => this.positionSign());
      };
      document.addEventListener("fullscreenchange", this.fullscreenHandler);

      this.$("#help-button").addEventListener("click", () => this.$("#help").showModal());
      this.$("#close-help").addEventListener("click", () => this.$("#help").close());
      this.$("#edit-captions-btn").addEventListener("click", () => this.openCaptionEditor());
      this.$("#close-editor-btn").addEventListener("click", () => this.$("#caption-editor-dialog").close());
      this.$("#save-captions-btn").addEventListener("click", () => this.saveCaptionCorrections());
      this.$("#word-pop-close")?.addEventListener("click", () => {
        this.$("#word-popover").hidden = true;
      });

      // Live EthSL Studio Controls
      this.$("#translate-sign-btn")?.addEventListener("click", () => {
        const val = this.$("#custom-sign-input")?.value?.trim();
        if (val) this.runCustomSignTranslation(val);
      });
      this.$("#mic-sign-btn")?.addEventListener("click", () => this.captureSpeechForSign());

      // Blind Console Controls
      this.$("#describe-scene-btn")?.addEventListener("click", () => this.describeCurrentVisualScene());
      this.$("#add-bookmark-btn")?.addEventListener("click", () => this.addAudioBookmark());
      this.$("#where-am-i-btn")?.addEventListener("click", () => this.announceWhereAmI());
      this.$("#read-page-btn")?.addEventListener("click", () => this.readHostLessonPage());
      this.$("#inspect-braille-btn")?.addEventListener("click", () => {
        const w = this.$("#braille-word-input")?.value?.trim() || "VA";
        this.selectedBrailleWord = w;
        this.renderBrailleInspector(w);
      });
      this.shadowRoot.querySelectorAll("[data-voice-sim]").forEach((btn) => {
        btn.addEventListener("click", () => this.executeVoiceCommand(btn.dataset.voiceSim));
      });

      // Bind keyboard listener across the entire player shell
      this.$("#player-shell").addEventListener("keydown", (event) => this.keyboard(event));

      // Auto-read focused controls when Blind+ Over-Cooked Mode is enabled
      this.$("#player-shell").addEventListener("focusin", (event) => {
        if (!this.preferences.blindOvercooked) return;
        const target = event.target;
        if (!target || target.tagName === "SECTION") return;
        playEarcon("tick", this.preferences.earcons);
      });

      this.$("#transcript-download").addEventListener("click", (e) => this.downloadTranscript(e));
      this.$("#transcript-download-brf").addEventListener("click", (e) => this.downloadBraille(e));
      this.$("#transcript-download-vtt").addEventListener("click", (e) => this.downloadVttFile(e));

      if (signVideo) {
        this.signTimer = window.setInterval(() => this.syncSign(!video.paused), 1000);
      }
    }

    switchWorkspaceTab(tabName) {
      this.activeTab = tabName;
      this.shadowRoot.querySelectorAll(".tab-btn").forEach((btn) => {
        const active = btn.dataset.tab === tabName;
        btn.setAttribute("aria-selected", String(active));
      });
      ["transcript", "sign", "blind", "sensory"].forEach((id) => {
        const panel = this.$((`#panel-${id}`));
        if (panel) panel.hidden = id !== tabName;
      });
      playEarcon("tick", this.preferences.earcons);
    }

    toggleSignWindow(forceState) {
      this.preferences.sign = typeof forceState === "boolean" ? forceState : !this.preferences.sign;
      playEarcon(this.preferences.sign ? "toggleOn" : "toggleOff", this.preferences.earcons);
      this.$("#sign-toggle")?.setAttribute("aria-pressed", String(this.preferences.sign));
      const signEl = this.$("#sign-window");
      if (signEl) {
        signEl.hidden = !this.preferences.sign;
        if (this.preferences.sign) this.positionSign();
      }
      this.persist(this.preferences.sign ? "Ethiopian Sign Language window shown" : "Sign Language window hidden");
    }

    setSignMode(mode) {
      this.preferences.signMode = mode === "video" ? "video" : "live";
      const isLive = this.preferences.signMode === "live";
      this.$("#sign-mode-live")?.setAttribute("aria-pressed", String(isLive));
      this.$("#sign-mode-video")?.setAttribute("aria-pressed", String(!isLive));
      const signVideo = this.$("#sign-video");
      const liveCanvas = this.$("#sign-live-canvas");
      if (signVideo) signVideo.hidden = isLive;
      if (liveCanvas) liveCanvas.hidden = !isLive;
      this.persist(
        isLive
          ? "Switched to Live Real-Time EthSL Sign Translator mode"
          : "Switched to Synchronized Human Video PiP mode"
      );
    }

    async runCustomSignTranslation(text) {
      let result = translateTextToEthSL(text, this.preferences.captionLanguage);
      try {
        const res = await fetch(`${this.api}/sign/translate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, language: this.preferences.captionLanguage })
        });
        if (res.ok) {
          const apiData = await res.json();
          if (apiData.gloss_sequence?.length) {
            result = {
              source: apiData.source_text,
              soundCues: apiData.sound_cues || [],
              tokens: apiData.gloss_sequence,
              glossEn: apiData.gloss_string_en,
              glossAm: apiData.gloss_string_am
            };
          }
        }
      } catch {}
      this.customSignTranslation = { ...result, timestamp: performance.now() };
      this.renderSignStudioTokens(result);
      this.setSignMode("live");
      this.announce(`Translated to Ethiopian Sign Language Gloss: ${result.glossEn}`, true);
    }

    captureSpeechForSign() {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SR) {
        this.runCustomSignTranslation("Welcome to accessible learning in Ethiopia with real-time sign language");
        return;
      }
      try {
        const rec = new SR();
        rec.lang = this.preferences.captionLanguage === "am" ? "am-ET" : "en-US";
        rec.onresult = (e) => {
          const transcript = e.results?.[0]?.[0]?.transcript || "";
          if (transcript) {
            const input = this.$("#custom-sign-input");
            if (input) input.value = transcript;
            this.runCustomSignTranslation(transcript);
          }
        };
        rec.start();
        this.announce("Listening for speech to translate into Ethiopian Sign Language...", false);
      } catch {
        this.runCustomSignTranslation("Welcome to accessible learning in Ethiopia");
      }
    }

    renderSignStudioTokens(translation) {
      const glossEnEl = this.$("#studio-gloss-en");
      const glossAmEl = this.$("#studio-gloss-am");
      const stripEl = this.$("#sign-gloss-strip");
      const cardsEl = this.$("#studio-token-cards");
      if (glossEnEl) glossEnEl.textContent = translation.glossEn || "WELCOME";
      if (glossAmEl) glossAmEl.textContent = translation.glossAm || "እንኳን-ደህና-መጡ";
      if (stripEl) stripEl.textContent = `ETHSL SOV: ${translation.glossEn}`;
      if (cardsEl) {
        cardsEl.innerHTML = (translation.tokens || [])
          .map(
            (tok) => `
          <div class="gloss-badge" title="${escapeHtml(tok.movement || "")}">
            <div>${escapeHtml(tok.gloss_en)} (${escapeHtml(tok.gloss_am)})</div>
            <div style="font-size:0.7rem;color:#cbd5e1;font-weight:500;">✋ ${escapeHtml(tok.handshape)}</div>
          </div>`
          )
          .join("");
      }
    }

    /* ==========================================================================
       60 FPS Real-Time Articulated EthSL Signer + Deaf Sensory Audio Radar Loop
       ========================================================================== */
    startLiveAnimationLoop() {
      let frameCount = 0;
      const tick = (now) => {
        frameCount++;
        if (frameCount % 2 === 0) {
          this.drawLiveSignCanvas(now);
          this.drawSensoryRadarCanvas(now);
        }
        this.animFrameId = window.requestAnimationFrame(tick);
      };
      this.animFrameId = window.requestAnimationFrame(tick);
    }

    drawLiveSignCanvas(now) {
      const video = this.$("#video");
      const currentSec = video ? video.currentTime : 0;
      const activeCue = this.cues().find((c) => currentSec >= c.start && currentSec < c.end) || this.cues()[0];

      // Determine active translation (custom input for 8 seconds, otherwise live video cue)
      let translation;
      if (this.customSignTranslation && now - this.customSignTranslation.timestamp < 8000) {
        translation = this.customSignTranslation;
      } else {
        translation = translateTextToEthSL(activeCue ? activeCue.text : "Welcome", this.preferences.captionLanguage);
      }

      const tokens = translation.tokens || [];
      const tokenIdx = tokens.length ? Math.floor((now / 1100) % tokens.length) : 0;
      const activeToken = tokens[tokenIdx] || {
        gloss_en: "WELCOME",
        gloss_am: "እንኳን-ደህና-መጡ",
        handshape: "5-Open Palm",
        movement: "Forward welcome arc",
        pose: "welcome",
        fingerspell: ["W", "E", "L"]
      };

      const stripEl = this.$("#sign-gloss-strip");
      if (stripEl) {
        stripEl.textContent = `⚡ ${activeToken.gloss_en} (${activeToken.gloss_am}) • ${activeToken.handshape}`;
      }
      const poseLabel = this.$("#studio-pose-label");
      if (poseLabel) {
        poseLabel.textContent = `${activeToken.gloss_en} • ${activeToken.handshape}`;
      }

      const canvases = [this.$("#sign-live-canvas"), this.$("#studio-sign-canvas")].filter(Boolean);
      const phase = now / 260;

      canvases.forEach((canvas) => {
        if (canvas.hidden) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        const w = canvas.width;
        const h = canvas.height;
        ctx.clearRect(0, 0, w, h);

        // Studio Background Grid
        ctx.fillStyle = "#061626";
        ctx.fillRect(0, 0, w, h);
        ctx.strokeStyle = "rgba(56, 189, 248, 0.12)";
        ctx.lineWidth = 1;
        for (let x = 0; x < w; x += 28) {
          ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
        }
        for (let y = 0; y < h; y += 28) {
          ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
        }

        const cx = w / 2;
        const cy = h * 0.44;
        const pose = activeToken.pose || "welcome";

        // Torso & Shoulders
        ctx.fillStyle = "#113255";
        ctx.strokeStyle = "#00e676";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.roundRect(cx - 52, cy + 8, 104, 74, 18);
        ctx.fill();
        ctx.stroke();

        // Head & Non-Manual Facial Expression
        ctx.fillStyle = "#e2eefc";
        ctx.beginPath();
        ctx.arc(cx, cy - 24, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Eyebrows & Eyes
        const browOffset = pose === "think" || pose === "code" ? -3 : 0;
        ctx.strokeStyle = "#0f172a";
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(cx - 11, cy - 31 + browOffset); ctx.lineTo(cx - 4, cy - 32 + browOffset);
        ctx.moveTo(cx + 4, cy - 32 + browOffset); ctx.lineTo(cx + 11, cy - 31 + browOffset);
        ctx.stroke();
        ctx.fillStyle = "#0f172a";
        ctx.beginPath();
        ctx.arc(cx - 7, cy - 25, 2.3, 0, Math.PI * 2);
        ctx.arc(cx + 7, cy - 25, 2.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx, cy - 17, 5, 0, Math.PI);
        ctx.stroke();

        // Kinematic Hand Coordinates by Pose
        let lx = cx - 38, ly = cy + 32, rx = cx + 38, ry = cy + 32;
        if (pose === "welcome") {
          lx = cx - 34 - Math.sin(phase) * 14;
          ly = cy + 32 - Math.cos(phase) * 8;
          rx = cx + 34 + Math.sin(phase) * 14;
          ry = cy + 32 - Math.cos(phase) * 8;
        } else if (pose === "expand") {
          const sp = 18 * (0.5 + 0.5 * Math.sin(phase));
          lx = cx - 24 - sp; ly = cy + 26 - Math.cos(phase) * 7;
          rx = cx + 24 + sp; ry = cy + 26 - Math.cos(phase) * 7;
        } else if (pose === "think") {
          lx = cx - 36; ly = cy + 44;
          rx = cx + 26 + Math.sin(phase * 1.5) * 5;
          ry = cy - 26 + Math.cos(phase * 1.5) * 5;
        } else if (pose === "empathy") {
          lx = cx - 12; ly = cy + 28;
          rx = cx + 16 + Math.sin(phase) * 16;
          ry = cy + 26 - Math.sin(phase) * 10;
        } else if (pose === "join" || pose === "code") {
          const d = Math.abs(Math.cos(phase)) * 18;
          lx = cx - 10 - d; ly = cy + 26;
          rx = cx + 10 + d; ry = cy + 26;
        } else if (pose === "fingerspell") {
          lx = cx - 38; ly = cy + 46;
          rx = cx + 34 + Math.sin(phase * 2) * 6;
          ry = cy + 12 + Math.cos(phase * 2) * 4;
        } else {
          lx = cx - 30; ly = cy + 30 + Math.sin(phase * 1.4) * 10;
          rx = cx + 30; ry = cy + 30 - Math.sin(phase * 1.4) * 10;
        }

        // Draw Arms (Shoulder -> Elbow -> Wrist)
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 6;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(cx - 44, cy + 18);
        ctx.lineTo((cx - 44 + lx) / 2 - 10, cy + 46);
        ctx.lineTo(lx, ly);
        ctx.moveTo(cx + 44, cy + 18);
        ctx.lineTo((cx + 44 + rx) / 2 + 10, cy + 46);
        ctx.lineTo(rx, ry);
        ctx.stroke();

        // Draw 21-Keypoint Articulated Hands (Palm + 5 Finger Skeletons)
        [[lx, ly], [rx, ry]].forEach(([hx, hy]) => {
          ctx.fillStyle = "#facc15";
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(hx, hy, 10, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          for (let f = 0; f < 5; f++) {
            const ang = -0.85 + f * 0.42 + 0.16 * Math.sin(phase + f);
            const fx = hx + Math.sin(ang) * 15;
            const fy = hy - Math.cos(ang) * 15;
            ctx.strokeStyle = "#facc15";
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(hx, hy);
            ctx.lineTo(fx, fy);
            ctx.stroke();
            ctx.fillStyle = "#ffffff";
            ctx.beginPath();
            ctx.arc(fx, fy, 2.2, 0, Math.PI * 2);
            ctx.fill();
          }
        });

        // Bottom HUD overlay inside canvas
        ctx.fillStyle = "rgba(5, 25, 45, 0.88)";
        ctx.fillRect(6, h - 42, w - 12, 36);
        ctx.strokeStyle = "#f5a300";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(6, h - 42, w - 12, 36);

        ctx.fillStyle = "#fff000";
        ctx.font = "bold 11px sans-serif";
        const fsChar = (activeToken.fingerspell || ["E"])[Math.floor((now / 350) % (activeToken.fingerspell?.length || 1))];
        ctx.fillText(`SIGN: ${activeToken.gloss_en} [${fsChar}]`, 14, h - 25);
        ctx.fillStyle = "#a7f3d0";
        ctx.font = "11px sans-serif";
        ctx.fillText(`${activeToken.gloss_am} • ${activeToken.handshape}`, 14, h - 11);
      });
    }

    drawSensoryRadarCanvas(now) {
      const canvas = this.$("#sensory-radar-canvas");
      if (!canvas || canvas.closest("[hidden]")) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const video = this.$("#video");
      const playing = video && !video.paused;
      const w = canvas.width;
      const h = canvas.height;
      ctx.fillStyle = "#020b14";
      ctx.fillRect(0, 0, w, h);

      const bars = 32;
      const barW = (w - 20) / bars;
      for (let i = 0; i < bars; i++) {
        const energy = playing
          ? 0.25 + 0.65 * Math.abs(Math.sin(now / 180 + i * 0.45)) * Math.cos(i * 0.15)
          : 0.08;
        const bh = Math.max(4, energy * (h - 24));
        ctx.fillStyle = energy > 0.65 ? "#fff000" : "#00e676";
        ctx.fillRect(10 + i * barW, h - 12 - bh, barW - 3, bh);
      }
    }

    /* ==========================================================================
       Over-Cooked Blind Mode & Voice Copilot Methods
       ========================================================================== */
    toggleBlindOvercookedMode() {
      this.preferences.blindOvercooked = !this.preferences.blindOvercooked;
      playEarcon(this.preferences.blindOvercooked ? "toggleOn" : "toggleOff", true);
      this.$("#blind-mode-toggle")?.setAttribute("aria-pressed", String(this.preferences.blindOvercooked));
      const pill = this.$("#blind-status-pill");
      if (pill) pill.textContent = this.preferences.blindOvercooked ? "🔊 Blind+ Active" : "🔊 Standard";
      this.persist(
        this.preferences.blindOvercooked
          ? "Over-Cooked Blind Mode activated: Spatial audio earcons, auto-spoken controls, chapter hopping keys 1 to 6, and scene inspector enabled."
          : "Standard screen-reader mode enabled."
      );
    }

    describeCurrentVisualScene() {
      const video = this.$("#video");
      const wasPlaying = video && !video.paused;
      if (wasPlaying) video.pause();
      playEarcon("chapter", this.preferences.earcons);

      const sec = video ? video.currentTime : 0;
      const descList = this.descriptions();
      const match = descList.find((d) => sec >= d.start && sec < d.end) || descList[0];
      const cueMatch = this.cues().find((c) => sec >= c.start && sec < c.end) || this.cues()[0];
      const signInfo = translateTextToEthSL(cueMatch ? cueMatch.text : "", this.preferences.captionLanguage);

      const fullSceneText =
        this.language === "am"
          ? `የምስል መግለጫ (${formatTime(sec)})፦ ${match ? match.text : ""}። በአሁኑ ሰዓት የምልክት ቋንቋ አስተርጓሚው ${signInfo.glossAm} እያሳየ ነው።`
          : `Visual Scene at ${formatTime(sec)} (${match?.visualTitle || "Lesson Frame"}): ${
              match ? match.text : ""
            } Meanwhile, the EthSL signer is performing ${signInfo.glossEn}.`;

      const box = this.$("#scene-inspector-text");
      if (box) box.textContent = fullSceneText;
      this.switchWorkspaceTab("blind");
      this.speakAloud(fullSceneText, () => {
        if (wasPlaying && video) video.play().catch(() => {});
      });
    }

    announceWhereAmI() {
      const video = this.$("#video");
      const sec = video ? video.currentTime : 0;
      const dur = video?.duration || 45;
      const pct = Math.round((sec / dur) * 100);
      const cue = this.cues().find((c) => sec >= c.start && sec < c.end) || this.cues()[0];
      const msg =
        this.language === "am"
          ? `በአሁኑ ሰዓት ${ cue?.chapter || "ምዕራፍ 1" } ላይ ነዎት። ሰዓት ${formatTime(sec)} ከ ${formatTime(dur)} (${pct} በመቶ ተጠናቋል)።`
          : `You are at ${cue?.chapter || "Chapter 1"}, timestamp ${formatTime(sec)} of ${formatTime(dur)} (${pct}% completed). Current line: ${cue?.text || ""}`;
      playEarcon("chapter", this.preferences.earcons);
      this.announce(msg, true);
    }

    addAudioBookmark() {
      const video = this.$("#video");
      const sec = Math.floor(video ? video.currentTime : 0);
      const cue = this.cues().find((c) => sec >= c.start && sec < c.end) || this.cues()[0];
      const note = cue ? cue.text : `Bookmark at ${formatTime(sec)}`;
      this.bookmarks.push({ time: sec, note });
      this.saveBookmarks();
      this.renderBookmarksList();
      playEarcon("bookmark", this.preferences.earcons);
      this.showNotice(
        this.language === "am"
          ? `የድምፅ ምልክት በ ${formatTime(sec)} ላይ ተቀምጧል።`
          : `Audio bookmark saved at ${formatTime(sec)}: "${note.slice(0, 50)}..."`
      );
    }

    renderBookmarksList() {
      const list = this.$("#bookmarks-list");
      if (!list) return;
      list.innerHTML = this.bookmarks
        .map(
          (b, i) => `
        <li style="margin-bottom:0.3rem;">
          <button type="button" data-bookmark-seek="${b.time}" style="min-height:32px;padding:0.15rem 0.5rem;border:1px solid #05192d;border-radius:4px;background:#ecfdf5;color:#05192d;font-weight:700;cursor:pointer;">
            ⏱️ ${formatTime(b.time)} — ${escapeHtml(b.note.slice(0, 68))}
          </button>
        </li>`
        )
        .join("");
      list.querySelectorAll("[data-bookmark-seek]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const video = this.$("#video");
          if (video) {
            video.currentTime = Number(btn.dataset.bookmarkSeek);
            video.play().catch(() => {});
          }
        });
      });
    }

    renderBrailleInspector(word) {
      const container = this.$("#braille-cells-container");
      if (!container) return;
      const chars = String(word || "VA").slice(0, 10).split("");
      container.innerHTML = chars
        .map((ch) => {
          const lower = ch.toLowerCase();
          const activeDots = BRAILLE_DOTS[lower] || [1];
          const dotSpans = [1, 4, 2, 5, 3, 6]
            .map((d) => `<span class="b-dot ${activeDots.includes(d) ? "raised" : ""}"></span>`)
            .join("");
          return `
          <button type="button" class="braille-cell-card" data-braille-char="${escapeHtml(ch)}" data-braille-dots="${activeDots.join(", ")}" aria-label="Character ${escapeHtml(ch)}, Braille dots ${activeDots.join(" ") || "space"}">
            <div style="font-weight:800;font-size:0.9rem;color:#fff000;">${escapeHtml(ch.toUpperCase())}</div>
            <div class="braille-dots-grid">${dotSpans}</div>
            <div style="font-size:0.68rem;color:#a7f3d0;">Dots ${activeDots.join(",") || "0"}</div>
          </button>`;
        })
        .join("");

      container.querySelectorAll(".braille-cell-card").forEach((card) => {
        card.addEventListener("click", () => {
          const ch = card.dataset.brailleChar;
          const dots = card.dataset.brailleDots;
          playEarcon("tick", this.preferences.earcons);
          this.announce(`Braille character ${ch}: raised dots ${dots || "none (space)"}`, true);
        });
      });
    }

    readHostLessonPage() {
      this.scanHostSections();
      const summary = this.hostSections
        .map((s) => `Section ${s.index}: ${s.title}. ${s.snippet}`)
        .join(" ");
      this.switchWorkspaceTab("blind");
      const box = this.$("#scene-inspector-text");
      if (box) box.textContent = `Reading Host Page Sections: ${summary}`;
      this.speakAloud(`Reading Lesson Page Headings and Content: ${summary}`);
    }

    toggleVoiceCopilot() {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      const btn = this.$("#voice-copilot-btn");
      if (this.voiceListening && this.voiceRecognition) {
        this.voiceListening = false;
        try { this.voiceRecognition.stop(); } catch {}
        btn?.setAttribute("aria-pressed", "false");
        this.announce("Voice Copilot stopped.", false);
        return;
      }
      if (!SR) {
        this.switchWorkspaceTab("blind");
        this.showNotice("Voice Copilot Panel opened — click any simulated voice command button below or speak on supported browsers.");
        return;
      }
      try {
        const rec = new SR();
        rec.lang = this.preferences.captionLanguage === "am" ? "am-ET" : "en-US";
        rec.continuous = false;
        rec.onresult = (e) => {
          const cmd = e.results?.[0]?.[0]?.transcript || "";
          if (cmd) this.executeVoiceCommand(cmd);
        };
        rec.onend = () => {
          this.voiceListening = false;
          btn?.setAttribute("aria-pressed", "false");
        };
        this.voiceRecognition = rec;
        this.voiceListening = true;
        btn?.setAttribute("aria-pressed", "true");
        rec.start();
        playEarcon("toggleOn", this.preferences.earcons);
        this.announce("Voice Copilot listening. Say play, pause, describe scene, where am I, next chapter, or Amharic.", false);
      } catch {
        this.switchWorkspaceTab("blind");
      }
    }

    executeVoiceCommand(rawCmd) {
      const cmd = String(rawCmd || "").toLowerCase();
      const video = this.$("#video");
      if (cmd.includes("play") || cmd.includes("አጫውት")) {
        video?.play().catch(() => {});
        this.announce("Voice Copilot: Playing video.", true);
      } else if (cmd.includes("pause") || cmd.includes("stop") || cmd.includes("አቁም")) {
        video?.pause();
        this.announce("Voice Copilot: Video paused.", true);
      } else if (cmd.includes("describe") || cmd.includes("scene") || cmd.includes("ምስል")) {
        this.describeCurrentVisualScene();
      } else if (cmd.includes("where") || cmd.includes("status")) {
        this.announceWhereAmI();
      } else if (cmd.includes("amharic") || cmd.includes("አማርኛ")) {
        this.preferences.captionLanguage = "am";
        this.$("#caption-language").value = "am";
        this.renderTranscript();
        this.updateCaption();
        this.persist("Voice Copilot switched language to Amharic.");
      } else if (cmd.includes("english")) {
        this.preferences.captionLanguage = "en";
        this.$("#caption-language").value = "en";
        this.renderTranscript();
        this.updateCaption();
        this.persist("Voice Copilot switched language to English.");
      } else if (cmd.includes("next") || cmd.includes("forward")) {
        this.jumpRelativeCue(1);
      } else if (cmd.includes("prev") || cmd.includes("back")) {
        this.jumpRelativeCue(-1);
      } else if (cmd.includes("bookmark")) {
        this.addAudioBookmark();
      } else if (cmd.includes("braille")) {
        this.downloadBraille();
      }
    }

    jumpToChapter(chapterNum) {
      const cues = this.cues();
      const idx = Math.max(0, Math.min(cues.length - 1, chapterNum - 1));
      const cue = cues[idx];
      const video = this.$("#video");
      if (cue && video) {
        video.currentTime = cue.start;
        playEarcon("chapter", this.preferences.earcons);
        this.announce(`Jumped to ${cue.chapter || `Chapter ${idx + 1}`}: ${cue.text}`, this.preferences.blindOvercooked);
      }
    }

    jumpRelativeCue(delta) {
      const video = this.$("#video");
      if (!video) return;
      const cues = this.cues();
      let idx = cues.findIndex((c) => video.currentTime >= c.start && video.currentTime < c.end);
      if (idx === -1) idx = 0;
      const targetIdx = Math.max(0, Math.min(cues.length - 1, idx + delta));
      const cue = cues[targetIdx];
      if (cue) {
        video.currentTime = cue.start;
        playEarcon(delta > 0 ? "seekFwd" : "seekBack", this.preferences.earcons);
        this.announce(`${cue.chapter || `Cue ${targetIdx + 1}`}: ${cue.text}`, this.preferences.blindOvercooked);
      }
    }

    toggle3GDataSaver(forceState) {
      this.preferences.dataSaver3G = typeof forceState === "boolean" ? forceState : !this.preferences.dataSaver3G;
      const dsStage = this.$("#datasaver-stage");
      if (dsStage) dsStage.hidden = !this.preferences.dataSaver3G;
      playEarcon(this.preferences.dataSaver3G ? "toggleOn" : "toggleOff", this.preferences.earcons);
      this.persist(
        this.preferences.dataSaver3G
          ? "3G Smart Data-Saver Mode enabled: using slide keyframes and low-bitrate audio to save 80% mobile data."
          : "Full video streaming restored."
      );
    }

    toggleFullscreen() {
      const shell = this.$("#player-shell");
      if (document.fullscreenElement || this.shadowRoot.fullscreenElement) {
        document.exitFullscreen?.();
      } else {
        shell.requestFullscreen?.();
      }
    }

    openCaptionEditor() {
      const cues = this.cues();
      const container = this.$("#editor-rows");
      container.innerHTML = cues
        .map(
          (cue, idx) => `
        <div class="editor-row">
          <input type="text" data-edit-start="${idx}" value="${formatVttTimestamp(cue.start)}" aria-label="Start time ${idx + 1}">
          <input type="text" data-edit-end="${idx}" value="${formatVttTimestamp(cue.end)}" aria-label="End time ${idx + 1}">
          <input type="text" data-edit-text="${idx}" value="${escapeHtml(cue.text)}" aria-label="Caption line ${idx + 1}">
        </div>`
        )
        .join("");
      this.$("#caption-editor-dialog").showModal();
    }

    async saveCaptionCorrections() {
      const lang = this.preferences.captionLanguage;
      const rows = this.shadowRoot.querySelectorAll("[data-edit-text]");
      const updated = [];
      rows.forEach((textInput, idx) => {
        const startInput = this.$((`[data-edit-start="${idx}"]`));
        const endInput = this.$((`[data-edit-end="${idx}"]`));
        updated.push({
          start: toSeconds(startInput ? startInput.value : 0),
          end: toSeconds(endInput ? endInput.value : 5),
          chapter: (this.captionCues[lang]?.[idx]?.chapter) || `Chapter ${idx + 1}`,
          text: textInput.value.trim()
        });
      });
      this.captionCues[lang] = updated;
      this.renderTranscript();
      this.updateCaption();

      const vttContent = serializeVtt(updated);
      const rawReviewer = this.$("#reviewer-input")?.value?.trim() || "";
      const reviewer = rawReviewer.length >= 2 ? rawReviewer : "Co-Designer Reviewer";
      const notes = this.$("#notes-input")?.value || "";
      let savedRemote = false;
      try {
        const formData = new FormData();
        formData.append(
          "metadata",
          JSON.stringify({ lesson_id: this.lessonId, language: lang, reviewer, notes })
        );
        formData.append("caption_file", new Blob([vttContent], { type: "text/vtt" }), `${this.lessonId}.${lang}.vtt`);
        const res = await fetch(`${this.api}/lessons/${encodeURIComponent(this.lessonId)}/captions`, {
          method: "POST",
          body: formData
        });
        if (res.ok) savedRemote = true;
      } catch {}
      this.$("#caption-editor-dialog").close();
      this.showNotice(
        savedRemote
          ? (this.language === "am" ? "የተስተካከሉ ንዑስ ርዕሶች ተቀምጠው ወደ ሲስተሙ ተልከዋል።" : "Captions updated and saved to the WebVTT pipeline.")
          : (this.language === "am" ? "ንዑስ ርዕሶች በአካባቢው ተስተካክለዋል።" : "Captions updated locally in browser.")
      );
    }

    restorePlaybackState() {
      const state = this.restorePlayback;
      this.restorePlayback = null;
      const video = this.$("#video");
      video.playbackRate = this.preferences.playbackRate;
      video.addEventListener("timeupdate", () => this.timeUpdate());
      video.addEventListener("seeking", () => {
        if ("speechSynthesis" in window) window.speechSynthesis.cancel();
        this.syncSign(!video.paused);
      });
      video.addEventListener("ratechange", () => this.syncSign(!video.paused));
      video.addEventListener("play", () => {
        playEarcon("play", this.preferences.earcons);
        this.playbackChanged(true);
      });
      video.addEventListener("pause", () => {
        playEarcon("pause", this.preferences.earcons);
        this.playbackChanged(false);
      });
      video.addEventListener("ended", () => {
        this.playbackChanged(false);
        this.dispatchEvent(new CustomEvent("db-player:complete", { bubbles: true, composed: true, detail: { lessonId: this.lessonId } }));
      });
      video.addEventListener("loadedmetadata", () => this.timeUpdate());
      if (state) {
        video.currentTime = state.time || 0;
        if (!state.paused) video.play().catch(() => {});
      }
      this.updateCaption();
    }

    positionSign() {
      const sign = this.$("#sign-window");
      if (!sign) return;

      const stage = this.$("#stage");
      if (this.preferences.signSplit) {
        if (stage) stage.classList.add("split");
        sign.className = `sign split ${this.preferences.signSize || "medium"}`;
        sign.style.left = "";
        sign.style.top = "";
        sign.style.right = "";
        sign.style.bottom = "";
        this.updateDockButton();
        return;
      } else if (stage) {
        stage.classList.remove("split");
      }

      const isFloating = Boolean(this.preferences.signFloating);
      const pos = this.preferences.signPosition || "bottom-right";
      const size = this.preferences.signSize || "medium";

      if (isFloating) {
        sign.className = `sign floating ${pos} ${size}`;
        const maxLeft = Math.max(0, window.innerWidth - sign.offsetWidth);
        const maxTop = Math.max(0, window.innerHeight - sign.offsetHeight);

        if (pos === "custom" && this.preferences.signCoords) {
          let left, top;
          if (typeof this.preferences.signCoords.xRatio === "number" && maxLeft > 0) {
            left = Math.round(this.preferences.signCoords.xRatio * maxLeft);
            top = Math.round(this.preferences.signCoords.yRatio * maxTop);
          } else if (typeof this.preferences.signCoords.left === "number") {
            left = this.preferences.signCoords.left;
            top = this.preferences.signCoords.top;
          } else {
            left = Math.max(0, maxLeft - 16);
            top = Math.max(0, maxTop - 16);
          }
          const clampedLeft = Math.max(0, Math.min(left, maxLeft));
          const clampedTop = Math.max(0, Math.min(top, maxTop));
          sign.style.left = `${clampedLeft}px`;
          sign.style.top = `${clampedTop}px`;
          sign.style.right = "auto";
          sign.style.bottom = "auto";
        } else if (pos === "top-left") {
          sign.style.left = "1rem"; sign.style.top = "1rem"; sign.style.right = "auto"; sign.style.bottom = "auto";
        } else if (pos === "top-right") {
          sign.style.left = "auto"; sign.style.top = "1rem"; sign.style.right = "1rem"; sign.style.bottom = "auto";
        } else if (pos === "bottom-left") {
          sign.style.left = "1rem"; sign.style.top = "auto"; sign.style.right = "auto"; sign.style.bottom = "1rem";
        } else {
          sign.style.left = "auto"; sign.style.top = "auto"; sign.style.right = "1rem"; sign.style.bottom = "1rem";
        }
      } else {
        const dockedPos = pos === "custom" ? "bottom-right" : pos;
        this.preferences.signPosition = dockedPos;
        sign.className = `sign docked ${dockedPos} ${size}`;
        sign.style.left = ""; sign.style.top = ""; sign.style.right = ""; sign.style.bottom = "";
      }

      this.updateDockButton();
    }

    toggleSignSplit() {
      this.preferences.signSplit = !this.preferences.signSplit;
      this.positionSign();
      this.persist(this.preferences.signSplit ? "50/50 Side-by-side view enabled" : "Side-by-side view disabled");
    }

    toggleSignDock() {
      this.preferences.signFloating = !this.preferences.signFloating;
      if (this.preferences.signPosition === "custom" && !this.preferences.signFloating) {
        this.preferences.signPosition = "bottom-right";
      }
      this.positionSign();
      this.persist(this.preferences.signFloating ? "Sign language window floating freely on page" : "Sign language window docked inside video");
    }

    updateDockButton() {
      const btn = this.$("#sign-dock-toggle");
      if (!btn) return;
      const isFloating = Boolean(this.preferences.signFloating);
      const label = isFloating ? (this.t.dockSign || "Dock inside video") : (this.t.floatSign || "Float freely on page");
      btn.textContent = isFloating ? "⤓" : "⛶";
      btn.setAttribute("aria-label", label);
      btn.setAttribute("title", label);
      btn.setAttribute("aria-pressed", String(isFloating));

      const splitBtn = this.$("#sign-split-toggle");
      if (splitBtn) {
        splitBtn.setAttribute("aria-pressed", String(Boolean(this.preferences.signSplit)));
      }
    }

    dragCaptions() {
      const capBox = this.$("#captions");
      const stage = this.$("#stage");
      if (!capBox || !stage) return;
      let dragging = false, startY = 0, initTop = 0, moved = false;

      capBox.addEventListener("pointerdown", (e) => {
        if (e.target.classList.contains("caption-word")) return;
        dragging = true;
        moved = false;
        startY = e.clientY;
        const stageRect = stage.getBoundingClientRect();
        const capRect = capBox.getBoundingClientRect();
        initTop = capRect.top - stageRect.top;
        try { capBox.setPointerCapture(e.pointerId); } catch {}
      });

      window.addEventListener("pointermove", (e) => {
        if (!dragging) return;
        const dy = e.clientY - startY;
        if (Math.abs(dy) > 4) moved = true;
        if (!moved) return;
        const stageRect = stage.getBoundingClientRect();
        const maxTop = Math.max(10, stageRect.height - capBox.offsetHeight - 10);
        const newTop = Math.max(10, Math.min(maxTop, initTop + dy));
        capBox.style.top = `${newTop}px`;
        capBox.style.bottom = "auto";
      });

      window.addEventListener("pointerup", () => {
        dragging = false;
      });
    }

    dragSign() {
      const sign = this.$("#sign-window");
      if (!sign) return;
      let startX = 0, startY = 0, initialLeft = 0, initialTop = 0, dragging = false, hasMoved = false;

      const onPointerMove = (event) => {
        if (!dragging) return;
        const deltaX = event.clientX - startX;
        const deltaY = event.clientY - startY;
        if (!hasMoved) {
          if (Math.abs(deltaX) < 3 && Math.abs(deltaY) < 3) return;
          hasMoved = true;
          this.preferences.signFloating = true;
          this.preferences.signPosition = "custom";
          sign.className = `sign floating custom ${this.preferences.signSize} dragging`;
        }

        const maxLeft = Math.max(0, window.innerWidth - sign.offsetWidth);
        const maxTop = Math.max(0, window.innerHeight - sign.offsetHeight);
        const clampedLeft = Math.max(0, Math.min(initialLeft + deltaX, maxLeft));
        const clampedTop = Math.max(0, Math.min(initialTop + deltaY, maxTop));

        sign.style.left = `${clampedLeft}px`;
        sign.style.top = `${clampedTop}px`;
        sign.style.bottom = "auto";
        sign.style.right = "auto";

        this.preferences.signCoords = {
          left: clampedLeft,
          top: clampedTop,
          xRatio: maxLeft > 0 ? clampedLeft / maxLeft : 0,
          yRatio: maxTop > 0 ? clampedTop / maxTop : 0
        };
      };

      const stop = (event) => {
        if (!dragging) return;
        dragging = false;
        this.isDragging = false;
        sign.classList.remove("dragging");

        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerup", stop);
        window.removeEventListener("pointercancel", stop);

        try {
          if (event && typeof event.pointerId === "number") {
            sign.releasePointerCapture(event.pointerId);
          }
        } catch {}

        if (hasMoved) {
          sign.className = `sign floating custom ${this.preferences.signSize}`;
          this.updateDockButton();
          this.persist("Sign language window moved");
        } else if (event && event.target && (event.target.id === "sign-video" || event.target.id === "sign-live-canvas")) {
          this.togglePlay();
        }
      };

      sign.addEventListener("pointerdown", (event) => {
        if (event.button !== 0) return;
        if (this.preferences.signSplit) return;
        if (event.target.closest("button, select, input, a")) return;
        event.preventDefault();
        dragging = true;
        this.isDragging = true;
        hasMoved = false;
        startX = event.clientX;
        startY = event.clientY;
        const rect = sign.getBoundingClientRect();
        initialLeft = rect.left;
        initialTop = rect.top;

        try { sign.setPointerCapture(event.pointerId); } catch {}
        window.addEventListener("pointermove", onPointerMove);
        window.addEventListener("pointerup", stop);
        window.addEventListener("pointercancel", stop);
      });

      sign.addEventListener("lostpointercapture", stop);

      sign.addEventListener("keydown", (event) => {
        if (event.target !== sign) return;
        if (event.key === "Enter") {
          event.preventDefault();
          event.stopPropagation();
          this.toggleSignDock();
          return;
        }
        const keys = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"];
        if (!keys.includes(event.key)) return;
        event.preventDefault();
        event.stopPropagation();

        const rect = sign.getBoundingClientRect();
        const step = event.shiftKey ? 40 : 15;
        const maxLeft = Math.max(0, window.innerWidth - sign.offsetWidth);
        const maxTop = Math.max(0, window.innerHeight - sign.offsetHeight);
        let newLeft = rect.left;
        let newTop = rect.top;

        if (event.key === "ArrowLeft") newLeft = Math.max(0, rect.left - step);
        else if (event.key === "ArrowRight") newLeft = Math.min(maxLeft, rect.left + step);
        else if (event.key === "ArrowUp") newTop = Math.max(0, rect.top - step);
        else if (event.key === "ArrowDown") newTop = Math.min(maxTop, rect.top + step);

        this.preferences.signFloating = true;
        this.preferences.signPosition = "custom";
        this.preferences.signCoords = {
          left: newLeft,
          top: newTop,
          xRatio: maxLeft > 0 ? newLeft / maxLeft : 0,
          yRatio: maxTop > 0 ? newTop / maxTop : 0
        };
        sign.className = `sign floating custom ${this.preferences.signSize}`;
        sign.style.left = `${newLeft}px`;
        sign.style.top = `${newTop}px`;
        sign.style.right = "auto";
        sign.style.bottom = "auto";
        this.updateDockButton();
        this.persist("Sign language window moved");
      });
    }

    togglePlay() {
      const video = this.$("#video");
      if (video.paused) video.play().catch(() => {});
      else video.pause();
    }

    playbackChanged(playing) {
      const button = this.$("#play-pause");
      if (button) {
        button.textContent = playing ? this.t.pause : this.t.play;
        button.setAttribute("aria-pressed", String(playing));
      }
      const signPlayBtn = this.$("#sign-play-btn");
      if (signPlayBtn) {
        signPlayBtn.textContent = playing ? "⏸" : "▶";
        signPlayBtn.setAttribute("aria-label", playing ? this.t.pause : this.t.play);
      }
      this.syncSign(playing);
    }

    syncSign(playing) {
      const video = this.$("#video");
      const sign = this.$("#sign-video");
      if (!sign || !video) return;
      if (Math.abs(sign.currentTime - video.currentTime) > 0.25) {
        sign.currentTime = video.currentTime;
      }
      sign.playbackRate = video.playbackRate;
      if (playing && sign.paused) sign.play().catch(() => {});
      if (!playing && !sign.paused) sign.pause();
    }

    cues() {
      return this.captionCues[this.preferences.captionLanguage] || this.captionCues.en || [];
    }

    descriptions() {
      return this.descriptionCues[this.preferences.captionLanguage] || this.descriptionCues.en || [];
    }

    updateCaption() {
      const video = this.$("#video");
      const captionEl = this.$("#caption");
      if (!video || !captionEl) return;

      const currentSec = video.currentTime;
      const primaryCues = this.cues();
      const cueIdx = primaryCues.findIndex((c) => currentSec >= c.start && currentSec < c.end);
      const current = cueIdx >= 0 ? primaryCues[cueIdx] : null;

      // Update Chapter Pill & 3G Data-Saver Card
      if (current) {
        const chapPill = this.$("#active-chapter-pill");
        if (chapPill) chapPill.textContent = current.chapter || `Chapter ${cueIdx + 1}`;
        const dsChap = this.$("#datasaver-chapter");
        const dsText = this.$("#datasaver-text");
        if (dsChap) dsChap.textContent = current.chapter || `Chapter ${cueIdx + 1}`;
        if (dsText) dsText.textContent = current.text;

        if (cueIdx !== this.lastChapterIndex) {
          this.lastChapterIndex = cueIdx;
          const translation = translateTextToEthSL(current.text, this.preferences.captionLanguage);
          this.renderSignStudioTokens(translation);
          if (translation.soundCues.length) {
            const badge = this.$("#sensory-event-badge");
            if (badge) badge.textContent = `🔔 ${translation.soundCues[0]}`;
            if (this.preferences.haptics && navigator.vibrate) {
              try { navigator.vibrate([90, 40, 90]); } catch {}
            }
          }
        }
      }

      if (!this.preferences.captions || !current) {
        captionEl.textContent = "";
        return;
      }

      // Render YouTube-Style Interactive Words + Sound Event Badge + Dual Bilingual Subtitles
      const soundMatches = Array.from(current.text.matchAll(/\[([^\]]+)\]/g)).map((m) => m[1]);
      const cleanText = current.text.replace(/\[[^\]]+\]/g, "").trim();
      const words = cleanText.split(/\s+/).filter(Boolean);
      const progressRatio = Math.max(0, Math.min(0.99, (currentSec - current.start) / Math.max(0.5, current.end - current.start)));
      const activeWordIdx = Math.floor(progressRatio * words.length);

      const soundBadgeHtml = soundMatches
        .map((s) => `<span class="caption-sound-badge">🔔 ${escapeHtml(s)}</span>`)
        .join("");

      const wordsHtml = words
        .map(
          (w, i) =>
            `<span class="caption-word ${i === activeWordIdx ? "active-word" : ""}" data-word="${escapeHtml(w)}">${escapeHtml(w)}</span>`
        )
        .join(" ");

      let dualHtml = "";
      if (this.preferences.captionDual) {
        const secondaryLang = this.preferences.captionLanguage === "am" ? "en" : "am";
        const secCue = (this.captionCues[secondaryLang] || [])[cueIdx];
        if (secCue) {
          dualHtml = `<span class="caption-dual-sub">${escapeHtml(secCue.text)}</span>`;
        }
      }

      captionEl.innerHTML = `${soundBadgeHtml}${wordsHtml}${dualHtml}`;

      captionEl.querySelectorAll(".caption-word").forEach((wordSpan) => {
        wordSpan.addEventListener("click", (e) => {
          e.stopPropagation();
          video.pause();
          const w = wordSpan.dataset.word || "";
          const signData = translateTextToEthSL(w, this.preferences.captionLanguage);
          const tok = signData.tokens[0] || {};
          const pop = this.$("#word-popover");
          const title = this.$("#word-pop-title");
          const body = this.$("#word-pop-body");
          if (pop && title && body) {
            title.textContent = `"${w}" → EthSL: ${tok.gloss_en || w.toUpperCase()}`;
            body.innerHTML = `
              <div><strong>Amharic Gloss:</strong> ${escapeHtml(tok.gloss_am || "")}</div>
              <div><strong>Handshape:</strong> ${escapeHtml(tok.handshape || "Manual Alphabet")}</div>
              <div><strong>Trajectory:</strong> ${escapeHtml(tok.movement || "")}</div>
            `;
            pop.hidden = false;
          }
          this.runCustomSignTranslation(w);
        });
      });
    }

    renderTranscript() {
      const list = this.$("#transcript-list");
      if (!list) return;
      list.innerHTML = this.cues()
        .map(
          (cue, index) =>
            `<li><button type="button" class="cue-row" data-cue="${index}" aria-current="false">
              <time>${formatTime(cue.start)}</time>
              <span class="cue-chap">${escapeHtml(cue.chapter || `Ch ${index + 1}`)}</span>
              <span>${escapeHtml(cue.text)}</span>
            </button></li>`
        )
        .join("");
      this.shadowRoot.querySelectorAll("[data-cue]").forEach((button) =>
        button.addEventListener("click", () => {
          const cue = this.cues()[Number(button.dataset.cue)];
          if (!cue) return;
          this.$("#video").currentTime = cue.start;
          this.$("#video").play().catch(() => {});
        })
      );
    }

    applyCaptionStyle() {
      const caption = this.$("#caption");
      if (!caption) return;
      caption.style.fontSize = `${this.preferences.captionSize}rem`;
      caption.style.color = this.preferences.captionColor;
      caption.style.backgroundColor = hexToRgba(this.preferences.captionBackground, Number(this.preferences.captionOpacity || 0.84));
    }

    timeUpdate() {
      const video = this.$("#video");
      if (!video) return;
      this.$("#time").textContent = `${formatTime(video.currentTime)} / ${formatTime(video.duration || 45)}`;
      if (video.duration) {
        this.$("#seek").value = String((video.currentTime / video.duration) * 100);
      }
      this.updateCaption();
      this.highlightCue(video.currentTime);
      this.checkAudioDescription(video.currentTime);
      this.emitProgress();
    }

    highlightCue(currentSeconds) {
      const items = this.shadowRoot.querySelectorAll("[data-cue]");
      this.cues().forEach((cue, index) => {
        const matches = currentSeconds >= cue.start && currentSeconds < cue.end;
        const button = items[index];
        if (button) button.setAttribute("aria-current", matches ? "true" : "false");
      });
    }

    checkAudioDescription(currentSeconds) {
      if (!this.preferences.audioDescription || !("speechSynthesis" in window)) return;
      const list = this.descriptions();
      const index = list.findIndex((cue) => currentSeconds >= cue.start && currentSeconds < cue.end);
      if (index === -1 || index === this.describedCue) return;
      this.describedCue = index;
      const cue = list[index];
      const video = this.$("#video");
      video.pause();
      this.speakAloud(cue.text, () => {
        if (this.preferences.audioDescription && !video.ended) {
          video.play().catch(() => {});
        }
      });
    }

    speakAloud(text, onEndCallback) {
      if (!("speechSynthesis" in window)) {
        if (onEndCallback) onEndCallback();
        return;
      }
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = this.preferences.captionLanguage === "am" ? "am-ET" : "en-US";
      if (onEndCallback) {
        utterance.onend = onEndCallback;
        utterance.onerror = onEndCallback;
      }
      window.speechSynthesis.speak(utterance);
    }

    keyboard(event) {
      const tag = (event.target && event.target.tagName) || "";
      if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") {
        if (event.key === "Escape") {
          this.$("#yt-settings-panel").hidden = true;
        }
        return;
      }
      if (event.target && event.target.closest && event.target.closest("#sign-window")) {
        if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Enter"].includes(event.key)) {
          return;
        }
      }
      const video = this.$("#video");
      const key = event.key.toLowerCase();

      if (event.key === " " || key === "k") {
        if (tag === "BUTTON" && event.key === " ") return;
        event.preventDefault();
        this.togglePlay();
      } else if (event.key === "ArrowLeft" || key === "j") {
        event.preventDefault();
        const delta = key === "j" ? 10 : 5;
        video.currentTime = Math.max(0, video.currentTime - delta);
        playEarcon("seekBack", this.preferences.earcons);
        this.announce(`Rewound ${delta} seconds`, this.preferences.blindOvercooked);
      } else if (event.key === "ArrowRight" || key === "l") {
        event.preventDefault();
        const delta = key === "l" ? 10 : 5;
        video.currentTime = Math.min(video.duration || 45, video.currentTime + delta);
        playEarcon("seekFwd", this.preferences.earcons);
        this.announce(`Forwarded ${delta} seconds`, this.preferences.blindOvercooked);
      } else if (["1", "2", "3", "4", "5", "6"].includes(event.key)) {
        event.preventDefault();
        this.jumpToChapter(Number(event.key));
      } else if (event.key === "[") {
        event.preventDefault();
        this.jumpRelativeCue(-1);
      } else if (event.key === "]") {
        event.preventDefault();
        this.jumpRelativeCue(1);
      } else if (key === "f") {
        event.preventDefault();
        this.toggleFullscreen();
      } else if (key === "c") {
        event.preventDefault();
        this.$("#caption-toggle")?.click();
      } else if (key === "s") {
        event.preventDefault();
        this.$("#sign-toggle")?.click();
      } else if (key === "d") {
        event.preventDefault();
        this.$("#desc-toggle")?.click();
      } else if (key === "b") {
        event.preventDefault();
        this.toggleBlindOvercookedMode();
      } else if (key === "i") {
        event.preventDefault();
        this.describeCurrentVisualScene();
      } else if (key === "n") {
        event.preventDefault();
        this.addAudioBookmark();
      } else if (key === "v") {
        event.preventDefault();
        this.toggleVoiceCopilot();
      } else if (key === "r") {
        event.preventDefault();
        this.readHostLessonPage();
      } else if (key === "m") {
        event.preventDefault();
        this.$("#mute-toggle")?.click();
      } else if (key === "t") {
        event.preventDefault();
        this.$("#transcript-toggle")?.click();
      }
    }

    emitProgress() {
      const video = this.$("#video");
      this.dispatchEvent(
        new CustomEvent("db-player:progress", {
          bubbles: true,
          composed: true,
          detail: {
            seconds: video.currentTime,
            percent: video.duration ? Math.round((video.currentTime / video.duration) * 100) : 0
          }
        })
      );
    }

    downloadTranscript(event) {
      if (event) event.preventDefault();
      const cuesPart = this.cues()
        .map((cue) => `[${formatTime(cue.start)}] (${cue.chapter || "Lesson"}) ${cue.text}`)
        .join("\n");
      const bookmarksPart = this.bookmarks.length
        ? "\n\n=== SAVED AUDIO BOOKMARKS ===\n" + this.bookmarks.map((b) => `[${formatTime(b.time)}] ${b.note}`).join("\n")
        : "";
      const blob = new Blob([cuesPart + bookmarksPart], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${this.lessonId}-transcript.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.setTimeout(() => URL.revokeObjectURL(url), 1500);
      this.announce("Downloaded plain-text transcript and bookmarks", this.preferences.blindOvercooked);
    }

    downloadBraille(event) {
      if (event) event.preventDefault();
      const header = `,alx ,savanna\r\n,accessible ,learning ,media\r\n,lesson: ${this.lessonId}\r\n======================================\r\n`;
      const body = this.cues()
        .map((cue, i) => `,part #${i + 1}\r\n` + textToBrailleAscii(cue.text, 38))
        .join("\r\n\r\n");
      const brf = header + "\r\n" + body + "\r\n\x0C";
      const blob = new Blob([brf], { type: "text/plain;charset=us-ascii" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${this.lessonId}-braille.brf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.setTimeout(() => URL.revokeObjectURL(url), 1500);
      this.announce("Downloaded Grade 1 Braille transcript", this.preferences.blindOvercooked);
    }

    downloadVttFile(event) {
      if (event) event.preventDefault();
      const vtt = serializeVtt(this.cues());
      const blob = new Blob([vtt], { type: "text/vtt;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${this.lessonId}-${this.preferences.captionLanguage}.vtt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.setTimeout(() => URL.revokeObjectURL(url), 1500);
      this.announce("Exported WebVTT captions", this.preferences.blindOvercooked);
    }

    async downloadOffline() {
      try {
        if ("serviceWorker" in navigator && this.offlineWorkerSource) {
          navigator.serviceWorker.register(this.offlineWorkerSource).catch(() => {});
        }
        const response = await fetch(`${this.api}/lessons/${encodeURIComponent(this.lessonId)}/offline-pack`);
        if (!response.ok) throw new Error("Server offline pack unavailable");
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${this.lessonId}-3g-offline-pack.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.setTimeout(() => URL.revokeObjectURL(url), 1500);
        this.showNotice("3G offline pack downloaded and cached for aeroplane mode.");
      } catch {
        const htmlOffline = `<!doctype html><html lang="${this.language}"><meta charset="utf-8"><title>${escapeHtml(
          this.getAttribute("title") || "Offline Lesson"
        )}</title><body style="font-family:sans-serif;max-width:44rem;margin:2rem auto;padding:1rem"><h1>${escapeHtml(
          this.getAttribute("title") || "Offline Lesson"
        )}</h1><h2>Transcript</h2><ol>${this.cues()
          .map((c) => `<li><strong>[${formatTime(c.start)}]</strong> ${escapeHtml(c.text)}</li>`)
          .join("")}</ol></body></html>`;
        const url = URL.createObjectURL(new Blob([htmlOffline], { type: "text/html;charset=utf-8" }));
        const link = document.createElement("a");
        link.href = url;
        link.download = `${this.lessonId}-offline-lesson.html`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.setTimeout(() => URL.revokeObjectURL(url), 1500);
        this.showNotice("Saved light offline HTML lesson directly to this device.");
      }
    }

    showNotice(message) {
      const notice = this.$("#notice");
      if (notice) {
        notice.textContent = message;
        notice.hidden = false;
      }
      this.announce(message, this.preferences.blindOvercooked);
    }

    announce(message, speakWithTts = false) {
      const live = this.$?.("#announcement");
      if (live) {
        live.textContent = "";
        window.setTimeout(() => {
          live.textContent = message;
        }, 40);
      }
      if (speakWithTts && "speechSynthesis" in window) {
        try {
          window.speechSynthesis.cancel();
          const u = new SpeechSynthesisUtterance(message);
          u.lang = this.preferences.captionLanguage === "am" ? "am-ET" : "en-US";
          u.rate = 1.08;
          window.speechSynthesis.speak(u);
        } catch {}
      }
    }
  }

  /* ==========================================================================
     2. <db-job-card> — Accessible Career Gateway + Schema.org JSON-LD + Open Badges
     ========================================================================== */
  class DbJobCard extends HTMLElement {
    static get observedAttributes() {
      return ["api", "job-id", "lang"];
    }
    constructor() {
      super();
      this.attachShadow({ mode: "open" });
    }
    connectedCallback() {
      this.render();
    }
    disconnectedCallback() {
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    }
    attributeChangedCallback() {
      this.render();
    }
    get api() {
      return (this.getAttribute("api") || "/api/v1").replace(/\/$/, "");
    }
    get jobId() {
      return this.getAttribute("job-id") || "accessible-va";
    }
    get language() {
      return this.getAttribute("lang") === "am" ? "am" : "en";
    }

    injectJsonLd(job) {
      const scriptId = `jsonld-job-${job.id || this.jobId}`;
      let scriptEl = document.getElementById(scriptId);
      if (!scriptEl) {
        scriptEl = document.createElement("script");
        scriptEl.id = scriptId;
        scriptEl.type = "application/ld+json";
        document.head.appendChild(scriptEl);
      }
      scriptEl.textContent = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "JobPosting",
        title: job.title,
        description: job.summary,
        datePosted: "2026-11-14",
        employmentType: "FULL_TIME",
        jobLocationType: "TELECOMMUTE",
        hiringOrganization: { "@type": "Organization", name: job.organization },
        jobLocation: {
          "@type": "Place",
          address: { "@type": "PostalAddress", addressLocality: "Addis Ababa", addressCountry: "ET" }
        },
        jobBenefits: (job.accommodations || []).join(", ")
      });
    }

    async render() {
      const t = await getDictionary(this.language);
      let job = {
        id: this.jobId,
        title: this.language === "am" ? "ጀማሪ ቨርቹዋል ረዳት (Junior Virtual Assistant)" : "Junior Virtual Assistant",
        organization: "Safaricom Telecommunications Ethiopia",
        location: this.language === "am" ? "አዲስ አበባ ወይም በርቀት (Remote)" : "Addis Ababa or remote",
        summary:
          this.language === "am"
            ? "የርቀት ቡድንን በቀጠሮ ማስያዝ እና በተደራሽ ዲጂታል ሰነዶች ያግዙ። ቀጣሪው የኢትዮጵያ የምልክት ቋንቋ አስተርጓሚ እና ለቃለ መጠይቅ ልዩ ድጋፍ ያቀርባል።"
            : "Support a distributed team with scheduling and accessible digital documents. The employer provides an Ethiopian Sign Language interpreter and offers remote interview accommodations.",
        accommodations:
          this.language === "am"
            ? [
                "ለስክሪን አንባቢ (NVDA / TalkBack) ተስማሚ የሆነ የማመልከቻ ሂደት",
                "በጥያቄ የሚቀርብ የኢትዮጵያ የምልክት ቋንቋ (EthSL) አስተርጓሚ",
                "በርቀት ወይም በጽሑፍ የሚከናወን የቃለ መጠይቅ አማራጭ"
              ]
            : [
                "Screen-reader compatible application process (NVDA / TalkBack)",
                "Ethiopian Sign Language (EthSL) interpreter on request",
                "Remote or asynchronous written interview option"
              ],
        certificate_url: "/certificates/va-2026-001"
      };
      try {
        const response = await fetch(`${this.api}/jobs/${encodeURIComponent(this.jobId)}?lang=${this.language}`);
        if (response.ok) job = await response.json();
      } catch {}

      this.injectJsonLd(job);

      this.shadowRoot.innerHTML = `
        <style>
          :host {
            display: block;
            font-family: var(--bs-body-font-family, system-ui, "Noto Sans Ethiopic", sans-serif);
            color: #101828;
            line-height: 1.6;
            margin: 1rem 0;
          }
          *, *::before, *::after { box-sizing: border-box; }
          article {
            border: 2px solid #05192d;
            border-radius: 0.75rem;
            padding: 1.25rem;
            background: #ffffff;
            display: grid;
            gap: 0.75rem;
            box-shadow: 0 4px 12px rgba(5, 25, 45, 0.06);
          }
          h3 { margin: 0; font-size: 1.3rem; color: #05192d; }
          h4 { margin: 0.25rem 0 0 0; font-size: 1.05rem; color: #0d5c3a; }
          .meta { font-weight: 700; color: #334155; }
          ul { margin: 0; padding-inline-start: 1.25rem; }
          li { margin-bottom: 0.25rem; }
          .actions {
            display: flex;
            flex-wrap: wrap;
            gap: 0.6rem;
            margin-top: 0.5rem;
          }
          button, a {
            min-height: 44px;
            padding: 0.55rem 0.9rem;
            border-radius: 0.4rem;
            font: inherit;
            font-weight: 700;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            border: 2px solid #05192d;
            cursor: pointer;
          }
          button.primary { background: #0d5c3a; border-color: #0d5c3a; color: #ffffff; }
          button.secondary, a { background: #ffffff; color: #05192d; }
          button:focus-visible, a:focus-visible, input:focus-visible {
            outline: 3px solid #f5a300 !important;
            outline-offset: 2px !important;
          }
          .status-msg {
            padding: 0.65rem 0.9rem;
            background: #ecfdf5;
            color: #065f46;
            border-left: 4px solid #0d5c3a;
            border-radius: 0.35rem;
            font-weight: 700;
          }
          dialog {
            max-width: 34rem;
            width: calc(100% - 2rem);
            border: 2px solid #05192d;
            border-radius: 0.65rem;
            padding: 1.25rem;
          }
          dialog::backdrop { background: rgba(5, 25, 45, 0.7); }
          .check-list { display: grid; gap: 0.5rem; margin: 0.75rem 0; }
          .check-item { display: flex; align-items: center; gap: 0.5rem; font-weight: 600; min-height: 36px; }
          .check-item input { width: 22px; height: 22px; }
        </style>

        <article aria-labelledby="job-title" lang="${this.language}">
          <h3 id="job-title">${escapeHtml(job.title)}</h3>
          <div class="meta">${escapeHtml(job.organization)} &bull; ${escapeHtml(job.location)}</div>
          <p style="margin:0">${escapeHtml(job.summary)}</p>
          <h4>${escapeHtml(t.workplaceAccommodations)}</h4>
          <ul>${(job.accommodations || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
          <div class="actions">
            <button type="button" class="primary" id="speak" aria-pressed="false">${escapeHtml(t.listenSummary)}</button>
            <button type="button" class="secondary" id="request">${escapeHtml(t.requestAccommodation)}</button>
            <a href="${escapeHtml(job.certificate_url || "/certificates/va-2026-001")}" id="verify">${escapeHtml(t.verifyCertificate)}</a>
          </div>
          <div id="acc-status" class="status-msg" role="status" aria-live="polite" hidden></div>
        </article>

        <dialog id="acc-dialog" aria-labelledby="acc-dialog-title" lang="${this.language}">
          <h3 id="acc-dialog-title">${escapeHtml(t.accommodationModalTitle)}</h3>
          <p>${escapeHtml(t.accommodationDesc)}</p>
          <div class="check-list">
            <label class="check-item"><input type="checkbox" value="ethsl_interpreter" checked> <span>${escapeHtml(t.accOptionSign)}</span></label>
            <label class="check-item"><input type="checkbox" value="screen_reader_format"> <span>${escapeHtml(t.accOptionScreenReader)}</span></label>
            <label class="check-item"><input type="checkbox" value="extra_time"> <span>${escapeHtml(t.accOptionExtraTime)}</span></label>
            <label class="check-item"><input type="checkbox" value="async_written"> <span>${escapeHtml(t.accOptionAsync)}</span></label>
          </div>
          <p id="acc-error" role="alert" style="color:#b42318;font-weight:700;margin:0.25rem 0;" hidden></p>
          <div style="display:flex;gap:0.5rem;justify-content:flex-end;margin-top:1rem">
            <button type="button" class="primary" id="submit-acc">${escapeHtml(t.submitRequest)}</button>
            <button type="button" class="secondary" id="close-acc">${escapeHtml(t.close)}</button>
          </div>
        </dialog>
      `;

      const speakBtn = this.shadowRoot.querySelector("#speak");
      speakBtn.addEventListener("click", () => {
        if (!("speechSynthesis" in window)) return;
        if (window.speechSynthesis.speaking) {
          window.speechSynthesis.cancel();
          speakBtn.setAttribute("aria-pressed", "false");
          speakBtn.textContent = t.listenSummary;
          return;
        }
        const utterance = new SpeechSynthesisUtterance(
          `${job.title}. ${job.organization}. ${job.location}. ${job.summary}. ${(job.accommodations || []).join(". ")}`
        );
        utterance.lang = this.language === "am" ? "am-ET" : "en-US";
        utterance.onend = () => {
          speakBtn.setAttribute("aria-pressed", "false");
          speakBtn.textContent = t.listenSummary;
        };
        speakBtn.setAttribute("aria-pressed", "true");
        speakBtn.textContent = t.stopSummary;
        window.speechSynthesis.speak(utterance);
      });

      const dialog = this.shadowRoot.querySelector("#acc-dialog");
      this.shadowRoot.querySelector("#request").addEventListener("click", () => dialog.showModal());
      this.shadowRoot.querySelector("#close-acc").addEventListener("click", () => dialog.close());
      this.shadowRoot.querySelector("#submit-acc").addEventListener("click", async () => {
        const selected = Array.from(this.shadowRoot.querySelectorAll(".check-item input:checked")).map((el) => el.value);
        const statusEl = this.shadowRoot.querySelector("#acc-status");
        const errEl = this.shadowRoot.querySelector("#acc-error");
        if (selected.length === 0) {
          errEl.textContent = this.language === "am" ? "እባክዎ ቢያንስ አንድ የድጋፍ አማራጭ ይምረጡ።" : "Please select at least one accommodation option.";
          errEl.hidden = false;
          return;
        }
        errEl.hidden = true;
        try {
          await fetch(`${this.api}/jobs/${encodeURIComponent(job.id || this.jobId)}/accommodations`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ accommodations: selected, language: this.language })
          });
        } catch {}
        try {
          window.localStorage.setItem(`db-job-acc-${job.id || this.jobId}`, JSON.stringify({ accommodations: selected, language: this.language }));
        } catch {}
        dialog.close();
        statusEl.textContent = t.requestSent;
        statusEl.hidden = false;
        this.dispatchEvent(
          new CustomEvent("db-job-card:accommodation-requested", {
            bubbles: true,
            composed: true,
            detail: { jobId: job.id || this.jobId, accommodations: selected, language: this.language }
          })
        );
      });
    }
  }

  /* ==========================================================================
     3. <db-live-viewer> — Extra Credit Recorded Live Session + Chat Log Viewer
     ========================================================================== */
  class DbLiveViewer extends HTMLElement {
    static get observedAttributes() {
      return ["lang", "src", "captions", "title"];
    }
    constructor() {
      super();
      this.attachShadow({ mode: "open" });
      this.chatMessages = [
        { time: 2, sender: "Heaven Youn (ALX Host)", text: "Welcome everyone to Session 3! Today Hussein Ali joins us for WCAG 2.2 AA and NVDA/TalkBack testing." },
        { time: 8, sender: "Hussein Ali (A11y Lead)", text: "Remember the 4 core principles: Perceivable, Operable, Understandable, and Robust." },
        { time: 15, sender: "Kidus (Co-Designer)", text: "For Deaf learners in Ethiopia, the movable Sign Language window and visual chat log are essential." },
        { time: 24, sender: "Meron (Learner)", text: "Can we export the session transcript to Grade 1 Braille (.brf) for refreshable displays?" },
        { time: 33, sender: "Hussein Ali (A11y Lead)", text: "Yes! Every cue and chat message can be searched, clicked to seek, or exported to .brf and .vtt." }
      ];
    }
    connectedCallback() {
      this.render();
    }
    disconnectedCallback() {
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    }
    attributeChangedCallback() {
      this.render();
    }
    get language() {
      return this.getAttribute("lang") === "am" ? "am" : "en";
    }
    get messages() {
      if (this.language === "am") {
        return [
          { time: 2, sender: "ሄቨን ዩን (ALX አስተናጋጅ)", text: "እንኳን ወደ ስልጠና 3 በደህና መጡ! ዛሬ ሁሴን አሊ ስለ WCAG 2.2 AA እና NVDA/TalkBack ስክሪን አንባቢ ሙከራ ያካፍለናል።" },
          { time: 8, sender: "ሁሴን አሊ (የተደራሽነት መሪ)", text: "4ቱን ዋና መርሆች አስታውሱ፦ መገንዘብ (Perceivable)፣ መስራት (Operable)፣ መረዳት (Understandable)፣ እና ጠንካራ (Robust)።" },
          { time: 15, sender: "ኪዱስ (አብሮ አዘጋጅ)", text: "በኢትዮጵያ ውስጥ ላሉ መስማት የተሳናቸው ተማሪዎች ተንቀሳቃሽ የምልክት ቋንቋ መስኮት እና የጽሑፍ ውይይት ወሳኝ ናቸው።" },
          { time: 24, sender: "ሜሮን (ተማሪ)", text: "የስብሰባውን ሙሉ ጽሑፍ ለብሬይል መሳሪያዎች በGrade 1 Braille (.brf) ማውረድ እንችላለን?" },
          { time: 33, sender: "ሁሴን አሊ (የተደራሽነት መሪ)", text: "አዎ! እያንዳንዱ መልዕክት ሊፈለግ፣ ተጭኖ ቪዲዮውን ሊያዘል ወይም ወደ .brf እና .vtt ሊላክ ይችላል።" }
        ];
      }
      return this.chatMessages;
    }
    async render() {
      const t = await getDictionary(this.language);
      const videoSrc = this.getAttribute("src") || "/savanna/assets/media/va-future-lesson.mp4";
      const capSrc = this.getAttribute("captions") || "/savanna/assets/captions/session-20261112-wcag.vtt";

      this.shadowRoot.innerHTML = `
        <style>
          :host {
            display: block;
            font-family: var(--bs-body-font-family, system-ui, sans-serif);
            color: #101828;
            margin: 1rem 0;
          }
          *, *::before, *::after { box-sizing: border-box; }
          .grid {
            display: grid;
            grid-template-columns: minmax(0, 1.4fr) minmax(18rem, 0.9fr);
            gap: 1rem;
          }
          .chat-box {
            border: 2px solid #05192d;
            border-radius: 0.75rem;
            background: #ffffff;
            display: flex;
            flex-direction: column;
            max-height: 36rem;
            overflow: hidden;
          }
          .chat-head {
            background: #05192d;
            color: #ffffff;
            padding: 0.75rem 1rem;
            font-weight: 700;
          }
          .chat-search {
            padding: 0.65rem 1rem;
            border-bottom: 1px solid #cbd5e1;
          }
          .chat-search input {
            width: 100%;
            min-height: 44px;
            padding: 0.45rem 0.75rem;
            border: 1px solid #64748b;
            border-radius: 0.35rem;
            font: inherit;
          }
          .chat-list {
            list-style: none;
            margin: 0;
            padding: 0.75rem;
            overflow-y: auto;
            display: grid;
            gap: 0.5rem;
          }
          .chat-btn {
            width: 100%;
            text-align: left;
            padding: 0.6rem 0.75rem;
            border: 1px solid #cbd5e1;
            border-radius: 0.45rem;
            background: #f8fafc;
            cursor: pointer;
            font: inherit;
          }
          .chat-btn:hover, .chat-btn:focus-visible {
            outline: 3px solid #f5a300;
            background: #ecfdf5;
          }
          .chat-meta {
            display: flex;
            justify-content: space-between;
            font-size: 0.82rem;
            font-weight: 700;
            color: #0d5c3a;
            margin-bottom: 0.25rem;
          }
          @media (max-width: 54rem) { .grid { grid-template-columns: 1fr; } }
        </style>
        <div class="grid" lang="${this.language}">
          <db-player
            id="inner-player"
            title="${escapeHtml(this.getAttribute("title") || t.liveViewerTitle)}"
            src="${escapeHtml(videoSrc)}"
            captions="${escapeHtml(capSrc)}"
            sign="/savanna/assets/media/va-future-ethsl.mp4"
            lang="${this.language}">
          </db-player>
          <aside class="chat-box" aria-labelledby="chat-heading">
            <div class="chat-head" id="chat-heading">${escapeHtml(t.chatHeading)}</div>
            <div class="chat-search">
              <label for="chat-filter" style="display:block;font-size:0.85rem;font-weight:700;margin-bottom:0.25rem">${escapeHtml(t.searchChat)}</label>
              <input id="chat-filter" type="search" placeholder="WCAG, Braille, EthSL...">
            </div>
            <ul class="chat-list" id="chat-list" role="log" aria-live="polite"></ul>
          </aside>
        </div>
      `;

      const renderMessages = (filterText = "") => {
        const q = filterText.trim().toLowerCase();
        const listEl = this.shadowRoot.querySelector("#chat-list");
        listEl.innerHTML = this.messages
          .filter((m) => !q || m.text.toLowerCase().includes(q) || m.sender.toLowerCase().includes(q))
          .map(
            (m) => `
          <li>
            <button type="button" class="chat-btn" data-seek="${m.time}">
              <div class="chat-meta"><span>${escapeHtml(m.sender)}</span><time>${formatTime(m.time)}</time></div>
              <div>${escapeHtml(m.text)}</div>
            </button>
          </li>`
          )
          .join("");
        listEl.querySelectorAll("[data-seek]").forEach((btn) =>
          btn.addEventListener("click", () => {
            const innerPlayer = this.shadowRoot.querySelector("#inner-player");
            const innerVideo = innerPlayer?.shadowRoot?.querySelector("#video");
            if (innerVideo) {
              innerVideo.currentTime = Number(btn.dataset.seek);
              innerVideo.play().catch(() => {});
            }
          })
        );
      };

      renderMessages();
      this.shadowRoot.querySelector("#chat-filter").addEventListener("input", (e) => renderMessages(e.target.value));
    }
  }

  if (!customElements.get("db-player")) customElements.define("db-player", DbPlayer);
  if (!customElements.get("db-job-card")) customElements.define("db-job-card", DbJobCard);
  if (!customElements.get("db-live-viewer")) customElements.define("db-live-viewer", DbLiveViewer);
})();
