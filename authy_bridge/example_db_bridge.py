"""Database example wrapper (v0.3, official tone)

Wrap a DB query with ISM-X attestation.

Required:
- A valid passport_b64 (obtained from your issuing endpoint)
- A per-session HMAC key to produce metrics_tag

This module demonstrates how to gate DB queries using the attestation client.
"""
import os, secrets
from authy_bridge.authy_client import ISMXAuthyClient

SESSION_ID = os.getenv("DEMO_SESSION", "sess-db-001")
SCOPE = os.getenv("ISMX_SCOPE", "db.query")
KEY = os.getenv("ISMX_TAG_KEY_B64")
KEY = __import__("base64").b64decode(KEY) if KEY else b"development-only-demo-key-32bytes!!!!"

def fake_db_query(sql: str):
    return [{"ok": True, "sql": sql, "rows": 3}]

def run_query_with_authy(sql: str, passport_b64: str):
    client = ISMXAuthyClient()
    nonce = secrets.token_urlsafe(12)
    tag = client.make_metrics_tag(SESSION_ID, nonce, SCOPE, KEY)
    res = client.verify_remote(passport_b64=passport_b64, metrics_tag=tag, scope=SCOPE)
    if not res.ok and "verify_remote error" in res.reason:
        res = client.verify_local(passport_b64=passport_b64, metrics_tag=tag, scope=SCOPE)
    if not res.ok:
        raise PermissionError(f"Attestation failed: {res.reason}")
    return fake_db_query(sql)
