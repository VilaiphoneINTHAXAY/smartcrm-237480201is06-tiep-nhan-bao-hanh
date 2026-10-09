# Smart CRM – Mekong Mobile · L2: Tiếp nhận và phân loại yêu cầu bảo hành

**Sinh viên:** INTHAXAY Vilaiphone – 237480201IS06 · **Track:** SE · **Học phần:** Chuyên đề tốt nghiệp 1 (HK1 2026–2027)

## 1. Đề tài và phạm vi
Luồng **L2**: tra cứu khách theo SĐT → tạo phiếu bảo hành (IMEI/Serial, ngày mua, mô tả lỗi) → kiểm tra tình trạng bảo hành → phân loại nhóm sự cố và mức ưu tiên → sinh hạn SLA → phiếu trạng thái MỚI. Quản lý TTBH duyệt phiếu chưa xác minh bảo hành, xem phiếu sắp/quá hạn, xem lịch sử trạng thái.

**Ngoài phạm vi (WON'T):** phân công kỹ thuật viên (L4), tồn kho linh kiện (L5), khảo sát hài lòng (L8), gửi SMS/Zalo, ngày lễ trong SLA, triển khai/hạ tầng.

## 2. Cấu trúc repo và cách mở file thiết kế
| Đường dẫn | Nội dung |
|---|---|
| `docs/srs.md` | SRS rút gọn (Mục 1 của bài nộp) |
| `docs/usecase.drawio` | Use Case Diagram – mở bằng https://app.diagrams.net (File → Open) |
| `docs/architecture.drawio` | Sơ đồ kiến trúc 4 lớp |
| `docs/erd.drawio` | ERD 6 bảng |
| `docs/wireframe.drawio` | Wireframe M1, M2, M3 (3 trang) · ảnh: `docs/wireframe.png` |
| `docs/export/*.png` | Ảnh xuất từ các file .drawio, chèn trong PDF |
| `docs/api-contract.md` | API contract (track SE) |
| `docs/ai-disclosure.md` | Bảng khai báo sử dụng công cụ AI |
| `db/schema.sql` | SQL DDL skeleton (PostgreSQL 16) |
| `BT1_237480201IS06_INTHAXAY_Vilaiphone.pdf` | Bản đã nộp trên E-learning |

Chạy thử DDL: `createdb smartcrm && psql -d smartcrm -f db/schema.sql`

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

## 6. Stack dự kiến
Node.js + Express (API) · PostgreSQL 16 · React (giao diện). Mã nguồn bắt đầu từ Bài tập 2 (`src/`, `tests/` hiện còn rỗng).
