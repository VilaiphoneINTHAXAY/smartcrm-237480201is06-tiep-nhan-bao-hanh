# SRS – Tiếp nhận và phân loại yêu cầu bảo hành (Mekong Mobile Luống 2)

Họ và tên: INTHAXAY Vilaiphone – 237480201IS06 – Track SE

---

## 1. Giới thiệu

### 1.1 Mục đích
Đặc tả yêu cầu cho luồng **tiếp nhận và phân loại yêu cầu bảo hành** tại trung tâm bảo hành Mekong Mobile.

### 1.2 Phạm vi
- **Trong phạm vi:** tra cứu khách theo SĐT → tạo phiếu kèm thiết bị và mô tả lỗi → kiểm tra bảo hành → phân loại nhóm sự cố và mức ưu tiên → sinh hạn cam kết (SLA) → phiếu ở trạng thái MỚI, sẵn sàng bàn giao cho quản lý.
- **Ngoài phạm vi:** phân công kỹ thuật viên theo tay nghề/khối lượng (L4); quản lý tồn kho linh kiện (L5); khảo sát hài lòng sau đóng phiếu (L8).

### 1.3 Thuật ngữ
| Thuật ngữ | Ý nghĩa |
|---|---|
| Phiếu | Phiếu yêu cầu bảo hành (ticket) |
| SLA | Hạn cam kết xử lý phiếu |
| Ngày làm việc | Thứ Hai – thứ Sáu, chưa tính ngày lễ |
| IMEI/Serial | Mã định danh thiết bị. IMEI: đúng 15 chữ số. Serial: 5–30 ký tự chữ/số (dùng khi thiết bị không có IMEI) |
| GWT | Given – When – Then |

---

## 2. Mô tả tổng quan

### 2.1 Actor
| Actor | Vai trò |
|---|---|
| A1 – Nhân viên tiếp nhận | Actor chính: tra cứu khách, tạo phiếu |
| A2 – Quản lý trung tâm bảo hành | Actor phụ: phê duyệt phiếu chưa xác minh, xem danh sách phiếu sắp/quá hạn |

### 2.2 User Story (8 story – 5 MUST)

| ID | Story | Ưu tiên |
|---|---|---|
| US01 | Là nhân viên tiếp nhận, tôi muốn tra cứu khách theo SĐT để không nhập lại thông tin khách cũ | MUST |
| US02 | Là nhân viên tiếp nhận, tôi muốn tạo phiếu kèm thiết bị (serial/IMEI) và mô tả lỗi để ghi nhận yêu cầu | MUST |
| US03 | Là nhân viên tiếp nhận, tôi muốn hệ thống tự kiểm tra còn/hết bảo hành theo ngày mua để báo đúng cho khách | MUST |
| US04 | Là quản lý, tôi muốn phiếu thiếu ngày mua bị đánh dấu "chưa xác minh bảo hành" để tôi phê duyệt | SHOULD |
| US05 | Là nhân viên tiếp nhận, tôi muốn hệ thống phân loại nhóm sự cố và mức ưu tiên để phiếu được xử lý đúng thứ tự | MUST |
| US06 | Là nhân viên tiếp nhận, tôi muốn hệ thống tự sinh hạn cam kết theo mức ưu tiên để hẹn đúng với khách | MUST |
| US07 | Là quản lý, tôi muốn xem danh sách phiếu sắp đến hạn/quá hạn để kịp xử lý | SHOULD |
| US08 | Là nhân viên/quản lý, tôi muốn xem lịch sử chuyển trạng thái của phiếu để truy vết | COULD |

### 2.3 Tiêu chí chấp nhận (20 GWT – 9 ngoại lệ, đánh dấu )

**US01**
- GWT-01: Given SĐT đã có trong hệ thống, When tìm theo SĐT, Then hiển thị thông tin khách và các thiết bị đã đăng ký.
- GWT-02 : Given SĐT chưa có, When tìm, Then báo "không tìm thấy" và gợi ý tạo khách mới.

**US02**
- GWT-03: Given khách và thiết bị hợp lệ, When nhập đủ mô tả lỗi và lưu, Then tạo phiếu trạng thái MỚI.
- GWT-04 : Given IMEI không đủ 15 chữ số (hoặc serial không hợp lệ), When lưu, Then từ chối và báo lỗi tại trường IMEI/serial.
- GWT-05 : Given mô tả lỗi để trống, When lưu, Then từ chối và yêu cầu nhập mô tả.

**US03**
- GWT-06: Given ngày tiếp nhận ≤ ngày hết bảo hành (= ngày mua + số tháng bảo hành, tính theo tháng lịch; cuối tháng thì lấy ngày cuối của tháng đích), When tạo phiếu, Then đánh dấu CÒN BẢO HÀNH (đúng ngày hết hạn vẫn là còn).
- GWT-07: Given ngày tiếp nhận > ngày hết bảo hành, When tạo phiếu, Then đánh dấu HẾT BẢO HÀNH.
- GWT-08 : Given ngày mua sau ngày tiếp nhận, When lưu, Then từ chối và báo ngày mua không hợp lệ.

**US04**
- GWT-09: Given thiếu ngày mua, When lưu phiếu, Then tình trạng bảo hành = CHƯA XÁC MINH, phiếu mang cờ "chưa xác minh bảo hành" và hiện trong danh sách chờ quản lý.
- GWT-10 : Given quản lý từ chối phê duyệt (có nhập lý do), When xác nhận, Then phiếu giữ cờ, ghi lý do từ chối vào lịch sử.
- GWT-20: Given quản lý phê duyệt phiếu có cờ, When xác nhận, Then bỏ cờ, ghi người duyệt và thời điểm vào lịch sử.

**US05**
- GWT-11: Given mô tả lỗi chứa từ khóa của một nhóm sự cố (bảng 3.1), When tạo phiếu, Then gán nhóm và mức ưu tiên tương ứng.
- GWT-12 : Given mô tả không khớp nhóm nào, When tạo phiếu, Then gán nhóm "Khác" và ưu tiên TRUNG_BÌNH.

**US06**
- GWT-13: Given ưu tiên CAO, When tạo phiếu, Then hạn = thời điểm tiếp nhận + 1 ngày làm việc (24h).
- GWT-14: Given ưu tiên THẤP, When tạo phiếu, Then hạn = thời điểm tiếp nhận + 5 ngày làm việc (120h).
- GWT-15 : Given phiếu tiếp nhận vào thứ Bảy/Chủ nhật, When sinh hạn, Then tính từ 08:00 thứ Hai kế tiếp rồi cộng số ngày làm việc.

**US07**
- GWT-16: Given có phiếu còn ≤ 8 giờ (giờ thực) đến hạn hoặc đã quá hạn, When quản lý mở danh sách, Then hiển thị, quá hạn tô nổi bật.
- GWT-17 : Given không có phiếu nào sắp/quá hạn, When mở danh sách, Then hiện thông báo "Không có phiếu cần chú ý".

**US08**
- GWT-18: Given phiếu tồn tại, When xem lịch sử, Then hiển thị mọi lần đổi trạng thái theo thời gian.
- GWT-19 : Given mã phiếu không tồn tại, When xem lịch sử, Then trả lỗi 404.

### 2.4 Use Case (8 UC – 2 actor)

| UC | Tên | Actor | Quan hệ |
|---|---|---|---|
| UC01 | Tra cứu khách theo SĐT | A1 | |
| UC02 | Tạo phiếu bảo hành | A1 | include UC01, UC03, UC04, UC05 |
| UC03 | Kiểm tra tình trạng bảo hành | (hệ thống) | được UC02 include |
| UC04 | Phân loại nhóm sự cố và ưu tiên | (hệ thống) | được UC02 include |
| UC05 | Sinh hạn cam kết (SLA) | (hệ thống) | được UC02 include |
| UC06 | Phê duyệt phiếu chưa xác minh bảo hành | A2 | extend UC02 |
| UC07 | Xem danh sách phiếu sắp/quá hạn | A2 | |
| UC08 | Xem lịch sử chuyển trạng thái | A1, A2 | |

#### Đặc tả chi tiết UC02 – Tạo phiếu bảo hành
- **Actor:** A1. **Tiền điều kiện:** A1 đã đăng nhập. **Hậu điều kiện:** phiếu trạng thái MỚI, có nhóm sự cố, ưu tiên, SLA, tình trạng bảo hành.
- **Luồng chính:**
  1. A1 nhập SĐT, hệ thống thực hiện UC01 và hiển thị khách.
  2. A1 nhập serial/IMEI, ngày mua, mô tả lỗi.
  3. Hệ thống kiểm tra dữ liệu hợp lệ.
  4. Hệ thống thực hiện UC03, UC04, UC05.
  5. Hệ thống lưu phiếu (MỚI) và ghi lịch sử trạng thái đầu tiên.
  6. Hệ thống hiển thị mã phiếu, nhóm, ưu tiên, hạn SLA.
- **Luồng ngoại lệ:**
  - E1 (bước 1): khách chưa tồn tại → A1 tạo khách mới rồi quay lại bước 2.
  - E2 (bước 3): IMEI/serial sai định dạng hoặc ngày mua ở tương lai → báo lỗi, quay lại bước 2.
  - E3 (bước 3): mô tả lỗi trống → báo lỗi, quay lại bước 2.

#### Đặc tả chi tiết UC05 – Sinh hạn cam kết (SLA)
- **Actor:** hệ thống (kích hoạt từ UC02). **Tiền điều kiện:** đã có mức ưu tiên. **Hậu điều kiện:** phiếu có `sla_due_at`.
- **Luồng chính:**
  1. Lấy thời điểm tiếp nhận và mức ưu tiên.
  2. Tra số ngày làm việc: CAO = 1 (24h), TRUNG_BÌNH = 3 (72h), THẤP = 5 (120h).
  3. Cộng số ngày làm việc (T2–T6), giữ nguyên giờ tiếp nhận.
  4. Lưu `sla_due_at`.
- **Luồng ngoại lệ:**
  - E1 (bước 1): tiếp nhận vào thứ Bảy/Chủ nhật → coi như tiếp nhận lúc 08:00 thứ Hai kế tiếp, rồi thực hiện bước 2–4.
  - E2 (bước 2): mức ưu tiên chưa xác định → dùng mặc định TRUNG_BÌNH (3 ngày làm việc).

---

## 3. Yêu cầu chức năng (10 FR)

| Mã | Yêu cầu |
|---|---|
| FR-01 | Hệ thống cho phép tra cứu khách theo SĐT |
| FR-02 | Hệ thống gợi ý khách đã tồn tại; nếu chưa có cho phép tạo khách mới |
| FR-03 | Hệ thống tạo phiếu kèm serial/IMEI, ngày mua, mô tả lỗi; trạng thái ban đầu là MỚI. IMEI phải đủ 15 chữ số; serial 5–30 ký tự chữ/số |
| FR-04 | Hệ thống tính ngày hết bảo hành = ngày mua + số tháng bảo hành của sản phẩm (tháng lịch); ngày tiếp nhận ≤ ngày hết bảo hành → CÒN, ngược lại → HẾT |
| FR-05 | Hệ thống đặt tình trạng bảo hành = CHƯA XÁC MINH và gắn cờ "chưa xác minh bảo hành" khi thiếu ngày mua |
| FR-06 | Quản lý phê duyệt hoặc từ chối phiếu có cờ; từ chối bắt buộc ghi lý do |
| FR-07 | Hệ thống gán nhóm sự cố và mức ưu tiên cho phiếu theo bảng 3.1 |
| FR-08 | Hệ thống sinh hạn SLA theo ưu tiên (CAO 1 ngày/24h, TRUNG_BÌNH 3 ngày/72h, THẤP 5 ngày/120h; chỉ tính ngày làm việc T2–T6) |
| FR-09 | Hệ thống liệt kê phiếu sắp đến hạn (còn ≤ 8 giờ thực) và quá hạn |
| FR-10 | Hệ thống ghi và hiển thị lịch sử chuyển trạng thái của phiếu |

### 3.1 Bảng phân loại nhóm sự cố và ưu tiên (FR-07)

Khớp từ khóa trong mô tả lỗi (không phân biệt hoa/thường), xét từ trên xuống, nhóm đầu tiên khớp thì dừng.

| Nhóm | Từ khóa ví dụ | Ưu tiên |
|---|---|---|
| Phần cứng | màn hình, vỡ, không lên nguồn, pin, sạc, camera, loa | CAO |
| Phần mềm | treo, đơ, lag, bootloop, lỗi ứng dụng, cập nhật | TRUNG_BÌNH |
| Kết nối | wifi, sóng, bluetooth, SIM | TRUNG_BÌNH |
| Phụ kiện/Ngoại hình | ốp, trầy xước, nút bấm | THẤP |
| Khác | (không khớp nhóm nào) | TRUNG_BÌNH |

---

## 4. Yêu cầu phi chức năng (7 NFR có ngưỡng số)

| Mã | Loại | Yêu cầu |
|---|---|---|
| NFR-01 | Hiệu năng | Tra cứu khách theo SĐT phản hồi ≤ 2 giây (p95) với ≥ 500 phiếu |
| NFR-02 | Hiệu năng | Tạo phiếu (gồm kiểm tra bảo hành, phân loại, SLA) hoàn tất ≤ 3 giây |
| NFR-03 | Chính xác | Tính SLA và bảo hành đúng 100% trên bộ ≥ 10 test case đã định nghĩa |
| NFR-04 | Đồng thời | Hỗ trợ ≥ 20 người dùng đồng thời không lỗi |
| NFR-05 | Truy vết | 100% thay đổi trạng thái được ghi log kèm thời điểm và người thực hiện |
| NFR-06 | Bảo mật | Phiên đăng nhập hết hạn sau 30 phút không hoạt động (trả 401); 2 vai trò (A1, A2) phân quyền riêng |
| NFR-07 | Hiệu năng | Mở danh sách phiếu sắp/quá hạn phản hồi ≤ 2 giây (p95) với ≥ 500 phiếu |

---

## 5. Ràng buộc và giả định

- Stack: Node.js + Express, PostgreSQL, React/HTML đơn giản.
- Dữ liệu mẫu: ≥ 500 phiếu trích từ `tickets_history.csv`.
- **Giả định cần xác nhận với GV:** "24h/72h/120h" quy đổi thành 1/3/5 ngày làm việc (T2–T6, giữ nguyên giờ tiếp nhận), chưa tính ngày lễ.
- Quy tắc còn bảo hành: ngày tiếp nhận ≤ ngày mua + số tháng bảo hành (tháng lịch) thì còn bảo hành.

---

## 6. Ma trận truy vết (0 ô trống)

| User Story | MoSCoW | Use Case | FR | NFR | GWT | Test |
|---|---|---|---|---|---|---|
| US01 | MUST | UC01 | FR-01, FR-02 | NFR-01 | GWT-01, 02 | TC-01, 02 |
| US02 | MUST | UC02 | FR-03 | NFR-02, 04 | GWT-03, 04, 05 | TC-03, 04, 05 |
| US03 | MUST | UC03 | FR-04 | NFR-03 | GWT-06, 07, 08 | TC-06, 07, 08 |
| US04 | SHOULD | UC06 | FR-05, FR-06 | NFR-06 | GWT-09, 10, 20 | TC-09, 10, 20 |
| US05 | MUST | UC04 | FR-07 | NFR-03 | GWT-11, 12 | TC-11, 12 |
| US06 | MUST | UC05 | FR-08 | NFR-03 | GWT-13, 14, 15 | TC-13, 14, 15 |
| US07 | SHOULD | UC07 | FR-09 | NFR-07 | GWT-16, 17 | TC-16, 17 |
| US08 | COULD | UC08 | FR-10 | NFR-05 | GWT-18, 19 | TC-18, 19 |

---

## Phụ lục – API contract (mẫu track SE)

Mọi endpoint trả **401** khi phiên hết hạn (NFR-06).

| Method | Endpoint | Mô tả | Thành công | Lỗi |
|---|---|---|---|---|
| GET | `/api/customers?phone=` | Tra cứu khách (FR-01) | 200 | 404 chưa có khách |
| POST | `/api/customers` | Tạo khách mới (FR-02) | 201 | 400 dữ liệu sai |
| POST | `/api/tickets` | Tạo phiếu, trả nhóm/ưu tiên/SLA/tình trạng bảo hành (FR-03,04,05,07,08) | 201 | 400 IMEI/serial/ngày mua/mô tả sai |
| GET | `/api/tickets?warranty=unverified` | Danh sách phiếu chờ quản lý duyệt (FR-05) | 200 | 403 sai vai trò |
| PATCH | `/api/tickets/{id}/warranty-review` | Quản lý duyệt/từ chối (FR-06) | 200 | 400 từ chối thiếu lý do, 403 sai vai trò, 404 |
| GET | `/api/tickets?due=soon\|overdue` | Danh sách sắp/quá hạn (FR-09) | 200 | 403 sai vai trò |
| GET | `/api/tickets/{id}/status-log` | Lịch sử trạng thái (FR-10) | 200 | 404 |

Ví dụ `POST /api/tickets`:

```json
// request
{ "customerId": 12, "imei": "356938035643809", "purchaseDate": "2026-03-15",
  "issueDescription": "Màn hình không lên nguồn" }
// response 201 (tiếp nhận thứ Sáu 02/10/2026 09:00, ưu tiên CAO = +1 ngày làm việc)
{ "id": "BH-0001", "status": "MOI", "warranty": "CON_BAO_HANH",
  "category": "Phần cứng", "priority": "CAO", "slaDueAt": "2026-10-05T09:00:00+07:00" }
```

Ví dụ `PATCH /api/tickets/{id}/warranty-review`:

```json
// request
{ "decision": "REJECTED", "reason": "Không có hóa đơn mua hàng" }
// response 200
{ "id": "BH-0002", "warranty": "CHUA_XAC_MINH", "flagged": true }
```