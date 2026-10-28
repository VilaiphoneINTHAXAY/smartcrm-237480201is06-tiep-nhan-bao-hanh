// AppError – lỗi nghiệp vụ. Lớp service ném lỗi này bằng MÃ NGHIỆP VỤ (không phải mã HTTP).
// Lớp routes mới là nơi đổi mã nghiệp vụ sang mã HTTP.
class AppError extends Error {
  constructor(code, message, field) {
    super(message);
    this.name = 'AppError';
    this.code = code;     // ví dụ: 'DU_LIEU_KHONG_HOP_LE', 'KHONG_TIM_THAY', 'TRUNG_DU_LIEU'
    this.field = field;   // tên trường bị lỗi (nếu có)
  }
}

module.exports = AppError;
