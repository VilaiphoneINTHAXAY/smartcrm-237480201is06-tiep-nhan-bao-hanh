// goi-thu-api.js – Gọi thử API bằng HTTP thật, in ra giống curl -i (tài liệu tự học buổi 7, mục A3):
//   (1) luồng đúng → 201 · (2) dữ liệu sai → 400 nêu TÊN trường · (3) quy tắc nghiệp vụ → 409 PHIEU_DANG_MO
// Cách chạy: backend đang chạy (npm start) rồi mở terminal khác: npm run goi-thu
// Mỗi lần chạy tạo một thiết bị mới (IMEI ngẫu nhiên) cho khách mẫu 0901234567 nên chạy lại vẫn ra đúng ba kết quả.
const BASE = process.env.API_URL || `http://localhost:${process.env.PORT || 3000}`;

async function goi(method, path, body, token) {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  return { status: res.status, statusText: res.statusText, json: text ? JSON.parse(text) : null };
}

function inRa(tieuDe, method, path, body, r, chon) {
  console.log(`\n# ${tieuDe}`);
  console.log(`> ${method} ${path}  ${JSON.stringify(body)}`);
  console.log(`< HTTP/1.1 ${r.status} ${r.statusText}`);
  console.log(`< ${JSON.stringify(chon ? chon(r.json) : r.json)}`);
}

(async () => {
  const login = await goi('POST', '/api/auth/login', { username: 'nv01', password: 'Demo@123' });
  const token = login.json.data.token;
  const khach = (await goi('GET', '/api/customers?phone=0901234567', null, token)).json.data;
  const imei = '35' + String(Date.now()).slice(-13);   // 15 chữ số, khác nhau mỗi lần chạy

  const b1 = { issueDescription: 'Màn hình không lên nguồn',
    device: { customerId: khach.id, modelName: 'Oppo A79', imei, purchaseDate: '2026-05-01', warrantyMonths: 12 } };
  const r1 = await goi('POST', '/api/tickets', b1, token);
  inRa('(1) Luồng đúng → 201 Created', 'POST', '/api/tickets', b1, r1,
    (j) => ({ data: { code: j.data.code, status: j.data.status, warrantyStatus: j.data.warrantyStatus,
      categoryName: j.data.categoryName, priority: j.data.priority, slaDueAt: j.data.slaDueAt } }));

  const b2 = { issueDescription: '   ', deviceId: r1.json.data.device.id, customerId: khach.id };
  inRa('(2) Dữ liệu sai → 400, nêu TÊN trường sai (tầng validator)', 'POST', '/api/tickets', b2, await goi('POST', '/api/tickets', b2, token));

  const b3 = { issueDescription: 'Loa rè', deviceId: r1.json.data.device.id, customerId: khach.id };
  inRa('(3) Quy tắc nghiệp vụ → 409, máy đang có phiếu chưa hoàn tất (tầng service)', 'POST', '/api/tickets', b3, await goi('POST', '/api/tickets', b3, token));
})().catch((e) => {
  console.error(`Không gọi được API tại ${BASE}. Hãy chạy "npm start" ở terminal khác trước. (${e.message})`);
  process.exitCode = 1;
});
