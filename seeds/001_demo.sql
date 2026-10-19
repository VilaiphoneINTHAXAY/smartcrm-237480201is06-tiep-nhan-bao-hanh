-- 001_demo.sql – Dữ liệu mẫu. INSERT OR IGNORE: chạy lại không nhân đôi dữ liệu (C5).

-- Bảng phân loại nhóm sự cố (SRS mục 1.3.2)
INSERT OR IGNORE INTO issue_category (name, keywords, default_priority, match_order) VALUES
 ('Phần cứng',           'màn hình,vỡ,không lên nguồn,pin,sạc,camera,loa', 'CAO',        1),
 ('Phần mềm',            'treo,đơ,lag,bootloop,lỗi ứng dụng,cập nhật',     'TRUNG_BINH', 2),
 ('Kết nối',             'wifi,sóng,bluetooth,sim',                        'TRUNG_BINH', 3),
 ('Phụ kiện/Ngoại hình', 'ốp,trầy xước,nút bấm',                           'THAP',       4),
 ('Khác',                '',                                               'TRUNG_BINH', 99);

-- Người dùng mẫu (mật khẩu demo sẽ được đặt ở buổi sau khi làm đăng nhập)
INSERT OR IGNORE INTO app_user (username, full_name, role, password_hash) VALUES
 ('nv01', 'Nguyễn An',  'TIEP_NHAN', 'chua-dat'),
 ('ql01', 'Trần Bình',  'QUAN_LY',   'chua-dat');

-- Khách hàng mẫu
INSERT OR IGNORE INTO customer (full_name, phone) VALUES
 ('Lê Cường',  '0901234567'),
 ('Phạm Dung', '0912345678'),
 ('Võ Em',     '0987654321');
