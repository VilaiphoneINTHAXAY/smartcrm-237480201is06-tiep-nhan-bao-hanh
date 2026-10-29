-- 002_vong_doi_va_xoa_mem.sql – Bổ sung theo case study (TD-07). Chạy MỘT lần cho mỗi CSDL
-- (migrate.js ghi tên tệp đã chạy vào bảng schema_migration).
--   QT-06: vòng đời phiếu ở Hình 6.2 có thêm CHO_LINH_KIEN và DA_HUY (khách huỷ).
--   QT-13: không xoá vật lý khách hàng -> thêm cờ is_active (xoá mềm).
-- SQLite không sửa được CHECK của bảng đã có, nên dựng lại bảng ticket theo quy trình chuẩn
-- của SQLite: tắt khoá ngoại -> tạo bảng mới -> chép dữ liệu -> đổi tên -> tạo lại chỉ mục.

PRAGMA foreign_keys = OFF;
BEGIN;

ALTER TABLE customer ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1;   -- QT-13

CREATE TABLE ticket_moi (
    id                 INTEGER PRIMARY KEY AUTOINCREMENT,
    code               TEXT    NOT NULL UNIQUE,
    device_id          INTEGER NOT NULL REFERENCES device(id),
    category_id        INTEGER NOT NULL REFERENCES issue_category(id),
    created_by         INTEGER NOT NULL REFERENCES app_user(id),
    issue_description  TEXT    NOT NULL CHECK (length(trim(issue_description)) > 0),
    priority           TEXT    NOT NULL CHECK (priority IN ('CAO', 'TRUNG_BINH', 'THAP')),
    status             TEXT    NOT NULL DEFAULT 'MOI'
                       CHECK (status IN ('MOI', 'DA_PHAN_CONG', 'DANG_XU_LY', 'CHO_LINH_KIEN',
                                         'HOAN_TAT', 'DA_DONG', 'DA_HUY')),          -- QT-06, Hình 6.2
    warranty_status    TEXT    NOT NULL CHECK (warranty_status IN ('CON_BAO_HANH', 'HET_BAO_HANH', 'CHUA_XAC_MINH')),
    is_unverified      INTEGER NOT NULL DEFAULT 0,
    received_at        TEXT    NOT NULL,
    sla_due_at         TEXT    NOT NULL,
    CHECK (sla_due_at > received_at),
    CHECK (is_unverified = 0 OR warranty_status = 'CHUA_XAC_MINH')
);

INSERT INTO ticket_moi (id, code, device_id, category_id, created_by, issue_description, priority, status,
                        warranty_status, is_unverified, received_at, sla_due_at)
SELECT id, code, device_id, category_id, created_by, issue_description, priority, status,
       warranty_status, is_unverified, received_at, sla_due_at
FROM ticket;

DROP TABLE ticket;
ALTER TABLE ticket_moi RENAME TO ticket;

CREATE INDEX idx_ticket_open_sla   ON ticket(sla_due_at) WHERE status NOT IN ('HOAN_TAT', 'DA_DONG', 'DA_HUY');   -- NFR-07
CREATE INDEX idx_ticket_unverified ON ticket(received_at) WHERE is_unverified = 1;                                -- FR-05
CREATE INDEX idx_ticket_device     ON ticket(device_id);

COMMIT;
PRAGMA foreign_keys = ON;
