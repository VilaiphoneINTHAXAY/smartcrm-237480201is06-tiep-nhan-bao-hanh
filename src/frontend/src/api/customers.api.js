import { request } from './client';

export const customersApi = {
  // FR-01: tra cứu theo SĐT, trả kèm danh sách thiết bị
  traCuu: (phone) => request(`/api/customers?phone=${encodeURIComponent(phone)}`),
  tao: (fullName, phone) => request('/api/customers', { method: 'POST', body: { fullName, phone } }),
};
