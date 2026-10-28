// ticket.routes.js – Lớp 2: nhận HTTP, gọi TicketService, trả JSON { data }.
// req.user do middleware auth gắn vào; lỗi nghiệp vụ được app.js đổi sang mã HTTP.
const express = require('express');

function parseId(req) {
  const id = Number(req.params.id);
  return Number.isInteger(id) && id > 0 ? id : -1;
}

function ticketRoutes(service) {
  const router = express.Router();

  // GET /api/tickets?status=MOI&unverified=1  (sắp theo hạn SLA)
  router.get('/', (req, res) => {
    res.json({ data: service.list({ status: req.query.status, unverified: req.query.unverified === '1' }) });
  });

  router.get('/:id', (req, res) => res.json({ data: service.getById(parseId(req)) }));

  router.get('/:id/logs', (req, res) => res.json({ data: service.getLogs(parseId(req)) }));

  router.post('/', (req, res) => res.status(201).json({ data: service.create(req.body, req.user) }));

  router.put('/:id', (req, res) => res.json({ data: service.update(parseId(req), req.body) }));

  router.patch('/:id/status', (req, res) => res.json({ data: service.changeStatus(parseId(req), req.body, req.user) }));

  router.post('/:id/approve', (req, res) => res.json({ data: service.approveWarranty(parseId(req), req.user) }));

  router.post('/:id/reject', (req, res) => res.json({ data: service.rejectWarranty(parseId(req), req.body, req.user) }));

  router.delete('/:id', (req, res) => {
    service.remove(parseId(req));
    res.status(204).end();
  });

  return router;
}

module.exports = ticketRoutes;
