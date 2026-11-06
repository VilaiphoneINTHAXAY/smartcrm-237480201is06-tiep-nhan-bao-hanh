# Test Report – Luồng L2: Tiếp nhận và phân loại yêu cầu bảo hành (Track SE)

> Sinh viên: INTHAXAY Vilaiphone · MSSV 237480201IS06 · Lớp 71K29CNTT17 · Bài tập 3
> Kế hoạch: `docs/test-plan.md` · Bug: `docs/bug-log.md` · Ảnh: `docs/screenshots/TC-xx.png`
> Môi trường chạy: Windows 11, Node.js 24 LTS, `node:test`; CSDL SQLite trong bộ nhớ dựng lại cho mỗi tệp test.
> Chạy lại một test case: `npm run tc -- TC-04` (giảng viên chọn mã bất kỳ). Chạy cả bộ: `npm test`.

## Tóm tắt

| Chỉ số | Giá trị |
|---|---|
| Test case trong báo cáo | **12** (TC-01 → TC-12) – 7 unit · 3 integration · 2 API |
| Đủ 5 loại | luồng đúng ×5 · giá trị biên ×2 (hai phía một ranh giới) · dữ liệu sai ×3 · bảo mật ×1 · tái lập ×1 |
| Lần chạy đầu (06/11/2026) | 11 PASS · **1 FAIL** (TC-11 → BUG-005, Critical) |
| Sau khi sửa bug | **12/12 PASS**; cả bộ `npm test`: **53/53 PASS** |
| Bug phát hiện khi kiểm thử BT3 | BUG-005 (Critical, từ TC-11) · BUG-006 (Major, từ tự kiểm OWASP A04) – đều đã sửa, xem `docs/bug-log.md` |

## Bảng test case (8 cột)

| Mã TC | Tiền điều kiện | Các bước thực hiện | Dữ liệu thử | Kết quả mong đợi | Mức ưu tiên | Kết quả thực tế | PASS/FAIL |
|---|---|---|---|---|---|---|---|
| **TC-01**<br>Unit · luồng đúng · BR-04 | Danh mục 5 nhóm sự cố như seed (Phần cứng, Phần mềm, Pin & sạc, Kết nối, Khác) truyền vào hàm | Gọi `phanLoai(moTa, DANH_MUC)` (`rules/classification.rule.js`) | `moTa = "Máy bị TREO logo"` (chữ HOA) | `{ categoryId: 2, tenNhom: "Phần mềm", mucUuTien: "TRUNG_BINH" }` – khớp từ khoá không phân biệt hoa/thường | Cao | Trả đúng `{ 2, "Phần mềm", "TRUNG_BINH" }` | **PASS** |
| **TC-02**<br>Unit · luồng đúng · BR-05, QT-04 | Không cần CSDL; thời điểm ghi kèm +07:00 | Gọi `tinhHanSla(thoiDiem, mucUuTien)` (`rules/sla.rule.js`) | Tiếp nhận thứ Hai 05/10/2026 10:00, mức `THAP` (5 ngày làm việc) | Hạn = **thứ Bảy 10/10/2026 10:00** (thứ Bảy là ngày làm việc, không bỏ qua) | Cao | Hạn trả về = 10/10/2026 10:00 +07:00 | **PASS** |
| **TC-03**<br>Unit · luồng đúng · BR-02, QT-05 | Thiết bị có ngày mua, 12 tháng bảo hành | Gọi `kiemTraBaoHanh(thietBi, ngayTiepNhan)` (`rules/warranty.rule.js`) | Mua 15/01/2026 · 12 tháng · tiếp nhận 08/09/2026 | `warrantyStatus = "CON_BAO_HANH"`, `ngayHetHan = "2027-01-15"` | Cao | `CON_BAO_HANH`, hết hạn 2027-01-15 | **PASS** |
| **TC-04**<br>Unit · **giá trị biên** · GWT-06 | Như TC-03 | Như TC-03 | Mua 23/10/2025 · 12 tháng · tiếp nhận **23/10/2026** (đúng ngày hết hạn) | `CON_BAO_HANH` (ngày hết hạn vẫn còn bảo hành) | Cao | `CON_BAO_HANH` | **PASS** |
| **TC-05**<br>Unit · **giá trị biên** · GWT-07 | Như TC-03 | Như TC-03 | Mua 23/10/2025 · 12 tháng · tiếp nhận **24/10/2026** (ngày kế tiếp) | `HET_BAO_HANH` | Cao | `HET_BAO_HANH` | **PASS** |
| **TC-06**<br>Unit · luồng đúng · QT-02 | Không cần CSDL | Gọi `chuanHoaSoDienThoai(s)` (`rules/phone.rule.js`) với từng dạng nhập | `0901234567` · `+84901234567` · `84901234567` · `090 123 4567` · `090.123.4567` · `␠+84 90-123-4567␠` | Cả 6 dạng đều trả `"0901234567"` | Trung bình | Cả 6 dạng trả `0901234567` | **PASS** |
| **TC-07**<br>Integration · luồng đúng · FR-03/04/07/08 | SQLite trong bộ nhớ + `migrate()`; đồng hồ cố định **thứ Sáu 23/10/2026 09:00**; người gọi nhân viên `nv01` | `TicketService.create()` với thiết bị mới, rồi `getLogs(id)` | Mô tả `"Màn hình bị sọc xanh"` · Oppo A79 · IMEI `490154203237518` · mua 01/05/2026 · 12 tháng | Phiếu mã `BH-xxxx`, trạng thái `MOI`, `CON_BAO_HANH`, nhóm **Phần cứng / CAO**, hạn SLA **thứ Bảy 24/10/2026 09:00**; bảng `ticket_status_log` có **1** dòng `TAO_PHIEU` | Cao | Đúng mọi trường như mong đợi; 1 dòng lịch sử `TAO_PHIEU` | **PASS** |
| **TC-08**<br>Integration · **dữ liệu sai** · GWT-04, BR-01 | Như TC-07; đếm dòng `ticket` và `device` trước khi gọi | `TicketService.create()` với IMEI sai | IMEI `49015420323751` (**14** chữ số) | Lỗi `DU_LIEU_KHONG_HOP_LE` tại trường **`imei`**; số dòng `ticket` và `device` **không đổi** | Cao | Ném `DU_LIEU_KHONG_HOP_LE`, `field = "imei"`; số dòng hai bảng giữ nguyên | **PASS** |
| **TC-09**<br>Unit (repository giả) · **dữ liệu sai** · quy tắc phiếu mở | Repository giả: thiết bị 5 (khách 7) đang có phiếu `BH-0009` trạng thái `MOI`; mảng `daGhi` ghi lại mọi lệnh ghi | `TicketService.create()` cho thiết bị đó | `deviceId = 5`, `customerId = 7`, mô tả `"Máy nóng"` | Lỗi `PHIEU_DANG_MO`, thông báo nêu `BH-0009`; **không có lệnh ghi nào** (`daGhi.length = 0`) | Cao | Ném `PHIEU_DANG_MO` có "BH-0009"; `daGhi` rỗng | **PASS** |
| **TC-10**<br>API · **dữ liệu sai** · C7, S4 | Ứng dụng Express trên cổng ngẫu nhiên, CSDL trong bộ nhớ; đăng nhập `nv01` / `Demo@123` | `POST /api/tickets` kèm token | Thân `{ "deviceId": 1, "issueDescription": "" }` | HTTP **400**; `fields = { issueDescription: "Vui lòng nhập mô tả lỗi" }`; thân lỗi không chứa stack trace / SQL; số dòng `ticket` **không đổi** | Cao | 400, `fields.issueDescription` đúng thông báo; không lộ stack trace; số phiếu giữ nguyên | **PASS** |
| **TC-11**<br>API · **bảo mật** · A01 OWASP, S2 | Như TC-10; seed có hai nhân viên `nv01`, `nv02`; `nv01` vừa tạo một phiếu cho khách `0901234567` | Đăng nhập `nv02` → `PUT /api/tickets/:id` rồi `DELETE /api/tickets/:id` vào phiếu của `nv01` | PUT `{ "issueDescription": "Đã bị sửa" }`; DELETE `{ "note": "Huỷ thử" }` | Cả hai **403** `KHONG_DU_QUYEN`; trong CSDL phiếu vẫn `"Màn hình bị sọc xanh"`, trạng thái `MOI` | Cao | **Lần 1: 200** – `nv02` sửa được phiếu (ảnh `TC-11-FAIL.png`) → **BUG-005**. **Lần 2** (sau commit 962a8e8): 403 cả hai, dữ liệu không đổi (ảnh `TC-11-PASS.png`) | Lần 1 **FAIL** → Lần 2 **PASS** |
| **TC-12**<br>Integration · **tái lập** · C5 | CSDL trong bộ nhớ trống | Chạy `migrate()` → đếm dòng 4 bảng → chạy `migrate()` lần hai → đếm lại | Bảng `customer`, `device`, `issue_category`, `app_user`; bảng `schema_migration` | Lần hai không lỗi, số dòng 4 bảng **bằng lần một**; `schema_migration` có đúng số tệp trong `migrations/` (mỗi migration chạy một lần) | Cao | Không lỗi; số dòng giữ nguyên; `schema_migration` = 2 dòng = 2 tệp | **PASS** |

**Ghi chú về "dữ liệu sai" ×3:** đề yêu cầu tối thiểu 2; TC-08 (định dạng – 400), TC-09 (vi phạm trạng thái nghiệp vụ – phiếu đang mở) và TC-10 (qua HTTP – 400 kèm tên trường) kiểm ba lớp khác nhau.

## Truy vết: mỗi quy tắc có ít nhất một test (bộ 53 test)

| Quy tắc | Test case trong báo cáo | Test khác trong bộ (`tests/*.test.js`) |
|---|---|---|
| BR-02, QT-05 bảo hành | TC-03, TC-04, TC-05 | BR-02 biên cuối tháng 31/01 → 28/02; GWT-08 ngày mua sau ngày tiếp nhận |
| BR-03, BR-06 chưa xác minh / duyệt | – | GWT-09 + GWT-20; BR-03 + BR-06 (GWT-10); "duyệt bằng vai trò nhân viên → 403" (API) |
| BR-04 phân loại | TC-01 | BR-04 khớp hai nhóm; GWT-12 không khớp → Khác |
| BR-05, QT-04 SLA thứ Hai – thứ Bảy | TC-02, TC-07 | GWT-13; thứ Bảy → thứ Hai; GWT-15 Chủ nhật; Chủ nhật 23:59; mức ưu tiên lạ |
| BR-07, QT-01, QT-02 SĐT | TC-06 | BR-07 trùng SĐT; QT-02 dạng +84 có dấu cách; QT-02 dữ liệu sai → null; SĐT sai định dạng → lỗi tại trường |
| QT-03 + phiếu đang mở | TC-09 | Repo giả QT-03; dữ liệu sai QT-03 (deviceId); "một thiết bị không có hai phiếu đang mở" |
| QT-06 vòng đời | – | "đổi trạng thái chỉ đi tiến"; QT-06 giá trị biên; A01 hồi quy đổi trạng thái |
| QT-13 không xoá vật lý | – | QT-13 xoá khách = ngừng sử dụng; QT-13 + QT-06 huỷ phiếu |
| QT-15 che SĐT | – | QT-15 giá trị biên; QT-15 tra cứu; QT-15 nhân viên / Quản lý |
| NFR-06 đăng nhập, phiên | – | chưa đăng nhập → 401; sai mật khẩu → 401; phiên đúng 30 phút / quá 30 phút |
| A01 theo chủ sở hữu (S2) | TC-11 | TC-11b người tạo và Quản lý vẫn sửa được; A01 hồi quy PATCH trạng thái |
| A04 băm mật khẩu (S3) | – | A04 salt riêng; 2 test hồi quy BUG-006 |
| C5 tái lập | TC-12 | Nâng cấp CSDL cũ giữ nguyên phiếu và lịch sử |
| C7 / S4 lỗi gọn | TC-08, TC-10 | GWT-05 mô tả chỉ khoảng trắng; GWT-08 trong giao dịch không để lại thiết bị rác |
