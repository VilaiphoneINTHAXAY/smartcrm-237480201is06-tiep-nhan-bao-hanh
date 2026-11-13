// do-nfr.js – Đo chỉ tiêu hiệu năng NFR-01, NFR-02 và kiểm NFR-04 ở mức đơn giản (TD-10, phản hồi BT2).
// KHÔNG phải kiểm thử tải đầy đủ (thuộc Chuyên đề tốt nghiệp 2): chỉ đo thời gian phản hồi thật trên máy cá nhân.
//
// Cách chạy: hệ thống đang chạy (docker compose up -d --build, hoặc npm start), rồi:  npm run do-nfr
//   - API_URL (không bắt buộc): mặc định http://localhost:3000
//   - Script TẠO THÊM ~600 phiếu (thiết bị mới, IMEI ngẫu nhiên) cho khách mẫu để CSDL có ≥ 500 phiếu như NFR-01 yêu cầu.
//     Muốn xoá dữ liệu đo: docker compose down -v  (rồi up lại – dữ liệu mẫu được nạp lại).
const BASE = process.env.API_URL || `http://localhost:${process.env.PORT || 3000}`;

async function goi(method, path, { body, token } = {}) {
  const t0 = performance.now();
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => null);
  return { ms: performance.now() - t0, status: res.status, json };
}

function thongKe(mangMs) {
  const s = [...mangMs].sort((a, b) => a - b);
  const pct = (p) => s[Math.min(s.length - 1, Math.ceil((p / 100) * s.length) - 1)];
  const tb = s.reduce((a, b) => a + b, 0) / s.length;
  return { n: s.length, tb, p50: pct(50), p95: pct(95), max: s[s.length - 1] };
}

const imeiNgauNhien = (() => {
  const goc = String(Date.now()).slice(-9);           // 9 số theo thời điểm chạy -> chạy lại không trùng
  let i = 0;
  return () => `35${goc}${String(i++).padStart(4, '0')}`; // 2 + 9 + 4 = 15 chữ số
})();

async function taoPhieu(token, khachId) {
  return goi('POST', '/api/tickets', { token, body: {
    issueDescription: 'Máy không lên nguồn (dữ liệu đo NFR)',
    device: { customerId: khachId, modelName: 'May do NFR', imei: imeiNgauNhien(), purchaseDate: '2026-06-01' },
  } });
}

(async () => {
  console.log(`Đo trên ${BASE}  ·  Node ${process.version}  ·  ${new Date().toLocaleString('vi-VN')}`);
  const h = await goi('GET', '/health');
  if (h.status !== 200) throw new Error(`/health trả ${h.status} – hệ thống chưa chạy?`);

  const login = await goi('POST', '/api/auth/login', { body: { username: 'nv01', password: process.env.DEMO_PASSWORD || 'Demo@123' } });
  if (login.status !== 200) throw new Error('Đăng nhập nv01 thất bại');
  const token = login.json.data.token;
  const khach = (await goi('GET', '/api/customers?phone=0901234567', { token })).json.data;

  // ---- Chuẩn bị ≥ 500 phiếu, đồng thời đo NFR-02 (tạo phiếu tuần tự, từng request một)
  const truoc = (await goi('GET', '/api/tickets', { token })).json.data.length;
  const canThem = Math.max(100, 500 - truoc + 100);
  const msTao = [];
  let loiTao = 0;
  process.stdout.write(`Tạo ${canThem} phiếu (đang có ${truoc}) `);
  for (let i = 0; i < canThem; i++) {
    const r = await taoPhieu(token, khach.id);
    if (r.status !== 201) loiTao++;
    msTao.push(r.ms);
    if (i % 50 === 0) process.stdout.write('.');
  }
  const tongPhieu = (await goi('GET', '/api/tickets', { token })).json.data.length;
  console.log(` xong. CSDL hiện có ${tongPhieu} phiếu.`);

  // ---- NFR-01: 100 lần tra cứu khách theo SĐT khi CSDL có ≥ 500 phiếu
  const msTraCuu = [];
  let loiTraCuu = 0;
  for (let i = 0; i < 100; i++) {
    const r = await goi('GET', '/api/customers?phone=0987654321', { token });
    if (r.status !== 200) loiTraCuu++;
    msTraCuu.push(r.ms);
  }

  // ---- Thêm: danh sách phiếu M2 (trả toàn bộ phiếu, sắp theo SLA) – 20 lần
  const msDanhSach = [];
  for (let i = 0; i < 20; i++) msDanhSach.push((await goi('GET', '/api/tickets', { token })).ms);

  // ---- NFR-04 (rút gọn): 20 request tạo phiếu ĐỒNG THỜI × 5 đợt -> không lỗi, không trùng mã phiếu
  const ma = [];
  let loiDongThoi = 0;
  const msDongThoi = [];
  for (let dot = 0; dot < 5; dot++) {
    const kq = await Promise.all(Array.from({ length: 20 }, () => taoPhieu(token, khach.id)));
    for (const r of kq) {
      msDongThoi.push(r.ms);
      if (r.status === 201) ma.push(r.json.data.code); else loiDongThoi++;
    }
  }
  const trungMa = ma.length - new Set(ma).size;

  const dong = (ten, tk, nguong, loi) => ({
    'Phép đo': ten, 'Số lần': tk.n, 'TB (ms)': tk.tb.toFixed(1), 'p50 (ms)': tk.p50.toFixed(1),
    'p95 (ms)': tk.p95.toFixed(1), 'Max (ms)': tk.max.toFixed(1), 'Lỗi': loi, 'Ngưỡng': nguong,
    'Kết quả': nguong === '—' ? '—' : (loi === 0 && tk.p95 <= Number(nguong.replace(/\D/g, '')) * 1000 ? 'ĐẠT' : 'KHÔNG ĐẠT'),
  });
  console.log(`NFR-01: GET /api/customers?phone · NFR-02: POST /api/tickets tuần tự · M2: GET /api/tickets (${tongPhieu} phiếu, tham khảo) · NFR-04: 20 POST đồng thời × 5 đợt`);
  console.table([
    dong('NFR-01 tra cứu SĐT', thongKe(msTraCuu), 'p95 ≤ 2 s', loiTraCuu),
    dong('NFR-02 tạo phiếu', thongKe(msTao), 'p95 ≤ 3 s', loiTao),
    dong('Danh sách phiếu M2', thongKe(msDanhSach), '—', 0),
    dong('NFR-04 20 đồng thời', thongKe(msDongThoi), 'p95 ≤ 3 s', loiDongThoi),
  ]);
  console.log(`NFR-04 rút gọn: ${ma.length}/100 phiếu tạo thành công, ${loiDongThoi} lỗi, ${trungMa} mã phiếu trùng -> ${loiDongThoi === 0 && trungMa === 0 ? 'ĐẠT' : 'KHÔNG ĐẠT'}`);
})().catch((e) => { console.error('Lỗi:', e.message); process.exit(1); });
