"""Router for Real-Time Ethiopian Sign Language (EthSL) Translation & Lexicon API."""

from __future__ import annotations

from fastapi import APIRouter
from pydantic import BaseModel, Field

from ..services.sign_translator import ETHSL_LEXICON, translate_to_ethsl_gloss

router = APIRouter()


class SignTranslationRequest(BaseModel):
    text: str = Field(..., min_length=1, description="English or Amharic sentence or caption cue to translate into EthSL")
    language: str = Field(default="en", description="Source language code ('en' or 'am')")


@router.post("/api/v1/sign/translate", tags=["sign-language"])
def translate_sign_endpoint(payload: SignTranslationRequest) -> dict:
    """Translates live speech, caption cues, or custom text into Ethiopian Sign Language (EthSL)
    Subject-Object-Verb (SOV) glosses, kinematic handshapes, facial markers, and fingerspelling.
    """
    return translate_to_ethsl_gloss(payload.text, payload.language)


@router.get("/api/v1/sign/dictionary", tags=["sign-language"])
def get_sign_dictionary() -> dict:
    """Returns the built-in Ethiopian Sign Language (EthSL) technical & career vocabulary lexicon."""
    return {
        "language": "EthSL (Ethiopian Sign Language / የኢትዮጵያ የምልክት ቋንቋ)",
        "grammar": "Subject-Object-Verb (SOV) with Non-Manual Facial Markers",
        "count": len(ETHSL_LEXICON),
        "signs": ETHSL_LEXICON,
    }
