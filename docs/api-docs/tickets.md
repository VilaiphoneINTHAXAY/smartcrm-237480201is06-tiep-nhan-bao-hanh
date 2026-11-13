# Warranty ticket endpoints

> Part of the API documentation of Smart CRM – flow L2 (see [README](README.md)). Every example below was produced by a real run of tag `v1.0` (fresh database with the sample data, 13/11/2026); only the 64-character session tokens are shortened to `xxxxxxxx…xxxxxxxx`.

## 11. `POST /api/tickets`

**1. Method and path:** `POST /api/tickets`

**2. Description:** Receives a device for warranty service: checks the warranty, classifies the issue, computes the SLA due date and creates a ticket in status `MOI` with a history line (FR-03, FR-04, FR-07, FR-08).

**3. Authentication and permission:** Token required; any role (normally `TIEP_NHAN`). The creator is stored in `created_by`. The response is a *ticket view* (fields described in README, section 5).

**4. Parameters and request body:**

Either `deviceId` (device already registered) **or** `device` (new device):

| Name | In | Type | Required | Constraints |
|---|---|---|---|---|
| issueDescription | body | string | yes | 1–1000 characters after trimming; keywords decide the category (BR-04) |
| deviceId | body | integer | one of | Registered device |
| customerId | body | integer | no | Customer being served; if sent, the device must belong to them (QT-03) |
| device.customerId | body | integer | one of | Owner of the new device |
| device.modelName | body | string | with `device` | Model name |
| device.imei | body | string | imei or serial | Exactly 15 digits, unique (BR-01) |
| device.serialNo | body | string | imei or serial | 5–30 letters/digits, unique |
| device.purchaseDate | body | string | no | `YYYY-MM-DD`, not after today; missing → warranty `CHUA_XAC_MINH` (GWT-09) |
| device.warrantyMonths | body | integer | no | 0–60, default 12 |


Real request:

```http
POST /api/tickets
Authorization: Bearer <token>
Content-Type: application/json

{
  "customerId": 3,
  "deviceId": 3,
  "issueDescription": "Máy không lên nguồn"
}
```

**5. Success response** (copied from a real run):

```http
HTTP/1.1 201

{
  "data": {
    "id": 1,
    "code": "BH-0001",
    "status": "MOI",
    "allowedNextStatuses": [
      "DA_PHAN_CONG",
      "DA_HUY"
    ],
    "priority": "CAO",
    "categoryName": "Phần cứng",
    "warrantyStatus": "CHUA_XAC_MINH",
    "isUnverified": true,
    "issueDescription": "Máy không lên nguồn",
    "receivedAt": "2026-11-13T09:04:04.605Z",
    "createdByName": "Nguyễn An",
    "slaDueAt": "2026-11-14T09:04:04.605Z",
    "isOverdue": false,
    "needsAttention": false,
    "customer": {
      "id": 3,
      "fullName": "Võ Em",
      "phone": "098****321"
    },
    "device": {
      "id": 3,
      "modelName": "Xiaomi Redmi Note 13",
      "imei": "867530912345678",
      "serialNo": null,
      "purchaseDate": null,
      "warrantyMonths": 18
    }
  }
}
```

Real request with a **new device** (purchase date given → `CON_BAO_HANH`, keywords "treo", "đơ" → *Phần mềm*):

```http
POST /api/tickets
Authorization: Bearer <token>
Content-Type: application/json

{
  "issueDescription": "Máy bị treo logo, đơ cảm ứng",
  "device": {
    "customerId": 1,
    "modelName": "Oppo Reno 11",
    "imei": "359876543210987",
    "purchaseDate": "2026-06-01",
    "warrantyMonths": 12
  }
}
```

```http
HTTP/1.1 201

{
  "data": {
    "id": 2,
    "code": "BH-0002",
    "status": "MOI",
    "allowedNextStatuses": [
      "DA_PHAN_CONG",
      "DA_HUY"
    ],
    "priority": "TRUNG_BINH",
    "categoryName": "Phần mềm",
    "warrantyStatus": "CON_BAO_HANH",
    "isUnverified": false,
    "issueDescription": "Máy bị treo logo, đơ cảm ứng",
    "receivedAt": "2026-11-13T09:04:04.614Z",
    "createdByName": "Nguyễn An",
    "slaDueAt": "2026-11-17T09:04:04.614Z",
    "isOverdue": false,
    "needsAttention": false,
    "customer": {
      "id": 1,
      "fullName": "Lê Cường",
      "phone": "090****567"
    },
    "device": {
      "id": 4,
      "modelName": "Oppo Reno 11",
      "imei": "359876543210987",
      "serialNo": null,
      "purchaseDate": "2026-06-01",
      "warrantyMonths": 12
    }
  }
}
```

**6. Error codes:**

| HTTP | `error` code | When | Real example |
|---|---|---|---|
| 400 | `DU_LIEU_KHONG_HOP_LE` | Empty description, bad IMEI/Serial/date, neither `deviceId` nor `device`; `fields` names the field | `{"error": "DU_LIEU_KHONG_HOP_LE", "message": "Vui lòng nhập mô tả lỗi", "field": "issueDescription", "fields": {"issueDescription": "Vui lòng nhập mô tả lỗi"}}` |
| 400 | `DU_LIEU_KHONG_HOP_LE` | IMEI not 15 digits | `{"error": "DU_LIEU_KHONG_HOP_LE", "message": "IMEI phải đúng 15 chữ số", "field": "imei", "fields": {"imei": "IMEI phải đúng 15 chữ số"}}` |
| 404 | `KHONG_TIM_THAY` | Unknown `deviceId` or unknown `device.customerId` |  |
| 409 | `PHIEU_DANG_MO` | The device already has an open ticket | `{"error": "PHIEU_DANG_MO", "message": "Thiết bị này đang có phiếu BH-0001 chưa hoàn tất. Hãy mở phiếu đó thay vì tạo phiếu mới.", "field": "deviceId", "fields": {"deviceId": "Thiết bị này đang có phiếu BH-0001 chưa hoàn tất. Hãy mở phiếu đó thay vì tạo phiếu mới."}}` |
| 409 | `THIET_BI_KHONG_THUOC_KHACH` | `deviceId` belongs to another customer than `customerId` | `{"error": "THIET_BI_KHONG_THUOC_KHACH", "message": "Thiết bị này không thuộc khách hàng đang tiếp nhận. Hãy chọn lại thiết bị của khách hoặc tạo thiết bị mới.", "field": "deviceId", "fields": {"deviceId": "Thiết bị này không thuộc khách hàng đang tiếp nhận. Hãy chọn lại thiết bị của khách hoặc tạo thiết bị mới."}}` |
| 409 | `TRUNG_DU_LIEU` | New device IMEI/Serial already exists |  |
| 401 | `CHUA_DANG_NHAP` | No `Authorization` header, unknown/expired token (30 min idle) or token logged out | `{"error": "CHUA_DANG_NHAP", "message": "Vui lòng đăng nhập"}` |

**7. Notes / limits:** Calling again for the same device while its ticket is still open returns 409 instead of creating a second ticket. Device + ticket + history are written in **one transaction** (a failed ticket leaves no orphan device). SLA: CAO +1, TRUNG_BINH +3, THAP +5 working days, Monday–Saturday (TD-06); the due date is fixed at creation (BR-05).

---

## 12. `GET /api/tickets`

**1. Method and path:** `GET /api/tickets`

**2. Description:** Lists tickets sorted by SLA due date (most urgent first), with overdue / needs-attention flags for screen M2.

**3. Authentication and permission:** Token required; any role. The response is a *ticket view* (fields described in README, section 5).

**4. Parameters and request body:**

| Name | In | Type | Required | Constraints |
|---|---|---|---|---|
| status | query | string | no | One of `MOI`, `DA_PHAN_CONG`, `DANG_XU_LY`, `CHO_LINH_KIEN`, `HOAN_TAT`, `DA_DONG`, `DA_HUY` |
| unverified | query | `1` | no | `1` = only tickets waiting for the manager to verify the warranty |


Real request:

```http
GET /api/tickets
Authorization: Bearer <token>
```

**5. Success response** (copied from a real run):

```http
HTTP/1.1 200

{
  "data": [
    {
      "id": 1,
      "code": "BH-0001",
      "status": "MOI",
      "allowedNextStatuses": [
        "DA_PHAN_CONG",
        "DA_HUY"
      ],
      "priority": "CAO",
      "categoryName": "Phần cứng",
      "warrantyStatus": "CHUA_XAC_MINH",
      "isUnverified": true,
      "issueDescription": "Máy không lên nguồn",
      "receivedAt": "2026-11-13T09:04:04.605Z",
      "createdByName": "Nguyễn An",
      "slaDueAt": "2026-11-14T09:04:04.605Z",
      "isOverdue": false,
      "needsAttention": false,
      "customer": {
        "id": 3,
        "fullName": "Võ Em",
        "phone": "098****321"
      },
      "device": {
        "id": 3,
        "modelName": "Xiaomi Redmi Note 13",
        "imei": "867530912345678",
        "serialNo": null,
        "purchaseDate": null,
        "warrantyMonths": 18
      }
    },
    "… 1 more item(s) omitted in this document"
  ]
}
```

Real request of the manager (`ql01`) for the approval queue:

```http
GET /api/tickets?unverified=1
Authorization: Bearer <token>
```

```http
HTTP/1.1 200

{
  "data": [
    {
      "id": 1,
      "code": "BH-0001",
      "status": "MOI",
      "allowedNextStatuses": [
        "DA_PHAN_CONG",
        "DA_HUY"
      ],
      "priority": "CAO",
      "categoryName": "Phần cứng",
      "warrantyStatus": "CHUA_XAC_MINH",
      "isUnverified": true,
      "issueDescription": "Máy không lên nguồn",
      "receivedAt": "2026-11-13T09:04:04.605Z",
      "createdByName": "Nguyễn An",
      "slaDueAt": "2026-11-14T09:04:04.605Z",
      "isOverdue": false,
      "needsAttention": false,
      "customer": {
        "id": 3,
        "fullName": "Võ Em",
        "phone": "0987654321"
      },
      "device": {
        "id": 3,
        "modelName": "Xiaomi Redmi Note 13",
        "imei": "867530912345678",
        "serialNo": null,
        "purchaseDate": null,
        "warrantyMonths": 18
      }
    }
  ]
}
```

**6. Error codes:**

| HTTP | `error` code | When | Real example |
|---|---|---|---|
| 400 | `DU_LIEU_KHONG_HOP_LE` | Unknown `status` value | `{"error": "DU_LIEU_KHONG_HOP_LE", "message": "Trạng thái lọc không hợp lệ", "field": "status", "fields": {"status": "Trạng thái lọc không hợp lệ"}}` |
| 401 | `CHUA_DANG_NHAP` | No `Authorization` header, unknown/expired token (30 min idle) or token logged out | `{"error": "CHUA_DANG_NHAP", "message": "Vui lòng đăng nhập"}` |

**7. Notes / limits:** `needsAttention` = still open and due within 8 hours (or overdue). Paging (20 per page) is done in the UI. Phone masking as for customers.

---

## 13. `GET /api/tickets/{id}`

**1. Method and path:** `GET /api/tickets/{id}`

**2. Description:** Returns one ticket with customer and device (screen M3).

**3. Authentication and permission:** Token required; any role. The response is a *ticket view* (fields described in README, section 5).

**4. Parameters and request body:**

| Name | In | Type | Required | Constraints |
|---|---|---|---|---|
| id | path | integer | yes | Ticket id |


Real request:

```http
GET /api/tickets/1
Authorization: Bearer <token>
```

**5. Success response** (copied from a real run):

```http
HTTP/1.1 200

{
  "data": {
    "id": 1,
    "code": "BH-0001",
    "status": "MOI",
    "allowedNextStatuses": [
      "DA_PHAN_CONG",
      "DA_HUY"
    ],
    "priority": "CAO",
    "categoryName": "Phần cứng",
    "warrantyStatus": "CHUA_XAC_MINH",
    "isUnverified": true,
    "issueDescription": "Máy không lên nguồn",
    "receivedAt": "2026-11-13T09:04:04.605Z",
    "createdByName": "Nguyễn An",
    "slaDueAt": "2026-11-14T09:04:04.605Z",
    "isOverdue": false,
    "needsAttention": false,
    "customer": {
      "id": 3,
      "fullName": "Võ Em",
      "phone": "098****321"
    },
    "device": {
      "id": 3,
      "modelName": "Xiaomi Redmi Note 13",
      "imei": "867530912345678",
      "serialNo": null,
      "purchaseDate": null,
      "warrantyMonths": 18
    }
  }
}
```

**6. Error codes:**

| HTTP | `error` code | When | Real example |
|---|---|---|---|
| 404 | `KHONG_TIM_THAY` | Unknown or non-numeric id (e.g. `1 OR 1=1`) | `{"error": "KHONG_TIM_THAY", "message": "Không tìm thấy phiếu", "field": "id", "fields": {"id": "Không tìm thấy phiếu"}}` |
| 401 | `CHUA_DANG_NHAP` | No `Authorization` header, unknown/expired token (30 min idle) or token logged out | `{"error": "CHUA_DANG_NHAP", "message": "Vui lòng đăng nhập"}` |

**7. Notes / limits:** `allowedNextStatuses` tells the UI which status buttons to show.

---

## 14. `GET /api/tickets/{id}/logs`

**1. Method and path:** `GET /api/tickets/{id}/logs`

**2. Description:** Returns the full status history of a ticket, oldest first (NFR-05).

**3. Authentication and permission:** Token required; any role.

**4. Parameters and request body:**

| Name | In | Type | Required | Constraints |
|---|---|---|---|---|
| id | path | integer | yes | Ticket id |


Real request:

```http
GET /api/tickets/1/logs
Authorization: Bearer <token>
```

**5. Success response** (copied from a real run):

```http
HTTP/1.1 200

{
  "data": [
    {
      "id": 1,
      "action": "TAO_PHIEU",
      "from_status": null,
      "to_status": "MOI",
      "note": null,
      "changed_at": "2026-11-13T09:04:04.605Z",
      "changed_by_name": "Nguyễn An"
    },
    {
      "id": 3,
      "action": "DUYET_BAO_HANH",
      "from_status": "MOI",
      "to_status": "MOI",
      "note": "Duyệt: CÒN BẢO HÀNH",
      "changed_at": "2026-11-13T09:04:04.632Z",
      "changed_by_name": "Trần Bình"
    },
    {
      "id": 4,
      "action": "DOI_TRANG_THAI",
      "from_status": "MOI",
      "to_status": "DA_PHAN_CONG",
      "note": "Giao KTV Hùng",
      "changed_at": "2026-11-13T09:04:04.636Z",
      "changed_by_name": "Nguyễn An"
    }
  ]
}
```

**6. Error codes:**

| HTTP | `error` code | When | Real example |
|---|---|---|---|
| 404 | `KHONG_TIM_THAY` | Unknown ticket | `{"error": "KHONG_TIM_THAY", "message": "Không tìm thấy phiếu", "field": "id", "fields": {"id": "Không tìm thấy phiếu"}}` |
| 401 | `CHUA_DANG_NHAP` | No `Authorization` header, unknown/expired token (30 min idle) or token logged out | `{"error": "CHUA_DANG_NHAP", "message": "Vui lòng đăng nhập"}` |

**7. Notes / limits:** History lines are never edited or deleted. `action` ∈ `TAO_PHIEU`, `DOI_TRANG_THAI`, `DUYET_BAO_HANH`, `TU_CHOI_BAO_HANH`.

---

## 15. `PUT /api/tickets/{id}`

**1. Method and path:** `PUT /api/tickets/{id}`

**2. Description:** Corrects the issue description of an open ticket; the category and priority are re-classified.

**3. Authentication and permission:** Token required; only the **creator** of the ticket or a `QUAN_LY` (OWASP A01, BUG-005). The response is a *ticket view* (fields described in README, section 5).

**4. Parameters and request body:**

| Name | In | Type | Required | Constraints |
|---|---|---|---|---|
| id | path | integer | yes | Open ticket |
| issueDescription | body | string | yes | Not empty |


Real request:

```http
PUT /api/tickets/2
Authorization: Bearer <token>
Content-Type: application/json

{
  "issueDescription": "Mất sóng wifi sau khi cập nhật"
}
```

**5. Success response** (copied from a real run):

```http
HTTP/1.1 200

{
  "data": {
    "id": 2,
    "code": "BH-0002",
    "status": "MOI",
    "allowedNextStatuses": [
      "DA_PHAN_CONG",
      "DA_HUY"
    ],
    "priority": "TRUNG_BINH",
    "categoryName": "Phần mềm",
    "warrantyStatus": "CON_BAO_HANH",
    "isUnverified": false,
    "issueDescription": "Mất sóng wifi sau khi cập nhật",
    "receivedAt": "2026-11-13T09:04:04.614Z",
    "createdByName": "Nguyễn An",
    "slaDueAt": "2026-11-17T09:04:04.614Z",
    "isOverdue": false,
    "needsAttention": false,
    "customer": {
      "id": 1,
      "fullName": "Lê Cường",
      "phone": "090****567"
    },
    "device": {
      "id": 4,
      "modelName": "Oppo Reno 11",
      "imei": "359876543210987",
      "serialNo": null,
      "purchaseDate": "2026-06-01",
      "warrantyMonths": 12
    }
  }
}
```

**6. Error codes:**

| HTTP | `error` code | When | Real example |
|---|---|---|---|
| 400 | `DU_LIEU_KHONG_HOP_LE` | Empty description |  |
| 403 | `KHONG_DU_QUYEN` | Another staff member (`nv02`) edits `nv01`'s ticket | `{"error": "KHONG_DU_QUYEN", "message": "Chỉ người tạo phiếu hoặc Quản lý TTBH được sửa phiếu này"}` |
| 404 | `KHONG_TIM_THAY` | Unknown ticket |  |
| 409 | `TRANG_THAI_KHONG_HOP_LE` | Ticket already `HOAN_TAT`, `DA_DONG` or `DA_HUY` | `{"error": "TRANG_THAI_KHONG_HOP_LE", "message": "Phiếu đã kết thúc (hoàn tất, đóng hoặc huỷ), không sửa được", "field": "status", "fields": {"status": "Phiếu đã kết thúc (hoàn tất, đóng hoặc huỷ), không sửa được"}}` |
| 401 | `CHUA_DANG_NHAP` | No `Authorization` header, unknown/expired token (30 min idle) or token logged out | `{"error": "CHUA_DANG_NHAP", "message": "Vui lòng đăng nhập"}` |

**7. Notes / limits:** The SLA due date is **not** recomputed (BR-05), even if the priority changes (in the example `slaDueAt` stays `2026-11-17T09:04:04.614Z`; "cập nhật" matches *Phần mềm* before "wifi" matches *Kết nối*, BR-04 order).

---

## 16. `PATCH /api/tickets/{id}/status`

**1. Method and path:** `PATCH /api/tickets/{id}/status`

**2. Description:** Moves a ticket one step forward in its life-cycle and writes a history line (QT-06).

**3. Authentication and permission:** Token required; only the creator or a `QUAN_LY`. The response is a *ticket view* (fields described in README, section 5).

**4. Parameters and request body:**

| Name | In | Type | Required | Constraints |
|---|---|---|---|---|
| id | path | integer | yes | Ticket id |
| status | body | string | yes | Must be in the ticket's `allowedNextStatuses` |
| note | body | string | no / yes for `DA_HUY` | Free text stored in the history |


Real request:

```http
PATCH /api/tickets/1/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "DA_PHAN_CONG",
  "note": "Giao KTV Hùng"
}
```

**5. Success response** (copied from a real run):

```http
HTTP/1.1 200

{
  "data": {
    "id": 1,
    "code": "BH-0001",
    "status": "DA_PHAN_CONG",
    "allowedNextStatuses": [
      "DANG_XU_LY",
      "DA_HUY"
    ],
    "priority": "CAO",
    "categoryName": "Phần cứng",
    "warrantyStatus": "CON_BAO_HANH",
    "isUnverified": false,
    "issueDescription": "Máy không lên nguồn",
    "receivedAt": "2026-11-13T09:04:04.605Z",
    "createdByName": "Nguyễn An",
    "slaDueAt": "2026-11-14T09:04:04.605Z",
    "isOverdue": false,
    "needsAttention": false,
    "customer": {
      "id": 3,
      "fullName": "Võ Em",
      "phone": "098****321"
    },
    "device": {
      "id": 3,
      "modelName": "Xiaomi Redmi Note 13",
      "imei": "867530912345678",
      "serialNo": null,
      "purchaseDate": null,
      "warrantyMonths": 18
    }
  }
}
```

**6. Error codes:**

| HTTP | `error` code | When | Real example |
|---|---|---|---|
| 409 | `TRANG_THAI_KHONG_HOP_LE` | Skipping a step or going backwards | `{"error": "TRANG_THAI_KHONG_HOP_LE", "message": "Phiếu đang ở DA_PHAN_CONG, chỉ chuyển được sang DANG_XU_LY hoặc DA_HUY", "field": "status", "fields": {"status": "Phiếu đang ở DA_PHAN_CONG, chỉ chuyển được sang DANG_XU_LY hoặc DA_HUY"}}` |
| 400 | `DU_LIEU_KHONG_HOP_LE` | `DA_HUY` without `note` | `{"error": "DU_LIEU_KHONG_HOP_LE", "message": "Phải nhập lý do khi huỷ phiếu", "field": "note", "fields": {"note": "Phải nhập lý do khi huỷ phiếu"}}` |
| 403 | `KHONG_DU_QUYEN` | Not the creator and not a manager |  |
| 404 | `KHONG_TIM_THAY` | Unknown ticket |  |
| 401 | `CHUA_DANG_NHAP` | No `Authorization` header, unknown/expired token (30 min idle) or token logged out | `{"error": "CHUA_DANG_NHAP", "message": "Vui lòng đăng nhập"}` |

**7. Notes / limits:** Life-cycle: `MOI → DA_PHAN_CONG → DANG_XU_LY → (CHO_LINH_KIEN →) HOAN_TAT → DA_DONG`; `DA_HUY` only from `MOI` or `DA_PHAN_CONG`. Technician assignment itself belongs to flow L4 (out of scope).

---

## 17. `POST /api/tickets/{id}/approve`

**1. Method and path:** `POST /api/tickets/{id}/approve`

**2. Description:** Manager confirms the warranty of a ticket flagged *unverified*: warranty becomes `CON_BAO_HANH`, flag removed, history line added (GWT-20).

**3. Authentication and permission:** Token required; role `QUAN_LY` only (BR-03). The response is a *ticket view* (fields described in README, section 5).

**4. Parameters and request body:**

| Name | In | Type | Required | Constraints |
|---|---|---|---|---|
| id | path | integer | yes | Ticket with `isUnverified: true` |


Real request:

```http
POST /api/tickets/1/approve
Authorization: Bearer <token>
```

**5. Success response** (copied from a real run):

```http
HTTP/1.1 200

{
  "data": {
    "id": 1,
    "code": "BH-0001",
    "status": "MOI",
    "allowedNextStatuses": [
      "DA_PHAN_CONG",
      "DA_HUY"
    ],
    "priority": "CAO",
    "categoryName": "Phần cứng",
    "warrantyStatus": "CON_BAO_HANH",
    "isUnverified": false,
    "issueDescription": "Máy không lên nguồn",
    "receivedAt": "2026-11-13T09:04:04.605Z",
    "createdByName": "Nguyễn An",
    "slaDueAt": "2026-11-14T09:04:04.605Z",
    "isOverdue": false,
    "needsAttention": false,
    "customer": {
      "id": 3,
      "fullName": "Võ Em",
      "phone": "0987654321"
    },
    "device": {
      "id": 3,
      "modelName": "Xiaomi Redmi Note 13",
      "imei": "867530912345678",
      "serialNo": null,
      "purchaseDate": null,
      "warrantyMonths": 18
    }
  }
}
```

**6. Error codes:**

| HTTP | `error` code | When | Real example |
|---|---|---|---|
| 403 | `KHONG_DU_QUYEN` | Caller is not a manager | `{"error": "KHONG_DU_QUYEN", "message": "Chỉ Quản lý TTBH được duyệt hoặc từ chối bảo hành"}` |
| 409 | `TRANG_THAI_KHONG_HOP_LE` | Ticket is not waiting for approval (already approved) | `{"error": "TRANG_THAI_KHONG_HOP_LE", "message": "Phiếu này không chờ duyệt bảo hành", "field": "id", "fields": {"id": "Phiếu này không chờ duyệt bảo hành"}}` |
| 404 | `KHONG_TIM_THAY` | Unknown ticket |  |
| 401 | `CHUA_DANG_NHAP` | No `Authorization` header, unknown/expired token (30 min idle) or token logged out | `{"error": "CHUA_DANG_NHAP", "message": "Vui lòng đăng nhập"}` |

**7. Notes / limits:** No request body.

---

## 18. `POST /api/tickets/{id}/reject`

**1. Method and path:** `POST /api/tickets/{id}/reject`

**2. Description:** Manager refuses the warranty of an unverified ticket; the reason is mandatory and stored in the history (GWT-10, BR-06).

**3. Authentication and permission:** Token required; role `QUAN_LY` only. The response is a *ticket view* (fields described in README, section 5).

**4. Parameters and request body:**

| Name | In | Type | Required | Constraints |
|---|---|---|---|---|
| id | path | integer | yes | Ticket with `isUnverified: true` |
| note | body | string | yes | Reason, not empty |


Real request:

```http
POST /api/tickets/3/reject
Authorization: Bearer <token>
Content-Type: application/json

{
  "note": "Tem bảo hành bị rách"
}
```

**5. Success response** (copied from a real run):

```http
HTTP/1.1 200

{
  "data": {
    "id": 3,
    "code": "BH-0003",
    "status": "MOI",
    "allowedNextStatuses": [
      "DA_PHAN_CONG",
      "DA_HUY"
    ],
    "priority": "THAP",
    "categoryName": "Phụ kiện/Ngoại hình",
    "warrantyStatus": "CHUA_XAC_MINH",
    "isUnverified": true,
    "issueDescription": "Trầy xước nút bấm",
    "receivedAt": "2026-11-13T09:04:04.641Z",
    "createdByName": "Nguyễn An",
    "slaDueAt": "2026-11-19T09:04:04.641Z",
    "isOverdue": false,
    "needsAttention": false,
    "customer": {
      "id": 2,
      "fullName": "Phạm Dung",
      "phone": "0912345678"
    },
    "device": {
      "id": 5,
      "modelName": "Vivo Y36",
      "imei": null,
      "serialNo": "VY36SN0001",
      "purchaseDate": null,
      "warrantyMonths": 12
    }
  }
}
```

**6. Error codes:**

| HTTP | `error` code | When | Real example |
|---|---|---|---|
| 400 | `DU_LIEU_KHONG_HOP_LE` | Missing reason | `{"error": "DU_LIEU_KHONG_HOP_LE", "message": "Phải nhập lý do khi từ chối", "field": "note", "fields": {"note": "Phải nhập lý do khi từ chối"}}` |
| 403 | `KHONG_DU_QUYEN` | Caller is not a manager |  |
| 409 | `TRANG_THAI_KHONG_HOP_LE` | Ticket is not waiting for approval |  |
| 401 | `CHUA_DANG_NHAP` | No `Authorization` header, unknown/expired token (30 min idle) or token logged out | `{"error": "CHUA_DANG_NHAP", "message": "Vui lòng đăng nhập"}` |

**7. Notes / limits:** The flag stays (`CHUA_XAC_MINH`, `isUnverified: true`) so the decision is visible; the reason is in `GET /logs`.

---

## 19. `DELETE /api/tickets/{id}`

**1. Method and path:** `DELETE /api/tickets/{id}`

**2. Description:** Customer cancels the ticket: status becomes `DA_HUY` with a mandatory reason; the ticket and its history are kept (QT-13).

**3. Authentication and permission:** Token required; only the creator or a `QUAN_LY`. The response is a *ticket view* (fields described in README, section 5).

**4. Parameters and request body:**

| Name | In | Type | Required | Constraints |
|---|---|---|---|---|
| id | path | integer | yes | Ticket in `MOI` or `DA_PHAN_CONG` |
| note | body | string | yes | Cancellation reason |


Real request:

```http
DELETE /api/tickets/3
Authorization: Bearer <token>
Content-Type: application/json

{
  "note": "Khách đổi ý, mang máy về"
}
```

**5. Success response** (copied from a real run):

```http
HTTP/1.1 200

{
  "data": {
    "id": 3,
    "code": "BH-0003",
    "status": "DA_HUY",
    "allowedNextStatuses": [],
    "priority": "THAP",
    "categoryName": "Phụ kiện/Ngoại hình",
    "warrantyStatus": "CHUA_XAC_MINH",
    "isUnverified": true,
    "issueDescription": "Trầy xước nút bấm",
    "receivedAt": "2026-11-13T09:04:04.641Z",
    "createdByName": "Nguyễn An",
    "slaDueAt": "2026-11-19T09:04:04.641Z",
    "isOverdue": false,
    "needsAttention": false,
    "customer": {
      "id": 2,
      "fullName": "Phạm Dung",
      "phone": "091****678"
    },
    "device": {
      "id": 5,
      "modelName": "Vivo Y36",
      "imei": null,
      "serialNo": "VY36SN0001",
      "purchaseDate": null,
      "warrantyMonths": 12
    }
  }
}
```

**6. Error codes:**

| HTTP | `error` code | When | Real example |
|---|---|---|---|
| 400 | `DU_LIEU_KHONG_HOP_LE` | Missing reason | `{"error": "DU_LIEU_KHONG_HOP_LE", "message": "Phải nhập lý do khi huỷ phiếu", "field": "note", "fields": {"note": "Phải nhập lý do khi huỷ phiếu"}}` |
| 409 | `TRANG_THAI_KHONG_HOP_LE` | Ticket already being repaired or closed |  |
| 403 | `KHONG_DU_QUYEN` | Not the creator and not a manager |  |
| 401 | `CHUA_DANG_NHAP` | No `Authorization` header, unknown/expired token (30 min idle) or token logged out | `{"error": "CHUA_DANG_NHAP", "message": "Vui lòng đăng nhập"}` |

**7. Notes / limits:** Same rules as `PATCH /status` with `status: "DA_HUY"`. Nothing is physically deleted; a new ticket can then be opened for the same device.

---
