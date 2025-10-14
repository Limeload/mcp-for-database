import sqlite3, os, json, time, hashlib, hmac
from typing import Optional, Tuple
from .config import SQLITE_PATH, METRICS_SECRET

def get_db():
    os.makedirs(os.path.dirname(SQLITE_PATH), exist_ok=True)
    conn = sqlite3.connect(SQLITE_PATH, check_same_thread=False)
    conn.execute("""CREATE TABLE IF NOT EXISTS passports (
        jti TEXT PRIMARY KEY,
        sub TEXT NOT NULL,
        org_id TEXT,
        scope TEXT NOT NULL,
        kid INTEGER NOT NULL,
        iat INTEGER NOT NULL,
        exp INTEGER NOT NULL,
        nonce TEXT NOT NULL,
        ip_hash TEXT,
        metrics_tag TEXT,
        sig TEXT NOT NULL
    )""")
    conn.execute("""CREATE TABLE IF NOT EXISTS revocations (
        jti TEXT PRIMARY KEY,
        revoked_at INTEGER NOT NULL,
        reason TEXT,
        by_user TEXT
    )""")
    conn.execute("""CREATE TABLE IF NOT EXISTS keys (
        kid INTEGER PRIMARY KEY,
        alg TEXT NOT NULL,
        status TEXT NOT NULL,
        created_at INTEGER NOT NULL
    )""")
    conn.commit()
    # Ensure a default key row
    cur = conn.execute("SELECT kid FROM keys WHERE kid=1")
    if cur.fetchone() is None:
        conn.execute("INSERT INTO keys(kid, alg, status, created_at) VALUES (1,'Ed25519','active',?)", (int(time.time()),))
        conn.commit()
    return conn

DB = get_db()

def hmac_metrics(payload_dict: dict) -> str:
    # privacy-preserving commitment over sorted JSON
    payload_bytes = json.dumps(payload_dict, sort_keys=True, separators=(",", ":")).encode("utf-8")
    tag = hmac.new(bytes.fromhex(METRICS_SECRET) if all(c in '0123456789abcdef' for c in METRICS_SECRET.lower().strip('x')) and len(METRICS_SECRET.replace("x",""))>=32 else METRICS_SECRET.encode("utf-8"),
                   payload_bytes, hashlib.sha256).hexdigest()
    return tag

def save_passport(jti: str, record: dict, sig_b64: str):
    DB.execute("""INSERT OR REPLACE INTO passports
        (jti, sub, org_id, scope, kid, iat, exp, nonce, ip_hash, metrics_tag, sig)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (jti, record["sub"], record.get("org_id"), json.dumps(record["scope"]),
         record["kid"], record["iat"], record["exp"], record["nonce"],
         record.get("ip_hash"), record.get("metrics_tag"), sig_b64))
    DB.commit()

def is_revoked(jti: str) -> bool:
    cur = DB.execute("SELECT 1 FROM revocations WHERE jti=?", (jti,))
    return cur.fetchone() is not None

def revoke_jti(jti: str, reason: Optional[str], by_user: Optional[str]):
    DB.execute("INSERT OR REPLACE INTO revocations(jti, revoked_at, reason, by_user) VALUES(?, ?, ?, ?)",
               (jti, int(time.time()), reason, by_user))
    DB.commit()
