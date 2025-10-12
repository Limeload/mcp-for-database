# PR: Optional ISM-X Attestation for Terminal_CLI_Agent

## Summary
Adds an optional attestation step for terminal command execution.
Preferred remote verification with local fallback.

## Changes
- `cli_bridge/example_cli_bridge.py`
- `authy_bridge/authy_client.py` (shared)
- `tests/test_comprehensive.py` (reusable patterns)

## Usage
```python
from cli_bridge.example_cli_bridge import run_command_with_authy
code, out, err = run_command_with_authy("echo hello", passport_b64=DEMO_PASSPORT_B64)
```

## Security
- Scope defaults to `agent.exec`
- Enforce short TTLs; restrict destructive operations; add quorum policy for admin paths.
