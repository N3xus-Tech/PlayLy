"""Pydantic schema for webhook registrations."""

from __future__ import annotations

from pydantic import BaseModel, Field


class WebhookRegistration(BaseModel):
    url: str = Field(..., description="Target HTTPS/HTTP URL to receive webhook events")
    events: list[str] = Field(
        default=["lesson.completed", "captions.updated", "job.accommodation_requested"],
        description="Subscribed event types",
    )
