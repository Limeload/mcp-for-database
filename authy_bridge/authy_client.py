"""ISM-X Attestation Client — official helper (v0.3)

This client adds an optional attestation step to protect database access or
command execution. It supports remote verification via an HTTP /verify endpoint
and a local verification fallback (Ed25519 signature + HMAC commitment).

Dependencies:
    requests, pynacl

Environment (recommended):
    ISMX_VERIFY_URL  = http://127.0.0.1:8010/verify
    ISMX_PUBKEY_B64  = base64 Ed25519 public key (for local verify)
    ISMX_SCOPE       = default scope string (e.g., "db.query" or "agent.exec")

Security notes:
- Only commitments (HMAC tags) are sent, never raw private metrics.
- Use short TTLs and revoke capabilities promptly.
- Store per-session HMAC keys securely.
"""
from __future__ import annotations
import os, time, hmac, hashlib, base64, json, secrets
from dataclasses import dataclass
from typing import Optional, Dict, Any
import requests
from nacl.signing import VerifyKey
from nacl.exceptions import BadSignatureError

DEFAULT_VERIFY_URL = os.getenv("ISMX_VERIFY_URL", "http://127.0.0.1:8010/verify")
DEFAULT_SCOPE = os.getenv("ISMX_SCOPE", "db.query")

def _b64u(b: bytes) -> str:
    return base64.urlsafe_b64encode(b).decode().rstrip("=")

def _unb64u(s: str) -> bytes:
    pad = "=" * (-len(s) % 4)
    return base64.urlsafe_b64decode(s + pad)

@dataclass
class VerifyResult:
    ok: bool
    reason: str = ""
    claims: Optional[Dict[str, Any]] = None

class ISMXAuthyClient:
    def __init__(self, verify_url: str = DEFAULT_VERIFY_URL, pubkey_b64: Optional[str] = os.getenv("ISMX_PUBKEY_B64")):
        self.verify_url = verify_url
        self.pubkey_b64 = pubkey_b64

    @staticmethod
    def make_metrics_tag(session_id: str, nonce: str, scope: str, key: bytes) -> str:
        msg = f"{session_id}|{nonce}|{scope}".encode()
        return _b64u(hmac.new(key, msg, hashlib.sha256).digest())

    def verify_remote(self, passport_b64: str, metrics_tag: str, scope: str = DEFAULT_SCOPE) -> VerifyResult:
        try:
            r = requests.post(self.verify_url, json={
                "passport_b64": passport_b64, "metrics_tag": metrics_tag, "scope": scope
            }, timeout=8)
            if r.status_code != 200:
                return VerifyResult(False, f"HTTP {r.status_code}: {r.text}")
            data = r.json()
            return VerifyResult(bool(data.get("ok", False)), data.get("reason", ""), data.get("claims"))
        except Exception as e:
            return VerifyResult(False, f"verify_remote error: {e}")

    def verify_local(self, passport_b64: str, metrics_tag: str, scope: str = DEFAULT_SCOPE) -> VerifyResult:
        if not self.pubkey_b64:
            return VerifyResult(False, "Missing ISMX_PUBKEY_B64 for local verification")
        try:
            blob = _unb64u(passport_b64)
            sig_b64u, payload_json = blob.split(b".", 1)
            VerifyKey(base64.b64decode(self.pubkey_b64)).verify(payload_json, _unb64u(sig_b64u.decode()))
            claims = json.loads(payload_json.decode("utf-8"))
            if claims.get("scope") != scope:
                return VerifyResult(False, f"Scope mismatch: {claims.get('scope')} != {scope}")
            if int(claims.get("exp", 0)) < int(time.time()):
                return VerifyResult(False, "Passport expired", claims)
            if not hmac.compare_digest(metrics_tag, claims.get("tag", "")):
                return VerifyResult(False, "Metrics tag mismatch", claims)
            return VerifyResult(True, "OK", claims)
        except BadSignatureError:
            return VerifyResult(False, "Bad Ed25519 signature")
        except Exception as e:
            return VerifyResult(False, f"verify_local error: {e}")
