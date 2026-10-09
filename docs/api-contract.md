# API contract – Luồng L2 (track SE)

Base path `/api` · JSON · mọi endpoint yêu cầu header `Authorization: Bearer <token>`.
Lỗi chung: **401** phiên hết hạn / chưa đăng nhập (NFR-06) · **403** sai vai trò · **400** dữ liệu sai (body `{ "field": "...", "message": "..." }`).

| Method | Endpoint | Vai trò | Mô tả | FR | Thành công | Lỗi riêng |
|---|---|---|---|---|---|---|
| GET | `/api/customers?phone=` | A1 | Tra cứu khách + thiết bị | FR-01 | 200 | 404 không tìm thấy khách hàng |
| POST | `/api/customers` | A1 | Tạo khách hàng mới | FR-02 | 201 | 400 SĐT sai, 409 SĐT đã tồn tại |
| POST | `/api/tickets` | A1 | Tạo phiếu bảo hành (kiểm tra bảo hành, phân loại, SLA, ghi lịch sử) | FR-03, 04, 05, 07, 08 | 201 | 400 IMEI/Serial/ngày mua/mô tả lỗi sai |
| GET | `/api/tickets?view=due` | A2 | Phiếu sắp/quá hạn SLA, `page`, 20 phiếu/trang | FR-09 | 200 (mảng rỗng nếu không có) | — |
| GET | `/api/tickets?view=unverified` | A2 | Phiếu chờ duyệt bảo hành | FR-05 | 200 | — |
| GET | `/api/tickets/{code}` | A1, A2 | Chi tiết phiếu | FR-04 | 200 | 404 không tìm thấy phiếu |
| PATCH | `/api/tickets/{code}/warranty-review` | A2 | Duyệt / từ chối bảo hành | FR-06 | 200 | 400 từ chối thiếu lý do, 404, 409 phiếu không có cờ |
| GET | `/api/tickets/{code}/status-log` | A1, A2 | Lịch sử trạng thái | FR-10 | 200 | 404 không tìm thấy phiếu |

## Ví dụ `POST /api/tickets`
```json
// request
{ "customerId": 12, "device": { "modelName": "Galaxy A55", "imei": "356938035643809",
  "purchaseDate": "2026-03-15", "warrantyMonths": 12 },
  "issueDescription": "Màn hình không lên nguồn" }
// response 201 – tiếp nhận thứ Sáu 02/10/2026 09:00, CAO = +1 ngày làm việc
{ "code": "BH-0001", "status": "MOI", "warrantyStatus": "CON_BAO_HANH", "isUnverified": false,
  "category": "Phần cứng", "priority": "CAO",
  "receivedAt": "2026-10-02T09:00:00+07:00", "slaDueAt": "2026-10-05T09:00:00+07:00" }
```

## Ví dụ `PATCH /api/tickets/BH-0002/warranty-review`
```json
// request
{ "decision": "REJECTED", "reason": "Không có hóa đơn mua hàng" }
// response 200
{ "code": "BH-0002", "warrantyStatus": "CHUA_XAC_MINH", "isUnverified": true }
```
