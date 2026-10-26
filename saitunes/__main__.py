"""CLI: python3 -m saitunes <command> [args]"""

import argparse
import json
import sys

from .client import ApiError, SaiTunesClient


def main():
    p = argparse.ArgumentParser(prog="saitunes")
    sub = p.add_subparsers(dest="cmd", required=True)

    sub.add_parser("health")
    sub.add_parser("token", help="verify credentials by fetching an access token")

    s = sub.add_parser("search")
    s.add_argument("q", nargs="?")
    for f in ("deity", "raga", "language", "tempo"):
        s.add_argument(f"--{f}")
    s.add_argument("--page", type=int)
    s.add_argument("--size", type=int)

    s = sub.add_parser("suggest")
    s.add_argument("q")
    s.add_argument("--limit", type=int)

    s = sub.add_parser("get")
    s.add_argument("slug")

    sub.add_parser("aggregations")
    sub.add_parser("homepage")

    s = sub.add_parser("singer")
    s.add_argument("keywords", help="comma-separated singer name variations")
    s.add_argument("--page", type=int)
    s.add_argument("--size", type=int)

    a = p.parse_args()
    c = SaiTunesClient()
    try:
        if a.cmd == "health":
            out = c.health()
        elif a.cmd == "token":
            c._token()
            out = {"ok": True, "message": "Token acquired and cached"}
        elif a.cmd == "search":
            out = c.search(a.q, a.deity, a.raga, a.language, a.tempo, a.page, a.size)
        elif a.cmd == "suggest":
            out = c.suggest(a.q, a.limit)
        elif a.cmd == "get":
            out = c.bhajan(a.slug)
        elif a.cmd == "aggregations":
            out = c.aggregations()
        elif a.cmd == "homepage":
            out = c.homepage()
        elif a.cmd == "singer":
            out = c.singer_bhajans(a.keywords, a.page, a.size)
    except (ApiError, RuntimeError) as e:
        print(f"error: {e}", file=sys.stderr)
        sys.exit(1)
    print(json.dumps(out, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
