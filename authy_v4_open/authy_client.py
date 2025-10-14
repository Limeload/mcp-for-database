import argparse, requests, json, os

AUTHY_URL = os.getenv("AUTHY_URL", "http://127.0.0.1:8011")

def cmd_issue(args):
    payload = {
        "sub": args.sub,
        "scope": args.scope,
        "ttl": args.ttl,
        "nonce": args.nonce,
    }
    if args.org_id:
        payload["org_id"] = args.org_id
    if args.raw:
        payload["raw"] = args.raw
    r = requests.post(f"{AUTHY_URL}/issue", json=payload, timeout=10)
    r.raise_for_status()
    print(json.dumps(r.json(), indent=2))

def cmd_verify(args):
    r = requests.post(f"{AUTHY_URL}/verify", json={"token": args.token}, timeout=10)
    r.raise_for_status()
    print(json.dumps(r.json(), indent=2))

def cmd_revoke(args):
    body = {}
    if args.token:
        body["token"] = args.token
    if args.jti:
        body["jti"] = args.jti
    if args.reason:
        body["reason"] = args.reason
    r = requests.post(f"{AUTHY_URL}/revoke", json=body, timeout=10)
    r.raise_for_status()
    print(json.dumps(r.json(), indent=2))

def main():
    p = argparse.ArgumentParser(description="ISM-X Authy v4 (Open) client")
    sub = p.add_subparsers(dest="cmd", required=True)

    p_issue = sub.add_parser("issue")
    p_issue.add_argument("--sub", required=True)
    p_issue.add_argument("--scope", nargs="*", default=["demo:read"])
    p_issue.add_argument("--ttl", type=int, default=60)
    p_issue.add_argument("--nonce", required=True)
    p_issue.add_argument("--org-id")
    p_issue.add_argument("--raw")
    p_issue.set_defaults(func=cmd_issue)

    p_verify = sub.add_parser("verify")
    p_verify.add_argument("--token", required=True)
    p_verify.set_defaults(func=cmd_verify)

    p_revoke = sub.add_parser("revoke")
    p_revoke.add_argument("--token")
    p_revoke.add_argument("--jti")
    p_revoke.add_argument("--reason")
    p_revoke.set_defaults(func=cmd_revoke)

    args = p.parse_args()
    args.func(args)

if __name__ == "__main__":
    main()
