# PR: Optional ISM-X Attestation for MCP-for-Database

## Summary
Adds an optional attestation layer (Ed25519 + HMAC commitments) for database access.
Includes short-lived capability leases (single-use) and audit receipts.

## Changes
- `authy_bridge/` client helper and DB example
- `examples/mcp_integration.py` FastAPI reference
- `tokens.py` (replay protection)
- `ismx/passport.py` (fixed TTL verification)
- `auth0_utils.py` (thread-safe JWKS)
- `tests/test_comprehensive.py`

## Usage
- See `README.md` → Quick Start
- Scope defaults to `db.query`

## Security
- No private metrics are exposed
- Commitments only (HMAC)
- Short TTLs recommended
