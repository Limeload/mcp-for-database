"""
Example Integration: Auth0-ISM-X with MCP-for-Database
Complete working example showing how to protect database access
"""
from typing import Dict, Any, List, Optional
from fastapi import FastAPI, HTTPException, Depends, Header
from pydantic import BaseModel, Field
import hashlib
import time
import os

# Import Auth0-ISM-X components
from auth0_utils import verify_jwt, require_scopes
from tokens import issue_capability_lease, lease_valid
from ismx.passport import issue_passport, verify_passport
from ismx.audit import audit_receipt, verify_receipt
from ismx.policy import quorum_3_of_5

app = FastAPI(title="MCP-for-Database with Auth0-ISM-X")

# Database connection (your existing logic)
# from your_db_module import get_connection, execute_query


# ============================================================================
# REQUEST/RESPONSE MODELS
# ============================================================================

class DatabaseQueryRequest(BaseModel):
    """Request model for database query"""
    query: str = Field(..., min_length=1, max_length=5000)
    database: str = Field(..., min_length=1, max_length=100)
    parameters: Optional[Dict[str, Any]] = None


class QueryResponse(BaseModel):
    """Response model with query result and security attestations"""
    result: Any
    lease: Dict[str, Any]
    audit_receipt: Dict[str, Any]
    execution_time_ms: float


class SensitiveQueryRequest(BaseModel):
    """Request for sensitive operations requiring quorum"""
    query: str
    database: str
    approvers: List[str] = Field(..., min_items=3)
    reason: str


# ============================================================================
# AUTHENTICATION & AUTHORIZATION
# ============================================================================

def get_authenticated_user(authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
    """
    Extract and verify Auth0 JWT from Authorization header.
    
    Returns:
        JWT claims dictionary
        
    Raises:
        HTTPException: If authentication fails
    """
    if not authorization:
        raise HTTPException(
            status_code=401,
            detail="Missing Authorization header"
        )
    
    if not authorization.lower().startswith("bearer "):
        raise HTTPException(
            status_code=401,
            detail="Invalid Authorization header format. Expected: Bearer <token>"
        )
    
    token = authorization.split(" ", 1)[1]
    
    try:
        claims = verify_jwt(token)
        return claims
    except ValueError as e:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired authentication token"
        )


def require_db_scope(claims: Dict[str, Any], operation: str) -> None:
    """
    Verify user has required database scope.
    
    Args:
        claims: JWT claims
        operation: One of 'read', 'write', 'admin'
        
    Raises:
        HTTPException: If scope missing
    """
    scope_map = {
        "read": "db:read",
        "write": "db:write",
        "admin": "db:admin"
    }
    
    needed_scope = scope_map.get(operation, "db:read")
    
    if not require_scopes(claims, [needed_scope]):
        raise HTTPException(
            status_code=403,
            detail=f"Missing required scope: {needed_scope}"
        )


def determine_operation_type(query: str) -> str:
    """
    Determine if query is read or write operation.
    
    Args:
        query: SQL query string
        
    Returns:
        'read', 'write', or 'admin'
    """
    query_upper = query.strip().upper()
    
    # Admin operations
    if any(query_upper.startswith(cmd) for cmd in [
        "DROP", "TRUNCATE", "ALTER", "CREATE DATABASE", "GRANT", "REVOKE"
    ]):
        return "admin"
    
    # Write operations
    if any(query_upper.startswith(cmd) for cmd in [
        "INSERT", "UPDATE", "DELETE", "CREATE", "MERGE"
    ]):
        return "write"
    
    # Read operations (SELECT, SHOW, DESCRIBE, etc.)
    return "read"


def is_sensitive_query(query: str) -> bool:
    """
    Check if query is considered sensitive (requires quorum).
    
    Args:
        query: SQL query string
        
    Returns:
        True if sensitive, False otherwise
    """
    query_upper = query.strip().upper()
    
    sensitive_keywords = [
        "DROP TABLE", "DROP DATABASE", "TRUNCATE",
        "DELETE FROM", "ALTER TABLE", "GRANT ALL"
    ]
    
    return any(keyword in query_upper for keyword in sensitive_keywords)


# ============================================================================
# MOCK DATABASE EXECUTOR (Replace with your real implementation)
# ============================================================================

async def execute_database_query(
    query: str, 
    database: str,
    parameters: Optional[Dict] = None
) -> Any:
    """
    Execute database query (MOCK - replace with your real implementation).
    
    Args:
        query: SQL query
        database: Database name
        parameters: Query parameters
        
    Returns:
        Query results
    """
    # TODO: Replace with your actual database execution logic
    # from your_db_module import execute_query
    # return await execute_query(query, database, parameters)
    
    # Mock implementation for demonstration:
    return {
        "rows": [
            {"id": 1, "name": "Alice", "email": "alice@example.com"},
            {"id": 2, "name": "Bob", "email": "bob@example.com"}
        ],
        "count": 2,
        "affected_rows": 0
    }


# ============================================================================
# PROTECTED ENDPOINTS
# ============================================================================

@app.post("/db/query", response_model=QueryResponse)
async def execute_query(
    request: DatabaseQueryRequest,
    claims: Dict[str, Any] = Depends(get_authenticated_user)
):
    """
    Execute a database query with Auth0-ISM-X protection.
    
    Features:
    - Auth0 JWT authentication
    - Scope-based authorization
    - Capability lease issuance
    - Audit trail with receipt
    - Replay protection
    
    Required scopes:
    - db:read for SELECT queries
    - db:write for INSERT/UPDATE/DELETE
    - db:admin for DROP/ALTER/GRANT
    """
    start_time = time.time()
    
    # Determine operation type
    operation = determine_operation_type(request.query)
    
    # Check if user has required scope
    require_db_scope(claims, operation)
    
    # Issue capability lease (short-lived, single-use)
    lease = issue_capability_lease(
        user_id=claims.get('sub', 'anonymous'),
        action_id=f"db:{operation}:{request.database}",
        scope=f"db:{operation}",
        ttl_s=30  # 30 seconds to execute query
    )
    
    # Validate lease (this consumes it - replay protection)
    if not lease_valid(lease, f"db:{operation}", consume=True):
        raise HTTPException(
            status_code=403,
            detail="Invalid or expired capability lease"
        )
    
    # Execute query
    try:
        result = await execute_database_query(
            query=request.query,
            database=request.database,
            parameters=request.parameters
        )
    except Exception as e:
        # Log error but don't expose details to user
        raise HTTPException(
            status_code=500,
            detail="Query execution failed"
        )
    
    # Calculate execution time
    execution_time = (time.time() - start_time) * 1000  # milliseconds
    
    # Create deterministic hash of result (for audit)
    result_str = str(result)
    result_hash = hashlib.sha256(result_str.encode()).hexdigest()
    
    # Create audit receipt
    receipt = audit_receipt(
        action_id=f"db:{operation}",
        inputs={
            "query": request.query[:100],  # Truncate for audit
            "database": request.database,
            "user": claims.get('sub'),
            "timestamp": int(time.time())
        },
        lease=lease,
        result_hash=result_hash
    )
    
    return QueryResponse(
        result=result,
        lease=lease,
        audit_receipt=receipt,
        execution_time_ms=execution_time
    )


@app.post("/db/sensitive_query", response_model=QueryResponse)
async def execute_sensitive_query(
    request: SensitiveQueryRequest,
    claims: Dict[str, Any] = Depends(get_authenticated_user)
):
    """
    Execute sensitive database query with 3-of-5 quorum approval.
    
    Used for destructive operations like DROP TABLE, TRUNCATE, etc.
    
    Required:
    - db:admin scope
    - Minimum 3 approvers from list of 5+ authorized approvers
    """
    start_time = time.time()
    
    # Verify user has admin scope
    require_db_scope(claims, "admin")
    
    # Verify 3-of-5 quorum
    if not quorum_3_of_5(request.approvers):
        raise HTTPException(
            status_code=403,
            detail="Sensitive operation requires 3-of-5 quorum approval"
        )
    
    # Issue capability lease
    lease = issue_capability_lease(
        user_id=claims.get('sub'),
        action_id=f"db:sensitive:{request.database}",
        scope="db:admin",
        ttl_s=60  # Longer TTL for reviewed operations
    )
    
    # Validate and consume lease
    if not lease_valid(lease, "db:admin", consume=True):
        raise HTTPException(403, "Invalid lease")
    
    # Execute query
    try:
        result = await execute_database_query(
            query=request.query,
            database=request.database
        )
    except Exception as e:
        raise HTTPException(500, "Query execution failed")
    
    execution_time = (time.time() - start_time) * 1000
    result_hash = hashlib.sha256(str(result).encode()).hexdigest()
    
    # Create audit receipt with approvers
    receipt = audit_receipt(
        action_id="db:sensitive",
        inputs={
            "query": request.query[:100],
            "database": request.database,
            "user": claims.get('sub'),
            "approvers": sorted(set(request.approvers)),
            "reason": request.reason,
            "timestamp": int(time.time())
        },
        lease=lease,
        result_hash=result_hash
    )
    
    return QueryResponse(
        result=result,
        lease=lease,
        audit_receipt=receipt,
        execution_time_ms=execution_time
    )


@app.get("/db/agent_passport")
async def get_database_agent_passport():
    """
    Issue ISM-X passport proving database agent health.
    
    The passport contains:
    - Agent ID
    - Session ID
    - HMAC commitment to redacted metrics
    - Ed25519 signature
    
    Metrics are kept private but cryptographically committed.
    """
    # Collect actual metrics (these stay private)
    metrics = {
        "connection_pool_size": 10,  # Replace with actual
        "active_connections": 3,
        "query_count_last_hour": 1247,
        "avg_query_time_ms": 45.3,
        "error_rate": 0.02,
        "uptime_seconds": int(time.time() - app.state.start_time) if hasattr(app.state, 'start_time') else 0
    }
    
    # Create redacted version (only status, not details)
    redacted = {
        "status": "healthy" if metrics["error_rate"] < 0.05 else "degraded",
        "version": "1.0.0"
    }
    
    # Issue passport
    passport = issue_passport(
        agent_id=os.getenv("AGENT_ID", "mcp-db-agent"),
        session_id=app.state.session_id if hasattr(app.state, 'session_id') else "default",
        redacted_metrics=redacted,
        ttl_s=300  # 5 minutes
    )
    
    return {
        "passport": passport,
        "note": "Verify this passport without seeing raw metrics"
    }


@app.post("/db/verify_passport")
async def verify_database_agent_passport(
    passport: Dict[str, Any],
    expected_status: str = "healthy"
):
    """
    Verify ISM-X passport from database agent.
    
    This proves the agent's health without revealing raw metrics.
    """
    # Reconstruct expected redacted metrics
    redacted = {
        "status": expected_status,
        "version": "1.0.0"
    }
    
    # Verify passport
    agent_id = passport.get("agent_id", "")
    session_id = passport.get("session_id", "")
    
    is_valid = verify_passport(
        passport=passport,
        agent_id=agent_id,
        session_id=session_id,
        redacted_metrics=redacted
    )
    
    return {
        "valid": is_valid,
        "agent_id": agent_id,
        "session_id": session_id,
        "verified_status": expected_status if is_valid else None
    }


@app.get("/health")
async def health_check():
    """Standard health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": int(time.time()),
        "version": "1.0.0",
        "auth0_configured": bool(os.getenv("AUTH0_DOMAIN")),
        "keys_configured": bool(os.getenv("ED25519_SK_B64"))
    }


# ============================================================================
# STARTUP
# ============================================================================

@app.on_event("startup")
async def startup_event():
    """Initialize app state on startup"""
    import secrets
    app.state.start_time = time.time()
    app.state.session_id = secrets.token_hex(16)
    print(f"MCP-for-Database started with session: {app.state.session_id}")


# ============================================================================
# USAGE EXAMPLE
# ============================================================================

"""
# Start server:
uvicorn mcp_integration:app --reload

# Example request (with valid Auth0 token):
curl -X POST http://localhost:8000/db/query \
  -H "Authorization: Bearer YOUR_AUTH0_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "SELECT * FROM users LIMIT 10",
    "database": "production"
  }'

# Example response:
{
  "result": {
    "rows": [...],
    "count": 10
  },
  "lease": {
    "lease_id": "abc123...",
    "user_id": "auth0|user123",
    "scope": "db:read",
    "exp": 1234567890
  },
  "audit_receipt": {
    "payload": {...},
    "digest": "sha256_hash...",
    "mac": "hmac_hash..."
  },
  "execution_time_ms": 45.3
}
"""
