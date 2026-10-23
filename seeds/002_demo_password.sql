-- 002_demo_password.sql – Đặt mật khẩu DEMO cho hai người dùng mẫu (chỉ dùng để chạy thử cục bộ).
-- Mật khẩu demo: Demo@123 (ghi trong README). Đây KHÔNG phải secret thật: chỉ có ở dữ liệu mẫu.
-- Chỉ cập nhật dòng còn mật khẩu tạm 'chua-dat' -> chạy lại lần hai không đổi gì.
UPDATE app_user SET password_hash = 'scrypt$mekong-demo-salt$e2bec9f2ceef98bf23976140abfe254328ecfbafd1b0981c6a27ae5bc8fed869'
WHERE password_hash = 'chua-dat';
