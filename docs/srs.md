# SRS rút gọn – Luồng L2: Tiếp nhận và phân loại yêu cầu bảo hành

Smart CRM – Mekong Mobile · Track SE · INTHAXAY Vilaiphone (237480201IS06)

## 1.1. Giới thiệu, phạm vi và bảng thuật ngữ

**Bối cảnh.** Trung tâm bảo hành (TTBH) của Mekong Mobile tiếp nhận điện thoại khách mang đến bảo hành. Smart CRM cần ghi nhận mỗi yêu cầu thành phiếu bảo hành, xác định còn/hết bảo hành, phân loại sự cố và cam kết hạn xử lý theo mức ưu tiên (24h / 72h / 120h theo case study).

**Luồng nghiệp vụ đã chọn: L2 – Tiếp nhận và phân loại yêu cầu bảo hành.** Trong phạm vi: tra cứu khách theo SĐT → tạo phiếu bảo hành kèm thiết bị và mô tả lỗi → kiểm tra tình trạng bảo hành → phân loại nhóm sự cố và mức ưu tiên → sinh hạn SLA → phiếu ở trạng thái MỚI; Quản lý TTBH duyệt phiếu chưa xác minh bảo hành, theo dõi phiếu sắp/quá hạn và xem lịch sử trạng thái.

**Chủ ý KHÔNG làm (WON'T):** phân công kỹ thuật viên (luồng L4); quản lý tồn kho linh kiện (L5); khảo sát hài lòng sau khi đóng phiếu (L8); gửi SMS/Zalo cho khách; tính ngày lễ vào hạn SLA; triển khai và hạ tầng.

| Thuật ngữ | Ý nghĩa | Tên trong ERD / API |
|---|---|---|
| Phiếu bảo hành (gọi tắt: phiếu) | Một yêu cầu bảo hành đã được ghi nhận | ticket |
| Mã phiếu | Mã hiển thị của phiếu, dạng BH-0001 | ticket.code |
| Khách hàng | Người mang thiết bị đến; định danh bằng số điện thoại (SĐT) | customer |
| Thiết bị | Điện thoại/máy của khách hàng cần bảo hành | device |
| IMEI / Serial | Mã định danh thiết bị. IMEI: đúng 15 chữ số. Serial: 5–30 ký tự chữ/số (dùng khi máy không có IMEI) | device.imei, device.serial_no |
| Nhóm sự cố | Loại lỗi xác định theo bảng phân loại 1.3.2 | issue_category |
| Mức ưu tiên | CAO / TRUNG_BINH / THAP | ticket.priority |
| Thời điểm tiếp nhận | Ngày giờ phiếu được tạo | ticket.received_at |
| Hạn SLA | Thời điểm cam kết xử lý xong phiếu, chốt lúc tạo phiếu | ticket.sla_due_at |
| Ngày làm việc | Thứ Hai – thứ Sáu, chưa tính ngày lễ | — |
| Tình trạng bảo hành | CÒN BẢO HÀNH / HẾT BẢO HÀNH / CHƯA XÁC MINH | ticket.warranty_status |
| Cờ "chưa xác minh bảo hành" | Đánh dấu phiếu thiếu ngày mua, chờ Quản lý TTBH duyệt | ticket.is_unverified |
| Trạng thái phiếu | Vòng đời phiếu; luồng L2 chỉ tạo trạng thái MỚI | ticket.status |
| Lịch sử trạng thái | Nhật ký mọi lần tạo phiếu, đổi trạng thái, duyệt/từ chối bảo hành | ticket_status_log |
| Nhân viên tiếp nhận (A1) | Người dùng tạo phiếu tại quầy | app_user.role = TIEP_NHAN |
| Quản lý TTBH (A2) | Quản lý trung tâm bảo hành | app_user.role = QUAN_LY |
| GWT | Tiêu chí chấp nhận dạng Given – When – Then | — |

## 1.2. Các bên liên quan và vai trò

| Vai trò | Được làm | Không được làm |
|---|---|---|
| A1 – Nhân viên tiếp nhận (dùng hệ thống) | Tra cứu và tạo khách hàng; tạo phiếu bảo hành; xem chi tiết phiếu và lịch sử trạng thái | Duyệt/từ chối bảo hành; xem tab "Chờ duyệt bảo hành"; sửa tay mức ưu tiên hoặc hạn SLA |
| A2 – Quản lý TTBH (dùng hệ thống) | Duyệt/từ chối phiếu chưa xác minh bảo hành; xem danh sách phiếu sắp/quá hạn; xem lịch sử trạng thái | Sửa hạn SLA đã chốt; xóa phiếu hoặc dòng lịch sử |
| Khách hàng (gián tiếp) | Cung cấp SĐT, thiết bị, mô tả lỗi; nhận mã phiếu và hạn SLA từ A1 | Không đăng nhập hệ thống |
| Kỹ thuật viên (luồng L4) | — ngoài phạm vi — | Không dùng các chức năng của L2 |

## 1.3. Yêu cầu chức năng và User Story

| Mã | Yêu cầu chức năng (kiểm chứng được) |
|---|---|
| FR-01 | Hệ thống tra cứu khách hàng theo SĐT và hiển thị họ tên cùng các thiết bị đã đăng ký. |
| FR-02 | Khi SĐT chưa có, hệ thống cho phép tạo khách hàng mới (họ tên + SĐT); một SĐT chỉ thuộc một khách hàng. |
| FR-03 | Hệ thống tạo phiếu bảo hành kèm thiết bị (IMEI hoặc Serial, model, ngày mua, số tháng bảo hành) và mô tả lỗi; trạng thái phiếu ban đầu là MỚI; IMEI đúng 15 chữ số, Serial 5–30 ký tự chữ/số. |
| FR-04 | Hệ thống tính ngày hết bảo hành = ngày mua + số tháng bảo hành (tháng lịch); thời điểm tiếp nhận ≤ ngày hết bảo hành → CÒN BẢO HÀNH, ngược lại → HẾT BẢO HÀNH. |
| FR-05 | Khi thiếu ngày mua, hệ thống đặt tình trạng bảo hành = CHƯA XÁC MINH, gắn cờ "chưa xác minh bảo hành" và đưa phiếu vào danh sách chờ Quản lý TTBH duyệt. |
| FR-06 | Quản lý TTBH duyệt hoặc từ chối phiếu có cờ. Duyệt → CÒN BẢO HÀNH, bỏ cờ. Từ chối → giữ cờ, bắt buộc nhập lý do. Cả hai ghi vào lịch sử trạng thái. |
| FR-07 | Hệ thống gán nhóm sự cố và mức ưu tiên cho phiếu theo bảng phân loại 1.3.2. |
| FR-08 | Hệ thống sinh hạn SLA theo mức ưu tiên: CAO +1, TRUNG_BINH +3, THAP +5 ngày làm việc (BR-05). |
| FR-09 | Hệ thống liệt kê phiếu chưa xong có hạn SLA còn ≤ 8 giờ hoặc đã quá hạn, sắp theo hạn SLA tăng dần, 20 phiếu/trang; phiếu quá hạn tô nổi bật. |
| FR-10 | Hệ thống ghi và hiển thị lịch sử trạng thái của phiếu theo thời gian (thời điểm, hành động, trạng thái từ → đến, người thực hiện, ghi chú). |

### 1.3.1. User Story (7 story · 4 MUST · 2 SHOULD · 1 COULD)

| Mã | User Story | MoSCoW | Tiêu chí chấp nhận |
|---|---|---|---|
| US01 | Là nhân viên tiếp nhận, tôi muốn tra cứu khách hàng theo SĐT để không nhập lại thông tin khách cũ. | MUST | GWT-01, 02 |
| US02 | Là nhân viên tiếp nhận, tôi muốn tạo phiếu bảo hành kèm thiết bị (IMEI/Serial) và mô tả lỗi để ghi nhận yêu cầu. | MUST | GWT-03, 04, 05 |
| US03 | Là nhân viên tiếp nhận, tôi muốn hệ thống tự kiểm tra còn/hết bảo hành theo ngày mua để báo đúng cho khách. | MUST | GWT-06, 07, 08 |
| US04 | Là Quản lý TTBH, tôi muốn phiếu thiếu ngày mua được gắn cờ "chưa xác minh bảo hành" để tôi duyệt hoặc từ chối. | SHOULD | GWT-09, 10, 20 |
| US05 | Là nhân viên tiếp nhận, tôi muốn hệ thống tự phân loại nhóm sự cố, gán mức ưu tiên và sinh hạn SLA theo mức ưu tiên đó để hẹn đúng thời hạn với khách. | MUST | GWT-11 … 15 |
| US06 | Là Quản lý TTBH, tôi muốn xem danh sách phiếu sắp đến hạn/quá hạn SLA để kịp xử lý. | SHOULD | GWT-16, 17 |
| US07 | Là nhân viên tiếp nhận hoặc Quản lý TTBH, tôi muốn xem lịch sử trạng thái của phiếu để truy vết. | COULD | GWT-18, 19 |

### 1.3.2. Bảng phân loại nhóm sự cố và mức ưu tiên (FR-07, BR-04)

| Thứ tự | Nhóm sự cố | Từ khóa trong mô tả lỗi | Mức ưu tiên | Hạn SLA |
|---|---|---|---|---|
| 1 | Phần cứng | màn hình, vỡ, không lên nguồn, pin, sạc, camera, loa | CAO | +1 ngày làm việc (24h) |
| 2 | Phần mềm | treo, đơ, lag, bootloop, lỗi ứng dụng, cập nhật | TRUNG_BINH | +3 ngày làm việc (72h) |
| 3 | Kết nối | wifi, sóng, bluetooth, SIM | TRUNG_BINH | +3 ngày làm việc (72h) |
| 4 | Phụ kiện/Ngoại hình | ốp, trầy xước, nút bấm | THAP | +5 ngày làm việc (120h) |
| — | Khác | (không khớp nhóm nào) | TRUNG_BINH | +3 ngày làm việc (72h) |

### 1.3.3. Tiêu chí chấp nhận (Given – When – Then)

| Mã | US | Given → When → Then (rút gọn) |
|---|---|---|
| GWT-01 | US01 | SĐT đã có → tra cứu → hiển thị họ tên khách và các thiết bị đã đăng ký. |
| GWT-02 | US01 | (ngoại lệ) SĐT chưa có → tra cứu → báo "Không tìm thấy khách hàng với SĐT này" và hiện nút "Tạo khách hàng mới". |
| GWT-03 | US02 | Khách và thiết bị hợp lệ, có mô tả lỗi → lưu → tạo phiếu trạng thái MỚI, có mã phiếu. |
| GWT-04 | US02 | (ngoại lệ) IMEI không đủ 15 chữ số / Serial sai định dạng → lưu → từ chối, báo lỗi tại trường IMEI/Serial. |
| GWT-05 | US02 | (ngoại lệ) Mô tả lỗi trống → lưu → từ chối, báo "Vui lòng nhập mô tả lỗi". |
| GWT-06 | US03 | Thời điểm tiếp nhận ≤ ngày hết bảo hành (đúng ngày hết hạn vẫn tính là còn) → tạo phiếu → CÒN BẢO HÀNH. |
| GWT-07 | US03 | Thời điểm tiếp nhận > ngày hết bảo hành → tạo phiếu → HẾT BẢO HÀNH. |
| GWT-08 | US03 | (ngoại lệ) Ngày mua sau ngày tiếp nhận → lưu → từ chối, báo "Ngày mua không được sau ngày tiếp nhận". |
| GWT-09 | US04 | Thiếu ngày mua → lưu → CHƯA XÁC MINH, gắn cờ, phiếu hiện trong tab "Chờ duyệt bảo hành". |
| GWT-10 | US04 | (ngoại lệ) Quản lý TTBH bấm Từ chối mà không nhập lý do → báo "Phải nhập lý do khi từ chối"; có lý do → giữ cờ, ghi lý do vào lịch sử. |
| GWT-20 | US04 | Quản lý TTBH duyệt phiếu có cờ → CÒN BẢO HÀNH, bỏ cờ, ghi người duyệt và thời điểm vào lịch sử. |
| GWT-11 | US05 | Mô tả lỗi chứa từ khóa của một nhóm (bảng 1.3.2) → tạo phiếu → gán nhóm và mức ưu tiên tương ứng. |
| GWT-12 | US05 | (ngoại lệ) Mô tả không khớp nhóm nào → tạo phiếu → nhóm "Khác", TRUNG_BINH. |
| GWT-13 | US05 | Mức ưu tiên CAO, tiếp nhận thứ Sáu 02/10/2026 09:00 → hạn SLA thứ Hai 05/10/2026 09:00. |
| GWT-14 | US05 | Mức ưu tiên THAP, tiếp nhận thứ Hai 05/10/2026 10:00 → hạn SLA thứ Hai 12/10/2026 10:00. |
| GWT-15 | US05 | (ngoại lệ) Tiếp nhận thứ Bảy/Chủ nhật → hạn SLA tính từ 08:00 thứ Hai kế tiếp rồi cộng số ngày làm việc. |
| GWT-16 | US06 | Có phiếu còn ≤ 8 giờ đến hạn hoặc đã quá hạn → Quản lý TTBH mở danh sách → hiển thị, phiếu quá hạn tô đỏ. |
| GWT-17 | US06 | (ngoại lệ) Không có phiếu nào sắp/quá hạn → mở danh sách → hiện "Không có phiếu cần chú ý". |
| GWT-18 | US07 | Phiếu tồn tại → xem lịch sử → hiển thị mọi dòng lịch sử theo thời gian tăng dần. |
| GWT-19 | US07 | (ngoại lệ) Mã phiếu không tồn tại → xem → báo "Không tìm thấy phiếu" (HTTP 404). |

## 1.4. Yêu cầu phi chức năng (mọi yêu cầu có ngưỡng số)

| Mã | Loại | Yêu cầu và ngưỡng | Cách đo |
|---|---|---|---|
| NFR-01 | Hiệu năng | Tra cứu khách theo SĐT phản hồi ≤ 2 giây (p95) khi CSDL có ≥ 500 phiếu | Đo 100 request bằng script, lấy p95 |
| NFR-02 | Hiệu năng | Tạo phiếu (gồm kiểm tra bảo hành, phân loại, SLA, ghi lịch sử) hoàn tất ≤ 3 giây | Đo thời gian POST /api/tickets |
| NFR-03 | Chính xác | Tính SLA và tình trạng bảo hành đúng 100% trên bộ ≥ 10 test case đã định nghĩa (TC-06…08, TC-13…15 và các ca biên) | Unit test các Rule |
| NFR-04 | Đồng thời | ≥ 20 người dùng đồng thời không phát sinh lỗi hoặc trùng mã phiếu | Load test 20 user ảo, 5 phút |
| NFR-05 | Truy vết | 100% lần tạo phiếu / đổi trạng thái / duyệt bảo hành có dòng lịch sử kèm thời điểm và người thực hiện | So số phiếu với số dòng TAO_PHIEU |
| NFR-06 | Bảo mật | Phiên hết hạn sau 30 phút không hoạt động (trả 401); 2 vai trò A1, A2 phân quyền riêng (sai vai trò trả 403) | Test API với token hết hạn / sai vai trò |
| NFR-07 | Hiệu năng | Mở danh sách phiếu sắp/quá hạn phản hồi ≤ 2 giây (p95) khi CSDL có ≥ 500 phiếu | Đo 100 request, lấy p95 |

## 1.5. Ràng buộc và quy tắc nghiệp vụ

| Mã | Quy tắc | Nguồn |
|---|---|---|
| BR-01 | Thiết bị phải có IMEI (đúng 15 chữ số) hoặc Serial (5–30 ký tự chữ/số); IMEI và Serial không trùng giữa hai thiết bị. | Phân tích của em |
| BR-02 | Ngày hết bảo hành = ngày mua + số tháng bảo hành theo tháng lịch (ngày không tồn tại ở tháng đích → lấy ngày cuối tháng). Ngày mua không được sau ngày tiếp nhận. | Case study + phân tích |
| BR-03 | Thiếu ngày mua → CHƯA XÁC MINH + cờ. Chỉ Quản lý TTBH được duyệt (→ CÒN BẢO HÀNH, bỏ cờ) hoặc từ chối (giữ cờ). | Phân tích của em |
| BR-04 | Phân loại: so khớp từ khóa không phân biệt hoa/thường, xét theo thứ tự bảng 1.3.2, khớp nhóm đầu tiên thì dừng; không khớp → "Khác", TRUNG_BINH. | Phân tích của em |
| BR-05 | Hạn SLA: CAO 24h, TRUNG_BINH 72h, THAP 120h, quy đổi thành 1/3/5 ngày làm việc, giữ nguyên giờ tiếp nhận; tiếp nhận thứ Bảy/Chủ nhật → tính từ 08:00 thứ Hai. Hạn SLA chốt lúc tạo phiếu, không tự tính lại. | Case study (24h/72h/120h); cách quy đổi là giả định |
| BR-06 | Từ chối bảo hành bắt buộc nhập lý do; lý do lưu vào lịch sử trạng thái. | Phân tích của em |
| BR-07 | Một SĐT chỉ thuộc một khách hàng. | Phân tích của em |

**Ràng buộc kỹ thuật:** Node.js + Express, PostgreSQL 16, React (giao diện web đơn giản); dữ liệu mẫu ≥ 500 phiếu trích từ tickets_history.csv. **Giả định cần GV xác nhận:** cách quy đổi 24h/72h/120h sang 1/3/5 ngày làm việc; chưa xử lý ngày lễ.

## 1.6. Bảng truy vết yêu cầu

| FR | User Story | Use case | MoSCoW | NFR | Bảng dữ liệu | Màn hình |
|---|---|---|---|---|---|---|
| FR-01 | US01 | UC01 | MUST | NFR-01 | customer, device | M1 |
| FR-02 | US01 | UC01 | MUST | NFR-01 | customer | M1 |
| FR-03 | US02 | UC02 | MUST | NFR-02, 04, 05 | ticket, device, ticket_status_log, app_user | M1 |
| FR-04 | US03 | UC03 | MUST | NFR-03 | device, ticket | M1, M3 |
| FR-05 | US04 | UC03, UC06 | SHOULD | NFR-06 | ticket | M1, M2 |
| FR-06 | US04 | UC06 | SHOULD | NFR-05, 06 | ticket, ticket_status_log, app_user | M3 |
| FR-07 | US05 | UC04 | MUST | NFR-03 | issue_category, ticket | M1 |
| FR-08 | US05 | UC05 | MUST | NFR-03 | ticket | M1, M2 |
| FR-09 | US06 | UC07 | SHOULD | NFR-07 | ticket, device, customer | M2 |
| FR-10 | US07 | UC08 | COULD | NFR-05 | ticket_status_log, app_user | M3 |
| FR-11 Phân công kỹ thuật viên | — | — | WON'T | — | — | ngoài phạm vi (L4) |
| FR-12 Gửi SMS/Zalo cho khách | — | — | WON'T | — | — | ngoài phạm vi |

Đọc theo hàng: mọi FR mức MUST/SHOULD/COULD đều có User Story, use case, bảng dữ liệu và màn hình (0 ô trống; hàng WON'T được phép trống). Đọc theo cột "Bảng dữ liệu": cả 6 bảng của ERD đều xuất hiện ít nhất một lần.
