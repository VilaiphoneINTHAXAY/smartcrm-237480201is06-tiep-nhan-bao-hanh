-- 003_demo_devices.sql – Thiết bị mẫu cho ba khách mẫu để màn hình tiếp nhận có dữ liệu thử.
-- INSERT OR IGNORE + IMEI/Serial UNIQUE -> chạy lại lần hai không nhân đôi.
INSERT OR IGNORE INTO device (customer_id, model_name, imei, serial_no, purchase_date, warranty_months)
SELECT id, 'Samsung Galaxy A55', '356789012345671', NULL, '2026-03-10', 12 FROM customer WHERE phone = '0901234567';
INSERT OR IGNORE INTO device (customer_id, model_name, imei, serial_no, purchase_date, warranty_months)
SELECT id, 'iPhone 13', NULL, 'F2LXK9ABCD', '2024-05-20', 12 FROM customer WHERE phone = '0912345678';
INSERT OR IGNORE INTO device (customer_id, model_name, imei, serial_no, purchase_date, warranty_months)
SELECT id, 'Xiaomi Redmi Note 13', '867530912345678', NULL, NULL, 18 FROM customer WHERE phone = '0987654321';
