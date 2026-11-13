# System endpoint

> Part of the API documentation of Smart CRM – flow L2 (see [README](README.md)). Every example below was produced by a real run of tag `v1.0` (fresh database with the sample data, 13/11/2026); only the 64-character session tokens are shortened to `xxxxxxxx…xxxxxxxx`.

## 1. `GET /health`

**1. Method and path:** `GET /health`

**2. Description:** Reports whether the API is running **and** the SQLite database answers `SELECT 1`; used by the Docker healthcheck.

**3. Authentication and permission:** None – public, no token.

**4. Parameters and request body:**

None.


Real request:

```http
GET /health
```

**5. Success response** (copied from a real run):

```http
HTTP/1.1 200

{
  "status": "ok",
  "db": "up"
}
```

**6. Error codes:**

| HTTP | `error` code | When | Real example |
|---|---|---|---|
| 503 | `—` | Database cannot be read. Body is `{"status":"error","db":"down"}` (covered by `tests/bao-mat.test.js`) |  |

**7. Notes / limits:** Not under `/api`. Never returns internal details. Docker marks the `app` container *healthy* only after this returns 200.

---
