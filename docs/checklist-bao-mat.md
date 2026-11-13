# Checklist bảo mật tự đánh giá – BT3 (thành phần 5)

**Sinh viên:** INTHAXAY Vilaiphone – 237480201IS06 · **Track:** SE · **Luồng:** L2 · **Phiên bản:** tag `v1.0`

Bảy mục bắt buộc theo bài giảng và tài liệu tự học buổi 15. Mỗi mục: **ĐÃ LÀM / CHƯA LÀM / KHÔNG ÁP DỤNG**
kèm minh chứng là lệnh đã **chạy thật** trên máy em (Windows 11, PowerShell, thư mục gốc repo) hoặc đường dẫn tệp.
Ảnh chụp kết quả nằm trong `docs/screenshots/sec-*.png`.

> Trên Windows không có `grep`, em dùng `git grep` – cùng biểu thức chính quy với tài liệu buổi 15, chỉ quét tệp được Git theo dõi (không quét `node_modules`).

## Tóm tắt

| # | Mục | Kết quả | Minh chứng chính |
|---|---|---|---|
| 1 | Không có bí mật trong repo (kể cả lịch sử Git) | **ĐÃ LÀM** | `git log --all --oneline -- .env` in ra rỗng · `sec-1.png` |
| 2 | Kiểm dữ liệu vào ở tầng ứng dụng | **ĐÃ LÀM** | `src/backend/validators/` · 3 lệnh grep · TC-10 · `sec-2.png` |
| 3 | Kiểm soát truy cập theo chủ sở hữu | **ĐÃ LÀM** | `ticket.service.js` · `tests/a01.chu-so-huu.test.js` (TC-11) · `sec-3.png` |
| 4 | Mật khẩu được băm, không lưu dạng đọc được | **ĐÃ LÀM** | `src/backend/security/password.js` (scrypt, salt ngẫu nhiên) · `tests/a04.mat-khau.test.js` · `sec-4.png` |
| 5 | Thông báo lỗi không lộ chi tiết bên trong | **ĐÃ LÀM** | bộ xử lý lỗi cuối trong `app.js` · `tests/bao-mat.test.js` · `sec-5.png` |
| 6 | Log không ghi mật khẩu, token, dữ liệu cá nhân thừa | **ĐÃ LÀM** | `src/backend/security/log.js` · `tests/bao-mat.test.js` · `sec-6.png` |
| 7 | Thư viện ngoài khoá phiên bản và kiểm cảnh báo lỗ hổng | **ĐÃ LÀM** (còn 1 rủi ro chấp nhận) | `package-lock.json` đã commit · `npm audit` · `sec-7.png` |

---

## 1. Không có bí mật trong repo – ĐÃ LÀM

Repo **công khai**, nên kiểm cả lịch sử Git, không chỉ thư mục hiện tại.

```powershell
git log --all --oneline -- .env
git log --all --oneline -- src/frontend/.env
git log -p --all | Select-String -Pattern "password|secret|api_key|token" | Select-Object -First 20
```

- Hai lệnh đầu in ra **rỗng**: `.env` chưa bao giờ được commit (`.gitignore` chặn `.env` từ BT2; `.dockerignore` cũng chặn để `.env` không lọt vào image).
- Lệnh thứ ba chỉ ra các dòng là **tên biến / tên hàm / tài liệu** (`password_hash`, `DEMO_PASSWORD`, `hashMatKhau`, mô tả BUG-006…) – không có giá trị bí mật nào.
- Giá trị duy nhất giống mật khẩu là `Demo@123`: mật khẩu **demo** của ba tài khoản mẫu, ghi công khai trong README và `.env.example`, chỉ tồn tại trong dữ liệu mẫu. Không phải bí mật thật.
- Hệ thống **không có** khoá API, chuỗi kết nối CSDL hay JWT_SECRET (SQLite là một tệp; đăng nhập dùng token phiên ngẫu nhiên – TD-12), nên không có gì phải xoay vòng (rotate).

## 2. Kiểm dữ liệu vào ở tầng ứng dụng – ĐÃ LÀM

- Validator riêng trong `src/backend/validators/` được gọi ở đầu mỗi service (TD-09), trả `400` kèm `fields` nêu tên trường; ràng buộc `CHECK`/`UNIQUE` của CSDL chỉ là lớp thứ hai. Minh chứng: TC-02 (SĐT sai định dạng), TC-10 (mô tả lỗi rỗng → 400, số phiếu không đổi).
- `express.json({ limit: '100kb' })`: thân request lớn hơn bị từ chối.
- Ba lệnh grep của tài liệu buổi 15 (mục A4):

```powershell
git grep -nE '(SELECT|INSERT|UPDATE|DELETE).*(\+ *[a-zA-Z_]|\$\{)' -- src/
git grep -nE 'innerHTML|dangerouslySetInnerHTML|v-html' -- src/
git grep -nE 'exec\(|execSync|spawn\(|os\.system|shell=True' -- src/
```

| Lệnh | Kết quả | Đánh giá |
|---|---|---|
| 1 – SQL ghép chuỗi | 5 dòng | **An toàn**, đã xem từng dòng: `migrate.js:67` – tên bảng lấy từ mảng hằng trong code; `ticket.repository.js:42` – `${where}` chỉ ghép các chuỗi hằng `'t.status = ?'`, giá trị đi qua tham số `?`; `ticket.repository.js:62` – `${…}` nằm trong **giá trị tham số** (mã phiếu `BH-0001`), không nằm trong câu SQL; `device.repository.js:14, 20` – `${COT}` là hằng danh sách cột. Không có dữ liệu người dùng nào được ghép vào SQL. |
| 2 – chèn HTML thô | rỗng | React tự escape; giao diện không dùng `dangerouslySetInnerHTML`. |
| 3 – gọi lệnh hệ thống | các dòng `db.exec(…)` | **An toàn**: đây là `DatabaseSync.exec` của `node:sqlite` chạy câu SQL hằng (`BEGIN`, `COMMIT`, `PRAGMA`) hoặc tệp migration trong repo – **không phải** `child_process.exec`. Hệ thống không gọi lệnh hệ điều hành nào. |

- Thử tiêm SQL qua đường dẫn: `GET /api/tickets/1%20OR%201=1` → `404 KHONG_TIM_THAY` (id không phải số nguyên dương thì không truy vấn) – test tự động trong `tests/bao-mat.test.js`.

## 3. Kiểm soát truy cập theo chủ sở hữu – ĐÃ LÀM

- Mọi API nghiệp vụ yêu cầu đăng nhập (`/api/customers`, `/api/tickets` gắn middleware `requireAuth`; NFR-06). Gọi không có token → `401 CHUA_DANG_NHAP`.
- Theo **chủ sở hữu** (OWASP A01): `TicketService.#chiNguoiTaoHoacQuanLy()` – chỉ người tạo phiếu (`created_by`) hoặc Quản lý TTBH được sửa / đổi trạng thái / huỷ phiếu; chỉ Quản lý được duyệt / từ chối bảo hành.
- Test: `npm run tc -- "TC-11"` – `nv02` sửa phiếu của `nv01` → `403 KHONG_DU_QUYEN`, nội dung phiếu không đổi. Lần chạy đầu test này FAIL (200) – ghi **BUG-005**, sửa ở commit riêng.
- CORS chỉ mở cho các địa chỉ trong `FRONTEND_ORIGIN` (danh sách, ngăn bằng dấu phẩy); giá trị `*` bị `src/backend/config.js` từ chối ngay khi khởi động.
- Token không bao giờ nằm trên URL: gửi trong header `Authorization: Bearer …`.

## 4. Mật khẩu được băm – ĐÃ LÀM

- `src/backend/security/password.js`: `crypto.scrypt` (hàm dẫn xuất khoá chậm, cùng nhóm với bcrypt/argon2 mà tài liệu buổi 15 nêu, có sẵn trong Node.js – không thêm thư viện), **salt ngẫu nhiên 16 byte cho từng tài khoản**, so sánh bằng `timingSafeEqual`. Lưu dạng `scrypt$<salt>$<hash>`.
- Test: `node --test tests/a04.mat-khau.test.js` – ba tài khoản cùng mật khẩu demo nhưng **ba chuỗi băm khác nhau**, không chuỗi nào chứa `Demo@123`. Lần chạy đầu FAIL (cùng một salt cố định) – ghi **BUG-006**.
- Không áp dụng: mã hoá dữ liệu cá nhân khác (SĐT, tên khách) – thuộc Chuyên đề tốt nghiệp 2.

## 5. Thông báo lỗi không lộ chi tiết bên trong – ĐÃ LÀM

- Bộ xử lý lỗi cuối trong `src/backend/app.js` đổi **mã nghiệp vụ → mã HTTP**; lỗi bất ngờ chỉ trả `500 {"error":"LOI_HE_THONG","message":"Đã xảy ra lỗi, vui lòng thử lại sau"}` – không stack trace, không câu SQL, không tên bảng.
- `app.disable('x-powered-by')`: phản hồi không còn header `X-Powered-By: Express`.
- Test `node --test tests/bao-mat.test.js`:
  - JSON hỏng → `400 DU_LIEU_KHONG_HOP_LE`, thân lỗi không chứa `node_modules`, `.js:<dòng>`, `SQLITE`, `SELECT`, tên bảng;
  - **CSDL ngừng hoạt động** (test đóng kết nối CSDL giữa chừng): `/health` → `503 {"status":"error","db":"down"}`, `POST /api/tickets` → `500` thông báo chung.
- Thay cho bước "tắt CSDL" trong slide (hệ thống không có dịch vụ CSDL riêng để tắt – TD-12): test trên đóng kết nối SQLite trong lúc ứng dụng đang chạy.

## 6. Log an toàn – ĐÃ LÀM

- `src/backend/security/log.js`: lỗi 500 được ghi thành **một dòng JSON** chỉ gồm thời gian, phương thức, đường dẫn (đã bỏ query string), tên và thông điệp lỗi. **Không** ghi `req.body`, `req.headers`, token. Có hàm `che()` thay giá trị các khoá `password`, `matKhau`, `token`, `authorization`, `secret`, `cookie` bằng `***` nếu sau này cần ghi một đối tượng.
- Hệ thống không ghi log truy cập (access log) và không ghi log đăng nhập sai kèm mật khẩu.
- Test `tests/bao-mat.test.js`: gây lỗi 500 với request có token và thân chứa `Demo@123` → log **không** chứa token, chữ `Bearer` hay `Demo@123`.
- Kiểm trên container đang chạy:

```powershell
docker compose logs app | Select-String -Pattern "Demo@123|Bearer|password"
```
→ in ra rỗng.

## 7. Thư viện ngoài khoá phiên bản và kiểm lỗ hổng – ĐÃ LÀM (còn 1 rủi ro chấp nhận)

- `package-lock.json` (backend) và `src/frontend/package-lock.json` đã commit; Docker build dùng `npm ci` (cài **đúng** phiên bản trong lock). `express` ghi phiên bản chính xác `5.3.0` trong `package.json`; giao diện ghi chính xác `react 18.3.1`, `vite 5.4.21`…
- `npm audit` backend: lần đầu báo **1 high** – `body-parser 2.3.0` (GHSA-27r3-jxmh-p828, từ chối dịch vụ với body nén). Đã chạy `npm audit fix` → `body-parser 2.4.0`, `npm audit` → `found 0 vulnerabilities`, `npm test` vẫn pass.
- `npm audit` giao diện (`src/frontend`): báo lỗ hổng ở `esbuild ≤ 0.24.2` / `vite ≤ 6.4.3` (GHSA-67mh-4wv8-2f99) – **chỉ ảnh hưởng máy chủ phát triển `npm run dev`**. Image `web` chỉ chứa tệp tĩnh đã build, phục vụ bằng nginx: `npm audit --omit=dev` → `found 0 vulnerabilities`. Bản sửa cần nâng Vite lên 7/8 (thay đổi lớn) – **rủi ro chấp nhận** ở mức prototype, ghi lại để xử lý ở Chuyên đề tốt nghiệp 2.

---

## Mục tự kiểm A6 (track SE) – đối chiếu

| Mục | Kết quả |
|---|---|
| Đã chạy ba lệnh grep và ghi kết quả | ĐÃ LÀM – mục 2 |
| JWT_SECRET từ biến môi trường, ≥ 32 ký tự, thiếu thì dừng | KHÔNG ÁP DỤNG – không dùng JWT (token phiên ngẫu nhiên lưu phía máy chủ, TD-12). Cấu hình sai khác vẫn làm hệ thống dừng (`config.js`) |
| Hàm kiểm token chỉ định thuật toán, không dùng decode | KHÔNG ÁP DỤNG – token là chuỗi ngẫu nhiên, kiểm bằng tra bảng phiên |
| Payload token chỉ có id, role, hạn | KHÔNG ÁP DỤNG – token không mang dữ liệu |
| Kiểm soát theo chủ sở hữu, có test A01 | ĐÃ LÀM – mục 3, TC-11 |
| CORS chỉ mở cho địa chỉ trong biến môi trường, không `*` | ĐÃ LÀM – mục 3 |
| Cookie có HttpOnly, SameSite, Secure | KHÔNG ÁP DỤNG – không dùng cookie |
| Không có bí mật / token / mật khẩu trên URL | ĐÃ LÀM – token trong header; log bỏ query string |
| HTTPS | Ghi cách làm trong `docs/deployment-guide.md` mục 7 |
