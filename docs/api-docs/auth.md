# Authentication endpoints

> Part of the API documentation of Smart CRM – flow L2 (see [README](README.md)). Every example below was produced by a real run of tag `v1.0` (fresh database with the sample data, 13/11/2026); only the 64-character session tokens are shortened to `xxxxxxxx…xxxxxxxx`.

## 2. `POST /api/auth/login`

**1. Method and path:** `POST /api/auth/login`

**2. Description:** Checks a username and password and opens a login session, returning a random session token and the user profile.

**3. Authentication and permission:** None – public.

**4. Parameters and request body:**

| Name | In | Type | Required | Constraints |
|---|---|---|---|---|
| username | body | string | yes | Sample accounts: `nv01`, `nv02` (role `TIEP_NHAN`), `ql01` (role `QUAN_LY`) |
| password | body | string | yes | Sample password `Demo@123` |


Real request:

```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "nv01",
  "password": "Demo@123"
}
```

**5. Success response** (copied from a real run):

```http
HTTP/1.1 200

{
  "data": {
    "token": "26b835ba…28d61578",
    "user": {
      "id": 1,
      "username": "nv01",
      "fullName": "Nguyễn An",
      "role": "TIEP_NHAN"
    }
  }
}
```

**6. Error codes:**

| HTTP | `error` code | When | Real example |
|---|---|---|---|
| 401 | `SAI_DANG_NHAP` | Wrong username **or** wrong password (same message for both) | `{"error": "SAI_DANG_NHAP", "message": "Sai tên đăng nhập hoặc mật khẩu"}` |
| 400 | `DU_LIEU_KHONG_HOP_LE` | Body is not valid JSON | `{"error": "DU_LIEU_KHONG_HOP_LE", "message": "Body không phải JSON hợp lệ"}` |

**7. Notes / limits:** Token = 32 random bytes (64 hex chars), kept in server memory; not a JWT, carries no data. Expires after `SESSION_TIMEOUT_MINUTES` (default 30) without activity; each authenticated call extends it. Restarting the API logs everyone out. The password is never logged.

---

## 3. `GET /api/auth/me`

**1. Method and path:** `GET /api/auth/me`

**2. Description:** Returns the profile of the user who owns the token (used by the UI after a page reload).

**3. Authentication and permission:** Token required; any role.

**4. Parameters and request body:**

None.


Real request:

```http
GET /api/auth/me
Authorization: Bearer <token>
```

**5. Success response** (copied from a real run):

```http
HTTP/1.1 200

{
  "data": {
    "id": 1,
    "username": "nv01",
    "fullName": "Nguyễn An",
    "role": "TIEP_NHAN"
  }
}
```

**6. Error codes:**

| HTTP | `error` code | When | Real example |
|---|---|---|---|
| 401 | `CHUA_DANG_NHAP` | No `Authorization` header, unknown/expired token (30 min idle) or token logged out | `{"error": "CHUA_DANG_NHAP", "message": "Vui lòng đăng nhập"}` |

**7. Notes / limits:** Read-only; also refreshes the session idle timer.

---

## 4. `POST /api/auth/logout`

**1. Method and path:** `POST /api/auth/logout`

**2. Description:** Ends the session: the token stops working immediately.

**3. Authentication and permission:** Token required; any role.

**4. Parameters and request body:**

None.


Real request:

```http
POST /api/auth/logout
Authorization: Bearer <token>
```

**5. Success response** (copied from a real run):

```http
HTTP/1.1 204
```

**6. Error codes:**

| HTTP | `error` code | When | Real example |
|---|---|---|---|
| 401 | `CHUA_DANG_NHAP` | No `Authorization` header, unknown/expired token (30 min idle) or token logged out | `{"error": "CHUA_DANG_NHAP", "message": "Vui lòng đăng nhập"}` |

**7. Notes / limits:** Returns **204 with no body**. Calling any API with the same token afterwards returns `401 CHUA_DANG_NHAP` (real run: `GET /api/auth/me` after logout → `{"error": "CHUA_DANG_NHAP", "message": "Vui lòng đăng nhập"}`).

---
