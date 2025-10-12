# Architecture Overview (Official)

Core concepts:
- **Passport**: Ed25519-signed data binding (agent_id, session_id, commitment, ttl, nonce).
- **Commitment**: HMAC-SHA256 over redacted metrics (deterministic JSON).
- **Capability Lease**: Short-lived, single-use authorization ticket with replay protection.
- **JWT**: Upstream identity via Auth0 RS256 tokens and JWKS-based verification.

Data flow (MCP DB variant):
1. Client sends JWT → server verifies (Auth0).
2. Server checks scopes and issues a capability lease (TTL ~30 s).
3. Server executes query (if lease valid; consume=True).
4. Server returns result + audit receipt (SHA-256 + HMAC).

Data flow (CLI variant):
1. Client requests command execution with passport_b64.
2. Bridge computes metrics_tag and verifies passport (remote or local).
3. On success, executes command and returns outputs with audit context.
