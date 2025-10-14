"""
Enhanced passport.py with fixed TTL verification bug
"""
import os
import json
import hmac
import hashlib
import time
import secrets
import base64
from typing import Dict, Any
from nacl.signing import SigningKey, VerifyKey
from nacl.exceptions import BadSignatureError

COMMIT_KEY = (os.getenv("COMMIT_KEY") or "dev-commit-key").encode()


def hmac_commit(payload: dict) -> str:
    """
    Create HMAC commitment for a payload.
    Uses constant-time comparison safe HMAC-SHA256.
    """
    msg = json.dumps(payload, sort_keys=True, separators=(",", ":")).encode()
    return hmac.new(COMMIT_KEY, msg, hashlib.sha256).hexdigest()


def _load_keys():
    """
    Load Ed25519 signing and verification keys.
    In production, fails loudly if keys not configured.
    """
    sk_b64 = os.getenv("ED25519_SK_B64")
    vk_b64 = os.getenv("ED25519_VK_B64")
    env_mode = os.getenv("ENV", "development")
    
    if not sk_b64 or not vk_b64:
        if env_mode == "development":
            # Dev fallback: generate ephemeral keys
            sk = SigningKey.generate()
            vk = sk.verify_key
            return sk, vk
        else:
            # Production: fail loudly
            raise ValueError(
                "ED25519_SK_B64 and ED25519_VK_B64 environment variables "
                "must be set in production mode. Generate keys with: "
                "python scripts/dev_keys.py"
            )
    
    try:
        sk = SigningKey(base64.b64decode(sk_b64))
        vk = VerifyKey(base64.b64decode(vk_b64))
        return sk, vk
    except Exception as e:
        raise ValueError(f"Failed to load Ed25519 keys: {e}")


def pack_message(
    agent_id: str, 
    session_id: str, 
    commitment: str, 
    ttl_s: int, 
    nonce: str
) -> bytes:
    """
    Pack passport data into canonical message format for signing.
    """
    payload = {
        "agent_id": agent_id,
        "session_id": session_id,
        "commitment": commitment,
        "ttl_s": ttl_s,
        "nonce": nonce
    }
    return json.dumps(payload, sort_keys=True, separators=(",", ":")).encode()


def issue_passport(
    agent_id: str, 
    session_id: str, 
    redacted_metrics: dict, 
    ttl_s: int = 60
) -> dict:
    """
    Issue an ISM-X passport with Ed25519 signature and HMAC commitment.
    
    The passport proves agent integrity without revealing metrics.
    
    Args:
        agent_id: Agent identifier
        session_id: Session identifier
        redacted_metrics: Metrics dictionary (kept private via commitment)
        ttl_s: Time-to-live in seconds
        
    Returns:
        Passport dictionary with signature and commitment
    """
    sk, vk = _load_keys()
    nonce = secrets.token_hex(16)  # 32 character hex (128 bits entropy)
    commitment = hmac_commit(redacted_metrics)
    
    # Sign the message with ORIGINAL ttl_s
    msg = pack_message(agent_id, session_id, commitment, ttl_s, nonce)
    sig = sk.sign(msg).signature
    
    exp = int(time.time()) + ttl_s
    
    return {
        "agent_id": agent_id,
        "session_id": session_id,
        "commitment": commitment,
        "nonce": nonce,
        "sig_b64": base64.b64encode(sig).decode(),
        "vk_b64": base64.b64encode(bytes(vk)).decode(),
        "exp": exp,
        "ttl_s_original": ttl_s,  # Store original TTL for verification
        "issued_at": int(time.time()),
    }


def verify_passport(
    passport: Dict[str, Any], 
    agent_id: str, 
    session_id: str, 
    redacted_metrics: dict
) -> bool:
    """
    Verify an ISM-X passport's signature and commitment.
    
    Args:
        passport: Passport dictionary to verify
        agent_id: Expected agent identifier
        session_id: Expected session identifier
        redacted_metrics: Expected metrics (must match commitment)
        
    Returns:
        True if passport is valid, False otherwise
    """
    try:
        # Check expiration
        if int(time.time()) > int(passport.get("exp", 0)):
            return False
        
        # Verify commitment matches (constant-time compare)
        expected_commit = hmac_commit(redacted_metrics)
        actual_commit = passport.get("commitment", "")
        if not hmac.compare_digest(expected_commit, actual_commit):
            return False
        
        # Verify agent_id and session_id match
        if passport.get("agent_id") != agent_id:
            return False
        if passport.get("session_id") != session_id:
            return False
        
        # Use ORIGINAL TTL from issuance, not recalculated
        ttl_s = passport.get("ttl_s_original", 60)
        
        # Reconstruct signed message
        msg = pack_message(
            agent_id, 
            session_id, 
            passport["commitment"], 
            ttl_s,  # Use original TTL
            passport["nonce"]
        )
        
        # Verify Ed25519 signature
        vk = VerifyKey(base64.b64decode(passport["vk_b64"]))
        sig = base64.b64decode(passport["sig_b64"])
        vk.verify(msg, sig)
        
        return True
        
    except (BadSignatureError, KeyError, ValueError, TypeError):
        return False


def verify_passport_commitment_only(
    passport: Dict[str, Any], 
    redacted_metrics: dict
) -> bool:
    """
    Verify only the HMAC commitment without signature verification.
    
    Useful for quickly checking if metrics match before full verification.
    
    Args:
        passport: Passport dictionary
        redacted_metrics: Metrics to check
        
    Returns:
        True if commitment matches, False otherwise
    """
    try:
        expected_commit = hmac_commit(redacted_metrics)
        actual_commit = passport.get("commitment", "")
        return hmac.compare_digest(expected_commit, actual_commit)
    except Exception:
        return False


def passport_is_expired(passport: Dict[str, Any]) -> bool:
    """
    Check if passport is expired without full verification.
    
    Args:
        passport: Passport dictionary
        
    Returns:
        True if expired, False otherwise
    """
    try:
        return int(time.time()) > int(passport.get("exp", 0))
    except (ValueError, TypeError):
        return True
