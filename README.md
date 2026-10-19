# Smart CRM – Mekong Mobile · L2: Tiếp nhận và phân loại yêu cầu bảo hành

**Sinh viên:** INTHAXAY Vilaiphone – 237480201IS06 · **Track:** SE · **Học phần:** Chuyên đề tốt nghiệp 1 (HK1 2026–2027)

## 1. Đề tài và phạm vi
Luồng **L2**: tra cứu khách theo SĐT → tạo phiếu bảo hành (IMEI/Serial, ngày mua, mô tả lỗi) → kiểm tra tình trạng bảo hành → phân loại nhóm sự cố và mức ưu tiên → sinh hạn SLA → phiếu trạng thái MỚI. Quản lý TTBH duyệt phiếu chưa xác minh bảo hành, xem phiếu sắp/quá hạn, xem lịch sử trạng thái.

**Ngoài phạm vi (WON'T):** phân công kỹ thuật viên (L4), tồn kho linh kiện (L5), khảo sát hài lòng (L8), gửi SMS/Zalo, ngày lễ trong SLA, triển khai/hạ tầng.

## 2. Yêu cầu môi trường và cách chạy
- **Node.js ≥ 22.13** (đã thử với Node.js 24 LTS) và npm đi kèm. Kiểm tra: `node -v`
- **CSDL:** SQLite qua module có sẵn `node:sqlite` – **không cần cài máy chủ CSDL** (xem TD-04 trong `docs/thay-doi-thiet-ke.md`)
- **Biến môi trường:** xem `.env.example` (`PORT`, `DB_PATH`, `SESSION_TIMEOUT_MINUTES`)

Các bước, mỗi bước một lệnh (chạy ở thư mục gốc của repo):

```bash
npm install                 # 1. cài thư viện theo package-lock.json
cp .env.example .env        # 2. tạo tệp cấu hình (Windows PowerShell: Copy-Item .env.example .env)
npm run migrate             # 3. dựng CSDL từ trạng thái trống + nạp dữ liệu mẫu (chạy lại không nhân đôi)
npm test                    # 4. chạy bộ kiểm thử (không cần CSDL thật, tự dựng CSDL trong bộ nhớ)
npm start                   # 5. chạy API tại http://localhost:3000
```

Kiểm tra hệ thống đã chạy đúng (mở terminal thứ hai):

```bash
curl -s http://localhost:3000/health                              # {"status":"ok"}
curl -s "http://localhost:3000/api/customers?phone=0901234567"    # khách Lê Cường từ dữ liệu mẫu
```

## 3. Cấu trúc repo
| Đường dẫn | Nội dung |
|---|---|
| `src/backend/routes/` | Lớp API – nhận HTTP, đổi mã nghiệp vụ sang mã HTTP |
| `src/backend/validators/` | Kiểm tra định dạng dữ liệu vào |
| `src/backend/services/` | Lớp nghiệp vụ – không chứa dấu vết HTTP |
| `src/backend/rules/` | WarrantyRule, ClassificationRule, SlaCalculator (hàm thuần) |
| `src/backend/repositories/` | Lớp truy cập dữ liệu – nơi duy nhất viết SQL |
| `src/backend/middleware/` | Xác thực phiên, phân quyền (NFR-06) |
| `src/frontend/` | Giao diện M1–M3 (buổi 10) |
| `migrations/`, `seeds/` | Tạo bảng và dữ liệu mẫu cho SQLite |
| `tests/` | Bộ kiểm thử (`node --test`) |
| `docs/` | SRS, sơ đồ .drawio, nhật ký thay đổi thiết kế, khai báo AI |
| `db/schema.sql` | DDL PostgreSQL gốc của BT1 (giữ để đối chiếu) |
| `BT1_237480201IS06_INTHAXAY_Vilaiphone.pdf` | Bài tập 1 đã nộp |

## Liên kết xem / sửa từng thành phần

| Thành phần | Xem trên GitHub | Mở trong draw.io (ai cũng mở được) | Sửa và lưu về GitHub (chủ repo) |
|---|---|---|---|
| Mục 1 – SRS | [Xem](https://github.com/VilaiphoneINTHAXAY/smartcrm-237480201is06-tiep-nhan-bao-hanh/blob/main/docs/srs.md) | — | [Sửa](https://github.com/VilaiphoneINTHAXAY/smartcrm-237480201is06-tiep-nhan-bao-hanh/edit/main/docs/srs.md) |
| Mục 2 – Use Case Diagram | [Xem](https://github.com/VilaiphoneINTHAXAY/smartcrm-237480201is06-tiep-nhan-bao-hanh/blob/main/docs/usecase.drawio) | [Mở](https://app.diagrams.net/#Uhttps%3A%2F%2Fraw.githubusercontent.com%2FVilaiphoneINTHAXAY%2Fsmartcrm-237480201is06-tiep-nhan-bao-hanh%2Fmain%2Fdocs%2Fusecase.drawio) | [Sửa](https://app.diagrams.net/#HVilaiphoneINTHAXAY%2Fsmartcrm-237480201is06-tiep-nhan-bao-hanh%2Fmain%2Fdocs%2Fusecase.drawio) |
| Mục 3 – Sơ đồ kiến trúc | [Xem](https://github.com/VilaiphoneINTHAXAY/smartcrm-237480201is06-tiep-nhan-bao-hanh/blob/main/docs/architecture.drawio) | [Mở](https://app.diagrams.net/#Uhttps%3A%2F%2Fraw.githubusercontent.com%2FVilaiphoneINTHAXAY%2Fsmartcrm-237480201is06-tiep-nhan-bao-hanh%2Fmain%2Fdocs%2Farchitecture.drawio) | [Sửa](https://app.diagrams.net/#HVilaiphoneINTHAXAY%2Fsmartcrm-237480201is06-tiep-nhan-bao-hanh%2Fmain%2Fdocs%2Farchitecture.drawio) |
| Mục 4 – ERD | [Xem](https://github.com/VilaiphoneINTHAXAY/smartcrm-237480201is06-tiep-nhan-bao-hanh/blob/main/docs/erd.drawio) | [Mở](https://app.diagrams.net/#Uhttps%3A%2F%2Fraw.githubusercontent.com%2FVilaiphoneINTHAXAY%2Fsmartcrm-237480201is06-tiep-nhan-bao-hanh%2Fmain%2Fdocs%2Ferd.drawio) | [Sửa](https://app.diagrams.net/#HVilaiphoneINTHAXAY%2Fsmartcrm-237480201is06-tiep-nhan-bao-hanh%2Fmain%2Fdocs%2Ferd.drawio) |
| Mục 4 – SQL DDL | [Xem](https://github.com/VilaiphoneINTHAXAY/smartcrm-237480201is06-tiep-nhan-bao-hanh/blob/main/db/schema.sql) | — | [Sửa](https://github.com/VilaiphoneINTHAXAY/smartcrm-237480201is06-tiep-nhan-bao-hanh/edit/main/db/schema.sql) |
| Mục 5 – Wireframe (3 trang) | [Xem](https://github.com/VilaiphoneINTHAXAY/smartcrm-237480201is06-tiep-nhan-bao-hanh/blob/main/docs/wireframe.drawio) | [Mở](https://app.diagrams.net/#Uhttps%3A%2F%2Fraw.githubusercontent.com%2FVilaiphoneINTHAXAY%2Fsmartcrm-237480201is06-tiep-nhan-bao-hanh%2Fmain%2Fdocs%2Fwireframe.drawio) | [Sửa](https://app.diagrams.net/#HVilaiphoneINTHAXAY%2Fsmartcrm-237480201is06-tiep-nhan-bao-hanh%2Fmain%2Fdocs%2Fwireframe.drawio) |
| API contract | [Xem](https://github.com/VilaiphoneINTHAXAY/smartcrm-237480201is06-tiep-nhan-bao-hanh/blob/main/docs/api-contract.md) | — | [Sửa](https://github.com/VilaiphoneINTHAXAY/smartcrm-237480201is06-tiep-nhan-bao-hanh/edit/main/docs/api-contract.md) |
| Khai báo AI | [Xem](https://github.com/VilaiphoneINTHAXAY/smartcrm-237480201is06-tiep-nhan-bao-hanh/blob/main/docs/ai-disclosure.md) | — | [Sửa](https://github.com/VilaiphoneINTHAXAY/smartcrm-237480201is06-tiep-nhan-bao-hanh/edit/main/docs/ai-disclosure.md) |

> "Mở" không cần đăng nhập: ai cũng xem và chỉnh được bản sao trong draw.io. "Sửa" cần đăng nhập GitHub có quyền ghi vào repo; bấm Ủy quyền → Authorize, sửa xong File → Save để lưu thẳng về repo.

## 6. Trạng thái hiện tại (buổi 8 – 19/10/2026)
- [x] Ghi quyết định điều chỉnh thiết kế theo phản hồi BT1 (`docs/thay-doi-thiet-ke.md`, TD-01 → TD-04)
- [x] Khung `src/` theo sơ đồ kiến trúc 4 lớp
- [x] Migration tạo 6 bảng theo ERD BT1 + dữ liệu mẫu; chạy lại lần hai không lỗi, không nhân đôi
- [x] CRUD **khách hàng** qua 3 lớp routes → services → repositories (`/api/customers`)
- [x] 3 kiểm thử PASS: luồng đúng · dữ liệu sai · quy tắc BR-07
- [ ] CRUD **phiếu bảo hành** + quy tắc WarrantyRule, ClassificationRule, SlaCalculator (trước buổi 10)
- [ ] Kiểm thử giá trị biên cho SLA và bảo hành (GWT-06, GWT-13 → GWT-15)
- [ ] Xác thực phiên 30 phút, phân quyền A1/A2 (NFR-06)
- [ ] Ba màn hình M1–M3 có ba trạng thái đang tải · rỗng · lỗi (buổi 10)
- Ghi chú: dùng SQLite thay PostgreSQL vì máy chưa cài PostgreSQL (TD-04)

Quy ước commit: Conventional Commits – `feat`, `fix`, `docs`, `chore`, `refactor`, `test` (TD-03).
