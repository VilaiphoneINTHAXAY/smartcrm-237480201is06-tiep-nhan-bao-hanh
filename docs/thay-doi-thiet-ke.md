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
- Thay đổi gì     : CSDL của prototype dùng SQLite (module node:sqlite có sẵn trong Node.js ≥ 22.13) thay cho PostgreSQL 16 như thiết kế BT1. DDL được chuyển sang migrations/001_init.sql: BIGSERIAL → INTEGER PRIMARY KEY AUTOINCREMENT, TIMESTAMPTZ → TEXT (ISO 8601), BOOLEAN → INTEGER 0/1. Các CHECK dùng biểu thức chính quy (IMEI, Serial, SĐT) chuyển sang lớp validators/ vì SQLite không hỗ trợ ~ .
- Vì sao           : Máy cá nhân chưa cài PostgreSQL; slide buổi 8 cho phép dùng SQLite làm phương án dự phòng. SQLite không cần cài máy chủ, không cần mật khẩu, nên người khác clone repo về là chạy được ngay (tiêu chí C1). Với khoảng 12 phiếu/ngày (NFR-04: ≥ 20 người dùng) SQLite vẫn đủ.
- Ảnh hưởng       : migrations/001_init.sql, seeds/001_demo.sql, src/backend/db.js, .env.example (bỏ DB_HOST/DB_USER/DB_PASSWORD, thêm DB_PATH). Lập luận LL5 của BT1 vẫn giữ. db/schema.sql (bản PostgreSQL của BT1) giữ nguyên để đối chiếu. Partial index idx_ticket_open_sla (LL2, NFR-07) vẫn giữ vì SQLite hỗ trợ.
