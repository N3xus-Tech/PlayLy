"""Pydantic schema for caption correction submissions."""

from __future__ import annotations

from pydantic import BaseModel, Field


class CaptionCorrection(BaseModel):
    lesson_id: str = Field(..., description="The lesson identifier")
    language: str = Field(..., pattern="^(en|am)$", description="Two-letter language code (en or am)")
    reviewer: str = Field(..., min_length=2, description="Reviewer name or identifier")
    notes: str = Field("", description="Optional notes on the changes")
