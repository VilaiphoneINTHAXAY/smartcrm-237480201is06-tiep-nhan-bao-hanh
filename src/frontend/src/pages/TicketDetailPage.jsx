// M3 – Chi tiết phiếu (UC06, UC08 · FR-06, FR-10 · GWT-10, GWT-18, GWT-19, GWT-20)
import { useState } from 'react';
import { ticketsApi } from '../api/tickets.api';
import { useApi } from '../hooks/useApi';
import { DataState } from '../components/DataState';
import { thoiGian, conLai, TEN_TRANG_THAI, TEN_BAO_HANH, TEN_UU_TIEN } from '../components/format';

const BUOC_TIEP = { MOI: 'DA_PHAN_CONG', DA_PHAN_CONG: 'DANG_XU_LY', DANG_XU_LY: 'HOAN_TAT', HOAN_TAT: 'DA_DONG' };
const TEN_HANH_DONG = {
  TAO_PHIEU: 'Tạo phiếu', DOI_TRANG_THAI: 'Đổi trạng thái', DUYET_BAO_HANH: 'Duyệt bảo hành', TU_CHOI_BAO_HANH: 'Từ chối bảo hành',
};

export default function TicketDetailPage({ id, user, quayLai }) {
  const phieu = useApi(() => ticketsApi.chiTiet(id), [id]);
  const lichSu = useApi(() => ticketsApi.lichSu(id), [id]);
  const [lyDo, setLyDo] = useState('');
  const [thaoTac, setThaoTac] = useState({ loading: false, error: null });

  async function lam(fn) {
    setThaoTac({ loading: true, error: null });
    try {
      await fn();
      setLyDo('');
      setThaoTac({ loading: false, error: null });
      phieu.taiLai();
      lichSu.taiLai();
    } catch (err) {
      setThaoTac({ loading: false, error: err });
    }
  }

  return (
    <section>
      <button className="link" onClick={quayLai}>← Danh sách phiếu</button>
      <DataState loading={phieu.loading} error={phieu.error} data={phieu.data} onRetry={phieu.taiLai}
        empty={{ message: 'Không tìm thấy phiếu.' }}>
        {(t) => (
          <>
            <h1>M3 · Phiếu {t.code}</h1>
            <div className="card grid">
              <div><span className="muted">Khách</span><br />{t.customer.fullName} · {t.customer.phone}</div>
              <div><span className="muted">Thiết bị</span><br />{t.device.modelName} · {t.device.imei || t.device.serialNo}</div>
              <div><span className="muted">Ngày mua</span><br />{t.device.purchaseDate || 'chưa có'} · BH {t.device.warrantyMonths} tháng</div>
              <div><span className="muted">Bảo hành</span><br /><strong>{TEN_BAO_HANH[t.warrantyStatus]}</strong>{t.isUnverified && ' ⚑ chờ duyệt'}</div>
              <div><span className="muted">Nhóm / Ưu tiên</span><br />{t.categoryName} · {TEN_UU_TIEN[t.priority]}</div>
              <div><span className="muted">Trạng thái</span><br />{TEN_TRANG_THAI[t.status]}</div>
              <div><span className="muted">Tiếp nhận</span><br />{thoiGian(t.receivedAt)}</div>
              <div className={t.isOverdue ? 'danger' : ''}><span className="muted">Hạn SLA</span><br />{thoiGian(t.slaDueAt)} ({conLai(t.slaDueAt)})</div>
              <div className="full"><span className="muted">Mô tả lỗi</span><br />{t.issueDescription}</div>
            </div>

            <div className="card">
              <h2>Thao tác</h2>
              {BUOC_TIEP[t.status] && (
                <button disabled={thaoTac.loading} onClick={() => lam(() => ticketsApi.doiTrangThai(t.id, BUOC_TIEP[t.status]))}>
                  Chuyển sang “{TEN_TRANG_THAI[BUOC_TIEP[t.status]]}”
                </button>
              )}
              {t.isUnverified && user.role === 'QUAN_LY' && (
                <div className="approve">
                  <button disabled={thaoTac.loading} onClick={() => lam(() => ticketsApi.duyetBaoHanh(t.id))}>Duyệt: còn bảo hành</button>
                  <input value={lyDo} onChange={(e) => setLyDo(e.target.value)} placeholder="Lý do từ chối (bắt buộc)" />
                  <button className="secondary" disabled={thaoTac.loading} onClick={() => lam(() => ticketsApi.tuChoiBaoHanh(t.id, lyDo))}>Từ chối</button>
                </div>
              )}
              {t.isUnverified && user.role !== 'QUAN_LY' && <p className="muted">Phiếu chờ Quản lý TTBH duyệt bảo hành.</p>}
              {thaoTac.error && <p className="field-error" role="alert">{thaoTac.error.message}</p>}
            </div>
          </>
        )}
      </DataState>

      <div className="card">
        <h2>Lịch sử trạng thái</h2>
        <DataState loading={lichSu.loading} error={lichSu.error} data={lichSu.data} onRetry={lichSu.taiLai}
          empty={{ message: 'Phiếu chưa có dòng lịch sử nào.' }}>
          {(logs) => (
            <ol className="timeline">
              {logs.map((l) => (
                <li key={l.id}>
                  <strong>{TEN_HANH_DONG[l.action]}</strong>
                  {l.from_status && l.from_status !== l.to_status && ` · ${TEN_TRANG_THAI[l.from_status]} → ${TEN_TRANG_THAI[l.to_status]}`}
                  {l.note && ` · ${l.note}`}
                  <br /><small>{thoiGian(l.changed_at.includes('T') ? l.changed_at : `${l.changed_at.replace(' ', 'T')}Z`)} · {l.changed_by_name}</small>
                </li>
              ))}
            </ol>
          )}
        </DataState>
      </div>
    </section>
  );
}
