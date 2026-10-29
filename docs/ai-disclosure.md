# Bảng khai báo sử dụng công cụ AI – Bài tập 1

| Công cụ | Dùng vào việc gì | Áp dụng ở phần nào | Đã kiểm chứng thế nào |
|---|---|---|---|
| Claude (Anthropic) – trợ lý AI dạng chat | Đọc Báo cáo Buổi 4 và đề bài, sắp xếp lại theo cấu trúc BT1; đề xuất gộp US05 + US06 cũ, bảng thuật ngữ, bảng BR-01…BR-07, bảng truy vết có cột bảng dữ liệu/màn hình | Mục 1, Mục 2, Ghi chú thay đổi | Đối chiếu từng FR/US/UC với Báo cáo Buổi 4; kiểm bảng truy vết theo hàng và theo cột (0 ô trống); kiểm lại ví dụ SLA GWT-13, 14 bằng lịch tháng 10/2026 |
| Claude (Anthropic) | Đề xuất kiến trúc 4 lớp và viết nháp 5 câu lập luận | Mục 3 | Kiểm mỗi câu có mã NFR, ngưỡng số, quyết định và đánh đổi; tên bảng trong sơ đồ khớp ERD |
| Claude (Anthropic) | Thiết kế ERD 6 bảng, viết db/schema.sql, tạo file .drawio và ảnh xuất | Mục 4, db/schema.sql, docs/*.drawio | Chạy schema.sql trên PostgreSQL 16; thử chèn IMEI sai, SĐT trùng, từ chối không lý do → đều bị CHECK/UNIQUE chặn; mở file .drawio trên draw.io |
| Claude (Anthropic) | Vẽ wireframe 3 màn hình | Mục 5 | Đối chiếu từng trường với ERD (bảng 5.1); kiểm mỗi luồng ngoại lệ có chỗ hiển thị |

Tôi xác nhận đã đọc, hiểu và chịu trách nhiệm về toàn bộ nội dung nộp.

INTHAXAY Vilaiphone – 237480201IS06 – 09/10/2026

---

# Bảng khai báo sử dụng công cụ AI – Bài tập 2 (cập nhật buổi 10, 23/10/2026)

| Công cụ | Dùng vào việc gì | Áp dụng ở tệp / hàm nào | Em đã kiểm chứng thế nào |
|---|---|---|---|
| Claude (Anthropic) – trợ lý AI dạng chat | Đề xuất cách chuyển DDL PostgreSQL của BT1 sang SQLite và viết tệp migration, dữ liệu mẫu, hàm `migrate()` | `migrations/001_init.sql`, `seeds/001_demo.sql`, `src/backend/db.js`, `src/backend/migrate.js` | Chạy `npm run migrate` hai lần liên tiếp: lần hai không lỗi, số dòng các bảng giữ nguyên (customer 3, issue_category 5) – không nhân đôi dữ liệu. Đối chiếu 6 bảng và các cột với ERD BT1. Ghi lý do đổi sang SQLite ở TD-04 |
| Claude (Anthropic) | Viết mã CRUD khách hàng tách 3 lớp và cơ chế đổi mã lỗi nghiệp vụ sang mã HTTP | `src/backend/routes/customer.routes.js`, `services/customer.service.js` (hàm `create`, `update`, `remove`, `findByPhone`), `repositories/customer.repository.js`, `validators/customer.validator.js`, `errors/AppError.js`, `app.js`, `server.js` | Gọi thử bằng curl: tra cứu SĐT 0901234567 trả đúng khách Lê Cường; gửi SĐT "123" bị từ chối 400 kèm tên trường `phone` (ảnh `docs/buoi8-curl.png`). Tìm `req.`, `res.`, `status(` trong thư mục services/ → không có (đạt S2). Đọc lại từng tệp theo luồng routes → service → repository |
| Claude (Anthropic) | Gợi ý ba kiểm thử đầu tiên cho lớp service | `tests/customer.service.test.js` | Chạy `npm test`: 3/3 PASS (ảnh `docs/buoi8-test.png`). Kiểm thử dùng CSDL trong bộ nhớ (`:memory:`) nên không phụ thuộc dữ liệu trên máy em |
| Claude (Anthropic) | Soạn nháp các mục TD-01 → TD-04 sau phản hồi BT1 | `docs/thay-doi-thiet-ke.md`, `docs/srs.md` (chuyển dòng GWT-20) | Đối chiếu từng mục với phản hồi của giảng viên trong bảng điểm BT1; kiểm GWT-01 → GWT-20 đã theo thứ tự mã |
| Claude (Anthropic) | Viết ba quy tắc nghiệp vụ dạng hàm thuần và kiểm thử của chúng | `src/backend/rules/sla.rule.js` (`tinhHanSla`), `warranty.rule.js` (`kiemTraBaoHanh`, `tinhNgayHetHan`), `classification.rule.js` (`phanLoai`); `tests/sla.rule.test.js`, `warranty.rule.test.js`, `classification.rule.test.js` | Đối chiếu kết quả mong đợi của từng test với GWT-06 → GWT-15 và BR-02, BR-04, BR-05 trong `docs/srs.md`. Chạy `npm test` trên máy em: PASS hết. Test viết giờ kèm `+07:00` nên chạy trên máy múi giờ khác vẫn ra cùng kết quả |
| Claude (Anthropic) | Viết CRUD phiếu bảo hành (ghép ba quy tắc khi tạo phiếu), hợp đồng dữ liệu `toTicketView`, đăng nhập và phiên 30 phút | `validators/ticket.validator.js`, `repositories/ticket.repository.js`, `device.repository.js`, `user.repository.js`, `services/ticket.service.js`, `ticket.contract.js`, `auth.service.js`, `middleware/auth.js`, `routes/ticket.routes.js`, `auth.routes.js`, `app.js`; `seeds/002_demo_password.sql`, `003_demo_devices.sql`; `tests/ticket.service.test.js`, `auth.service.test.js`, `api.test.js` | Chạy `npm run migrate` hai lần: không lỗi, số dòng giữ nguyên. Chạy `npm test`: PASS hết. Chạy thử trên giao diện: tạo phiếu cho SĐT 0987654321 → BH-0001 (trước khi đổi mã theo wireframe là BH-000001), *Phần cứng · Cao*, *Chưa xác minh*, hạn SLA thứ Sáu 14:56 → thứ Hai 26/10 14:56 (đúng GWT-13). Đăng nhập `ql01` → từ chối không lý do bị chặn (GWT-10), duyệt → *Còn bảo hành* và có dòng lịch sử (GWT-20). Tìm `req`, `res`, `status(` trong services/ → chỉ có trong comment (đạt S2) |
| Claude (Anthropic) | Viết giao diện React: lớp gọi API, thành phần ba trạng thái, ba màn hình M1–M3 và trang đăng nhập; sau đó sửa lại bố cục cho khớp wireframe BT1 (TD-05) | `src/frontend/src/api/` (`client.js` …), `hooks/useApi.js`, `components/DataState.jsx`, `pages/` (M1 `ReceiveDevicePage`, M2 `TicketListPage`, M3 `TicketDetailPage`, `LoginPage`) | Mở http://localhost:5173 và làm hết luồng chính. Tắt backend rồi mở trang → hiện "Không kết nối được tới hệ thống…" kèm nút Thử lại. Nhập SĐT có chữ "SĐT" → hiện "Không tìm thấy khách hàng…" và nút tạo khách mới (GWT-02). Lọc trạng thái không có phiếu → hiện câu riêng kèm nút Xoá bộ lọc. Đặt ảnh chụp từng màn hình cạnh `docs/export/wireframe-M1..M3.png` để so từng khung, từng cột |
| Claude (Anthropic) | Đối chiếu nhận xét BT1 của GV với mã nguồn; sửa SLA sang ngày làm việc thứ Hai – thứ Bảy (QT-04) và cập nhật test, SRS (TD-06) | `src/backend/rules/sla.rule.js` (`laNgayNghi`, `tinhHanSla`), `tests/sla.rule.test.js`, `tests/ticket.service.test.js`, `docs/srs.md`, `docs/api-contract.md` | Tra lịch tháng 10/2026: 02/10 thứ Sáu, 03/10 thứ Bảy, 04/10 Chủ nhật, 24/10 thứ Bảy; tự tính tay từng ca GWT-13/14/15 rồi so với test. Chạy `npm test`: 31/31 PASS |
| — không dùng — | Cài Node.js, chạy lệnh, chạy thử giao diện, chụp ảnh kết quả, commit và push | Lịch sử commit nhánh `dev` | Không áp dụng |

Tôi xác nhận đã đọc, hiểu và chịu trách nhiệm về toàn bộ mã nguồn nộp ở Bài tập 2.

INTHAXAY Vilaiphone – 237480201IS06 – 19/10/2026
