# ISM-X Authy v4 (Open Cutline) — Quick Start

## Local (Python)
```bash
pip install -r requirements.txt
# copy .env.example to .env and edit METRICS_SECRET to a random hex
python -m uvicorn authy_server:app --host 0.0.0.0 --port 8011
```

## Issue / Verify / Revoke
```powershell
$env:AUTHY_URL="http://127.0.0.1:8011"
python authy_client.py issue --sub agent-001 --scope demo:read demo:write --ttl 60 --nonce n-001
python authy_client.py verify --token "<paste_token>"
python authy_client.py revoke --token "<paste_token>" --reason "test revoke"
```

## Docker
```bash
cp .env.example .env  # and edit METRICS_SECRET
docker compose up --build
```

## API
See `openapi.yaml` or GET http://localhost:8011/healthz
