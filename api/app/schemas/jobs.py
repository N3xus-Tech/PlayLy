"""Pydantic schema for job interview accommodation requests."""

from __future__ import annotations

from pydantic import BaseModel, Field


class AccommodationRequest(BaseModel):
    accommodations: list[str] = Field(..., min_length=1, description="Requested interview accommodations")
    language: str = Field("en", pattern="^(en|am)$", description="Preferred communication language")
