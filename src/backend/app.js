// app.js – Lắp ráp các lớp: repository -> service -> routes. Tách khỏi server.js để kiểm thử được.
const express = require('express');
const AppError = require('./errors/AppError');
const CustomerRepository = require('./repositories/customer.repository');
const DeviceRepository = require('./repositories/device.repository');
const TicketRepository = require('./repositories/ticket.repository');
const UserRepository = require('./repositories/user.repository');
const CustomerService = require('./services/customer.service');
const TicketService = require('./services/ticket.service');
const AuthService = require('./services/auth.service');
const { requireAuth } = require('./middleware/auth');
const { dongLogLoi } = require('./security/log');
const customerRoutes = require('./routes/customer.routes');
const ticketRoutes = require('./routes/ticket.routes');
const authRoutes = require('./routes/auth.routes');

// Bảng đổi MÃ NGHIỆP VỤ -> MÃ HTTP (chỉ lớp API mới biết mã HTTP)
const HTTP_STATUS = {
  DU_LIEU_KHONG_HOP_LE: 400,
  SAI_DANG_NHAP: 401,
  CHUA_DANG_NHAP: 401,
  KHONG_DU_QUYEN: 403,
  KHONG_TIM_THAY: 404,
  TRUNG_DU_LIEU: 409,
  DANG_DUOC_SU_DUNG: 409,
  TRANG_THAI_KHONG_HOP_LE: 409,
  THIET_BI_KHONG_THUOC_KHACH: 409,
  PHIEU_DANG_MO: 409,
};

function buildApp(db, { sessionTimeoutMinutes = Number(process.env.SESSION_TIMEOUT_MINUTES) || 30 } = {}) {
  const app = express();
  app.disable('x-powered-by');   // không lộ "Express" trong header phản hồi (checklist bảo mật mục 5)
  app.use(express.json({ limit: '100kb' }));

  // Cho phép giao diện chạy ở cổng khác (Vite 5173) gọi API trong môi trường cục bộ.
  // FRONTEND_ORIGIN có thể là một danh sách, ngăn bằng dấu phẩy; KHÔNG dùng '*' (checklist bảo mật, tài liệu buổi 15 A2).
  const nguonChoPhep = (process.env.FRONTEND_ORIGIN || 'http://localhost:5173')
    .split(',').map((s) => s.trim()).filter(Boolean);
  app.use((req, res, next) => {
    const nguon = req.headers.origin;
    res.set('Access-Control-Allow-Origin', nguon && nguonChoPhep.includes(nguon) ? nguon : nguonChoPhep[0]);
    res.set('Vary', 'Origin');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    if (req.method === 'OPTIONS') return res.status(204).end();
    next();
  });

  // /health kiểm cả CSDL: người chấm (và healthcheck của docker compose) biết hệ thống đã thật sự sẵn sàng
  app.get('/health', (_req, res) => {
    try {
      db.prepare('SELECT 1').get();
      res.json({ status: 'ok', db: 'up' });
    } catch {
      res.status(503).json({ status: 'error', db: 'down' });
    }
  });

  const authService = new AuthService(new UserRepository(db), { timeoutMinutes: sessionTimeoutMinutes });
  const dangNhap = requireAuth(authService);
  const customerService = new CustomerService(new CustomerRepository(db));
  const ticketService = new TicketService(new TicketRepository(db), new DeviceRepository(db));

  app.use('/api/auth', authRoutes(authService, dangNhap));
  // NFR-06: mọi API nghiệp vụ đều phải đăng nhập
  app.use('/api/customers', dangNhap, customerRoutes(customerService));
  app.use('/api/tickets', dangNhap, ticketRoutes(ticketService));

  // Bản deploy (Dockerfile.deploy): API phục vụ luôn giao diện đã build – một dịch vụ, cùng địa chỉ, không cần CORS.
  // Ở docker compose / phát triển không đặt STATIC_DIR nên đoạn này không chạy.
  if (process.env.STATIC_DIR) app.use(express.static(process.env.STATIC_DIR, { index: 'index.html', maxAge: '1h' }));

  app.use((_req, res) => res.status(404).json({ error: 'KHONG_TIM_THAY', message: 'Không có đường dẫn này' }));

  // Xử lý lỗi cuối cùng: một định dạng lỗi cho cả API { error, message, fields } (buổi 9);
  // KHÔNG trả lỗi thô của thư viện cho người gọi (C7).
  app.use((err, req, res, _next) => {
    if (err instanceof AppError) {
      const body = { error: err.code, message: err.message };
      if (err.field) {
        body.field = err.field;
        body.fields = { [err.field]: err.message };
      }
      return res.status(HTTP_STATUS[err.code] || 400).json(body);
    }
    if (err.type === 'entity.parse.failed') {
      return res.status(400).json({ error: 'DU_LIEU_KHONG_HOP_LE', message: 'Body không phải JSON hợp lệ' });
    }
    console.error(dongLogLoi(err, req));   // log an toàn: không ghi body, header, token (checklist mục 6)
    res.status(500).json({ error: 'LOI_HE_THONG', message: 'Đã xảy ra lỗi, vui lòng thử lại sau' });
  });

  return app;
}

module.exports = { buildApp };
