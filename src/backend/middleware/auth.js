// auth.js – Middleware (lớp API): đọc token từ header Authorization, gắn req.user.
// Thiếu token / hết phiên -> chuyển lỗi CHUA_DANG_NHAP cho bộ xử lý lỗi (401).
function requireAuth(authService) {
  return (req, _res, next) => {
    try {
      const header = req.get('Authorization') || '';
      const token = header.startsWith('Bearer ') ? header.slice(7) : null;
      req.token = token;
      req.user = authService.verify(token);
      next();
    } catch (err) {
      next(err);
    }
  };
}

module.exports = { requireAuth };
