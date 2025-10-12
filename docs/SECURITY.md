# Security Notes (Official)

This package is designed to add a minimal attestation layer to agent operations.
It does not expose private metrics. Only HMAC commitments are transmitted.
Keys must be provisioned securely. For production deployments:

1. Generate Ed25519 keys (signing + verification). Do not keep private keys in code.
2. Use per-session HMAC keys for metrics tags. Rotate frequently.
3. Enforce short TTLs for passports and leases. Revoke on failure.
4. Enable rate limiting, audit logging, and monitoring on all endpoints.
5. Store state in a durable store (e.g., Redis) instead of process memory.
6. Validate all inputs (length, format). Deny excessive payload sizes.
7. Use generic error messages externally; log details internally.
