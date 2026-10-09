-- =====================================================================
-- Smart CRM – Mekong Mobile · Luồng L2: Tiếp nhận và phân loại yêu cầu bảo hành
-- SQL DDL skeleton (PostgreSQL 16) – Bài tập 1, track SE
-- SV: INTHAXAY Vilaiphone – 237480201IS06
-- 6 bảng: app_user, customer, device, issue_category, ticket, ticket_status_log
-- =====================================================================

-- 1. Người dùng hệ thống (A1 = TIEP_NHAN, A2 = QUAN_LY) – NFR-06
CREATE TABLE app_user (
    id             BIGSERIAL     PRIMARY KEY,
    username       VARCHAR(50)   NOT NULL UNIQUE,
    full_name      VARCHAR(100)  NOT NULL,
    role           VARCHAR(20)   NOT NULL CHECK (role IN ('TIEP_NHAN', 'QUAN_LY')),
    password_hash  VARCHAR(255)  NOT NULL,
    is_active      BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at     TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- 2. Khách hàng – FR-01, FR-02
CREATE TABLE customer (
    id          BIGSERIAL     PRIMARY KEY,
    full_name   VARCHAR(100)  NOT NULL,
    phone       VARCHAR(15)   NOT NULL UNIQUE           -- BR-07: 1 SĐT = 1 khách; UNIQUE tạo sẵn index cho NFR-01
                CHECK (phone ~ '^0[0-9]{9,10}$'),
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- 3. Thiết bị của khách – FR-03, FR-04
CREATE TABLE device (
    id               BIGSERIAL     PRIMARY KEY,
    customer_id      BIGINT        NOT NULL REFERENCES customer(id),
    model_name       VARCHAR(100)  NOT NULL,
    imei             VARCHAR(15)   UNIQUE CHECK (imei ~ '^[0-9]{15}$'),                 -- BR-01
    serial_no        VARCHAR(30)   UNIQUE CHECK (serial_no ~ '^[A-Za-z0-9]{5,30}$'),    -- BR-01
    purchase_date    DATE,                                                             -- NULL => CHƯA XÁC MINH (BR-03)
    warranty_months  SMALLINT      NOT NULL DEFAULT 12 CHECK (warranty_months BETWEEN 0 AND 60),
    created_at       TIMESTAMPTZ   NOT NULL DEFAULT now(),
    CONSTRAINT chk_device_identifier CHECK (imei IS NOT NULL OR serial_no IS NOT NULL)
);
CREATE INDEX idx_device_customer ON device(customer_id);   -- hiển thị thiết bị của khách sau khi tra SĐT (FR-01)

-- 4. Nhóm sự cố (bảng phân loại 1.3.2) – FR-07
CREATE TABLE issue_category (
    id                BIGSERIAL     PRIMARY KEY,
    name              VARCHAR(50)   NOT NULL UNIQUE,
    keywords          TEXT          NOT NULL DEFAULT '',   -- danh sách từ khóa, phân cách bằng dấu phẩy
    default_priority  VARCHAR(10)   NOT NULL CHECK (default_priority IN ('CAO', 'TRUNG_BINH', 'THAP')),
    match_order       SMALLINT      NOT NULL UNIQUE        -- BR-04: xét từ nhỏ đến lớn, khớp đầu tiên thì dừng
);

-- 5. Phiếu bảo hành – FR-03 … FR-09
CREATE TABLE ticket (
    id                 BIGSERIAL     PRIMARY KEY,
    code               VARCHAR(12)   NOT NULL UNIQUE,                 -- mã hiển thị, ví dụ BH-0001 (không dùng làm khóa chính)
    device_id          BIGINT        NOT NULL REFERENCES device(id),
    category_id        BIGINT        NOT NULL REFERENCES issue_category(id),
    created_by         BIGINT        NOT NULL REFERENCES app_user(id),
    issue_description  TEXT          NOT NULL CHECK (length(trim(issue_description)) > 0),   -- GWT-05
    priority           VARCHAR(10)   NOT NULL CHECK (priority IN ('CAO', 'TRUNG_BINH', 'THAP')),
    status             VARCHAR(20)   NOT NULL DEFAULT 'MOI'
                       CHECK (status IN ('MOI', 'DA_PHAN_CONG', 'DANG_XU_LY', 'HOAN_TAT', 'DA_DONG')),
    warranty_status    VARCHAR(15)   NOT NULL
                       CHECK (warranty_status IN ('CON_BAO_HANH', 'HET_BAO_HANH', 'CHUA_XAC_MINH')),
    is_unverified      BOOLEAN       NOT NULL DEFAULT FALSE,          -- cờ "chưa xác minh bảo hành" (FR-05)
    received_at        TIMESTAMPTZ   NOT NULL DEFAULT now(),          -- thời điểm tiếp nhận
    sla_due_at         TIMESTAMPTZ   NOT NULL,                        -- hạn SLA chốt lúc tạo phiếu (FR-08)
    CONSTRAINT chk_sla_after_received CHECK (sla_due_at > received_at),
    CONSTRAINT chk_flag_consistent   CHECK (NOT is_unverified OR warranty_status = 'CHUA_XAC_MINH')
);
-- NFR-07: danh sách phiếu sắp/quá hạn – chỉ quét phiếu chưa xong, sắp theo hạn SLA
CREATE INDEX idx_ticket_open_sla   ON ticket(sla_due_at) WHERE status NOT IN ('HOAN_TAT', 'DA_DONG');
-- FR-05: danh sách phiếu chờ quản lý duyệt bảo hành
CREATE INDEX idx_ticket_unverified ON ticket(received_at) WHERE is_unverified;
CREATE INDEX idx_ticket_device     ON ticket(device_id);

-- 6. Lịch sử trạng thái phiếu – FR-06, FR-10, NFR-05
CREATE TABLE ticket_status_log (
    id           BIGSERIAL     PRIMARY KEY,
    ticket_id    BIGINT        NOT NULL REFERENCES ticket(id) ON DELETE CASCADE,
    action       VARCHAR(20)   NOT NULL
                 CHECK (action IN ('TAO_PHIEU', 'DOI_TRANG_THAI', 'DUYET_BAO_HANH', 'TU_CHOI_BAO_HANH')),
    from_status  VARCHAR(20),                                         -- NULL ở dòng TAO_PHIEU
    to_status    VARCHAR(20)   NOT NULL,
    note         TEXT,                                                -- lý do từ chối (bắt buộc với TU_CHOI_BAO_HANH)
    changed_by   BIGINT        NOT NULL REFERENCES app_user(id),
    changed_at   TIMESTAMPTZ   NOT NULL DEFAULT now(),
    CONSTRAINT chk_reject_has_reason CHECK (action <> 'TU_CHOI_BAO_HANH' OR length(trim(coalesce(note, ''))) > 0)  -- BR-06
);
CREATE INDEX idx_log_ticket_time ON ticket_status_log(ticket_id, changed_at);   -- FR-10: xem lịch sử theo thời gian

-- Dữ liệu danh mục ban đầu (bảng phân loại 1.3.2)
INSERT INTO issue_category (name, keywords, default_priority, match_order) VALUES
 ('Phần cứng',           'màn hình,vỡ,không lên nguồn,pin,sạc,camera,loa', 'CAO',        1),
 ('Phần mềm',            'treo,đơ,lag,bootloop,lỗi ứng dụng,cập nhật',     'TRUNG_BINH', 2),
 ('Kết nối',             'wifi,sóng,bluetooth,sim',                        'TRUNG_BINH', 3),
 ('Phụ kiện/Ngoại hình', 'ốp,trầy xước,nút bấm',                           'THAP',       4),
 ('Khác',                '',                                               'TRUNG_BINH', 99);
