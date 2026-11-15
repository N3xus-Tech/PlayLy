"""Compatibility module re-exporting schemas as models."""

from __future__ import annotations

from .schemas import AccommodationRequest, CaptionCorrection, WebhookRegistration

__all__ = [
    "CaptionCorrection",
    "AccommodationRequest",
    "WebhookRegistration",
]
