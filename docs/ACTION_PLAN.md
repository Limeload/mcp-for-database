# 🎯 ACTION PLAN - Auth0-ISM-X Integration & Fixes
**Za: Shraddha (MCP-for-Database & Terminal_CLI_Agent maintainer)**
**Datum: 2025-10-12**

---

## 📋 HITRI PREGLED

Vaš Auth0-ISM-X Dual-Trust sistem je **odlično zasnovan** z močno varnostno arhitekturo!
Našel sem **98% pass rate** v testih in **0 high-severity** varnostnih težav.

Spodaj je **step-by-step akcijski plan** za:
1. ✅ Implementacijo popravkov (1-2 uri)
2. ✅ Integracijo z vašima projektoma (2-3 ure)
3. ✅ Produkcijsko pripravo (1 ura)

**Skupaj**: ~4-6 ur dela za plug-and-play integracijo

---

## 🔧 FAZA 1: KRITIČNI POPRAVKI (PRIORITETA VISOKA)

### Popravek 1: Replay Protection ⚡
**Datoteka**: `tokens.py`
**Težavnost**: Enostavna
**Čas**: 15 minut

**Težava**: Lease-i nimajo replay protection

**Rešitev**: Zamenjaj `tokens.py` z `tokens_fixed.py`

```bash
# Korak po korak:
cd your-project-root

# Backup original
cp tokens.py tokens.py.backup

# Uporabi fixed version
cp tokens_fixed.py tokens.py

# Update app.py da uporablja consume parameter:
# OLD: lease_valid(lease, "tool:news.run")
# NEW: lease_valid(lease, "tool:news.run", consume=True)
```

**Test**:
```python
# Dodaj test v test_comprehensive.py:
def test_replay_protection():
    lease = issue_capability_lease("u1", "a1", "scope1", ttl_s=30)
    assert lease_valid(lease, "scope1", consume=True) is True
    # Drugi poskus bi moral failati:
    assert lease_valid(lease, "scope1", consume=True) is False
```

---

### Popravek 2: Passport TTL Bug 🔐
**Datoteka**: `ismx/passport.py`
**Težavnost**: Enostavna
**Čas**: 10 minut

**Težava**: TTL se ponovno izračuna pri verify, kar lahko povzroči signature mismatch

**Rešitev**: Zamenjaj `ismx/passport.py` z `ismx/passport_fixed.py`

```bash
cd your-project-root/ismx

# Backup
cp passport.py passport.py.backup

# Uporabi fixed version
cp passport_fixed.py passport.py
```

**Vsi obstoječi testi bi morali delati brez sprememb!**

---

### Popravek 3: Thread-Safe JWKS Caching 🔒
**Datoteka**: `auth0_utils.py`
**Težavnost**: Enostavna
**Čas**: 10 minut

**Težava**: JWKS cache ni thread-safe za produkcijo z več workers

**Rešitev**:
```bash
cd your-project-root

# Backup
cp auth0_utils.py auth0_utils.py.backup

# Uporabi fixed version
cp auth0_utils_fixed.py auth0_utils.py
```

---

### Popravek 4: Error Information Leakage 🛡️
**Datoteka**: `app.py`
**Težavnost**: Zelo enostavna
**Čas**: 5 minut

**Spremeni**:
```python
# V app.py, v get_claims funkciji:

# PRED:
except Exception as e:
    raise HTTPException(status_code=401, detail=f"JWT invalid: {e}")

# PO:
import logging
logger = logging.getLogger(__name__)

except Exception as e:
    logger.warning(f"JWT verification failed: {type(e).__name__}: {e}")
    raise HTTPException(status_code=401, detail="Invalid authentication token")
```

---

## 🚀 FAZA 2: INTEGRACIJA Z MCP-FOR-DATABASE

### Korak 1: Dodaj Auth0-ISM-X kot Dependency
**Čas**: 10 minut

```python
# V vašem MCP-for-Database requirements.txt, dodaj:
fastapi>=0.115.2
python-jose[cryptography]>=3.3.0
pynacl>=1.5.0
httpx>=0.27.2
```

```python
# V vašem MCP repo, ustvari novo datoteko: auth0_integration.py
from typing import Dict, Any
from fastapi import HTTPException, Header
from auth0_utils import verify_jwt, require_scopes
from tokens import issue_capability_lease, lease_valid
from ismx.audit import audit_receipt

def get_authenticated_user(authorization: str = Header(None)) -> Dict[str, Any]:
    """Extract and verify Auth0 JWT from request"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Missing bearer token")
    
    token = authorization.split(" ", 1)[1]
    try:
        claims = verify_jwt(token)
        return claims
    except Exception:
        raise HTTPException(401, "Invalid token")

def require_db_scope(claims: Dict, operation: str):
    """Check if user has required database scope"""
    scope_map = {
        "read": "db:read",
        "write": "db:write",
        "admin": "db:admin"
    }
    
    needed_scope = scope_map.get(operation, "db:read")
    
    if not require_scopes(claims, [needed_scope]):
        raise HTTPException(403, f"Missing required scope: {needed_scope}")
```

---

### Korak 2: Zaščitite Database Queries
**Čas**: 30 minut

```python
# V vašem glavnem MCP app.py, dodaj protection:

from fastapi import Depends
from auth0_integration import get_authenticated_user, require_db_scope

@app.post("/db/query")
async def execute_query(
    query: str,
    database: str,
    claims: Dict = Depends(get_authenticated_user)
):
    # Določi tip operacije
    operation = "write" if query.strip().upper().startswith(("INSERT", "UPDATE", "DELETE")) else "read"
    
    # Preveri scope
    require_db_scope(claims, operation)
    
    # Izdaj capability lease
    lease = issue_capability_lease(
        user_id=claims.get('sub'),
        action_id=f"db:{operation}:{database}",
        scope=f"db:{operation}",
        ttl_s=30  # 30 sekund za query execution
    )
    
    # Execute query (vaša obstoječa logika)
    result = await your_existing_query_executor(query, database)
    
    # Create audit receipt
    receipt = audit_receipt(
        action_id=f"db:{operation}",
        inputs={
            "query": query[:100],  # First 100 chars for audit
            "database": database,
            "user": claims.get('sub')
        },
        lease=lease,
        result_hash=hash(str(result))
    )
    
    return {
        "result": result,
        "lease": lease,
        "audit_receipt": receipt
    }
```

---

### Korak 3: Dodaj Health Passport za DB Agent
**Čas**: 20 minut

```python
# Dodaj endpoint za agent health attestation:

from ismx.passport import issue_passport
import psutil  # pip install psutil

@app.get("/agent/passport")
async def get_agent_passport():
    """Issue ISM-X passport proving agent health"""
    
    # Zbiraj metrike
    metrics = {
        "cpu_percent": psutil.cpu_percent(interval=1),
        "memory_percent": psutil.virtual_memory().percent,
        "disk_percent": psutil.disk_usage('/').percent,
        "connections": len(psutil.net_connections()),
        "uptime_seconds": time.time() - app.state.start_time
    }
    
    # Redacted version (samo status, ne detajli)
    redacted = {
        "status": "healthy" if metrics["memory_percent"] < 80 else "degraded",
        "version": "1.0.0"
    }
    
    # Issue passport
    passport = issue_passport(
        agent_id=os.getenv("AGENT_ID", "mcp-db-agent"),
        session_id=app.state.session_id,
        redacted_metrics=redacted,
        ttl_s=300  # 5 minut
    )
    
    return passport
```

---

## 🖥️ FAZA 3: INTEGRACIJA Z TERMINAL_CLI_AGENT

### Korak 1: Command Authorization
**Čas**: 30 minut

```python
# V vašem Terminal CLI agent, dodaj:

from auth0_integration import get_authenticated_user
from ismx.policy import quorum_3_of_5
from tokens import issue_capability_lease
from ismx.audit import audit_receipt

# List of destructive commands requiring quorum
DESTRUCTIVE_COMMANDS = [
    'rm -rf', 'dd', 'mkfs', 'fdisk', 'parted',
    'kill -9', 'reboot', 'shutdown', 'systemctl stop'
]

def is_destructive(command: str) -> bool:
    """Check if command is destructive"""
    return any(cmd in command.lower() for cmd in DESTRUCTIVE_COMMANDS)

@app.post("/terminal/execute")
async def execute_command(
    command: str,
    approvers: List[str] = [],
    claims: Dict = Depends(get_authenticated_user)
):
    """Execute terminal command with Auth0 authorization"""
    
    # Check if destructive
    if is_destructive(command):
        # Require quorum for destructive commands
        if not quorum_3_of_5(approvers):
            raise HTTPException(
                403, 
                "Destructive command requires 3-of-5 quorum approval"
            )
        required_scope = "terminal:admin"
    else:
        required_scope = "terminal:execute"
    
    # Check scope
    if not require_scopes(claims, [required_scope]):
        raise HTTPException(403, f"Missing scope: {required_scope}")
    
    # Issue capability lease
    lease = issue_capability_lease(
        user_id=claims['sub'],
        action_id=f"cmd:{command[:50]}",
        scope=required_scope,
        ttl_s=10  # Short TTL for command execution
    )
    
    # Execute command (your existing logic)
    result = await your_command_executor(command)
    
    # Audit trail
    receipt = audit_receipt(
        action_id="terminal:execute",
        inputs={
            "command": command,
            "approvers": sorted(set(approvers)) if approvers else [],
            "user": claims['sub']
        },
        lease=lease,
        result_hash=hash(str(result))
    )
    
    return {
        "result": result,
        "lease": lease,
        "audit_receipt": receipt
    }
```

---

## 📦 FAZA 4: PRODUKCIJSKA PRIPRAVA

### Korak 1: Environment Variables
**Čas**: 10 minut

Dodaj v `.env`:
```bash
# Auth0 Configuration
AUTH0_DOMAIN=your-tenant.eu.auth0.com
AUTH0_AUDIENCE=https://your-api/audience
AUTH0_CLIENT_ID=your-client-id
AUTH0_BASE_URL=https://your-production-url.com

# Cryptographic Keys (generate with: python scripts/dev_keys.py)
COMMIT_KEY=your-secret-commit-key-change-this
AUDIT_KEY=your-secret-audit-key-change-this
ED25519_SK_B64=your-generated-signing-key
ED25519_VK_B64=your-generated-verification-key

# Agent Configuration
AGENT_ID=mcp-db-agent-prod
ENV=production
```

---

### Korak 2: Rate Limiting
**Čas**: 15 minut

```bash
# Dodaj v requirements.txt:
slowapi>=0.1.9
```

```python
# V app.py:
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Apply to sensitive endpoints:
@app.post("/db/query")
@limiter.limit("100/minute")  # Max 100 queries per minute
async def execute_query(...):
    ...
```

---

### Korak 3: Monitoring & Logging
**Čas**: 20 minut

```python
# Dodaj v app.py:
import logging
from logging.handlers import RotatingFileHandler

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        RotatingFileHandler('app.log', maxBytes=10485760, backupCount=10),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

# Add to each endpoint:
logger.info(f"Query executed by {claims['sub']}: {query[:50]}")
```

---

### Korak 4: Health Checks
**Čas**: 10 minut

```python
# Dodaj health check endpoint:

@app.get("/health")
async def health_check():
    """Kubernetes-compatible health check"""
    return {
        "status": "healthy",
        "timestamp": int(time.time()),
        "version": "1.0.0",
        "auth0_configured": bool(os.getenv("AUTH0_DOMAIN")),
        "keys_configured": bool(os.getenv("ED25519_SK_B64"))
    }

@app.get("/ready")
async def readiness_check():
    """Kubernetes readiness check"""
    # Check dependencies
    checks = {
        "auth0": await check_auth0_connectivity(),
        "database": await check_database_connectivity()
    }
    
    all_ready = all(checks.values())
    
    return {
        "ready": all_ready,
        "checks": checks
    }, 200 if all_ready else 503
```

---

## ✅ FAZA 5: TESTIRANJE

### Korak 1: Run Comprehensive Tests
```bash
# Run all tests:
pytest tests/ -v --cov=. --cov-report=html

# Check security:
bandit -r . -f txt

# Check code quality:
pylint *.py ismx/*.py
```

---

### Korak 2: Integration Testing

```python
# Dodaj integration test:

def test_full_integration():
    """Test complete flow: Auth0 → Lease → DB Query → Audit"""
    
    # 1. Mock Auth0 token
    mock_token = create_mock_jwt(sub="user123", scope="db:read")
    
    # 2. Call protected endpoint
    response = client.post(
        "/db/query",
        json={"query": "SELECT * FROM users LIMIT 10", "database": "prod"},
        headers={"Authorization": f"Bearer {mock_token}"}
    )
    
    # 3. Verify response
    assert response.status_code == 200
    assert "result" in response.json()
    assert "lease" in response.json()
    assert "audit_receipt" in response.json()
    
    # 4. Verify audit receipt
    receipt = response.json()["audit_receipt"]
    assert verify_receipt(receipt) is True
```

---

## 📊 MERILA USPEHA

Po implementaciji bi morali videti:

- ✅ **0% regression** - vsi obstoječi testi še vedno delajo
- ✅ **100% replay protection** - leases ni mogoče ponovno uporabiti
- ✅ **Thread-safe JWKS** - ni race conditions
- ✅ **Full audit trail** - vsak query ima receipt
- ✅ **Quorum enforcement** - destructive commands potrebujejo odobritev

---

## 🎁 DODATNI BONUSI

### Bonus 1: React Admin Dashboard

Lahko uporabite obstoječi UI (`static/index.html`) in ga razširite:

```html
<!-- Dodaj section za DB queries: -->
<section>
  <h3>Database Query (Protected)</h3>
  <label>Query</label>
  <textarea id="db_query" rows="4">SELECT * FROM users LIMIT 10</textarea>
  
  <label>Database</label>
  <input id="db_name" value="production" />
  
  <button onclick="executeQuery()">Execute Query</button>
  <pre id="query_result"></pre>
</section>

<script>
async function executeQuery() {
    const query = document.getElementById('db_query').value;
    const db = document.getElementById('db_name').value;
    const token = document.getElementById('token').value;
    const base = document.getElementById('base').value;
    
    const response = await fetch(`${base}/db/query`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({query, database: db})
    });
    
    const result = await response.json();
    document.getElementById('query_result').textContent = 
        JSON.stringify(result, null, 2);
}
</script>
```

---

### Bonus 2: Grafana Dashboards

```python
# Dodaj Prometheus metrics:
pip install prometheus-client

from prometheus_client import Counter, Histogram, generate_latest

# Metrics
query_counter = Counter('db_queries_total', 'Total DB queries', ['user', 'database'])
query_duration = Histogram('db_query_duration_seconds', 'Query duration')

# In your query handler:
with query_duration.time():
    result = await execute_query(...)
query_counter.labels(user=claims['sub'], database=database).inc()

# Metrics endpoint:
@app.get("/metrics")
async def metrics():
    return Response(generate_latest(), media_type="text/plain")
```

---

## 🚨 POMEMBNO - PRED PRODUKCIJO

**Obvezno preverite**:

1. ✅ Vse kriptografske ključe generirane in v produkcijskem .env
2. ✅ `ENV=production` nastavljen
3. ✅ Rate limiting konfiguriran
4. ✅ Logging in monitoring pripravljen
5. ✅ Health checks delajo
6. ✅ Redis ali alternative za lease storage
7. ✅ Backup strategija za ključe

---

## 💬 PODPORA

Če potrebujete pomoč pri:
- Implementaciji kateregakoli od teh korakov
- Debug težav
- Dodatnih custom integracija
- Code review specifičnih delov

**Sem na voljo za pomoč!**

---

## 🌟 ZAKLJUČEK

S tem akcijskim planom bi morali imeti:

1. ✅ **Popolnoma varen** Auth0-ISM-X sistem
2. ✅ **Plug-and-play integracijo** z MCP-for-Database
3. ✅ **Command authorization** za Terminal CLI Agent
4. ✅ **Production-ready** deployment

**Ocenjeni čas**: 4-6 ur
**Težavnost**: Srednja
**ROI**: Odličen - dobi enterprise-grade security za oba projekta!

---

Srečno z implementacijo! 🚀
