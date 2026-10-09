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

| Thành phần | Xem | Sửa trực tiếp |
|---|---|---|
| Mục 1 – SRS (docs/srs.md) | [Xem](https://github.com/VilaiphoneINTHAXAY/smartcrm-237480201is06-tiep-nhan-bao-hanh/blob/main/docs/srs.md) | [Sửa trên GitHub](https://github.com/VilaiphoneINTHAXAY/smartcrm-237480201is06-tiep-nhan-bao-hanh/edit/main/docs/srs.md) |
| Mục 2 – Use Case Diagram | [Xem](https://github.com/VilaiphoneINTHAXAY/smartcrm-237480201is06-tiep-nhan-bao-hanh/blob/main/docs/usecase.drawio) | [Sửa trong draw.io](https://app.diagrams.net/#HVilaiphoneINTHAXAY%2Fsmartcrm-237480201is06-tiep-nhan-bao-hanh%2Fmain%2Fdocs%2Fusecase.drawio) |
| Mục 3 – Sơ đồ kiến trúc | [Xem](https://github.com/VilaiphoneINTHAXAY/smartcrm-237480201is06-tiep-nhan-bao-hanh/blob/main/docs/architecture.drawio) | [Sửa trong draw.io](https://app.diagrams.net/#HVilaiphoneINTHAXAY%2Fsmartcrm-237480201is06-tiep-nhan-bao-hanh%2Fmain%2Fdocs%2Farchitecture.drawio) |
| Mục 4 – ERD | [Xem](https://github.com/VilaiphoneINTHAXAY/smartcrm-237480201is06-tiep-nhan-bao-hanh/blob/main/docs/erd.drawio) | [Sửa trong draw.io](https://app.diagrams.net/#HVilaiphoneINTHAXAY%2Fsmartcrm-237480201is06-tiep-nhan-bao-hanh%2Fmain%2Fdocs%2Ferd.drawio) |
| Mục 4 – SQL DDL (db/schema.sql) | [Xem](https://github.com/VilaiphoneINTHAXAY/smartcrm-237480201is06-tiep-nhan-bao-hanh/blob/main/db/schema.sql) | [Sửa trên GitHub](https://github.com/VilaiphoneINTHAXAY/smartcrm-237480201is06-tiep-nhan-bao-hanh/edit/main/db/schema.sql) |
| Mục 5 – Wireframe (3 trang) | [Xem](https://github.com/VilaiphoneINTHAXAY/smartcrm-237480201is06-tiep-nhan-bao-hanh/blob/main/docs/wireframe.drawio) | [Sửa trong draw.io](https://app.diagrams.net/#HVilaiphoneINTHAXAY%2Fsmartcrm-237480201is06-tiep-nhan-bao-hanh%2Fmain%2Fdocs%2Fwireframe.drawio) |
| API contract (docs/api-contract.md) | [Xem](https://github.com/VilaiphoneINTHAXAY/smartcrm-237480201is06-tiep-nhan-bao-hanh/blob/main/docs/api-contract.md) | [Sửa trên GitHub](https://github.com/VilaiphoneINTHAXAY/smartcrm-237480201is06-tiep-nhan-bao-hanh/edit/main/docs/api-contract.md) |
| Phụ lục – Khai báo AI | [Xem](https://github.com/VilaiphoneINTHAXAY/smartcrm-237480201is06-tiep-nhan-bao-hanh/blob/main/docs/ai-disclosure.md) | [Sửa trên GitHub](https://github.com/VilaiphoneINTHAXAY/smartcrm-237480201is06-tiep-nhan-bao-hanh/edit/main/docs/ai-disclosure.md) |

> File .drawio: bấm "Sửa trong draw.io" → đăng nhập GitHub khi được hỏi → sửa → File → Save (lưu thẳng về repo). Sau đó xuất lại ảnh PNG vào docs/export/.

## 6. Stack dự kiến
Node.js + Express (API) · PostgreSQL 16 · React (giao diện). Mã nguồn bắt đầu từ Bài tập 2 (`src/`, `tests/` hiện còn rỗng).
