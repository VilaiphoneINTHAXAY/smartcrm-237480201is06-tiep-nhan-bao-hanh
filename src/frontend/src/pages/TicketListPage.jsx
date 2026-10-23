// M2 – Danh sách phiếu (UC07 · FR-05, FR-08, FR-09 · GWT-16, GWT-17)
import { useState } from 'react';
import { ticketsApi } from '../api/tickets.api';
import { useApi } from '../hooks/useApi';
import { DataState } from '../components/DataState';
import { thoiGian, conLai, TEN_TRANG_THAI, TEN_BAO_HANH, TEN_UU_TIEN } from '../components/format';

const BO_LOC_TRONG = { status: '', unverified: false, canChuY: false };

export default function TicketListPage({ moPhieu, taoPhieu }) {
  const [loc, setLoc] = useState(BO_LOC_TRONG);
  const { data, loading, error, taiLai } = useApi(
    () => ticketsApi.danhSach({ status: loc.status, unverified: loc.unverified }),
    [loc.status, loc.unverified]
  );
  const dangLoc = loc.status || loc.unverified || loc.canChuY;
  const hienThi = data && loc.canChuY ? data.filter((t) => t.needsAttention) : data;

  // Hai kiểu RỖNG phải nói khác nhau: chưa có phiếu nào / bộ lọc không ra phiếu nào (buổi 9)
  const empty = !dangLoc
    ? { message: 'Chưa có phiếu bảo hành nào. Bấm "Tạo phiếu" để tiếp nhận thiết bị đầu tiên.',
        action: <button onClick={taoPhieu}>Tạo phiếu</button> }
    : { message: loc.canChuY ? 'Không có phiếu cần chú ý.' : 'Không có phiếu nào khớp bộ lọc hiện tại.',
        action: <button onClick={() => setLoc(BO_LOC_TRONG)}>Xoá bộ lọc</button> };

  return (
    <section>
      <h1>M2 · Danh sách phiếu</h1>
      <div className="card row filters">
        <label>Trạng thái
          <select value={loc.status} onChange={(e) => setLoc({ ...loc, status: e.target.value })}>
            <option value="">Tất cả</option>
            {Object.entries(TEN_TRANG_THAI).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </label>
        <label className="check"><input type="checkbox" checked={loc.unverified} onChange={(e) => setLoc({ ...loc, unverified: e.target.checked })} /> Chờ duyệt bảo hành</label>
        <label className="check"><input type="checkbox" checked={loc.canChuY} onChange={(e) => setLoc({ ...loc, canChuY: e.target.checked })} /> Sắp/quá hạn SLA (≤ 8 giờ)</label>
      </div>

      <DataState loading={loading} error={error} data={hienThi} empty={empty} onRetry={taiLai}>
        {(rows) => {
          const quaHan = rows.filter((t) => t.isOverdue).length;
          return (
            <>
              <p className="summary">{rows.length} phiếu · <span className="danger">{quaHan} quá hạn SLA</span> · sắp theo hạn SLA, gần nhất ở trên</p>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>Mã phiếu</th><th>Khách</th><th>Thiết bị</th><th>Nhóm / Ưu tiên</th><th>Bảo hành</th><th>Trạng thái</th><th>Hạn SLA</th></tr>
                  </thead>
                  <tbody>
                    {rows.map((t) => (
                      <tr key={t.id} className={t.isOverdue ? 'overdue' : t.needsAttention ? 'attention' : ''}>
                        <td><button className="link" onClick={() => moPhieu(t.id)}>{t.code}</button></td>
                        <td>{t.customer.fullName}</td>
                        <td>{t.device.modelName}</td>
                        <td>{t.categoryName} · {TEN_UU_TIEN[t.priority]}</td>
                        <td>{TEN_BAO_HANH[t.warrantyStatus]}{t.isUnverified && ' ⚑'}</td>
                        <td>{TEN_TRANG_THAI[t.status]}</td>
                        <td>{thoiGian(t.slaDueAt)}<br /><small>{['HOAN_TAT', 'DA_DONG'].includes(t.status) ? '' : conLai(t.slaDueAt)}</small></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="muted">Dòng đỏ = đã quá hạn SLA (GWT-16). ⚑ = chờ Quản lý duyệt bảo hành.</p>
            </>
          );
        }}
      </DataState>
    </section>
  );
}
