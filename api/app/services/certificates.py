"""Open Badges 3.0 verifiable credential issuance, cryptographic HMAC-SHA256 verification, and HTML rendering."""

from __future__ import annotations

import hashlib
import hmac
import html as html_module
import json

from ..core.config import CERTIFICATE_SECRET

ISSUED_CREDENTIALS = {
    "va-2026-001": {
        "learner_id": "learner-alx-2026-001",
        "learner_name": "Abel Alemayehu",
        "achievement_id": "va-future",
        "achievement_name": "The Future of the VA Industry: Accessible Media & Professional Identity",
        "issued_on": "2026-11-14T00:00:00Z",
    }
}


def make_certificate(credential_id: str) -> dict | None:
    record = ISSUED_CREDENTIALS.get(credential_id)
    if not record:
        return None
    credential = {
        "@context": [
            "https://www.w3.org/ns/credentials/v2",
            "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json",
        ],
        "id": f"https://savanna.alxafrica.com/credentials/{credential_id}",
        "type": ["VerifiableCredential", "OpenBadgeCredential"],
        "issuer": {
            "id": "https://savanna.alxafrica.com/issuer",
            "type": ["Profile"],
            "name": "ALX Digital Bridge Certification Authority",
        },
        "validFrom": record["issued_on"],
        "credentialSubject": {
            "id": record["learner_id"],
            "type": ["AchievementSubject"],
            "achievement": {
                "id": f"https://savanna.alxafrica.com/achievements/{record['achievement_id']}",
                "type": ["Achievement"],
                "name": record["achievement_name"],
                "description": (
                    "Successfully completed the Digital Bridge accessible media "
                    "curriculum with bilingual caption review and accessibility competencies."
                ),
            },
        },
    }
    digest = hmac.new(
        CERTIFICATE_SECRET,
        json.dumps(credential, sort_keys=True).encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()
    credential["proof"] = {
        "type": "DataIntegrityProof",
        "cryptosuite": "hmac-sha256-2026",
        "created": record["issued_on"],
        "proofPurpose": "assertionMethod",
        "verificationMethod": "https://savanna.alxafrica.com/keys/2026-sha256",
        "proofValue": digest,
    }
    return credential


def verify_certificate_signature(credential: dict | None, override_sig: str | None = None) -> bool:
    if not credential or not isinstance(credential, dict):
        return False
    received_proof = credential.get("proof")
    if not isinstance(received_proof, dict):
        return False
    payload = {key: value for key, value in credential.items() if key != "proof"}
    expected = hmac.new(
        CERTIFICATE_SECRET,
        json.dumps(payload, sort_keys=True).encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()
    candidate_sig = override_sig if override_sig is not None else received_proof.get("proofValue", "")
    return hmac.compare_digest(candidate_sig, expected)


def render_certificate_html(credential_id: str, sig: str | None = None) -> str:
    credential = make_certificate(credential_id)
    is_valid = verify_certificate_signature(credential, override_sig=sig)
    status_label = (
        "valid — Verified ALX Digital Bridge Open Badge 3.0 Credential"
        if is_valid
        else "not valid — Credential Signature or ID Could Not Be Verified"
    )
    badge_bg = "#ecfdf5" if is_valid else "#fef2f2"
    badge_border = "#0d5c3a" if is_valid else "#b42318"
    badge_text = "#065f46" if is_valid else "#991b1b"

    achievement_name = (
        credential["credentialSubject"]["achievement"]["name"]
        if credential
        else "Unrecognized / Tampered Credential"
    )
    proof_val = credential["proof"]["proofValue"] if credential else "N/A"

    return f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>ALX Open Badges 3.0 Verification</title>
  <style>
    body {{ font-family: system-ui, -apple-system, sans-serif; max-width: 48rem; margin: 2.5rem auto; padding: 0 1.25rem; line-height: 1.6; color: #101828; }}
    .status-box {{ background: {badge_bg}; border: 2px solid {badge_border}; color: {badge_text}; padding: 1rem 1.25rem; border-radius: 0.5rem; font-weight: 700; font-size: 1.15rem; margin: 1.25rem 0; }}
    dl {{ display: grid; grid-template-columns: 11rem 1fr; gap: 0.5rem 1rem; background: #f8fafc; padding: 1.25rem; border-radius: 0.5rem; border: 1px solid #cbd5e1; }}
    dt {{ font-weight: 700; color: #05192d; }}
    dd {{ margin: 0; word-break: break-all; }}
    a {{ color: #0d5c3a; font-weight: 700; }}
    a:focus-visible {{ outline: 3px solid #f5a300; outline-offset: 2px; }}
  </style>
</head>
<body>
  <main>
    <h1>ALX Digital Bridge — Open Badges 3.0 Verification</h1>
    <div class="status-box" role="status" aria-live="polite">{html_module.escape(status_label)}</div>
    <dl>
      <dt>Credential ID</dt><dd>{html_module.escape(credential_id)}</dd>
      <dt>Achievement</dt><dd>{html_module.escape(achievement_name)}</dd>
      <dt>Standard</dt><dd>W3C Verifiable Credentials 2.0 / Open Badges 3.0 (HMAC-SHA256)</dd>
      <dt>Cryptographic Proof</dt><dd><code>{html_module.escape(sig or proof_val)}</code></dd>
    </dl>
    <p style="margin-top:1.25rem">
      <a href="/api/v1/certificates/{html_module.escape(credential_id)}">View Machine-Readable JSON Credential</a> |
      <a href="/certificates/{html_module.escape(credential_id)}?sig=tampered_invalid_signature">Test Tampered Signature ("not valid" state)</a> |
      <a href="/savanna/pages/jobs.html">Return to Career Gateway</a>
    </p>
  </main>
</body>
</html>"""
