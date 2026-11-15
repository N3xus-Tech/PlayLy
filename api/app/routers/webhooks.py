"""Router for webhooks registration and inspection."""

from __future__ import annotations

from fastapi import APIRouter
from fastapi.responses import JSONResponse

from ..schemas.webhooks import WebhookRegistration
from ..services.webhooks import (
    list_webhooks as service_list_webhooks,
    register_webhook as service_register_webhook,
)

router = APIRouter(tags=["webhooks"])


@router.post("/api/v1/webhooks", status_code=201)
def register_webhook(hook: WebhookRegistration) -> JSONResponse:
    entry = service_register_webhook(hook)
    return JSONResponse(status_code=201, content=entry)


@router.get("/api/v1/webhooks")
def list_webhooks() -> list[dict]:
    return service_list_webhooks()
