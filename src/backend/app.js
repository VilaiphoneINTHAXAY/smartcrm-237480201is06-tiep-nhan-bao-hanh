// app.js – Lắp ráp các lớp: repository -> service -> routes. Tách khỏi server.js để kiểm thử được.
const express = require('express');
const AppError = require('./errors/AppError');
const CustomerRepository = require('./repositories/customer.repository');
const CustomerService = require('./services/customer.service');
const customerRoutes = require('./routes/customer.routes');

// Bảng đổi MÃ NGHIỆP VỤ -> MÃ HTTP (chỉ lớp API mới biết mã HTTP)
const HTTP_STATUS = {
  DU_LIEU_KHONG_HOP_LE: 400,
  KHONG_TIM_THAY: 404,
  TRUNG_DU_LIEU: 409,
  DANG_DUOC_SU_DUNG: 409,
};

function buildApp(db) {
  const app = express();
  app.use(express.json({ limit: '100kb' }));

  app.get('/health', (_req, res) => res.json({ status: 'ok' }));

  const customerService = new CustomerService(new CustomerRepository(db));
  app.use('/api/customers', customerRoutes(customerService));

  app.use((_req, res) => res.status(404).json({ error: 'KHONG_TIM_THAY', message: 'Không có đường dẫn này' }));

  // Xử lý lỗi cuối cùng: KHÔNG trả lỗi thô của thư viện cho người gọi (C7)
  app.use((err, _req, res, _next) => {
    if (err instanceof AppError) {
      return res.status(HTTP_STATUS[err.code] || 400).json({ error: err.code, message: err.message, field: err.field });
    }
    if (err.type === 'entity.parse.failed') {
      return res.status(400).json({ error: 'DU_LIEU_KHONG_HOP_LE', message: 'Body không phải JSON hợp lệ' });
    }
    console.error(err);
    res.status(500).json({ error: 'LOI_HE_THONG', message: 'Đã xảy ra lỗi, vui lòng thử lại sau' });
  });

  return app;
}

module.exports = { buildApp };
