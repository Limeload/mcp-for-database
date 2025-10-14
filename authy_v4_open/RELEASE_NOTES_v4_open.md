# Release: ISM-X Authy v4 — Open Cutline (MVP)

**Type:** Public demo package (safe-by-default)  
**Scope:** FastAPI gateway + SQLite audit + Ed25519 + HMAC metrics_tag

## Highlights
- `/issue`, `/verify`, `/revoke`, `/did`, `/healthz`
- Compact Ed25519 token (header.payload.signature)
- SQLite revocation/audit (auto-init), local file key
- Dockerfile + docker-compose, `.env.example`
- Minimal `openapi.yaml` and `README.quick.md`

## Security Notes
- No HSM/TPM, No OIDC (FEATURE flags off)
- Keys auto-generated locally; rotate by deleting `keys/` and restarting
- `METRICS_SECRET` must be set to a random 64-hex string

## Upgrade Path
- Backward‑compatible claims: `sub, scope[], exp, jti, kid, nonce`
- Enterprise v4 adds Postgres, OIDC, approvals, key registry

