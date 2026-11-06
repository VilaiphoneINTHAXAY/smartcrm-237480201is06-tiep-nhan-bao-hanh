# Test Plan rút gọn – Luồng L2: Tiếp nhận và phân loại yêu cầu bảo hành (Track SE)

> Sinh viên: INTHAXAY Vilaiphone · MSSV 237480201IS06 · Lớp 71K29CNTT17 · Bài tập 3
> Lập TRƯỚC khi chạy test case (buổi 13–14). Kết quả chạy: `docs/test-report.md`. Bug: `docs/bug-log.md`.

## 1. Phạm vi kiểm thử

**Kiểm:** các quy tắc nghiệp vụ đã hiện thực ở BT2 và luồng tiếp nhận qua API:

| Quy tắc | Nội dung | Nơi hiện thực |
|---|---|---|
| BR-02, QT-05 | Còn / hết bảo hành theo ngày mua + số tháng | `rules/warranty.rule.js` |
| BR-03, BR-06 | Thiếu ngày mua → CHƯA XÁC MINH; chỉ Quản lý duyệt / từ chối | `services/ticket.service.js` |
| BR-04 | Phân loại nhóm sự cố theo từ khoá | `rules/classification.rule.js` |
| BR-05, QT-04 | Hạn SLA 1/3/5 ngày làm việc, thứ Hai – thứ Bảy | `rules/sla.rule.js` |
| BR-07, QT-01, QT-02 | Một SĐT một khách; chuẩn hoá SĐT | `rules/phone.rule.js`, `services/customer.service.js` |
| QT-03 + phiếu mở | Thiết bị thuộc đúng khách; một thiết bị không có hai phiếu đang mở | `services/ticket.service.js` |
| QT-06 | Vòng đời phiếu chỉ đi tiến | `services/ticket.contract.js` |
| QT-13 | Không xoá vật lý | `services/ticket.service.js`, `repositories/customer.repository.js` |
| QT-15 | Che SĐT với nhân viên tiếp nhận | `rules/phone.rule.js` |
| NFR-06 | Đăng nhập, phiên 30 phút, 401/403 | `services/auth.service.js`, `middleware/auth.js` |
| A01 (S2) | Chỉ người tạo phiếu hoặc Quản lý được sửa / huỷ phiếu | `services/ticket.service.js` |

**CHỦ Ý KHÔNG kiểm (kèm lý do):**
- **Giao diện React bằng test tự động** – các màn hình chỉ gọi API qua `api/client.js`, mọi quy tắc nằm ở backend và đã được kiểm qua API; ba trạng thái màn hình đã có ảnh chụp ở BT2. Kiểm thử giao diện tự động thuộc Chuyên đề tốt nghiệp 2.
- **Hiệu năng và tải đồng thời** – thuộc Chuyên đề tốt nghiệp 2 (đề BT3 mục 1). Chỉ đo thời gian phản hồi đơn giản để trả lời phản hồi BT2 (TD-10), không tính là test case.
- **QT-14 (dữ liệu theo trung tâm)** – chưa hiện thực, prototype có một trung tâm (TD-08).

## 2. Loại test và số lượng mỗi tầng

Bộ kiểm thử tự động: **49 test** trong 11 tệp `tests/*.test.js` (`node:test`, không cần cài thêm gói). Test Report trình bày chi tiết **12 test case** đại diện, đặt mã TC-01 … TC-12 ngay trong tên test:

| Tầng | Số TC | Mã |
|---|---|---|
| Unit – hàm thuần trong `rules/` và service với repository giả | 7 | TC-01 → TC-06, TC-09 |
| Integration – service + repository + SQLite thật (trong bộ nhớ) | 3 | TC-07, TC-08, TC-12 |
| API – gọi HTTP thật vào ứng dụng Express | 2 | TC-10, TC-11 |

Đủ năm loại của đề BT3: **luồng đúng** ×5 (TC-01, 02, 03, 06, 07) · **giá trị biên** ×2 ở hai bên cùng một ranh giới (TC-04, TC-05: ngày hết bảo hành) · **dữ liệu sai** ×3 (TC-08, 09, 10) · **bảo mật** ×1 (TC-11, A01) · **tái lập** ×1 (TC-12).

**Kỹ thuật chọn dữ liệu thử:**
- *Phân vùng tương đương*: SĐT chia ba vùng – đúng 10 số bắt đầu bằng 0 · dạng +84/84/có dấu cách (chuẩn hoá được) · sai số chữ số hoặc có chữ (từ chối); mô tả lỗi: có nội dung · rỗng/chỉ khoảng trắng.
- *Giá trị biên*: ngày hết bảo hành (đúng ngày → còn, ngày kế tiếp → hết); cuối tháng (31/01 + 1 tháng → 28/02); SLA quanh Chủ nhật (thứ Bảy, Chủ nhật 23:59); phiên đúng 30 phút.

## 3. Tiêu chí thành công (đặt trước khi chạy)

1. 12/12 test case có kết quả thực tế ghi bằng số liệu và ảnh chụp trong `docs/screenshots/`.
2. Mỗi quy tắc ở mục 1 có **≥ 1 test** trong bộ 49 test (bảng truy vết ở `docs/test-report.md`).
3. `npm test` PASS toàn bộ sau khi sửa bug; không còn bug **Critical** nào đang mở.
4. Bug Major còn lại (nếu có) ghi rõ lý do chưa sửa và hướng xử lý.

## 4. Môi trường và dữ liệu thử

- Node.js ≥ 22.13 (đã chạy với Node.js 24 LTS trên Windows 11); lệnh: `npm test`. Chạy lại một test case: `node --test --test-name-pattern="TC-04"`.
- Dữ liệu dựng bằng code, không phụ thuộc máy: mỗi tệp test mở **SQLite trong bộ nhớ** (`openDb(':memory:')`), chạy `migrate()` (2 migration + 3 seed: 3 khách, 3 thiết bị, 5 nhóm sự cố, tài khoản `nv01`, `nv02`, `ql01` / `Demo@123`). Test đơn vị dùng repository giả và đồng hồ cố định, thời điểm ghi kèm `+07:00`.
- Test API mở ứng dụng ở cổng ngẫu nhiên (`listen(0)`), không đụng server đang chạy và không dùng `data/smartcrm.db`.
- Sau khi có Docker (buổi 15): lặp lại `npm test` trong container – ghi ở `docs/deployment-guide.md`.
