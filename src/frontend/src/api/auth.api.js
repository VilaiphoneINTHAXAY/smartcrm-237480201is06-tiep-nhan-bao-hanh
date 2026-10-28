import { request } from './client';

export const authApi = {
  dangNhap: (username, password) => request('/api/auth/login', { method: 'POST', body: { username, password } }),
  toi: () => request('/api/auth/me'),
  dangXuat: () => request('/api/auth/logout', { method: 'POST' }),
};
