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
    if (req.query.phone !== undefined) return res.json({ data: service.findByPhone(req.query.phone) });
    res.json({ data: service.list() });
  });

  router.get('/:id', (req, res) => {
    res.json({ data: service.getById(parseId(req)) });
  });

  router.post('/', (req, res) => {
    res.status(201).json({ data: service.create(req.body) });
  });

  router.put('/:id', (req, res) => {
    res.json({ data: service.update(parseId(req), req.body) });
  });

  router.delete('/:id', (req, res) => {
    service.remove(parseId(req));
    res.status(204).end();
  });

  return router;
}

module.exports = customerRoutes;
