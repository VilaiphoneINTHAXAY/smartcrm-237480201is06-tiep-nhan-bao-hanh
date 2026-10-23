// client.js – LỚP GỌI API: nơi DUY NHẤT trong giao diện biết về HTTP và fetch (buổi 9, A2).
// Đổi base URL, thêm token, xử lý 401 -> chỉ sửa ở đây.
const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'; // không ghi cứng trong component
const KHOA_TOKEN = 'smartcrm_token';
// Chỉ để CHỤP ẢNH trạng thái "đang tải": đặt VITE_DEMO_DELAY_MS trong .env. Mặc định 0 = không chờ.
const DEMO_DELAY_MS = Number(import.meta.env.VITE_DEMO_DELAY_MS) || 0;

export class ApiError extends Error {
  constructor(status, code, message, fields) {
    super(message);
    this.status = status;   // mã HTTP (0 = không kết nối được)
    this.code = code;       // mã nghiệp vụ backend trả về, vd DU_LIEU_KHONG_HOP_LE
    this.fields = fields || {}; // lỗi theo từng trường để hiện cạnh ô nhập
  }
}

// Token lưu ở localStorage: chấp nhận ở mức prototype (README ghi rõ hạn chế: đọc được nếu có XSS).
export const tokenStore = {
  get: () => { try { return localStorage.getItem(KHOA_TOKEN); } catch { return null; } },
  set: (t) => { try { localStorage.setItem(KHOA_TOKEN, t); } catch { /* bỏ qua */ } },
  clear: () => { try { localStorage.removeItem(KHOA_TOKEN); } catch { /* bỏ qua */ } },
};

// App đăng ký hàm này để quay về trang đăng nhập khi nhận 401.
let khiHetPhien = () => {};
export function onUnauthorized(fn) { khiHetPhien = fn; }

export async function request(path, { method = 'GET', body } = {}) {
  const token = tokenStore.get();
  if (DEMO_DELAY_MS > 0) await new Promise((r) => setTimeout(r, DEMO_DELAY_MS));
  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    // Mất mạng hoặc backend đang tắt: thông báo cho người dùng, không hiện "TypeError: Failed to fetch"
    throw new ApiError(0, 'MAT_KET_NOI', 'Không kết nối được tới hệ thống. Kiểm tra máy chủ rồi bấm Thử lại.');
  }
  if (res.status === 204) return null;
  let data = null;
  try { data = await res.json(); } catch { /* phản hồi không phải JSON */ }

  if (res.status === 401 && path !== '/api/auth/login') {
    tokenStore.clear();       // buổi 9 A4: 401 -> xoá token, về trang đăng nhập
    khiHetPhien();
  }
  if (!res.ok) {
    throw new ApiError(res.status, data?.error, data?.message || 'Hệ thống đang gặp sự cố. Vui lòng thử lại.', data?.fields);
  }
  return data?.data ?? data;
}
