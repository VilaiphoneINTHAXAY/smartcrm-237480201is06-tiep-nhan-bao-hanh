-- 001_init.sql – Tạo 6 bảng theo ERD Bài tập 1 (bản SQLite, xem TD-04)
-- Chạy lại nhiều lần không lỗi: mọi lệnh đều có IF NOT EXISTS.

CREATE TABLE IF NOT EXISTS app_user (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    username      TEXT    NOT NULL UNIQUE,
    full_name     TEXT    NOT NULL,
    role          TEXT    NOT NULL CHECK (role IN ('TIEP_NHAN', 'QUAN_LY')),
    password_hash TEXT    NOT NULL,
    is_active     INTEGER NOT NULL DEFAULT 1,
    created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS customer (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name   TEXT    NOT NULL,
    phone       TEXT    NOT NULL UNIQUE,                       -- BR-07
    created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS device (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id      INTEGER NOT NULL REFERENCES customer(id),
    model_name       TEXT    NOT NULL,
    imei             TEXT    UNIQUE,                            -- BR-01
    serial_no        TEXT    UNIQUE,                            -- BR-01
    purchase_date    TEXT,                                      -- NULL => CHƯA XÁC MINH
    warranty_months  INTEGER NOT NULL DEFAULT 12 CHECK (warranty_months BETWEEN 0 AND 60),
    created_at       TEXT    NOT NULL DEFAULT (datetime('now')),
    CHECK (imei IS NOT NULL OR serial_no IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS idx_device_customer ON device(customer_id);

CREATE TABLE IF NOT EXISTS issue_category (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    name              TEXT    NOT NULL UNIQUE,
    keywords          TEXT    NOT NULL DEFAULT '',
    default_priority  TEXT    NOT NULL CHECK (default_priority IN ('CAO', 'TRUNG_BINH', 'THAP')),
    match_order       INTEGER NOT NULL UNIQUE                  -- BR-04
);

CREATE TABLE IF NOT EXISTS ticket (
    id                 INTEGER PRIMARY KEY AUTOINCREMENT,
    code               TEXT    NOT NULL UNIQUE,
    device_id          INTEGER NOT NULL REFERENCES device(id),
    category_id        INTEGER NOT NULL REFERENCES issue_category(id),
    created_by         INTEGER NOT NULL REFERENCES app_user(id),
    issue_description  TEXT    NOT NULL CHECK (length(trim(issue_description)) > 0),
    priority           TEXT    NOT NULL CHECK (priority IN ('CAO', 'TRUNG_BINH', 'THAP')),
    status             TEXT    NOT NULL DEFAULT 'MOI'
                       CHECK (status IN ('MOI', 'DA_PHAN_CONG', 'DANG_XU_LY', 'HOAN_TAT', 'DA_DONG')),
    warranty_status    TEXT    NOT NULL CHECK (warranty_status IN ('CON_BAO_HANH', 'HET_BAO_HANH', 'CHUA_XAC_MINH')),
    is_unverified      INTEGER NOT NULL DEFAULT 0,
    received_at        TEXT    NOT NULL,
    sla_due_at         TEXT    NOT NULL,
    CHECK (sla_due_at > received_at),
    CHECK (is_unverified = 0 OR warranty_status = 'CHUA_XAC_MINH')
);
CREATE INDEX IF NOT EXISTS idx_ticket_open_sla   ON ticket(sla_due_at) WHERE status NOT IN ('HOAN_TAT', 'DA_DONG');   -- NFR-07
CREATE INDEX IF NOT EXISTS idx_ticket_unverified ON ticket(received_at) WHERE is_unverified = 1;                     -- FR-05
CREATE INDEX IF NOT EXISTS idx_ticket_device     ON ticket(device_id);

CREATE TABLE IF NOT EXISTS ticket_status_log (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_id    INTEGER NOT NULL REFERENCES ticket(id) ON DELETE CASCADE,
    action       TEXT    NOT NULL CHECK (action IN ('TAO_PHIEU', 'DOI_TRANG_THAI', 'DUYET_BAO_HANH', 'TU_CHOI_BAO_HANH')),
    from_status  TEXT,
    to_status    TEXT    NOT NULL,
    note         TEXT,
    changed_by   INTEGER NOT NULL REFERENCES app_user(id),
    changed_at   TEXT    NOT NULL DEFAULT (datetime('now')),
    CHECK (action <> 'TU_CHOI_BAO_HANH' OR length(trim(coalesce(note, ''))) > 0)   -- BR-06
);
CREATE INDEX IF NOT EXISTS idx_log_ticket_time ON ticket_status_log(ticket_id, changed_at);   -- FR-10
