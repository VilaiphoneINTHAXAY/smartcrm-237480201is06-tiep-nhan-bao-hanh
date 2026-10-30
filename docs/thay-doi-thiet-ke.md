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

### TD-07  Hiện thực thêm các quy tắc của case study liên quan tới L2: QT-02, QT-03, QT-06, QT-13, QT-15
- Phản hồi của GV : Không có góp ý riêng. Khi đối chiếu mã nguồn với Bảng 9.1 của case study (các quy tắc ghi luồng L2 hoặc "Tất cả") và với slide/tài liệu tự học buổi 7, em thấy các quy tắc dưới đây chưa được hiện thực đầy đủ trong BT1/BT2.
- Quyết định      : SỬA – (1) QT-02: hàm thuần chuanHoaSoDienThoai (rules/phone.rule.js), validator chuẩn hoá trước khi lưu, tra cứu cũng chuẩn hoá; chỉ nhận 10 chữ số (trước đây nhận 10–11). (2) QT-06: vòng đời đủ 7 trạng thái của Hình 6.2, thêm CHO_LINH_KIEN và DA_HUY; bảng chuyển tiếp CHUYEN_TIEP trong ticket.contract.js, phiếu trả kèm allowedNextStatuses. (3) QT-13: bỏ mọi lệnh DELETE trong repository; xoá phiếu = khách huỷ → DA_HUY (chỉ khi MOI/DA_PHAN_CONG, bắt buộc lý do, có dòng lịch sử); xoá khách = is_active = 0. (4) QT-15: SĐT khách che dạng 090****567 cho nhân viên tiếp nhận, Quản lý thấy đủ – che ở lớp service (dữ liệu không rời máy chủ ở dạng đầy đủ), không che ở giao diện.
- Lý do           : Case study ghi rõ các quy tắc này là "nguồn trực tiếp cho phần validation ở BT2". Che SĐT ở service thay vì ở giao diện vì nếu chỉ che trên màn hình thì API vẫn trả số đầy đủ.
- Bổ sung       : (5) QT-03: khi tạo phiếu cho máy đã đăng ký, giao diện gửi kèm customerId; service từ chối nếu máy không thuộc khách đó (THIET_BI_KHONG_THUOC_KHACH, 409) – theo ví dụ slide 12 buổi 7. (6) Một thiết bị không có hai phiếu đang mở cùng lúc (PHIEU_DANG_MO, 409) – theo ví dụ nghiệp vụ ở slide 7 và tài liệu tự học buổi 7; phiếu đã HOAN_TAT/DA_DONG/DA_HUY không tính. Repository chỉ trả danh sách phiếu của thiết bị (findByDevice), việc quyết định "đang mở" nằm ở service.
- Ảnh hưởng       : migrations/002_vong_doi_va_xoa_mem.sql (thêm customer.is_active; dựng lại bảng ticket để CHECK trạng thái có CHO_LINH_KIEN, DA_HUY – giữ nguyên dữ liệu và lịch sử); src/backend/migrate.js (bảng schema_migration – mỗi migration chạy một lần, seeds vẫn chạy mỗi lần); rules/phone.rule.js; validators/customer.validator.js; services/customer.service.js, ticket.service.js, ticket.contract.js; repositories/customer.repository.js, ticket.repository.js; routes/*.routes.js (truyền người xem); giao diện M3 (nút theo allowedNextStatuses, ô lý do + nút "Huỷ phiếu"); docs/srs.md (BR-08 → BR-10, thuật ngữ "Trạng thái phiếu"); docs/api-contract.md. Thêm 16 kiểm thử (tests/phone.rule.test.js, tests/migrate.test.js, tests/ticket.service.fake-repo.test.js – service với repository giả theo mục A5 tài liệu buổi 7, bổ sung customer.service và ticket.service). CSDL đang có trên máy: chạy lại `npm run migrate` một lần là được nâng cấp.

### TD-08  Những điểm của case study CHƯA hiện thực – ghi lại có chủ ý
- Phản hồi của GV : Không có góp ý riêng; ghi để minh bạch phạm vi.
- Quyết định      : GIỮ NGUYÊN – (1) QT-14 (nhân viên chỉ xem dữ liệu trung tâm mình): prototype chỉ có một trung tâm, ERD BT1 không có center_id; (2) bảng nhóm sự cố giữ 5 nhóm theo SRS 1.3.2 của BT1 (Phần cứng, Phần mềm, Kết nối, Phụ kiện/Ngoại hình, Khác) thay vì 6 nhóm trong issue_categories.csv (MAN_HINH, PIN, SAC, PHAN_MEM, NUOC_VAO, KHAC).
- Lý do           : (1) Thêm trung tâm cần thêm bảng service_center, cột center_id cho app_user và ticket – thay đổi ERD lớn, để sang BT3 nếu GV yêu cầu. (2) Bảng 5 nhóm và từ khoá đã được GV chấp nhận ở BT1 và đã có kiểm thử; README của bộ dữ liệu chỉ gợi ý dùng issue_categories.csv làm danh mục.
- Ảnh hưởng       : Không đổi mã nguồn. Nếu GV yêu cầu dùng 6 nhóm của bộ dữ liệu: chỉ sửa seeds/001_demo.sql (tên nhóm, từ khoá, mức ưu tiên) và tests/classification.rule.test.js; ClassificationRule không phải sửa vì đọc danh mục từ CSDL.

### TD-09  Kiến trúc và API đã hiện thực so với sơ đồ kiến trúc và api-contract của BT1
- Phản hồi của GV : Không có góp ý riêng. Khi đối chiếu đề bài BT2 (mục 3.2: sơ đồ kiến trúc ĐÃ HIỆN THỰC; tiêu chí 3: mọi sai lệch phải ghi lại), em thấy các điểm dưới đây khác architecture.drawio và api-contract.md của BT1 nhưng chưa được ghi.
- Quyết định      : SỬA, ghi lại như sau. (1) ReviewService của BT1 gộp vào TicketService (approveWarranty, rejectWarranty). (2) CategoryRepo và StatusLogRepo gộp vào TicketRepository (findCategories, addLog, findLogs). (3) Validator là tệp riêng trong validators/ nhưng được gọi ở đầu service thay vì ở routes. (4) Ba Rule* của BT1 đặt trong thư mục riêng rules/, thêm phone.rule.js (TD-07). (5) API: đường dẫn dùng id thay vì mã phiếu; GET /api/tickets?view=due → GET /api/tickets trả cờ needsAttention, lọc tab "Sắp/quá hạn SLA" và phân trang 20 phiếu/trang ở giao diện; ?view=unverified → ?unverified=1; PATCH /{code}/warranty-review → POST /{id}/approve và POST /{id}/reject; /{code}/status-log → /{id}/logs; thêm /api/auth/login, /me, /logout; thêm GET/PUT/DELETE khách hàng, PUT, PATCH /status, DELETE phiếu để đủ CRUD (S1).
- Lý do           : (1)(2) Duyệt/từ chối và ghi lịch sử luôn chạy trong cùng một giao dịch với bảng ticket – gộp lại thì một repository mở một transaction, ít lớp mỏng không có logic. (3) Mọi lối vào (API, kiểm thử, script) đều bị kiểm định dạng, không phụ thuộc route có nhớ gọi validator hay không. (5) id là khoá chính số nguyên, không phụ thuộc định dạng mã phiếu (mã đã đổi ở TD-05); tách approve/reject cho mỗi endpoint một việc, dễ phân quyền và dễ test.
- Ảnh hưởng       : Thêm docs/architecture-thuc-te.md + .png (sơ đồ theo mã thực tế, ghi thư mục của từng lớp); docs/api-contract.md thêm bảng "API đã hiện thực"; architecture.drawio và bảng API cũ của BT1 giữ nguyên để đối chiếu. Không đổi ERD (6 bảng) ngoài các cột ở TD-04, TD-07. (.gitignore đã chặn data/*.db từ trước nên CSDL SQLite cục bộ không bị commit.)

