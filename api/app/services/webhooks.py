"""Webhook dispatcher and persistence service."""

from __future__ import annotations

import json
import urllib.request
from datetime import datetime, timezone

from ..core.config import DATA_DIRECTORY, WEBHOOKS_FILE
from ..schemas.webhooks import WebhookRegistration


def fire_webhooks(event_name: str, payload: dict) -> None:
    if not WEBHOOKS_FILE.is_file():
        return
    try:
        hooks = json.loads(WEBHOOKS_FILE.read_text(encoding="utf-8"))
    except Exception:
        return
    body = json.dumps({
        "event": event_name,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "data": payload,
    }).encode("utf-8")
    for hook in hooks:
        url = hook.get("url")
        if not url:
            continue
        try:
            req = urllib.request.Request(url, data=body, headers={"Content-Type": "application/json"}, method="POST")
            urllib.request.urlopen(req, timeout=2)
        except Exception:
            pass


def list_webhooks() -> list[dict]:
    if not WEBHOOKS_FILE.is_file():
        return []
    try:
        return json.loads(WEBHOOKS_FILE.read_text(encoding="utf-8"))
    except Exception:
        return []


def register_webhook(hook: WebhookRegistration) -> dict:
    DATA_DIRECTORY.mkdir(parents=True, exist_ok=True)
    hooks = []
    if WEBHOOKS_FILE.is_file():
        try:
            hooks = json.loads(WEBHOOKS_FILE.read_text(encoding="utf-8"))
        except Exception:
            hooks = []
    entry = {"id": f"wh-{len(hooks) + 1:03d}", "url": hook.url, "events": hook.events}
    hooks.append(entry)
    WEBHOOKS_FILE.write_text(json.dumps(hooks, indent=2), encoding="utf-8")
    return entry
