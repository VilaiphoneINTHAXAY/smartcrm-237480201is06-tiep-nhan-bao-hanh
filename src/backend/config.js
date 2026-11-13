// config.js – Đọc và KIỂM biến môi trường khi khởi động. Sai cấu hình thì dừng ngay với thông báo rõ,
// thay vì chạy với giá trị nguy hiểm (ví dụ CORS '*'). Không in giá trị bí mật ra màn hình.
function docCauHinh(env = process.env) {
  const loi = [];
  const port = Number(env.PORT || 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) loi.push('PORT phải là số nguyên 1–65535');

  const timeout = Number(env.SESSION_TIMEOUT_MINUTES || 30);
  if (!Number.isInteger(timeout) || timeout < 1 || timeout > 1440) loi.push('SESSION_TIMEOUT_MINUTES phải là số nguyên 1–1440');

  const origins = (env.FRONTEND_ORIGIN || 'http://localhost:5173').split(',').map((s) => s.trim()).filter(Boolean);
  if (origins.includes('*')) loi.push("FRONTEND_ORIGIN không được là '*' – liệt kê từng địa chỉ, ngăn bằng dấu phẩy");
  for (const o of origins) {
    if (o !== '*' && !/^https?:\/\/[^/\s]+$/.test(o)) loi.push(`FRONTEND_ORIGIN không hợp lệ: ${o} (dạng http://host:port, không có / ở cuối)`);
  }

  if (loi.length) {
    const e = new Error(`Cấu hình sai trong .env:\n  - ${loi.join('\n  - ')}`);
    e.code = 'CAU_HINH_SAI';
    throw e;
  }
  return { port, sessionTimeoutMinutes: timeout, frontendOrigins: origins, dbPath: env.DB_PATH || 'data/smartcrm.db' };
}

module.exports = { docCauHinh };
