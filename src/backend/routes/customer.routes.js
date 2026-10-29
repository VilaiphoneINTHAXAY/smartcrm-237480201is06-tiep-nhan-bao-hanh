// customer.routes.js – Lớp 2: nhận HTTP, gọi service, đổi kết quả/lỗi thành phản hồi HTTP.
const express = require('express');

function parseId(req) {
  const id = Number(req.params.id);
  return Number.isInteger(id) && id > 0 ? id : -1;
}

function customerRoutes(service) {
  const router = express.Router();

  // GET /api/customers            -> danh sách
  // GET /api/customers?phone=...  -> tra cứu theo SĐT (FR-01)
  router.get('/', (req, res) => {
    if (req.query.phone !== undefined) return res.json({ data: service.findByPhone(req.query.phone, req.user) });
    res.json({ data: service.list(req.user) });
  });

  router.get('/:id', (req, res) => {
    res.json({ data: service.getById(parseId(req), req.user) });
  });

  router.post('/', (req, res) => {
    res.status(201).json({ data: service.create(req.body, req.user) });
  });

  router.put('/:id', (req, res) => {
    res.json({ data: service.update(parseId(req), req.body, req.user) });
  });

  // QT-13: xoá mềm (đánh dấu ngừng sử dụng), không xoá vật lý
  router.delete('/:id', (req, res) => {
    service.remove(parseId(req));
    res.status(204).end();
  });

  return router;
}

module.exports = customerRoutes;
