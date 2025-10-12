# ISM-X Bridges (v0.3): MCP-for-Database & Terminal CLI

This package provides two small, optional bridges that add **attestation** to:
1) database access (MCP-for-Database), and
2) terminal command execution (Terminal_CLI_Agent).

The bridges use Ed25519 signatures and HMAC commitments with short-lived, single-use
capability leases. They work with a remote `/verify` endpoint (preferred) and a local
verification fallback.

## Contents
- `authy_bridge/` — client helper + DB example
- `cli_bridge/` — CLI example
- `ismx/` — passport (fixed TTL verify)
- `tokens.py` — capability leases with replay protection
- `auth0_utils.py` — Auth0 JWT verification with thread-safe JWKS cache
- `examples/mcp_integration.py` — FastAPI example for MCP-for-Database
- `tests/test_comprehensive.py` — Comprehensive test suite

## Quick Start
```bash
pip install requests pynacl python-jose[cryptography] httpx fastapi
# Optional: pytest, bandit, pylint

# Environment (example)
set ISMX_VERIFY_URL=http://127.0.0.1:8010/verify
set ISMX_PUBKEY_B64=<Ed25519 public key (b64)>
set ISMX_SCOPE=db.query
set CLI_SESSION=my-cli-session
# Per-session HMAC key for commitments
set ISMX_TAG_KEY_B64=<base64 32-byte secret>
```

### Database wrapper
```python
from authy_bridge.example_db_bridge import run_query_with_authy
rows = run_query_with_authy("SELECT * FROM customers LIMIT 10;", passport_b64=DEMO_PASSPORT_B64)
```

### CLI wrapper
```python
from cli_bridge.example_cli_bridge import run_command_with_authy
code, out, err = run_command_with_authy("echo hello", passport_b64=DEMO_PASSPORT_B64)
```
“CLI wrapper is provided as a separate optional integration (see Terminal_CLI_Agent PR).”

## Security
- **Signatures:** Ed25519 via PyNaCl
- **Commitments:** HMAC-SHA256 (no raw metrics transmitted)
- **Replay protection:** single-use capability leases
- **JWT:** Auth0 RS256 with thread-safe JWKS cache

See `docs/SECURITY.md` for details.
