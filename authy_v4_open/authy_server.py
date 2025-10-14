from fastapi import FastAPI, HTTPException, Request
from pydantic import BaseModel, Field, field_validator
from typing import List, Optional, Dict, Any
import time, uuid, hashlib
from .config import ISSUER, TTL_DEFAULT
from .crypto import ensure_keypair, sign_compact, verify_compact, b64url
from .storage import save_passport, is_revoked, revoke_jti, hmac_metrics

app = FastAPI(title="ISM-X Authy v4 (Open Cutline)", version="4.0-open")

sk, vk = ensure_keypair()
KID = 1

class IssueReq(BaseModel):
    sub: str
    scope: List[str] = Field(default_factory=list)
    ttl: Optional[int] = None
    nonce: str
    org_id: Optional[str] = None
    raw: Optional[str] = None

    @field_validator("scope", mode="before")
    @classmethod
    def ensure_list(cls, v):
        if v is None:
            return []
        return v

class IssueResp(BaseModel):
    token: str
    kid: int
    jti: str
    exp: int

class VerifyReq(BaseModel):
    token: str

class VerifyResp(BaseModel):
    valid: bool
    sub: Optional[str] = None
    scope: Optional[List[str]] = None
    org_id: Optional[str] = None
    exp: Optional[int] = None
    kid: Optional[int] = None
    jti: Optional[str] = None
    reason: Optional[str] = None

class RevokeReq(BaseModel):
    token: Optional[str] = None
    jti: Optional[str] = None
    reason: Optional[str] = None

@app.get("/healthz")
def healthz():
    return {"ok": True}

@app.get("/did")
def did():
    return {"did": ISSUER, "kid": KID, "alg": "Ed25519"}

@app.post("/issue", response_model=IssueResp)
async def issue(req: IssueReq, request: Request):
    now = int(time.time())
    ttl = req.ttl if (req.ttl and req.ttl > 0) else TTL_DEFAULT
    exp = now + ttl
    jti = uuid.uuid4().hex
    ip = request.client.host if request.client else "0.0.0.0"
    ip_hash = hashlib.sha256(ip.encode("utf-8")).hexdigest()

    header = {"alg": "Ed25519", "kid": KID, "typ": "ISMJ"}
    payload = {
        "iss": ISSUER,
        "sub": req.sub,
        "scope": req.scope,
        "org_id": req.org_id,
        "iat": now,
        "exp": exp,
        "jti": jti,
        "nonce": req.nonce,
        "kid": KID,
    }
    # metrics commitment
    payload["mtag"] = hmac_metrics({
        "sub": req.sub,
        "scope": req.scope,
        "org_id": req.org_id,
        "raw": req.raw or "",
        "nonce": req.nonce,
        "iat": now,
    })

    token = sign_compact(header, payload, sk)

    # persist audit header (store signature for forensic trace)
    sig_b64 = token.split(".")[-1]
    record = {**payload, "metrics_tag": payload["mtag"], "ip_hash": ip_hash}
    save_passport(jti, record, sig_b64)

    return IssueResp(token=token, kid=KID, jti=jti, exp=exp)

@app.post("/verify", response_model=VerifyResp)
async def verify(req: VerifyReq):
    try:
        header, payload = verify_compact(req.token, vk)
    except Exception as e:
        return VerifyResp(valid=False, reason=str(e))

    now = int(time.time())
    if payload.get("exp", 0) < now:
        return VerifyResp(valid=False, reason="expired")

    jti = payload.get("jti")
    if not jti:
        return VerifyResp(valid=False, reason="missing jti")
    if is_revoked(jti):
        return VerifyResp(valid=False, reason="revoked")

    return VerifyResp(
        valid=True,
        sub=payload.get("sub"),
        scope=payload.get("scope"),
        org_id=payload.get("org_id"),
        exp=payload.get("exp"),
        kid=payload.get("kid"),
        jti=jti
    )

@app.post("/revoke")
async def revoke(req: RevokeReq):
    # accept either token or jti
    jti = req.jti
    if req.token and not jti:
        try:
            header, payload = verify_compact(req.token, vk)
            jti = payload.get("jti")
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"invalid token: {e}")
    if not jti:
        raise HTTPException(status_code=400, detail="jti or token required")
    revoke_jti(jti, req.reason, by_user="api")
    return {"ok": True, "jti": jti}
