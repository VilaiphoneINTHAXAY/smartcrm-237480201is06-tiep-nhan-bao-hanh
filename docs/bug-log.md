# Bug Log – Luồng L2 Tiếp nhận và phân loại yêu cầu bảo hành (Mekong Mobile)

> Sinh viên: INTHAXAY Vilaiphone · MSSV 237480201IS06 · Lớp 71K29CNTT17 · Track SE
>
> Mỗi mục ghi theo mẫu bảy dòng của buổi 11. Chỉ ghi những lỗi **đã thực sự gặp và gỡ** trong quá trình làm BT2
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
