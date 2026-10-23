import { useState } from 'react';
import { authApi } from '../api/auth.api';
import { tokenStore } from '../api/client';

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [dangGui, setDangGui] = useState(false);
  const [loi, setLoi] = useState('');

  async function gui(e) {
    e.preventDefault();
    setDangGui(true);
    setLoi('');
    try {
      const { token, user } = await authApi.dangNhap(username, password);
      tokenStore.set(token);
      onLogin(user);
    } catch (err) {
      setLoi(err.message);
    } finally {
      setDangGui(false);
    }
  }

  return (
    <main className="login">
      <form className="card" onSubmit={gui}>
        <h1>Smart CRM · Bảo hành</h1>
        <p className="muted">Mekong Mobile · Tiếp nhận và phân loại yêu cầu bảo hành</p>
        <label>Tên đăng nhập
          <input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" required />
        </label>
        <label>Mật khẩu
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
        </label>
        {loi && <p className="field-error" role="alert">{loi}</p>}
        <button type="submit" className="btn-dark" disabled={dangGui}>{dangGui ? 'Đang đăng nhập…' : 'Đăng nhập'}</button>
      </form>
    </main>
  );
}
