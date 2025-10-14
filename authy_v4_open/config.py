import os
from dotenv import load_dotenv

load_dotenv()

ISSUER = os.getenv("ISSUER", "did:ismx:public")
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8011"))
SQLITE_PATH = os.getenv("SQLITE_PATH", "/data/authy.db")
METRICS_SECRET = os.getenv("METRICS_SECRET", "please_change_me_" + "0"*32)
TTL_DEFAULT = int(os.getenv("TTL_DEFAULT", "60"))
RATE_LIMIT_GLOBAL = int(os.getenv("RATE_LIMIT_GLOBAL", "60"))  # naive per minute
FEATURE_OIDC = os.getenv("FEATURE_OIDC", "0") == "1"
FEATURE_HSM = os.getenv("FEATURE_HSM", "0") == "1"
KEY_PATH = os.getenv("KEY_PATH", "keys/ed25519.key")
