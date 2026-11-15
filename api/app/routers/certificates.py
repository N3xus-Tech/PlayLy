"""Router for Open Badges 3.0 cryptographic verification endpoints and web verification page."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Query
from fastapi.responses import HTMLResponse

from ..services.certificates import (
    make_certificate,
    render_certificate_html,
    verify_certificate_signature,
)

router = APIRouter(tags=["career"])


@router.get("/api/v1/certificates/{credential_id}")
def get_certificate(
    credential_id: str,
    sig: Annotated[str | None, Query(description="Optional signature override to test invalid/tampered proofs")] = None,
) -> dict:
    credential = make_certificate(credential_id)
    if not credential:
        return {"credential": None, "valid": False, "status": "not_valid", "reason": "Unknown credential ID"}
    is_valid = verify_certificate_signature(credential, override_sig=sig)
    return {
        "credential": credential,
        "valid": is_valid,
        "status": "valid" if is_valid else "not_valid",
    }


@router.get("/certificates/{credential_id}", response_class=HTMLResponse)
def verify_certificate_page(
    credential_id: str,
    sig: Annotated[str | None, Query(description="Optional signature override to test invalid/tampered proofs")] = None,
) -> HTMLResponse:
    html_content = render_certificate_html(credential_id, sig=sig)
    return HTMLResponse(content=html_content)
