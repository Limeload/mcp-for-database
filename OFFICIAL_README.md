# ISM-X Bridges v0.3.1 — Official Package

This package adds an optional **attestation layer** to two integration targets:

1. **MCP‑for‑Database** — protect database queries with cryptographic attestation.
2. **Terminal_CLI_Agent** — protect shell command execution with cryptographic attestation.

The design uses **Ed25519** signatures for passports and **HMAC‑SHA256** commitments for
redacted metrics, with short‑lived, single‑use capability leases and replay protection.

No private metrics are transmitted. Only commitments and signed envelopes are exchanged.

## Components
- `authy_bridge/` — minimal client helper + database example wrapper
- `cli_bridge/` — command‑execution wrapper for Terminal_CLI_Agent
- `ismx/passport.py` — passport issue/verify (fixed TTL verify)
- `tokens.py` — single‑use capability leases with replay protection
- `auth0_utils.py` — Auth0 RS256 verification with thread‑safe JWKS cache
- `examples/mcp_integration.py` — FastAPI example integration for MCP‑for‑Database
- `tests/test_comprehensive.py` — comprehensive tests
- `docs/` — architecture, security notes, PR templates, certification report

## Quick Start
```bash
pip install requests pynacl python-jose[cryptography] httpx fastapi

# Environment (examples)
set ISMX_VERIFY_URL=http://127.0.0.1:8010/verify
set ISMX_PUBKEY_B64=<Ed25519 public key (base64)>
set ISMX_SCOPE=db.query
set ISMX_TAG_KEY_B64=<base64 32-byte secret>
set CLI_SESSION=my-session-42
```

**Database wrapper**
```python
from authy_bridge.example_db_bridge import run_query_with_authy
rows = run_query_with_authy("SELECT * FROM customers LIMIT 10;", passport_b64=DEMO_PASSPORT_B64)
```

**CLI wrapper**
```python
from cli_bridge.example_cli_bridge import run_command_with_authy
code, out, err = run_command_with_authy("echo hello", passport_b64=DEMO_PASSPORT_B64)
```

## Security Properties
- Ed25519 signatures (PyNaCl)
- HMAC commitments; constant‑time compare
- Short TTLs; single‑use leases (replay protection)
- Thread‑safe JWKS caching for Auth0
- Generic external errors; detailed internal logging

For details see `docs/ARCHITECTURE.md` and `docs/SECURITY.md`.
