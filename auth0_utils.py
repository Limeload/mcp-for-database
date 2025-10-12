"""
Enhanced auth0_utils.py with thread-safe JWKS caching and better error handling
"""
import os
import time
import threading
import logging
from typing import Dict, Any, List
import httpx
from jose import jwt, JWTError

# Configure logging
logger = logging.getLogger(__name__)

AUTH0_DOMAIN = os.getenv("AUTH0_DOMAIN", "")
AUTH0_AUDIENCE = os.getenv("AUTH0_AUDIENCE", "")

# Thread-safe JWKS cache
JWKS_CACHE = {"keys": None, "ts": 0, "ttl": 300}
JWKS_LOCK = threading.Lock()


def _jwks() -> Dict[str, Any]:
    """
    Fetch JWKS from Auth0 with thread-safe caching.
    
    Returns:
        JWKS dictionary
        
    Raises:
        httpx.HTTPError: If JWKS fetch fails
        ValueError: If Auth0 domain not configured
    """
    if not AUTH0_DOMAIN:
        raise ValueError("AUTH0_DOMAIN environment variable not set")
    
    now = time.time()
    
    # Fast path - check cache without lock
    if JWKS_CACHE["keys"] and (now - JWKS_CACHE["ts"] < JWKS_CACHE["ttl"]):
        return JWKS_CACHE["keys"]
    
    # Slow path - need to refresh, acquire lock
    with JWKS_LOCK:
        # Double-check after acquiring lock (another thread may have refreshed)
        if JWKS_CACHE["keys"] and (now - JWKS_CACHE["ts"] < JWKS_CACHE["ttl"]):
            return JWKS_CACHE["keys"]
        
        try:
            url = f"https://{AUTH0_DOMAIN}/.well-known/jwks.json"
            logger.debug(f"Fetching JWKS from {url}")
            
            r = httpx.get(url, timeout=10.0)
            r.raise_for_status()
            
            jwks = r.json()
            
            # Validate JWKS structure
            if "keys" not in jwks or not isinstance(jwks["keys"], list):
                raise ValueError("Invalid JWKS structure")
            
            JWKS_CACHE["keys"] = jwks
            JWKS_CACHE["ts"] = now
            
            logger.info(f"JWKS refreshed successfully ({len(jwks['keys'])} keys)")
            return jwks
            
        except httpx.HTTPError as e:
            logger.error(f"Failed to fetch JWKS: {e}")
            # If we have stale cache, use it as fallback
            if JWKS_CACHE["keys"]:
                logger.warning("Using stale JWKS cache as fallback")
                return JWKS_CACHE["keys"]
            raise
        except Exception as e:
            logger.error(f"Unexpected error fetching JWKS: {e}")
            raise


def verify_jwt(token: str) -> Dict[str, Any]:
    """
    Verify Auth0 JWT token with JWKS.
    
    Args:
        token: JWT token string
        
    Returns:
        Decoded JWT claims
        
    Raises:
        ValueError: If token is invalid or verification fails
    """
    if not token:
        raise ValueError("Empty token")
    
    if not AUTH0_DOMAIN or not AUTH0_AUDIENCE:
        raise ValueError("AUTH0_DOMAIN and AUTH0_AUDIENCE must be configured")
    
    try:
        # Get unverified header to find kid
        unverified = jwt.get_unverified_header(token)
        kid = unverified.get("kid")
        alg = unverified.get("alg")
        
        if not kid:
            raise ValueError("Token missing 'kid' in header")
        
        if alg != "RS256":
            raise ValueError(f"Unsupported algorithm: {alg}. Only RS256 is supported")
        
        # Fetch JWKS and find matching key
        jwks = _jwks()
        keys = jwks.get("keys", [])
        
        key = next((k for k in keys if k.get("kid") == kid), None)
        
        if not key:
            raise ValueError(f"No matching JWKS key found for kid: {kid}")
        
        # Verify algorithm matches
        if key.get("alg") and key.get("alg") != "RS256":
            raise ValueError(f"JWKS key algorithm mismatch: {key.get('alg')}")
        
        # Construct expected issuer
        iss = f"https://{AUTH0_DOMAIN}/"
        
        # Decode and verify JWT
        claims = jwt.decode(
            token,
            key,
            algorithms=["RS256"],
            audience=AUTH0_AUDIENCE,
            issuer=iss,
            options={
                "verify_at_hash": False,
                "verify_exp": True,
                "verify_nbf": True,
                "verify_iat": True,
                "verify_aud": True,
                "verify_iss": True,
            },
        )
        
        logger.debug(f"JWT verified successfully for subject: {claims.get('sub')}")
        return claims
        
    except JWTError as e:
        logger.warning(f"JWT verification failed: {type(e).__name__}: {e}")
        raise ValueError(f"Invalid JWT: {type(e).__name__}")
    except Exception as e:
        logger.error(f"Unexpected error verifying JWT: {type(e).__name__}: {e}")
        raise ValueError("Token verification failed")


def require_scopes(claims: Dict[str, Any], needed: List[str]) -> bool:
    """
    Check if JWT claims contain all required scopes.
    
    Args:
        claims: Decoded JWT claims
        needed: List of required scopes
        
    Returns:
        True if all scopes present, False otherwise
    """
    if not needed:
        return True
    
    scope_str = claims.get("scope") or ""
    scopes = set(scope_str.split())
    
    has_all = all(s in scopes for s in needed)
    
    if not has_all:
        missing = [s for s in needed if s not in scopes]
        logger.debug(f"Missing required scopes: {missing}")
    
    return has_all


def get_user_scopes(claims: Dict[str, Any]) -> List[str]:
    """
    Extract list of scopes from JWT claims.
    
    Args:
        claims: Decoded JWT claims
        
    Returns:
        List of scope strings
    """
    scope_str = claims.get("scope") or ""
    return scope_str.split()


def clear_jwks_cache():
    """
    Clear JWKS cache (useful for testing or forced refresh).
    """
    with JWKS_LOCK:
        JWKS_CACHE["keys"] = None
        JWKS_CACHE["ts"] = 0
    logger.info("JWKS cache cleared")


def get_jwks_cache_age() -> float:
    """
    Get age of current JWKS cache in seconds.
    
    Returns:
        Age in seconds, or -1 if no cache
    """
    if not JWKS_CACHE["keys"]:
        return -1
    return time.time() - JWKS_CACHE["ts"]
