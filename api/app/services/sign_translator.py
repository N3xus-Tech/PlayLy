"""Real-Time Ethiopian Sign Language (EthSL) Translation & Gloss Engine.

Converts English and Amharic spoken/written sentences or live WebVTT caption cues
into Ethiopian Sign Language (EthSL) Subject-Object-Verb (SOV) / Topic-Comment gloss streams,
complete with handshape, anatomical location, kinematic movement trajectory, non-manual
facial markers, haptic vibration patterns, and character-by-character fingerspelling fallback.
"""

from __future__ import annotations

import re
from typing import Any

STOPWORDS_EN = {
    "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
    "to", "of", "in", "on", "at", "by", "for", "with", "as", "into", "that", "this"
}

ETHSL_LEXICON: dict[str, dict[str, Any]] = {
    "welcome": {
        "gloss_en": "WELCOME",
        "gloss_am": "እንኳን-ደህና-መጡ",
        "handshape": "B-Flat Open Palm (5-Hand)",
        "location": "Neutral Chest Space",
        "movement": "Open palms sweep inward toward chest with warm nod",
        "facial_marker": "Raised eyebrows + welcoming smile",
        "pose": "welcome",
    },
    "module": {
        "gloss_en": "MODULE-LESSON",
        "gloss_am": "ትምህርት-ክፍል",
        "handshape": "Flat-B Base + C-Classifier",
        "location": "Non-dominant Palm",
        "movement": "Structured step block placed on palm",
        "facial_marker": "Focused neutral expression",
        "pose": "work",
    },
    "future": {
        "gloss_en": "FUTURE-AHEAD",
        "gloss_am": "ወደፊት",
        "handshape": "Flat-B Vertical Palm",
        "location": "Beside Temple / Cheek",
        "movement": "Forward arc extending ahead of body",
        "facial_marker": "Eyes tracking forward arc",
        "pose": "expand",
    },
    "virtual": {
        "gloss_en": "VIRTUAL-DIGITAL",
        "gloss_am": "ዲጂታል-ርቀት",
        "handshape": "V-Hand / Flicking Fingers",
        "location": "Upper Neutral Space",
        "movement": "Circular digital network oscillation",
        "facial_marker": "Raised eyebrows (topic marker)",
        "pose": "think",
    },
    "assistant": {
        "gloss_en": "ASSISTANT-HELPER",
        "gloss_am": "ረዳት-ባለሙያ",
        "handshape": "A-Thumb-Up on Flat Palm",
        "location": "Center Chest",
        "movement": "Dominant palm lifts non-dominant A-hand upward",
        "facial_marker": "Supportive nod",
        "pose": "empathy",
    },
    "industry": {
        "gloss_en": "INDUSTRY-SECTOR",
        "gloss_am": "ኢንዱስትሪ-ዘርፍ",
        "handshape": "S-Fists Alternating",
        "location": "Neutral Space",
        "movement": "Rotational gear-like circular motion",
        "facial_marker": "Steady gaze",
        "pose": "work",
    },
    "evolving": {
        "gloss_en": "EVOLVE-TRANSFORM",
        "gloss_am": "መሻሻል-ማደግ",
        "handshape": "Closed-O Opening to 5-Spread",
        "location": "Center Chest Rising",
        "movement": "Spiral upward expansion",
        "facial_marker": "Slightly open mouth (intensity marker)",
        "pose": "expand",
    },
    "global": {
        "gloss_en": "WORLD-GLOBAL",
        "gloss_am": "ዓለም-አቀፍ",
        "handshape": "Two Curved C-Hands / W-Hands",
        "location": "Central Sphere Space",
        "movement": "Hands trace large globe circumference outward",
        "facial_marker": "Wide eyes (scale marker)",
        "pose": "expand",
    },
    "remote": {
        "gloss_en": "REMOTE-DISTANCE",
        "gloss_am": "የርቀት-ሥራ",
        "handshape": "I-L-Y / Index-to-Index",
        "location": "Near Shoulder -> Extended Forward",
        "movement": "Connection line projected across distance",
        "facial_marker": "Focused nod",
        "pose": "join",
    },
    "work": {
        "gloss_en": "WORK-TASK",
        "gloss_am": "ሥራ",
        "handshape": "Double S-Fists",
        "location": "Neutral Front",
        "movement": "Dominant wrist taps back of non-dominant wrist twice",
        "facial_marker": "Direct gaze",
        "pose": "work",
    },
    "ai": {
        "gloss_en": "AI-COMPUTE",
        "gloss_am": "ኤአይ-ቴክኖሎጂ",
        "handshape": "Claw-5 / Index-1 at Temple",
        "location": "Right Temple",
        "movement": "Rapid neural rotation beside forehead",
        "facial_marker": "Analytical brow furrow",
        "pose": "think",
    },
    "human": {
        "gloss_en": "HUMAN-PERSON",
        "gloss_am": "የሰው-ልጅ",
        "handshape": "Parallel P/B-Palms",
        "location": "Torso Sides",
        "movement": "Downward parallel sweep outlining human torso",
        "facial_marker": "Warm affirmative nod",
        "pose": "empathy",
    },
    "empathy": {
        "gloss_en": "EMPATHY-UNDERSTAND",
        "gloss_am": "ርኅራኄ-መረዳት",
        "handshape": "Open-8 (Middle Finger Bent)",
        "location": "Over Heart -> Forward",
        "movement": "Touch heart then extend open palm toward interlocutor",
        "facial_marker": "Softened eyes + head tilt",
        "pose": "empathy",
    },
    "judgment": {
        "gloss_en": "JUDGMENT-DECIDE",
        "gloss_am": "ውሳኔ-አሰጣጥ",
        "handshape": "Two F-Scale Hands",
        "location": "Neutral Space",
        "movement": "Alternating balance scale motion -> firm downward lock",
        "facial_marker": "Firm decisive nod",
        "pose": "contrast",
    },
    "ethiopian": {
        "gloss_en": "ETHIOPIA",
        "gloss_am": "ኢትዮጵያ",
        "handshape": "3-Finger / Crown Touch",
        "location": "Forehead / Temple",
        "movement": "Distinctive Ethiopian sign marker at forehead with pride nod",
        "facial_marker": "Proud upright posture",
        "pose": "join",
    },
    "ethiopia": {
        "gloss_en": "ETHIOPIA",
        "gloss_am": "ኢትዮጵያ",
        "handshape": "3-Finger / Crown Touch",
        "location": "Forehead / Temple",
        "movement": "Distinctive Ethiopian sign marker at forehead with pride nod",
        "facial_marker": "Proud upright posture",
        "pose": "join",
    },
    "certificate": {
        "gloss_en": "CERTIFICATE-BADGE",
        "gloss_am": "የምስክር-ወረቀት",
        "handshape": "C-Hand / Flat Stamp",
        "location": "Left Chest / Palm",
        "movement": "Seal stamp gesture onto open palm",
        "facial_marker": "Affirmative nod",
        "pose": "finish",
    },
    "complete": {
        "gloss_en": "FINISH-COMPLETE",
        "gloss_am": "ማጠናቀቅ-መጨረስ",
        "handshape": "Two 5-Open Palms",
        "location": "Neutral Chest Space",
        "movement": "Crisp outward wrist flip (palms in -> palms down)",
        "facial_marker": "Completion mouth marker 'pah'",
        "pose": "finish",
    },
    "html": {
        "gloss_en": "HTML-CODE",
        "gloss_am": "ኤችቲኤምኤል-ኮድ",
        "handshape": "H -> T -> M -> L + Angle-Bracket Hands",
        "location": "Neutral Coding Space",
        "movement": "Symmetric angle-bracket `< >` framing gesture",
        "facial_marker": "Technical focus",
        "pose": "code",
    },
    "h1": {
        "gloss_en": "H1-MAIN-HEADING",
        "gloss_am": "ዋና-ርዕስ-H1",
        "handshape": "H-Hand -> 1-Index at Top",
        "location": "High Neutral Space (Top of Page)",
        "movement": "Horizontal banner sweep across top visual field",
        "facial_marker": "Raised brows (primary hierarchy)",
        "pose": "code",
    },
}

# Amharic keyword aliases mapped to the same canonical EthSL entries
AMHARIC_ALIASES: dict[str, str] = {
    "እንኳን": "welcome",
    "ደህና": "welcome",
    "ሞጁል": "module",
    "ትምህርት": "module",
    "ወደፊት": "future",
    "ቨርቹዋል": "virtual",
    "ረዳት": "assistant",
    "ኢንዱስትሪ": "industry",
    "እየተሻሻለ": "evolving",
    "ዓለም": "global",
    "ርቀት": "remote",
    "ሥራ": "work",
    "ስራ": "work",
    "ኤአይ": "ai",
    "ሰው": "human",
    "ባለሙያዎች": "human",
    "መረዳት": "empathy",
    "ርኅራኄ": "empathy",
    "ውሳኔ": "judgment",
    "ኢትዮጵያ": "ethiopia",
    "ምስክር": "certificate",
    "ወረቀት": "certificate",
    "ያጠናቅቁ": "complete",
}


def translate_to_ethsl_gloss(text: str, language: str = "en") -> dict[str, Any]:
    """Translates English or Amharic input text into an Ethiopian Sign Language (EthSL)
    SOV / Topic-Comment gloss sequence with kinematic pose tokens and fingerspelling.
    """
    raw = (text or "").strip()
    if not raw:
        return {
            "source_text": "",
            "language": language,
            "grammar": "EthSL Topic-Comment / SOV",
            "sound_cues": [],
            "gloss_sequence": [],
            "gloss_string_en": "",
            "gloss_string_am": "",
        }

    # Extract non-speech sound cues in brackets like [Introductory chime]
    sound_cues = re.findall(r"\[([^\]]+)\]", raw)
    cleaned = re.sub(r"\[[^\]]+\]", "", raw).strip()

    # Tokenize words preserving Ethiopic and Latin characters
    words = re.findall(r"[\w\u1200-\u137F]+", cleaned.lower())

    tokens: list[dict[str, Any]] = []
    verbs_for_sov_end: list[dict[str, Any]] = []
    verb_keys = {"welcome", "evolving", "complete", "judgment", "work"}

    for w in words:
        if language == "en" and w in STOPWORDS_EN:
            continue
        canonical = None
        if w in {"ወደ", "እና", "ውስጥ", "ላይ", "ጋር", "ነው", "ናቸው", "ወይም", "ግን"}:
            continue
        stripped_am = w[1:] if len(w) > 2 and w[0] in {"በ", "ለ", "ከ", "የ"} else w
        if w in ETHSL_LEXICON:
            canonical = w
        elif w in AMHARIC_ALIASES:
            canonical = AMHARIC_ALIASES[w]
        elif stripped_am in AMHARIC_ALIASES:
            canonical = AMHARIC_ALIASES[stripped_am]
        else:
            for am_k, am_v in AMHARIC_ALIASES.items():
                if am_k in w or am_k in stripped_am:
                    canonical = am_v
                    break
            # Check prefix stem match
            for k in ETHSL_LEXICON:
                if len(w) >= 4 and (w.startswith(k[:4]) or k.startswith(w[:4])):
                    canonical = k
                    break

        if canonical and canonical in ETHSL_LEXICON:
            entry = ETHSL_LEXICON[canonical]
            item = {
                "word": w,
                "type": "lexical_sign",
                "gloss_en": entry["gloss_en"],
                "gloss_am": entry["gloss_am"],
                "handshape": entry["handshape"],
                "location": entry["location"],
                "movement": entry["movement"],
                "facial_marker": entry["facial_marker"],
                "pose": entry["pose"],
                "fingerspell": list(w.upper()[:8]),
            }
            if canonical in verb_keys:
                verbs_for_sov_end.append(item)
            else:
                tokens.append(item)
        else:
            # Fingerspelling fallback for proper nouns / technical acronyms
            letters = list(w.upper()[:10])
            tokens.append({
                "word": w,
                "type": "fingerspelling",
                "gloss_en": f"FS:{'-'.join(letters)}",
                "gloss_am": f"ፊደል፦{'-'.join(letters)}",
                "handshape": "EthSL HaHu / Manual Alphabet Handshapes",
                "location": "Dominant Shoulder Fingerspelling Box",
                "movement": f"Sequential manual spelling ({len(letters)} characters)",
                "facial_marker": "Mouthing lexical characters",
                "pose": "fingerspell",
                "fingerspell": letters,
            })

    # Reorder into EthSL Subject-Object-Verb (SOV) order by placing predicate signs at clause end
    sov_sequence = tokens + verbs_for_sov_end

    # Deduplicate consecutive identical glosses
    deduped: list[dict[str, Any]] = []
    for item in sov_sequence:
        if not deduped or deduped[-1]["gloss_en"] != item["gloss_en"]:
            deduped.append(item)

    return {
        "source_text": raw,
        "language": language,
        "grammar": "EthSL Subject-Object-Verb (SOV) & Topic-Comment",
        "sound_cues": sound_cues,
        "haptic_pattern_ms": [120, 60, 120] if sound_cues else [40],
        "gloss_sequence": deduped,
        "gloss_string_en": " • ".join(t["gloss_en"] for t in deduped),
        "gloss_string_am": " • ".join(t["gloss_am"] for t in deduped),
    }
