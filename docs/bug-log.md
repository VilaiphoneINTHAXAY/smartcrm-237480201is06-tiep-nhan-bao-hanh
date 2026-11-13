# Bug Log – Luồng L2 Tiếp nhận và phân loại yêu cầu bảo hành (Mekong Mobile)

> Sinh viên: INTHAXAY Vilaiphone · MSSV 237480201IS06 · Lớp 71K29CNTT17 · Track SE
>
> Mỗi mục ghi theo mẫu bảy dòng của buổi 11 / buổi 13. BUG-001 → BUG-004 gặp ở BT2 (buổi 9–10); BUG-005 trở đi phát hiện khi chạy Test Report của **Bài tập 3** (`docs/test-report.md`). Chỉ ghi những lỗi **đã thực sự gặp và gỡ** trong quá trình làm BT2
> (buổi 9–10). Mã yêu cầu (US, GWT, FR, NFR, BR) lấy từ đặc tả BT1 – `docs/srs.md`.
>
> Về dòng 7: ba lỗi dưới đây nằm ở giao diện (React); dự án **chưa có bộ test tự động cho frontend**, nên việc xác
> nhận hiện là kiểm thử thủ công theo đúng lệnh tái lập ở dòng 4. Bổ sung test tự động cho frontend là việc
> cần làm trước BT3.

| Mã | Mức độ | Tóm tắt | Liên quan BT1 |
|---|---|---|---|
| BUG-001 | Major | Tải lại trang khi backend tắt → bị đẩy về màn hình đăng nhập | NFR-06, FR-01 |
| BUG-002 | Major | Frontend chạy ở cổng khác 5173 → mọi màn hình báo mất kết nối (CORS) | Ràng buộc kỹ thuật 1.5, README |
| BUG-003 | Minor | Nhấn Enter ở ô Số điện thoại (M1) gửi form tạo phiếu thay vì tra cứu khách | US01, GWT-01, GWT-02 |
| BUG-004 | Minor | Bấm "Thử lại" khi vẫn lỗi trông như không có tác dụng | Trạng thái lỗi M1–M3 (wireframe) |
| BUG-005 | **Critical** | Nhân viên sửa / đổi trạng thái / huỷ được phiếu do nhân viên KHÁC tạo (A01 OWASP) | NFR-06, đề BT3 mục S2 |
| BUG-006 | Major | Mọi tài khoản dùng chung một salt cố định khi băm mật khẩu – hai mật khẩu giống nhau cho cùng một chuỗi băm (A04 OWASP) | NFR-06, đề BT3 mục S3, checklist bảo mật mục 4 |
| BUG-007 | Minor | Màn hình M3 vẫn hiện nút đổi trạng thái / huỷ phiếu cho nhân viên không phải người tạo phiếu (API trả `allowedNextStatuses` không xét quyền) | QT-06, đề BT3 mục S2, OWASP A01 |


> **Ghi chú về quy tắc "mỗi lỗi một commit" (đề BT3, mục C4).** BUG-001 → BUG-003 là lỗi của BT2, được gỡ **trước** khi
> có quy tắc này: BUG-001 nằm chung commit giao diện đầu tiên, BUG-002 và BUG-003 chung commit `ec824fb` – em giữ
> nguyên lịch sử, không viết lại. Các lỗi tính cho BT3 – **BUG-005 (Critical), BUG-006 (Major), BUG-007 (Minor)** –
> mỗi lỗi có commit test FAIL riêng và commit sửa riêng (BUG-004 cũng một commit riêng `b134273`).

---

## BUG-001 · Major — Tải lại trang khi backend tắt thì bị đẩy về màn hình đăng nhập

| Dòng | Nội dung |
|---|---|
| 1. Mã và mức độ | BUG-001 · Major — người dùng mất phiên đăng nhập dù phiên còn hạn; sai yêu cầu phiên 30 phút của NFR-06 |
| 2. Phát hiện bởi | Kiểm thử thủ công khi chụp ảnh trạng thái lỗi cho BT2: tắt backend rồi tải lại trang danh sách phiếu (M2) |
| 3. Triệu chứng | Thay vì hiện trạng thái lỗi "Không kết nối được tới hệ thống" có nút Thử lại, giao diện chuyển về màn hình đăng nhập; bật lại backend vẫn phải đăng nhập lại |
| 4. Cách tái lập | 1) Đăng nhập `nv01` / `Demo@123`; 2) dừng backend (Ctrl+C ở terminal đang chạy `npm start`); 3) F5 tại `http://localhost:5173` → bị về trang đăng nhập (5/5 lần) |
| 5. Nguyên nhân | Hàm `kiemTraPhien()` trong `src/frontend/src/App.jsx` gọi `GET /api/auth/me` và coi **mọi** lỗi là "phiên không hợp lệ" → `setUser(null)`. Lỗi mạng (fetch thất bại, `ApiError` status 0, mã `MAT_KET_NOI`) và lỗi 401 bị xử lý như nhau, trái với hợp đồng lỗi: chỉ 401 `CHUA_DANG_NHAP` mới nghĩa là hết phiên |
| 6. Cách sửa | Sửa tại `kiemTraPhien()` — nơi duy nhất quyết định phiên khi khởi động: `status === 0` → giữ token, hiện `DataState` lỗi với nút Thử lại (`onRetry={kiemTraPhien}`); chỉ lỗi khác (401) mới `setUser(null)`. 401 ở các màn hình khác vẫn đi qua `onUnauthorized` trong `api/client.js` |
| 7. Commit và xác nhận | Commit: [93b5d36](https://github.com/VilaiphoneINTHAXAY/smartcrm-237480201is06-tiep-nhan-bao-hanh/commit/93b5d36) (lỗi được gỡ trước khi commit giao diện lần đầu, nên bản sửa nằm chung trong commit `feat(frontend)` này) · Xác nhận thủ công: lặp lại dòng 4 → hiện "Không tải được dữ liệu… Kiểm tra máy chủ rồi bấm Thử lại"; bật backend, bấm Thử lại → vào thẳng danh sách phiếu, không phải đăng nhập lại. `npm test` backend: 30/30 PASS (không vỡ chỗ khác). Ảnh: `docs/bt2-trang-thai-loi.png` |

## BUG-002 · Major — Frontend chạy ở cổng khác 5173 thì mọi màn hình báo mất kết nối

| Dòng | Nội dung |
|---|---|
| 1. Mã và mức độ | BUG-002 · Major — toàn bộ giao diện không gọi được API, hệ thống không dùng được theo README |
| 2. Phát hiện bởi | Chạy hệ thống theo README sau khi đã mở nhiều terminal `npm run dev` cũ (buổi 10) |
| 3. Triệu chứng | Vite báo chạy tại `http://localhost:5175`; đăng nhập báo "Không kết nối được tới hệ thống"; Console trình duyệt báo lỗi CORS, dù backend đang chạy bình thường ở cổng 3000 |
| 4. Cách tái lập | 1) Chạy một tiến trình chiếm cổng 5173 (vd. một `npm run dev` frontend cũ); 2) `cd src/frontend` → `npm run dev` lần nữa → Vite tự chuyển sang 5174/5175; 3) mở địa chỉ đó, đăng nhập → lỗi |
| 5. Nguyên nhân | Backend chỉ cho phép CORS từ `FRONTEND_ORIGIN` (mặc định `http://localhost:5173`, `src/backend/app.js`). Vite mặc định **tự đổi cổng** khi 5173 bận, nên origin thực tế (`:5175`) không khớp cấu hình → trình duyệt chặn mọi request. Cấu hình hai phía không ràng buộc nhau |
| 6. Cách sửa | `src/frontend/vite.config.js`: `server: { port: 5173, strictPort: true }` — cổng bận thì Vite **báo lỗi và dừng** thay vì lặng lẽ đổi cổng, nên lỗi lộ ra ngay ở terminal. Không nới CORS sang mọi origin (giữ đúng nguyên tắc bảo mật). README mục 2.2 ghi: cổng bận thì tắt các terminal `npm run dev` cũ rồi chạy lại |
| 7. Commit và xác nhận | Commit: [ec824fb](https://github.com/VilaiphoneINTHAXAY/smartcrm-237480201is06-tiep-nhan-bao-hanh/commit/ec824fb) (`fix(frontend): … strictPort …`) · Xác nhận thủ công: lặp lại dòng 4 → Vite báo `Port 5173 is already in use` và dừng; tắt tiến trình cũ, chạy lại → frontend ở 5173, đăng nhập thành công |

## BUG-003 · Minor — Nhấn Enter ở ô Số điện thoại gửi form tạo phiếu thay vì tra cứu khách

| Dòng | Nội dung |
|---|---|
| 1. Mã và mức độ | BUG-003 · Minor — sai luồng US01 (tra cứu khách theo SĐT) nhưng có cách khác là bấm nút "Tra cứu" |
| 2. Phát hiện bởi | Kiểm thử thủ công màn hình M1 theo GWT-01/GWT-02 |
| 3. Triệu chứng | Gõ SĐT rồi nhấn Enter: không hiện thông tin khách mà form "Tạo phiếu" bị gửi đi |
| 4. Cách tái lập | M1 "Tạo phiếu bảo hành" → gõ `0901234567` vào ô Số điện thoại → nhấn Enter |
| 5. Nguyên nhân | Ô SĐT nằm trong `<form onSubmit={luuPhieu}>` (`ReceiveDevicePage.jsx`); theo chuẩn HTML, Enter trong ô input sẽ gửi form (implicit submission). `luuPhieu` không kiểm tra điều kiện tiên quyết "đã tra cứu khách" (bước 1 của UC01/UC02) |
| 6. Cách sửa | Hai chỗ: (1) ô SĐT bắt `onKeyDown` Enter → `preventDefault()` rồi gọi `traCuu()`; (2) đầu `luuPhieu`: `if (!khach) return;` — chưa có khách thì không được tạo phiếu, dù form bị gửi bằng cách nào |
| 7. Commit và xác nhận | Commit: [ec824fb](https://github.com/VilaiphoneINTHAXAY/smartcrm-237480201is06-tiep-nhan-bao-hanh/commit/ec824fb) (`fix(frontend): Enter tra cứu …`) · Xác nhận thủ công: lặp lại dòng 4 → hiện họ tên khách và thiết bị (GWT-01); với SĐT chưa có → "Không tìm thấy khách hàng…" (GWT-02). Ảnh: `docs/bt2-m1-khong-tim-thay.png` |

## BUG-004 · Minor — Bấm "Thử lại" khi vẫn lỗi trông như không có tác dụng

| Dòng | Nội dung |
|---|---|
| 1. Mã và mức độ | BUG-004 · Minor — chức năng đúng nhưng người dùng tưởng nút hỏng |
| 2. Phát hiện bởi | Kiểm thử thủ công trạng thái lỗi (backend tắt) ở M2 khi chuẩn bị ảnh cho BT2 |
| 3. Triệu chứng | Bấm "Thử lại" khi backend vẫn tắt: màn hình y hệt trước, không có dấu hiệu gì cho thấy đã thử |
| 4. Cách tái lập | Tắt backend → mở M2 → bấm "Thử lại" nhiều lần |
| 5. Nguyên nhân | `DataState` (trạng thái lỗi) chỉ hiện thông điệp lỗi cố định; request thử lại thất bại rất nhanh nên trạng thái "đang tải" chỉ chớp trong vài mili-giây, kết quả hiển thị không đổi |
| 6. Cách sửa | `src/frontend/src/components/DataState.jsx`: thêm dòng "Lần thử gần nhất lúc HH:MM:SS" — mỗi lần thử lại, giờ thay đổi, người dùng thấy hệ thống đã thử |
| 7. Commit và xác nhận | Commit: [b134273](https://github.com/VilaiphoneINTHAXAY/smartcrm-237480201is06-tiep-nhan-bao-hanh/commit/b134273) · Xác nhận thủ công: lặp lại dòng 4 → giờ "Lần thử gần nhất" đổi sau mỗi lần bấm |

## BUG-005 · Critical — Nhân viên sửa / đổi trạng thái / huỷ được phiếu do nhân viên khác tạo (A01 OWASP)

| Dòng | Nội dung |
|---|---|
| 1. Mã và mức độ | BUG-005 · **Critical** — lỗ hổng kiểm soát truy cập (A01:2025 Broken Access Control); dữ liệu phiếu bị người không có quyền thay đổi thật. Phân loại theo câu hỏi 1 của cây phân loại buổi 13: "dữ liệu bị sai hoặc có lỗ hổng bảo mật" → Critical |
| 2. Phát hiện bởi | **TC-11** trong Test Report BT3 (`tests/a01.chu-so-huu.test.js`) – lần chạy đầu FAIL: `200 !== 403` (ảnh `docs/screenshots/TC-11-FAIL.png`) |
| 3. Triệu chứng | Nhân viên tiếp nhận `nv02` gọi `PUT /api/tickets/:id` (sửa mô tả lỗi) và `DELETE /api/tickets/:id` (huỷ phiếu) với phiếu do `nv01` tạo → API trả **200** và phiếu bị đổi thật; `PATCH /api/tickets/:id/status` cũng đổi được trạng thái |
| 4. Cách tái lập | 1) `npm run migrate` (seed có `nv01`, `nv02`, mật khẩu `Demo@123`); 2) đăng nhập `nv01`, tạo phiếu cho khách `0901234567` → nhận `id`; 3) đăng nhập `nv02`, gọi `PUT /api/tickets/<id>` thân `{"issueDescription":"Đã bị sửa"}` → 200 (5/5 lần). Tự động: `node --test --test-name-pattern="TC-11"` |
| 5. Nguyên nhân | Trong `src/backend/services/ticket.service.js`, các hàm `update()` và `changeStatus()` (hàm `cancel()` gọi lại `changeStatus()`) chỉ kiểm phiếu **có tồn tại** và **trạng thái hợp lệ**, KHÔNG so người gọi với cột `ticket.created_by`. Middleware `auth.js` đã gắn `req.user` và routes đã truyền xuống service, nhưng service chỉ dùng `req.user` để che SĐT (QT-15), không dùng để kiểm quyền. Chỉ `approveWarranty` / `rejectWarranty` có kiểm vai trò |
| 6. Cách sửa | Thêm hàm riêng `#chiNguoiTaoHoacQuanLy(id, nguoiDung)` trong `ticket.service.js`: đọc phiếu từ repository, nếu người gọi không phải `QUAN_LY` và `created_by !== nguoiDung.id` thì ném `AppError('KHONG_DU_QUYEN', …)` (bảng lỗi ở `app.js` đã ánh xạ sẵn → 403). Gọi ở đầu `update()` và `changeStatus()` – `cancel()` đi qua `changeStatus()` nên được chặn theo. Kiểm ở service (không ở route) để mọi lối vào đều bị chặn như nhau. Thêm 2 test: **TC-11b** (người tạo và Quản lý vẫn sửa được – bản sửa không làm hỏng luồng đúng) và test hồi quy `PATCH /status` của người khác → 403 |
| 7. Commit và xác nhận | Commit: [962a8e8](https://github.com/VilaiphoneINTHAXAY/smartcrm-237480201is06-tiep-nhan-bao-hanh/commit/962a8e822f5da2acec87d7fd1e026d6db125c79e) (`fix(ticket): … (BUG-005)`) · Chạy lại TC-11 → 403 `KHONG_DU_QUYEN`, mô tả và trạng thái phiếu trong CSDL không đổi → **PASS**; TC-11b PASS; `npm test`: **50/50 PASS** (ảnh `docs/screenshots/TC-11-PASS.png`) |

## BUG-006 · Major — Mọi tài khoản dùng chung một salt cố định khi băm mật khẩu (A04 OWASP)

| Dòng | Nội dung |
|---|---|
| 1. Mã và mức độ | BUG-006 · **Major** — mật khẩu vẫn được băm (scrypt) nên không lộ trực tiếp, hệ thống vẫn dùng được; nhưng cơ chế bảo vệ mật khẩu không đạt chuẩn: kẻ có bản sao CSDL nhận ra ngay các tài khoản trùng mật khẩu và chỉ cần dò **một lần** cho mọi tài khoản. Không xếp Critical vì phải lấy được tệp CSDL mới khai thác được |
| 2. Phát hiện bởi | Tự kiểm OWASP A04 theo tài liệu tự học buổi 13 (mục A4 "Kiểm thử bảo mật") và checklist bảo mật mục 4; viết thành test `tests/a04.mat-khau.test.js` – lần chạy đầu FAIL: `actual: 'mekong-demo-salt'` (ảnh `docs/screenshots/A04-FAIL.png`) |
| 3. Triệu chứng | Trong bảng `app_user`, ba tài khoản `nv01`, `nv02`, `ql01` (cùng mật khẩu demo) có **cùng một** `password_hash` = `scrypt$mekong-demo-salt$e2bec9…`; salt là chuỗi chữ cố định, không phải ngẫu nhiên |
| 4. Cách tái lập | 1) `npm run migrate`; 2) `node -e "const {DatabaseSync}=require('node:sqlite');console.log(new DatabaseSync('data/smartcrm.db').prepare('SELECT username,password_hash FROM app_user').all())"` → ba dòng cùng chuỗi băm. Tự động: `node --test tests/a04.mat-khau.test.js` |
| 5. Nguyên nhân | `seeds/002_demo_password.sql` (viết ở BT2) đặt mật khẩu demo bằng **một chuỗi băm tính sẵn** và gán cho mọi dòng `password_hash = 'chua-dat'`. Vì seed là SQL thuần nên không sinh được salt ngẫu nhiên cho từng dòng – mọi tài khoản nhận cùng salt `mekong-demo-salt`. Hàm kiểm mật khẩu trong `auth.service.js` đúng, lỗi nằm ở cách **tạo** chuỗi băm |
| 6. Cách sửa | Tách băm / so mật khẩu ra `src/backend/security/password.js`: `hashMatKhau()` sinh salt **16 byte ngẫu nhiên riêng cho từng tài khoản** (`crypto.randomBytes`) rồi băm scrypt; `auth.service.js` dùng lại `dungMatKhau()` từ đây. Xoá `seeds/002_demo_password.sql`; `migrate.js` thêm bước `datMatKhauDemo()` băm mật khẩu demo (đọc `DEMO_PASSWORD` trong `.env`, mặc định `Demo@123`) cho dòng còn `chua-dat` **hoặc còn chuỗi băm salt cũ** – CSDL cũ được sửa tự động, chạy lại lần hai không băm lại (giữ C5). Thêm 2 test hồi quy: migrate lần hai giữ nguyên chuỗi băm và vẫn đăng nhập được; CSDL cũ có salt chung được băm lại |
| 7. Commit và xác nhận | Commit: [b46074c](https://github.com/VilaiphoneINTHAXAY/smartcrm-237480201is06-tiep-nhan-bao-hanh/commit/b46074c5a61e2e8d39755091eab93f03b61555ce) (`fix(auth): … (BUG-006)`) · Chạy lại `node --test tests/a04.mat-khau.test.js` → 3/3 **PASS** (ảnh `docs/screenshots/A04-PASS.png`); `npm run migrate` trên CSDL cũ của máy em: lần 1 "đặt cho 3 tài khoản", lần 2 "đặt cho 0 tài khoản", số dòng mọi bảng giữ nguyên (6 phiếu, 6 dòng lịch sử còn đủ); đăng nhập `nv01` / `Demo@123` vẫn được; `npm test`: **53/53 PASS** |

## BUG-007 · Minor — M3 vẫn hiện nút đổi trạng thái / huỷ phiếu cho nhân viên không có quyền

| Dòng | Nội dung |
|---|---|
| 1. Mã và mức độ | BUG-007 · **Minor** — sau khi sửa BUG-005, server đã chặn đúng (403) nên dữ liệu **không** bị đổi; lỗi chỉ ở chỗ giao diện gợi ý một thao tác người dùng không được làm, bấm vào thì nhận thông báo lỗi. Phân loại theo cây phân loại buổi 13: dữ liệu đúng, chức năng chính vẫn chạy, có cách đi tiếp → Minor |
| 2. Phát hiện bởi | Rà lại màn hình M3 bằng tài khoản `nv02` khi viết API docs (trường `allowedNextStatuses`); viết thành **TC-11c** trong `tests/a01.chu-so-huu.test.js` – lần chạy đầu FAIL: `actual: ['DA_PHAN_CONG', 'DA_HUY']`, `expected: []` (ảnh `docs/screenshots/TC-11c-FAIL.png`, commit test [3d1b5cd](https://github.com/VilaiphoneINTHAXAY/smartcrm-237480201is06-tiep-nhan-bao-hanh/commit/3d1b5cdb44d7830e5083f11f222a31a544f8aada)) |
| 3. Triệu chứng | Đăng nhập `nv02`, mở phiếu do `nv01` tạo ở M3 → vẫn thấy các nút "Chuyển trạng thái → Đã phân công" và ô "Lý do khách huỷ" + nút "Huỷ phiếu"; bấm vào → thông báo đỏ "Chỉ người tạo phiếu hoặc Quản lý TTBH được sửa phiếu này" (403) |
| 4. Cách tái lập | 1) `docker compose up -d --build`; 2) đăng nhập `nv01`, tạo phiếu bất kỳ; 3) đăng xuất, đăng nhập `nv02` / `Demo@123`, mở phiếu đó ở *Danh sách phiếu* → thấy nút (5/5 lần). Ở mức API: `GET /api/tickets/<id>` bằng token `nv02` trả `allowedNextStatuses: ["DA_PHAN_CONG","DA_HUY"]`. Tự động: `npm run tc -- "TC-11c"` |
| 5. Nguyên nhân | `toTicketView()` trong `src/backend/services/ticket.contract.js` tính `allowedNextStatuses` **chỉ theo trạng thái phiếu** (vòng đời QT-06), không xét người xem; còn quy tắc người tạo / Quản lý (BUG-005) chỉ nằm trong `TicketService` lúc ghi. Hai nơi không dùng cùng một quy tắc nên API "gợi ý" bước chuyển cho người không được chuyển; M3 vẽ nút theo đúng mảng đó |
| 6. Cách sửa | `toTicketView()` tính thêm `canEdit = người xem là QUAN_LY hoặc created_by === người xem` (cùng quy tắc với `#chiNguoiTaoHoacQuanLy`); khi `canEdit` sai thì `allowedNextStatuses = []`. Hợp đồng dữ liệu thêm trường `canEdit` (cập nhật test hợp đồng trong `tests/ticket.service.test.js`). M3 (`TicketDetailPage.jsx`) hiện dòng "Chỉ người tạo phiếu (…) hoặc Quản lý TTBH được cập nhật phiếu này" thay cho các nút. Server vẫn giữ kiểm quyền 403 – giao diện ẩn nút chỉ để dễ dùng, không thay cho kiểm quyền |
| 7. Commit và xác nhận | Commit: [d827e3c](https://github.com/VilaiphoneINTHAXAY/smartcrm-237480201is06-tiep-nhan-bao-hanh/commit/d827e3c9044937b7c474c3374b961162111b924e) (`fix(ticket): … (BUG-007)`) · Chạy lại TC-11c → `allowedNextStatuses: []`, `canEdit: false` với `nv02`; `nv01` và `ql01` vẫn thấy `["DA_PHAN_CONG","DA_HUY"]` → **PASS** (ảnh `docs/screenshots/TC-11c-PASS.png`); TC-11, TC-11b vẫn PASS; `npm test`: **62/62 PASS** |
