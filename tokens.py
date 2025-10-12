"""
Enhanced tokens.py with replay protection and lease tracking
"""
import time
import secrets
import threading
from typing import Dict, Set, Optional

# In-memory store for used leases (use Redis in production)
_USED_LEASES: Set[str] = set()
_LEASE_LOCK = threading.Lock()

# Lease storage for validation (use Redis in production)
_ACTIVE_LEASES: Dict[str, dict] = {}
_STORAGE_LOCK = threading.Lock()


def issue_capability_lease(
    user_id: str, 
    action_id: str, 
    scope: str, 
    ttl_s: int = 30
) -> dict:
    """
    Issue a capability lease with replay protection.
    
    Args:
        user_id: User identifier
        action_id: Action being authorized
        scope: Required scope
        ttl_s: Time-to-live in seconds
        
    Returns:
        Lease dictionary with unique ID, expiration, and metadata
    """
    lease_id = secrets.token_hex(16)  # 32 character hex (128 bits entropy)
    exp = int(time.time()) + ttl_s
    
    lease = {
        "lease_id": lease_id,
        "user_id": user_id,
        "action_id": action_id,
        "scope": scope,
        "exp": exp,
        "issued_at": int(time.time()),
        "used": False,  # Track if lease has been consumed
    }
    
    # Store lease for validation
    with _STORAGE_LOCK:
        _ACTIVE_LEASES[lease_id] = lease
    
    return lease


def lease_valid(lease: dict, needed_scope: str, consume: bool = True) -> bool:
    """
    Validate a capability lease with replay protection.
    
    Args:
        lease: Lease dictionary to validate
        needed_scope: Required scope for this operation
        consume: If True, mark lease as used (default: True for replay protection)
        
    Returns:
        True if lease is valid and not yet used, False otherwise
    """
    lease_id = lease.get('lease_id')
    
    if not lease_id:
        return False
    
    # Check if already used
    with _LEASE_LOCK:
        if lease_id in _USED_LEASES:
            return False
    
    # Check expiration
    if int(time.time()) > int(lease.get('exp', 0)):
        return False
    
    # Check scope match
    if lease.get('scope') != needed_scope:
        return False
    
    # Mark as used if consume=True
    if consume:
        with _LEASE_LOCK:
            if lease_id in _USED_LEASES:
                # Double-check after acquiring lock
                return False
            _USED_LEASES.add(lease_id)
            
        # Update lease in storage
        with _STORAGE_LOCK:
            if lease_id in _ACTIVE_LEASES:
                _ACTIVE_LEASES[lease_id]['used'] = True
    
    return True


def revoke_lease(lease_id: str) -> bool:
    """
    Revoke a lease before its expiration.
    
    Args:
        lease_id: ID of lease to revoke
        
    Returns:
        True if lease was revoked, False if not found
    """
    with _STORAGE_LOCK:
        if lease_id in _ACTIVE_LEASES:
            del _ACTIVE_LEASES[lease_id]
    
    with _LEASE_LOCK:
        _USED_LEASES.add(lease_id)  # Prevent future use
    
    return True


def get_lease_status(lease_id: str) -> Optional[dict]:
    """
    Get current status of a lease.
    
    Args:
        lease_id: ID of lease to check
        
    Returns:
        Lease dictionary with status, or None if not found
    """
    with _STORAGE_LOCK:
        return _ACTIVE_LEASES.get(lease_id)


def cleanup_expired_leases() -> int:
    """
    Remove expired leases from storage (call periodically).
    
    Returns:
        Number of leases cleaned up
    """
    now = int(time.time())
    count = 0
    
    with _STORAGE_LOCK:
        expired_ids = [
            lid for lid, lease in _ACTIVE_LEASES.items()
            if lease.get('exp', 0) < now
        ]
        
        for lid in expired_ids:
            del _ACTIVE_LEASES[lid]
            count += 1
    
    # Note: We keep used_leases set growing in this simple implementation
    # In production, use Redis with TTL or implement LRU eviction
    
    return count


def get_active_lease_count() -> int:
    """Get count of active (non-expired) leases."""
    with _STORAGE_LOCK:
        return len(_ACTIVE_LEASES)


def get_used_lease_count() -> int:
    """Get count of used leases in replay protection set."""
    with _LEASE_LOCK:
        return len(_USED_LEASES)
