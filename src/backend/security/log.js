// log.js – Ghi log an toàn (checklist bảo mật mục 6): không bao giờ ghi mật khẩu, token, header Authorization
// hay thân request. Chỉ ghi phương thức, đường dẫn, tên và thông điệp lỗi.
const KHOA_NHAY_CAM = /pass(word)?|mat_?khau|token|authorization|secret|cookie/i;

// Thay giá trị của mọi khóa nhạy cảm bằng '***' (đệ quy, không sửa đối tượng gốc).
function che(giaTri, sau = 0) {
  if (sau > 5 || giaTri === null || typeof giaTri !== 'object') return giaTri;
  if (Array.isArray(giaTri)) return giaTri.map((x) => che(x, sau + 1));
  const ra = {};
  for (const [k, v] of Object.entries(giaTri)) ra[k] = KHOA_NHAY_CAM.test(k) ? '***' : che(v, sau + 1);
  return ra;
}

// Dòng log cho lỗi 500: không có req.body, req.headers, không có stack trace đầy đủ.
function dongLogLoi(err, req) {
  return JSON.stringify({
    time: new Date().toISOString(),
    level: 'error',
    method: req?.method,
    path: req?.originalUrl?.split('?')[0],   // bỏ query string: phòng trường hợp ai đó gửi token qua URL
    error: err?.name || 'Error',
    message: String(err?.message || '').slice(0, 200),
  });
}

module.exports = { che, dongLogLoi };
