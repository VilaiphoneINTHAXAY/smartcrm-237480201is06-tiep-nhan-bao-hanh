// App – điều hướng bằng địa chỉ #/... (không cần thư viện router) và giữ người dùng đăng nhập.
// Thanh trên cùng theo wireframe BT1: "Smart CRM · Bảo hành" · hai tab · người dùng | Đăng xuất.
import { useEffect, useState } from 'react';
import { authApi } from './api/auth.api';
import { onUnauthorized, tokenStore } from './api/client';
import LoginPage from './pages/LoginPage';
import ReceiveDevicePage from './pages/ReceiveDevicePage';
import TicketListPage from './pages/TicketListPage';
import TicketDetailPage from './pages/TicketDetailPage';
import { DataState } from './components/DataState';
import { TEN_VAI_TRO } from './components/format';

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
    return () => window.removeEventListener('hashchange', doi);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
  else if (chiTiet) trang = <TicketDetailPage id={Number(chiTiet[1])} user={user} />;
  else trang = <TicketListPage user={user} moPhieu={(id) => di(`/tickets/${id}`)} taoPhieu={() => di('/receive')} />;

  return (
    <>
      <header className="topbar">
        <strong className="brand">Smart CRM · Bảo hành</strong>
        <nav className="tabs">
          <a href="#/receive" className={path === '/receive' ? 'tab active' : 'tab'}>Tạo phiếu bảo hành</a>
          <a href="#/tickets" className={path === '/tickets' ? 'tab active' : 'tab'}>Danh sách phiếu</a>
        </nav>
        <span className="user">
          {user.fullName} ({TEN_VAI_TRO[user.role]}) &nbsp;|&nbsp; <button className="link" onClick={dangXuat}>Đăng xuất</button>
        </span>
      </header>
      <main className="page">{trang}</main>
    </>
  );
}
