"""Minimal client for the Sai Tunes External API (stdlib only)."""

import base64
import json
import os
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TOKEN_CACHE = ROOT / ".token_cache.json"


def load_env(path=ROOT / ".env"):
    """Load KEY=VALUE lines into os.environ without overriding existing vars."""
    if not path.exists():
        return
    for line in path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


class ApiError(Exception):
    def __init__(self, status, body):
        super().__init__(f"HTTP {status}: {body}")
        self.status = status
        self.body = body


class SaiTunesClient:
    def __init__(self):
        load_env()
        self.base = os.environ.get("SAITUNES_API_BASE", "https://api.saitunes.org").rstrip("/")
        self.client_id = os.environ.get("SAITUNES_CLIENT_ID", "")
        self.client_secret = os.environ.get("SAITUNES_CLIENT_SECRET", "")
        self.token_url = os.environ.get("SAITUNES_TOKEN_URL", "")
        self.scope = os.environ.get("SAITUNES_SCOPE", "https://api.saitunes.com/read")

    # --- auth -------------------------------------------------------------

    def _token(self):
        # Tokens last 60 minutes; reuse a cached one until a minute before expiry.
        if TOKEN_CACHE.exists():
            cached = json.loads(TOKEN_CACHE.read_text())
            if cached.get("expires_at", 0) > time.time() + 60:
                return cached["access_token"]

        missing = [
            name
            for name, value in [
                ("SAITUNES_CLIENT_ID", self.client_id),
                ("SAITUNES_CLIENT_SECRET", self.client_secret),
                ("SAITUNES_TOKEN_URL", self.token_url),
            ]
            if not value
        ]
        if missing:
            raise RuntimeError(f"Missing in .env: {', '.join(missing)}")

        basic = base64.b64encode(f"{self.client_id}:{self.client_secret}".encode()).decode()
        data = urllib.parse.urlencode({"grant_type": "client_credentials", "scope": self.scope}).encode()
        req = urllib.request.Request(
            self.token_url,
            data=data,
            headers={
                "Authorization": f"Basic {basic}",
                "Content-Type": "application/x-www-form-urlencoded",
            },
        )
        payload = self._send(req)
        TOKEN_CACHE.write_text(
            json.dumps(
                {
                    "access_token": payload["access_token"],
                    "expires_at": time.time() + payload.get("expires_in", 3600),
                }
            )
        )
        TOKEN_CACHE.chmod(0o600)
        return payload["access_token"]

    # --- http -------------------------------------------------------------

    @staticmethod
    def _send(req):
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                return json.loads(resp.read().decode())
        except urllib.error.HTTPError as e:
            raise ApiError(e.code, e.read().decode(errors="replace")) from None

    def get(self, path, auth=True, **params):
        params = {k: v for k, v in params.items() if v is not None}
        url = f"{self.base}{path}"
        if params:
            url += "?" + urllib.parse.urlencode(params)
        headers = {"Accept": "application/json"}
        if auth:
            headers["Authorization"] = f"Bearer {self._token()}"
        return self._send(urllib.request.Request(url, headers=headers))

    # --- endpoints --------------------------------------------------------

    def health(self):
        return self.get("/v1/health", auth=False)

    def search(self, q=None, deity=None, raga=None, language=None, tempo=None, page=None, size=None):
        return self.get(
            "/v1/bhajans", q=q, deity=deity, raga=raga, language=language, tempo=tempo, page=page, size=size
        )

    def suggest(self, q, limit=None):
        return self.get("/v1/bhajans/suggest", q=q, limit=limit)

    def bhajan(self, slug):
        return self.get(f"/v1/bhajans/{urllib.parse.quote(slug, safe='')}")

    def aggregations(self):
        return self.get("/v1/aggregations")

    def homepage(self):
        return self.get("/v1/homepage")

    def singer_bhajans(self, keywords, page=None, size=None):
        return self.get("/v1/albums/singer/bhajans", keywords=keywords, page=page, size=size)
