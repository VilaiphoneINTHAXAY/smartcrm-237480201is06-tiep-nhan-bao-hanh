import { request } from './client';

// Mỗi nghiệp vụ một hàm; tên hàm nói rõ nó làm gì (buổi 9, A2).
export const ticketsApi = {
  danhSach: ({ status, unverified } = {}) => {
    const q = new URLSearchParams();
    if (status) q.set('status', status);
    if (unverified) q.set('unverified', '1');
    const s = q.toString();
    return request(`/api/tickets${s ? `?${s}` : ''}`);
  },
  chiTiet: (id) => request(`/api/tickets/${id}`),
  lichSu: (id) => request(`/api/tickets/${id}/logs`),
  tiepNhan: (payload) => request('/api/tickets', { method: 'POST', body: payload }),
  doiTrangThai: (id, status) => request(`/api/tickets/${id}/status`, { method: 'PATCH', body: { status } }),
  duyetBaoHanh: (id) => request(`/api/tickets/${id}/approve`, { method: 'POST' }),
  tuChoiBaoHanh: (id, note) => request(`/api/tickets/${id}/reject`, { method: 'POST', body: { note } }),
  // QT-13: không xoá vật lý – khách huỷ phiếu -> DA_HUY, bắt buộc lý do
  huyPhieu: (id, note) => request(`/api/tickets/${id}`, { method: 'DELETE', body: { note } }),
};
