# Nhật ký thay đổi thiết kế

## Sau phản hồi Bài tập 1 (buổi 8, ngày 19/10/2026)

### TD-01  Độ dài báo cáo vượt mức gợi ý
- Phản hồi của GV : Bài dài 18 trang, gấp đôi mức gợi ý 6–9 trang. Có thể để DDL đầy đủ trong repo, trong bài chỉ giữ các bảng chính.
- Quyết định      : SỬA (áp dụng từ BT2)
- Lý do           : DDL và bảng 20 tiêu chí GWT chiếm khoảng 3 trang nhưng đã có sẵn trong db/schema.sql và docs/srs.md. Người đọc báo cáo chỉ cần thấy danh sách bảng, khóa và đường dẫn tới file gốc.
- Ảnh hưởng       : Báo cáo BT2 chỉ đưa bảng tóm tắt (bảng – PK – FK) và link tới db/schema.sql; bảng GWT đầy đủ chỉ để trong docs/srs.md. Bản PDF BT1 đã nộp giữ nguyên, không nộp lại.

### TD-02  Mã tiêu chí chấp nhận chưa theo thứ tự
- Phản hồi của GV : GWT-20 nằm giữa GWT-10 và GWT-11.
- Quyết định      : SỬA thứ tự trình bày, GIỮ NGUYÊN mã số
- Lý do           : GWT-20 được bổ sung sau cho US04 nên mang số cuối. Không đánh số lại vì các mã GWT-10…GWT-19 đã được tham chiếu trong wireframe M2, M3 và sẽ là tên test case ở BT2/BT3; đổi số sẽ làm sai các tham chiếu đó. Thay vào đó bảng được sắp đúng thứ tự mã tăng dần.
- Ảnh hưởng       : docs/srs.md: chuyển dòng GWT-20 xuống cuối bảng tiêu chí chấp nhận; ghi chú "bổ sung sau" ở dòng US04. Không đổi wireframe, ERD, API.

### TD-03  Commit message chưa đều
- Phản hồi của GV : Có commit tên "commit", "update srs" lặp lại và một commit lỗi ":wq". Nên viết theo mẫu docs(srs): …
- Quyết định      : SỬA cho các commit từ nay; GIỮ NGUYÊN lịch sử cũ
- Lý do           : Các commit cũ đã push lên nhánh main và dev; viết lại lịch sử (rebase/force push) có thể làm hỏng repo và mất dấu vết đã chấm. Từ buổi 8 mọi commit theo Conventional Commits: feat, fix, docs, chore, refactor, test, kèm phạm vi khi cần, ví dụ feat(ticket): …, docs(srs): …
- Ảnh hưởng       : Chỉ ảnh hưởng quy trình làm việc. Ghi quy ước vào README mục 6.

### TD-04  Dùng SQLite thay PostgreSQL 16 cho prototype
- Phản hồi của GV : Không có góp ý về CSDL; đây là thay đổi do môi trường, ghi lại để giữ nhất quán với thiết kế BT1.
- Quyết định      : SỬA – CSDL của prototype dùng SQLite (module node:sqlite có sẵn trong Node.js ≥ 22.13) thay cho PostgreSQL 16 như thiết kế BT1. DDL được chuyển sang migrations/001_init.sql: BIGSERIAL → INTEGER PRIMARY KEY AUTOINCREMENT, TIMESTAMPTZ → TEXT (ISO 8601), BOOLEAN → INTEGER 0/1. Các CHECK dùng biểu thức chính quy (IMEI, Serial, SĐT) chuyển sang lớp validators/ vì SQLite không hỗ trợ ~ .
- Lý do           : Máy cá nhân chưa cài PostgreSQL; slide buổi 8 cho phép dùng SQLite làm phương án dự phòng. SQLite không cần cài máy chủ, không cần mật khẩu, nên người khác clone repo về là chạy được ngay (tiêu chí C1). Với khoảng 12 phiếu/ngày (NFR-04: ≥ 20 người dùng) SQLite vẫn đủ.
- Ảnh hưởng       : migrations/001_init.sql, seeds/001_demo.sql, src/backend/db.js, .env.example (bỏ DB_HOST/DB_USER/DB_PASSWORD, thêm DB_PATH); docs/architecture.drawio (lớp 4 và khối CSDL ghi SQLite); docs/srs.md mục ràng buộc kỹ thuật. Lập luận LL5 của BT1 vẫn giữ. db/schema.sql (bản PostgreSQL của BT1) giữ nguyên để đối chiếu. Partial index idx_ticket_open_sla (LL2, NFR-07) vẫn giữ vì SQLite hỗ trợ.

## Trong khi hiện thực Bài tập 2 (buổi 10, ngày 23/10/2026)

### TD-05  Giao diện M1–M3 so với wireframe BT1
- Phản hồi của GV : Không có góp ý riêng; ghi lại để mã nguồn khớp thiết kế BT1 (tiêu chí 3).
- Quyết định      : GIỮ NGUYÊN bố cục wireframe (thanh trên, M1 hai cột có khung "Kết quả sau khi lưu", M2 hai tab + bảng 9 cột + dòng đỏ quá hạn, M3 hai cột + khung Duyệt bảo hành + bảng lịch sử). SỬA bổ sung ba điểm nhỏ: (1) M1 có lựa chọn "+ Thiết bị mới" và ô nhập họ tên khi bấm "+ Tạo khách hàng mới"; (2) M2 có dòng tổng "N phiếu · M quá hạn SLA"; (3) M3 có nút "Chuyển trạng thái" theo đúng thứ tự MỚI → ĐÃ PHÂN CÔNG → ĐANG XỬ LÝ → HOÀN TẤT → ĐÃ ĐÓNG. Mã phiếu đổi về dạng BH-0001 như wireframe.
- Lý do           : (1) wireframe vẽ nút "+ Tạo khách hàng mới" nhưng chưa vẽ ô nhập, và cần tạo được thiết bị chưa đăng ký; (2) con số phải có ngữ cảnh so sánh (buổi 9); (3) bảng ticket_status_log có hành động DOI_TRANG_THAI nên cần một chỗ để tạo dòng đó. Phân trang 20 phiếu/trang làm ở giao diện vì dữ liệu mẫu còn nhỏ.
- Ảnh hưởng       : src/frontend/src/pages/*.jsx, styles.css; ticket.repository.js (mã BH-0001, thêm tên người tiếp nhận cho M3); ticket.contract.js (thêm createdByName). Không đổi ERD, không đổi API.

## Sau nhận xét Bài tập 1 của giảng viên (buổi 11, ngày 30/10/2026)

### TD-06  Ngày làm việc tính SLA: thứ Hai – thứ Bảy theo QT-04 của case study
- Phản hồi của GV : Nhận xét BT1: “giả định ngày làm việc thứ Hai đến thứ Sáu đang khác quy tắc QT-04 của case study (tính cả thứ Bảy)”; GV đề nghị hiện thực SlaCalculator và viết test cho các ca biên.
- Quyết định      : SỬA – ngày làm việc là thứ Hai – thứ Bảy, chỉ Chủ nhật là ngày nghỉ. Tiếp nhận Chủ nhật → tính từ 08:00 thứ Hai rồi cộng số ngày làm việc. Giữ nguyên CAO/TRUNG_BINH/THAP = 1/3/5 ngày làm việc và giữ nguyên giờ tiếp nhận.
- Lý do           : Case study là nguồn quy tắc nghiệp vụ chính thức; giả định thứ Hai – thứ Sáu của BT1 là của em và trái với QT-04.
- Ảnh hưởng       : src/backend/rules/sla.rule.js (hàm laCuoiTuan → laNgayNghi, chỉ Chủ nhật); tests/sla.rule.test.js (GWT-13: thứ Sáu 09:00 CAO → thứ Bảy 09:00; GWT-14: thứ Hai 05/10 THAP → thứ Bảy 10/10; GWT-15 đổi thành tiếp nhận Chủ nhật; thêm ca biên thứ Bảy CAO → thứ Hai); tests/ticket.service.test.js; docs/srs.md (thuật ngữ “Ngày làm việc”, GWT-13/14/15, BR-05); docs/api-contract.md (ví dụ slaDueAt); ghi chú ở M1. Không đổi ERD, không đổi API. Hình wireframe .drawio của BT1 giữ nguyên để đối chiếu.
