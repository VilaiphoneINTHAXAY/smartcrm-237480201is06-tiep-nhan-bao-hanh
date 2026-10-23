// auth.routes.js – Lớp 2: đăng nhập / đăng xuất / người dùng hiện tại.
const express = require('express');

function authRoutes(authService, requireAuth) {
  const router = express.Router();

  router.post('/login', (req, res) => {
    const { username, password } = req.body || {};
    res.json({ data: authService.login(username, password) });
  });

  router.get('/me', requireAuth, (req, res) => res.json({ data: req.user }));

  router.post('/logout', requireAuth, (req, res) => {
    authService.logout(req.token);
    res.status(204).end();
  });

  return router;
}

module.exports = authRoutes;
