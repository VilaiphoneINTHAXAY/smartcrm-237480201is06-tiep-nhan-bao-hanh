# API documentation – Smart CRM (Mekong Mobile) · Flow L2

Student: INTHAXAY Vilaiphone – 237480201IS06 · Track SE · Release `v1.0`

This folder documents **every endpoint that exists in the code** (`src/backend/app.js` and
`src/backend/routes/*.js`) – 19 endpoints, nothing more. Each endpoint has the seven mandatory sections of the
Session 15 guide: (1) method and path, (2) one-sentence description, (3) authentication and permission,
(4) parameters and body, (5) a **real** success response, (6) error codes, (7) notes and limits.

All examples were produced by a real run of the code of tag `v1.0` against a fresh database with the
sample data (script run by the author on 13/11/2026, same code as the Docker image). Only the 64-character
session tokens are shortened (`39502c18…cb86`); long lists are cut after the first item with a marked line.

## 1. Base URL and how to try it

| Environment | Base URL |
|---|---|
| Docker (`docker compose up -d --build`) | `http://localhost:3000` |
| Without Docker (`npm start`) | `http://localhost:3000` (variable `PORT`) |

```bash
# 1) log in and copy data.token
curl -s -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d "{\"username\":\"nv01\",\"password\":\"Demo@123\"}"
# 2) call a business API with the token
curl -s "http://localhost:3000/api/customers?phone=0987654321" -H "Authorization: Bearer <token>"
```
(On Windows PowerShell write `curl.exe`.)

## 2. Authentication and roles

- `POST /api/auth/login` returns a random session token. Every other `/api/...` endpoint needs the header
  `Authorization: Bearer <token>`; without it → `401 CHUA_DANG_NHAP` (NFR-06).
- A session expires after 30 minutes without activity (`SESSION_TIMEOUT_MINUTES`) and ends at logout.
- Roles in the sample data:

| Account | Role | Can additionally |
|---|---|---|
| `nv01`, `nv02` | `TIEP_NHAN` – intake staff (A1) | edit / move / cancel **only the tickets they created** |
| `ql01` | `QUAN_LY` – warranty centre manager (A2) | approve / reject warranty, edit any ticket, see full phone numbers |

## 3. Response format

- Success: `{ "data": … }` (except `GET /health` and the two `204 No Content` responses).
- Error – always the same shape, never a stack trace or SQL:

```json
{ "error": "DU_LIEU_KHONG_HOP_LE", "message": "Vui lòng nhập mô tả lỗi",
  "field": "issueDescription", "fields": { "issueDescription": "Vui lòng nhập mô tả lỗi" } }
```
`field` / `fields` appear only when the error belongs to one input field (the UI shows the message next to it).
Messages are in Vietnamese because they are shown to the staff as they are.

## 4. Error codes (business code → HTTP)

| HTTP | `error` | Meaning |
|---|---|---|
| 400 | `DU_LIEU_KHONG_HOP_LE` | Invalid input (also: body is not valid JSON) |
| 401 | `SAI_DANG_NHAP` | Wrong username or password |
| 401 | `CHUA_DANG_NHAP` | Missing, expired or logged-out token |
| 403 | `KHONG_DU_QUYEN` | Logged in but not allowed (wrong role or not the ticket's creator) |
| 404 | `KHONG_TIM_THAY` | Record not found, or unknown path |
| 409 | `TRUNG_DU_LIEU` | Phone / IMEI / Serial already used |
| 409 | `DANG_DUOC_SU_DUNG` | Customer still has devices, cannot be deactivated |
| 409 | `TRANG_THAI_KHONG_HOP_LE` | Status change not allowed by the life-cycle, or ticket already closed |
| 409 | `THIET_BI_KHONG_THUOC_KHACH` | Device belongs to another customer (QT-03) |
| 409 | `PHIEU_DANG_MO` | Device already has an open ticket |
| 500 | `LOI_HE_THONG` | Unexpected error – generic message only, details go to the server log without body/token |
| 503 | – | `GET /health` only: database down |

## 5. The *ticket view* object

Returned by every ticket endpoint.

| Field | Type | Meaning |
|---|---|---|
| `id`, `code` | integer, string | Internal id and ticket code `BH-0001` |
| `status` | string | `MOI`, `DA_PHAN_CONG`, `DANG_XU_LY`, `CHO_LINH_KIEN`, `HOAN_TAT`, `DA_DONG`, `DA_HUY` |
| `allowedNextStatuses` | string[] | Statuses **the caller** may move the ticket to next – empty when the ticket is closed or the caller is neither its creator nor a manager (BUG-007) |
| `canEdit` | boolean | The caller may edit / move / cancel this ticket (creator or `QUAN_LY`) |
| `priority` | string | `CAO`, `TRUNG_BINH`, `THAP` – from the issue category |
| `categoryName` | string | Phần cứng, Phần mềm, Kết nối, Phụ kiện/Ngoại hình, Khác |
| `warrantyStatus` | string | `CON_BAO_HANH`, `HET_BAO_HANH`, `CHUA_XAC_MINH` |
| `isUnverified` | boolean | Waiting for the manager to approve/reject the warranty |
| `issueDescription` | string | Customer's description |
| `receivedAt`, `slaDueAt` | ISO-8601 UTC | Intake time and SLA due time |
| `createdByName` | string | Staff member who created the ticket |
| `isOverdue` | boolean | Open and past `slaDueAt` |
| `needsAttention` | boolean | Open and due within 8 hours (or overdue) |
| `customer` | object | `id`, `fullName`, `phone` (masked for `TIEP_NHAN`) |
| `device` | object | `id`, `modelName`, `imei`, `serialNo`, `purchaseDate` (null = unknown), `warrantyMonths` |

## 6. Endpoint index

| # | Method and path | Permission | File |
|---|---|---|---|
| 1 | `GET /health` | public | [system.md](system.md) |
| 2 | `POST /api/auth/login` | public | [auth.md](auth.md) |
| 3 | `GET /api/auth/me` | token | [auth.md](auth.md) |
| 4 | `POST /api/auth/logout` | token | [auth.md](auth.md) |
| 5 | `GET /api/customers?phone=` | token | [customers.md](customers.md) |
| 6 | `GET /api/customers` | token | [customers.md](customers.md) |
| 7 | `GET /api/customers/{id}` | token | [customers.md](customers.md) |
| 8 | `POST /api/customers` | token | [customers.md](customers.md) |
| 9 | `PUT /api/customers/{id}` | token | [customers.md](customers.md) |
| 10 | `DELETE /api/customers/{id}` | token | [customers.md](customers.md) |
| 11 | `POST /api/tickets` | token | [tickets.md](tickets.md) |
| 12 | `GET /api/tickets` | token | [tickets.md](tickets.md) |
| 13 | `GET /api/tickets/{id}` | token | [tickets.md](tickets.md) |
| 14 | `GET /api/tickets/{id}/logs` | token | [tickets.md](tickets.md) |
| 15 | `PUT /api/tickets/{id}` | creator or `QUAN_LY` | [tickets.md](tickets.md) |
| 16 | `PATCH /api/tickets/{id}/status` | creator or `QUAN_LY` | [tickets.md](tickets.md) |
| 17 | `POST /api/tickets/{id}/approve` | `QUAN_LY` | [tickets.md](tickets.md) |
| 18 | `POST /api/tickets/{id}/reject` | `QUAN_LY` | [tickets.md](tickets.md) |
| 19 | `DELETE /api/tickets/{id}` | creator or `QUAN_LY` | [tickets.md](tickets.md) |

Any other path → `404 {"error":"KHONG_TIM_THAY","message":"Không có đường dẫn này"}`.

## 7. Known inconsistencies and limits (honest list)

- Customer objects use database column names (`full_name`, `created_at`, devices with `model_name`, `serial_no`…)
  while ticket objects use camelCase. Kept as is in v1.0 because the UI already depends on both; to unify in a later version.
- Customer create / update / deactivate are open to every logged-in role (no owner rule: customers are shared
  by the whole service centre).
- A non-numeric id (e.g. `/api/tickets/abc`) returns `404`, not `400`.
- No paging on the API (paging of 20 tickets is done in the UI); no rate limiting.
- Times are stored and returned in UTC; the UI shows them in Vietnam time (UTC+7).

The older design-time contract of Assignment 1 is kept in `docs/api-contract.md` for comparison (differences in TD-09).
