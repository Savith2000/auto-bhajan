"""Download the whole bhajan catalog into a static file the web app ships with.

The browser never talks to the Sai Tunes API: the client secret has to stay
off the device, and the catalog is small (~1,000 bhajans) and only changes when
something is published. So it is fetched here, at build time, and the app
matches against public/catalog.json offline.

    python3 scripts/fetch_catalog.py            # list from the API, details cached
    python3 scripts/fetch_catalog.py --offline  # rebuild from data/raw only

Writes:
    data/raw/<slug>.json   every detail response, untouched (gitignored)
    public/catalog.json    only what the app needs
"""

import json
import sys
import time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from saitunes import ApiError, SaiTunesClient  # noqa: E402

RAW = ROOT / "data" / "raw"
OUT = ROOT / "public" / "catalog.json"
PAGE_SIZE = 100
WORKERS = 6


def with_retry(fn, *args):
    for attempt in range(6):
        try:
            return fn(*args)
        except ApiError as e:
            if e.status != 429 and e.status < 500:
                raise
            time.sleep(2**attempt)
    return fn(*args)


def all_slugs(client):
    slugs = []
    page = 1
    while True:
        result = with_retry(lambda p: client.search(page=p, size=PAGE_SIZE), page)
        slugs += [r["slug"] for r in result["results"]]
        if page >= result["totalPages"]:
            return slugs
        page += 1


def fetch_detail(client, slug, refresh):
    path = RAW / f"{slug}.json"
    if path.exists() and not refresh:
        return json.loads(path.read_text())
    detail = with_retry(client.bhajan, slug)
    path.write_text(json.dumps(detail, ensure_ascii=False, indent=1))
    return detail


def translation(detail, language):
    for t in detail.get("translations") or []:
        if t.get("language") == language:
            return t.get("lyrics") or ""
    return ""


def main():
    refresh = "--refresh" in sys.argv
    RAW.mkdir(parents=True, exist_ok=True)

    if "--offline" in sys.argv:
        # Every detail is already cached; no API calls, no credentials.
        details = [json.loads(f.read_text()) for f in sorted(RAW.glob("*.json"))]
        print(f"{len(details)} bhajans from data/raw")
    else:
        client = SaiTunesClient()
        slugs = all_slugs(client)
        print(f"{len(slugs)} bhajans in the catalog")
        with ThreadPoolExecutor(WORKERS) as pool:
            details = list(pool.map(lambda s: fetch_detail(client, s, refresh), slugs))

    catalog = []
    for d in details:
        catalog.append(
            {
                "slug": d["slug"],
                "title": d["title"],
                "deity": d.get("deity") or [],
                "language": d.get("language") or [],
                "lyrics": d.get("lyrics") or "",
                "meaning": d.get("englishMeaning") or "",
                "gentsPitch": d.get("gentsPitch") or "",
                "ladiesPitch": d.get("ladiesPitch") or "",
                "devanagari": translation(d, "Devnaagri"),
                "respell": translation(d, "Diacritical Respell"),
            }
        )

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(catalog, ensure_ascii=False))

    missing = [c["slug"] for c in catalog if not c["devanagari"].strip()]
    print(f"wrote {OUT.relative_to(ROOT)} ({OUT.stat().st_size // 1024} KB)")
    print(f"{len(missing)} without Devanagari: {missing[:20]}")


if __name__ == "__main__":
    main()
