from nacl.signing import SigningKey, VerifyKey
from nacl.exceptions import BadSignatureError
import base64, os, binascii, json
from typing import Tuple
from .config import KEY_PATH

def b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")

def b64url_decode(s: str) -> bytes:
    pad = "=" * (-len(s) % 4)
    return base64.urlsafe_b64decode(s + pad)

def ensure_keypair() -> Tuple[SigningKey, VerifyKey]:
    os.makedirs(os.path.dirname(KEY_PATH), exist_ok=True)
    if not os.path.exists(KEY_PATH):
        sk = SigningKey.generate()
        with open(KEY_PATH, "wb") as f:
            f.write(sk.encode())
    else:
        with open(KEY_PATH, "rb") as f:
            raw = f.read()
            sk = SigningKey(raw)
    return sk, sk.verify_key

def sign_compact(header: dict, payload: dict, sk: SigningKey) -> str:
    header_b = json.dumps(header, separators=(",", ":"), sort_keys=True).encode("utf-8")
    payload_b = json.dumps(payload, separators=(",", ":"), sort_keys=True).encode("utf-8")
    signing_input = b".".join([base64.urlsafe_b64encode(header_b).rstrip(b"="),
                               base64.urlsafe_b64encode(payload_b).rstrip(b"=")])
    sig = sk.sign(signing_input).signature
    token = b".".join([signing_input, base64.urlsafe_b64encode(sig).rstrip(b"=")]).decode("ascii")
    return token

def verify_compact(token: str, vk: VerifyKey) -> Tuple[dict, dict]:
    try:
        parts = token.split(".")
        if len(parts) != 3:
            raise ValueError("invalid token format")
        h_b = b64url_decode(parts[0])
        p_b = b64url_decode(parts[1])
        sig_b = b64url_decode(parts[2])
        signing_input = ".".join(parts[:2]).encode("ascii")
        vk.verify(signing_input, sig_b)
        header = json.loads(h_b)
        payload = json.loads(p_b)
        return header, payload
    except (BadSignatureError, ValueError, json.JSONDecodeError) as e:
        raise ValueError(f"verification failed: {e}")
