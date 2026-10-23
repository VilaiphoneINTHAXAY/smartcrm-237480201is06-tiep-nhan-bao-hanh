// App – điều hướng đơn giản bằng địa chỉ #/... (không cần thư viện router) và giữ người dùng đăng nhập.
import { useEffect, useState } from 'react';
import { authApi } from './api/auth.api';
import { onUnauthorized, tokenStore } from './api/client';
import LoginPage from './pages/LoginPage';
import ReceiveDevicePage from './pages/ReceiveDevicePage';
import TicketListPage from './pages/TicketListPage';
import TicketDetailPage from './pages/TicketDetailPage';
import { DataState } from './components/DataState';

const docDuongDan = () => window.location.hash.replace(/^#/, '') || '/tickets';
const di = (p) => { window.location.hash = p; };

export default function App() {
  const [path, setPath] = useState(docDuongDan());
  const [user, setUser] = useState(null);
  const [kiemTra, setKiemTra] = useState(Boolean(tokenStore.get()));
  const [loiKetNoi, setLoiKetNoi] = useState(null);

  // Hỏi backend "token này là ai". Mất kết nối thì hiện lỗi + Thử lại, KHÔNG đá về trang đăng nhập.
  function kiemTraPhien() {
    setKiemTra(true);
    setLoiKetNoi(null);
    authApi.toi()
      .then(setUser)
      .catch((err) => { if (err.status === 0) setLoiKetNoi(err); else setUser(null); })
      .finally(() => setKiemTra(false));
  }

  useEffect(() => {
    const doi = () => setPath(docDuongDan());
    window.addEventListener('hashchange', doi);
    onUnauthorized(() => setUser(null)); // 401 ở bất kỳ đâu -> về trang đăng nhập
    if (tokenStore.get()) kiemTraPhien();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return () => window.removeEventListener('hashchange', doi);
  }, []);

  if (kiemTra) return <main className="page"><DataState loading /></main>;
  if (loiKetNoi) return <main className="page"><DataState error={loiKetNoi} onRetry={kiemTraPhien} /></main>;
  if (!user) return <LoginPage onLogin={(u) => { setUser(u); di('/tickets'); }} />;

  async function dangXuat() {
    try { await authApi.dangXuat(); } catch { /* vẫn đăng xuất ở phía giao diện */ }
    tokenStore.clear();
    setUser(null);
  }

  const chiTiet = path.match(/^\/tickets\/(\d+)$/);
  let trang;
  if (path === '/receive') trang = <ReceiveDevicePage moPhieu={(id) => di(`/tickets/${id}`)} />;
  else if (chiTiet) trang = <TicketDetailPage id={Number(chiTiet[1])} user={user} quayLai={() => di('/tickets')} />;
  else trang = <TicketListPage moPhieu={(id) => di(`/tickets/${id}`)} taoPhieu={() => di('/receive')} />;

  return (
    <>
      <header className="topbar">
        <strong>Mekong Mobile · Bảo hành</strong>
        <nav>
          <a href="#/receive" className={path === '/receive' ? 'active' : ''}>Tạo phiếu</a>
          <a href="#/tickets" className={path.startsWith('/tickets') ? 'active' : ''}>Danh sách phiếu</a>
        </nav>
        <span className="user">{user.fullName} ({user.role === 'QUAN_LY' ? 'Quản lý' : 'Tiếp nhận'}) <button className="link" onClick={dangXuat}>Đăng xuất</button></span>
      </header>
      <main className="page">{trang}</main>
    </>
  );
}
