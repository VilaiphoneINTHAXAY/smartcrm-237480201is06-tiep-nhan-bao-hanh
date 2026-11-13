# Customer endpoints

> Part of the API documentation of Smart CRM – flow L2 (see [README](README.md)). Every example below was produced by a real run of tag `v1.0` (fresh database with the sample data, 13/11/2026); only the 64-character session tokens are shortened to `xxxxxxxx…xxxxxxxx`.

Customer objects use the database column names (`full_name`, `created_at`) – see README, *Known inconsistencies*.

## 5. `GET /api/customers?phone={phone}`

**1. Method and path:** `GET /api/customers?phone={phone}`

**2. Description:** Looks up one active customer by phone number and returns the customer with all registered devices (step 1 of screen M1, FR-01).

**3. Authentication and permission:** Token required; any role. Phone numbers are masked (`098****321`) for role `TIEP_NHAN` and shown in full for `QUAN_LY` (rule QT-15).

**4. Parameters and request body:**

| Name | In | Type | Required | Constraints |
|---|---|---|---|---|
| phone | query | string | yes | Accepts `0987654321`, `+84 987 654 321`, `84987654321`, dots or spaces – normalised to 10 digits starting with 0 (QT-02) |


Real request:

```http
GET /api/customers?phone=0987654321
Authorization: Bearer <token>
```

**5. Success response** (copied from a real run):

```http
HTTP/1.1 200

{
  "data": {
    "id": 3,
    "full_name": "Võ Em",
    "phone": "098****321",
    "created_at": "2026-11-13 09:04:04",
    "devices": [
      {
        "id": 3,
        "model_name": "Xiaomi Redmi Note 13",
        "imei": "867530912345678",
        "serial_no": null,
        "purchase_date": null,
        "warranty_months": 18
      }
    ]
  }
}
```

**6. Error codes:**

| HTTP | `error` code | When | Real example |
|---|---|---|---|
| 404 | `KHONG_TIM_THAY` | No active customer with that phone (also returned for an invalid phone format) | `{"error": "KHONG_TIM_THAY", "message": "Không tìm thấy khách hàng với SĐT này", "field": "phone", "fields": {"phone": "Không tìm thấy khách hàng với SĐT này"}}` |
| 401 | `CHUA_DANG_NHAP` | No `Authorization` header, unknown/expired token (30 min idle) or token logged out | `{"error": "CHUA_DANG_NHAP", "message": "Vui lòng đăng nhập"}` |

**7. Notes / limits:** Same customer seen by the manager `ql01`: `"phone": "0987654321"`. Without the `phone` parameter the same path returns the list (next endpoint).

---

## 6. `GET /api/customers`

**1. Method and path:** `GET /api/customers`

**2. Description:** Lists all active customers, oldest first.

**3. Authentication and permission:** Token required; any role. Phone numbers are masked (`098****321`) for role `TIEP_NHAN` and shown in full for `QUAN_LY` (rule QT-15).

**4. Parameters and request body:**

None.


Real request:

```http
GET /api/customers
Authorization: Bearer <token>
```

**5. Success response** (copied from a real run):

```http
HTTP/1.1 200

{
  "data": [
    {
      "id": 1,
      "full_name": "Lê Cường",
      "phone": "090****567",
      "created_at": "2026-11-13 09:04:04"
    },
    "… 2 more item(s) omitted in this document"
  ]
}
```

**6. Error codes:**

| HTTP | `error` code | When | Real example |
|---|---|---|---|
| 401 | `CHUA_DANG_NHAP` | No `Authorization` header, unknown/expired token (30 min idle) or token logged out | `{"error": "CHUA_DANG_NHAP", "message": "Vui lòng đăng nhập"}` |

**7. Notes / limits:** No paging (prototype has few customers). Deactivated customers (QT-13) are not listed.

---

## 7. `GET /api/customers/{id}`

**1. Method and path:** `GET /api/customers/{id}`

**2. Description:** Returns one customer by id.

**3. Authentication and permission:** Token required; any role. Phone numbers are masked (`098****321`) for role `TIEP_NHAN` and shown in full for `QUAN_LY` (rule QT-15).

**4. Parameters and request body:**

| Name | In | Type | Required | Constraints |
|---|---|---|---|---|
| id | path | integer | yes | Positive integer; anything else is treated as not found |


Real request:

```http
GET /api/customers/1
Authorization: Bearer <token>
```

**5. Success response** (copied from a real run):

```http
HTTP/1.1 200

{
  "data": {
    "id": 1,
    "full_name": "Lê Cường",
    "phone": "090****567",
    "created_at": "2026-11-13 09:04:04"
  }
}
```

**6. Error codes:**

| HTTP | `error` code | When | Real example |
|---|---|---|---|
| 404 | `KHONG_TIM_THAY` | Unknown id or non-numeric id | `{"error": "KHONG_TIM_THAY", "message": "Không tìm thấy khách hàng", "field": "id", "fields": {"id": "Không tìm thấy khách hàng"}}` |
| 401 | `CHUA_DANG_NHAP` | No `Authorization` header, unknown/expired token (30 min idle) or token logged out | `{"error": "CHUA_DANG_NHAP", "message": "Vui lòng đăng nhập"}` |

**7. Notes / limits:** Does not include devices; use the phone lookup for that.

---

## 8. `POST /api/customers`

**1. Method and path:** `POST /api/customers`

**2. Description:** Registers a new customer (FR-02).

**3. Authentication and permission:** Token required; any role. Phone numbers are masked (`098****321`) for role `TIEP_NHAN` and shown in full for `QUAN_LY` (rule QT-15).

**4. Parameters and request body:**

| Name | In | Type | Required | Constraints |
|---|---|---|---|---|
| fullName | body | string | yes | 1–100 characters after trimming |
| phone | body | string | yes | Vietnamese mobile number, any common format (QT-02); stored normalised; must be unique (BR-07) |


Real request:

```http
POST /api/customers
Authorization: Bearer <token>
Content-Type: application/json

{
  "fullName": "Trần Thị Bích",
  "phone": "+84 933 111 222"
}
```

**5. Success response** (copied from a real run):

```http
HTTP/1.1 201

{
  "data": {
    "id": 4,
    "full_name": "Trần Thị Bích",
    "phone": "093****222",
    "created_at": "2026-11-13 09:04:04"
  }
}
```

**6. Error codes:**

| HTTP | `error` code | When | Real example |
|---|---|---|---|
| 400 | `DU_LIEU_KHONG_HOP_LE` | Missing name, name > 100 chars, missing or invalid phone; `fields` names the field | `{"error": "DU_LIEU_KHONG_HOP_LE", "message": "Số điện thoại phải gồm 10 chữ số bắt đầu bằng 0 (chấp nhận +84…, 84…, có dấu cách hoặc dấu chấm)", "field": "phone", "fields": {"phone": "Số điện thoại phải gồm 10 chữ số bắt đầu bằng 0 (chấp nhận +84…, 84…, có dấu cách hoặc dấu chấm)"}}` |
| 409 | `TRUNG_DU_LIEU` | Phone already belongs to another customer (also a deactivated one) | `{"error": "TRUNG_DU_LIEU", "message": "Số điện thoại đã thuộc về một khách hàng khác", "field": "phone", "fields": {"phone": "Số điện thoại đã thuộc về một khách hàng khác"}}` |
| 401 | `CHUA_DANG_NHAP` | No `Authorization` header, unknown/expired token (30 min idle) or token logged out | `{"error": "CHUA_DANG_NHAP", "message": "Vui lòng đăng nhập"}` |

**7. Notes / limits:** Phone `+84 933 111 222` in the request was stored as `0933111222`.

---

## 9. `PUT /api/customers/{id}`

**1. Method and path:** `PUT /api/customers/{id}`

**2. Description:** Updates the name and/or phone of a customer; fields that are not sent stay unchanged.

**3. Authentication and permission:** Token required; any role. Phone numbers are masked (`098****321`) for role `TIEP_NHAN` and shown in full for `QUAN_LY` (rule QT-15). (the example is called by `ql01`, so the phone is shown in full).

**4. Parameters and request body:**

| Name | In | Type | Required | Constraints |
|---|---|---|---|---|
| id | path | integer | yes | Existing customer |
| fullName | body | string | no | 1–100 characters |
| phone | body | string | no | Same rules as create; must not belong to another customer |


Real request:

```http
PUT /api/customers/4
Authorization: Bearer <token>
Content-Type: application/json

{
  "fullName": "Trần Thị Bích Ngọc"
}
```

**5. Success response** (copied from a real run):

```http
HTTP/1.1 200

{
  "data": {
    "id": 4,
    "full_name": "Trần Thị Bích Ngọc",
    "phone": "0933111222",
    "created_at": "2026-11-13 09:04:04"
  }
}
```

**6. Error codes:**

| HTTP | `error` code | When | Real example |
|---|---|---|---|
| 400 | `DU_LIEU_KHONG_HOP_LE` | Invalid name or phone |  |
| 404 | `KHONG_TIM_THAY` | Unknown id | `{"error": "KHONG_TIM_THAY", "message": "Không tìm thấy khách hàng", "field": "id", "fields": {"id": "Không tìm thấy khách hàng"}}` |
| 409 | `TRUNG_DU_LIEU` | Phone belongs to another customer |  |
| 401 | `CHUA_DANG_NHAP` | No `Authorization` header, unknown/expired token (30 min idle) or token logged out | `{"error": "CHUA_DANG_NHAP", "message": "Vui lòng đăng nhập"}` |

**7. Notes / limits:** Partial update (both fields optional) although the method is PUT.

---

## 10. `DELETE /api/customers/{id}`

**1. Method and path:** `DELETE /api/customers/{id}`

**2. Description:** Deactivates a customer (soft delete, QT-13): the row is kept for history, the customer disappears from lookups and the phone cannot be reused.

**3. Authentication and permission:** Token required; any role.

**4. Parameters and request body:**

| Name | In | Type | Required | Constraints |
|---|---|---|---|---|
| id | path | integer | yes | Existing customer without devices |


Real request:

```http
DELETE /api/customers/4
Authorization: Bearer <token>
```

**5. Success response** (copied from a real run):

```http
HTTP/1.1 204
```

**6. Error codes:**

| HTTP | `error` code | When | Real example |
|---|---|---|---|
| 404 | `KHONG_TIM_THAY` | Unknown id |  |
| 409 | `DANG_DUOC_SU_DUNG` | Customer already has at least one device | `{"error": "DANG_DUOC_SU_DUNG", "message": "Không thể xoá khách hàng đã có thiết bị", "field": "id", "fields": {"id": "Không thể xoá khách hàng đã có thiết bị"}}` |
| 401 | `CHUA_DANG_NHAP` | No `Authorization` header, unknown/expired token (30 min idle) or token logged out | `{"error": "CHUA_DANG_NHAP", "message": "Vui lòng đăng nhập"}` |

**7. Notes / limits:** Returns **204 with no body**. Nothing is physically deleted.

---
