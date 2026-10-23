// M2 – Danh sách phiếu (UC06 tab Chờ duyệt · UC07 tab Sắp/quá hạn SLA · FR-05, FR-09 · GWT-16, GWT-17)
// Bố cục theo wireframe-M2 của BT1.
import { useState } from 'react';
import { ticketsApi } from '../api/tickets.api';
import { useApi } from '../hooks/useApi';
import { DataState } from '../components/DataState';
import { thoiGian, thoiGianNgan, TEN_TRANG_THAI, TEN_BAO_HANH } from '../components/format';

const MOI_TRANG = 20;

export default function TicketListPage({ user, moPhieu, taoPhieu }) {
  const [tab, setTab] = useState('');   // '' = tất cả · 'sla' · 'duyet'
  const [trang, setTrang] = useState(1);
  const { data, loading, error, taiLai } = useApi(() => ticketsApi.danhSach({ unverified: tab === 'duyet' }), [tab]);

  const chonTab = (t) => { setTab(tab === t ? '' : t); setTrang(1); }; // bấm lại tab đang chọn = bỏ lọc
  const loc = data && tab === 'sla' ? data.filter((t) => t.needsAttention) : data;
  const soTrang = Math.max(1, Math.ceil((loc?.length || 0) / MOI_TRANG));
  const hienThi = loc?.slice((trang - 1) * MOI_TRANG, trang * MOI_TRANG);

  // Mỗi kiểu RỖNG nói đúng lý do của nó (buổi 9): chưa có phiếu / bộ lọc không ra phiếu
  const empty = {
    '': { message: 'Chưa có phiếu bảo hành nào. Bấm "Tạo phiếu bảo hành" để tiếp nhận thiết bị đầu tiên.',
          action: <button className="btn-dark" onClick={taoPhieu}>Tạo phiếu bảo hành</button> },
    sla: { message: 'Không có phiếu cần chú ý', action: <button className="btn-outline" onClick={() => chonTab('sla')}>Xem tất cả phiếu</button> },
    duyet: { message: 'Không có phiếu nào chờ duyệt bảo hành', action: <button className="btn-outline" onClick={() => chonTab('duyet')}>Xem tất cả phiếu</button> },
  }[tab];

  return (
    <section>
      <h1>M2 – Danh sách phiếu</h1>
      <div className="toolbar">
        <button className={tab === 'sla' ? 'tab-btn active' : 'tab-btn'} onClick={() => chonTab('sla')}>Sắp/quá hạn SLA (≤ 8 giờ)</button>
        {/* NFR-06: chỉ Quản lý TTBH thấy tab Chờ duyệt bảo hành */}
        {user.role === 'QUAN_LY' && (
          <button className={tab === 'duyet' ? 'tab-btn active' : 'tab-btn'} onClick={() => chonTab('duyet')}>Chờ duyệt bảo hành</button>
        )}
        <span className="muted right">Hiện tại: {thoiGian(new Date().toISOString())} · Sắp xếp: Hạn SLA tăng dần</span>
      </div>

      <DataState loading={loading} error={error} data={hienThi} empty={empty} onRetry={taiLai}>
        {(rows) => (
          <>
            <p className="summary">{loc.length} phiếu · <span className="danger">{loc.filter((t) => t.isOverdue).length} quá hạn SLA</span></p>
            <div className="table-wrap">
              <table className="grid-table">
                <thead>
                  <tr><th>Mã phiếu</th><th>Khách hàng</th><th>SĐT</th><th>Thiết bị</th><th>Nhóm sự cố</th>
                    <th>Mức ưu tiên</th><th>Hạn SLA</th><th>Trạng thái phiếu</th><th>Tình trạng bảo hành</th></tr>
                </thead>
                <tbody>
                  {rows.map((t) => (
                    <tr key={t.id} className={t.isOverdue ? 'overdue' : ''}>
                      <td><button className="link" onClick={() => moPhieu(t.id)}>{t.code}</button></td>
                      <td>{t.customer.fullName}</td>
                      <td>{t.customer.phone}</td>
                      <td>{t.device.modelName}</td>
                      <td>{t.categoryName}</td>
                      <td>{t.priority}</td>
                      <td className={t.isOverdue ? 'bold' : ''}>{thoiGianNgan(t.slaDueAt)}</td>
                      <td>{TEN_TRANG_THAI[t.status]}</td>
                      <td>{TEN_BAO_HANH[t.warrantyStatus]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="under-table">
              <span className="note-red">Dòng tô đỏ = phiếu đã QUÁ HẠN SLA (GWT-16). Bấm vào Mã phiếu → mở M3.</span>
              <span className="pager">
                <button className="link" disabled={trang <= 1} onClick={() => setTrang(trang - 1)}>‹</button>
                {' '}Trang {trang}/{soTrang}{' '}
                <button className="link" disabled={trang >= soTrang} onClick={() => setTrang(trang + 1)}>›</button>
                {' '}· {MOI_TRANG} phiếu/trang
              </span>
            </div>
          </>
        )}
      </DataState>
    </section>
  );
}
