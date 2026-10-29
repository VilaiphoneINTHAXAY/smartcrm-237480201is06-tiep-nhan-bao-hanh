// M3 – Chi tiết phiếu (UC06, UC08 · FR-06, FR-10 · GWT-10, GWT-18, GWT-19, GWT-20)
// Bố cục theo wireframe-M3 của BT1.
import { useState } from 'react';
import { ticketsApi } from '../api/tickets.api';
import { useApi } from '../hooks/useApi';
import { DataState } from '../components/DataState';
import { thoiGian, ngay, conLai, TEN_TRANG_THAI, TEN_BAO_HANH, TEN_HANH_DONG } from '../components/format';

// changed_at có thể là ISO (ghi từ service) hoặc 'YYYY-MM-DD HH:MM:SS' UTC (mặc định của SQLite)
const isoTuCsdl = (s) => (s.includes('T') ? s : `${s.replace(' ', 'T')}Z`);

const Dong = ({ nhan, children, bold }) => (
  <div className="kv"><span>{nhan}</span><span className={`val${bold ? ' bold' : ''}`}>{children}</span></div>
);

export default function TicketDetailPage({ id, user }) {
  const phieu = useApi(() => ticketsApi.chiTiet(id), [id]);
  const lichSu = useApi(() => ticketsApi.lichSu(id), [id]);
  const [lyDo, setLyDo] = useState('');
  const [lyDoHuy, setLyDoHuy] = useState('');
  const [tt, setTt] = useState({ loading: false, error: null });

  async function lam(fn) {
    setTt({ loading: true, error: null });
    try {
      await fn();
      setLyDo('');
      setLyDoHuy('');
      setTt({ loading: false, error: null });
      phieu.taiLai();
      lichSu.taiLai();
    } catch (err) {
      setTt({ loading: false, error: err });
    }
  }

  // GWT-19: mã phiếu không tồn tại -> "Không tìm thấy phiếu" thay cho toàn trang
  if (phieu.error?.code === 'KHONG_TIM_THAY') {
    return <section><h1>M3 – Chi tiết phiếu</h1><div className="state state-empty"><p>Không tìm thấy phiếu</p></div></section>;
  }

  return (
    <section>
      <DataState loading={phieu.loading} error={phieu.error} data={phieu.data} onRetry={phieu.taiLai}>
        {(t) => (
          <>
            <h1>M3 – Chi tiết phiếu {t.code}</h1>
            <div className="m3">
              <div>
                <Dong nhan="Mã phiếu">{t.code}</Dong>
                <Dong nhan="Trạng thái phiếu">{TEN_TRANG_THAI[t.status]}</Dong>
                <Dong nhan="Thời điểm tiếp nhận">{thoiGian(t.receivedAt)}</Dong>
                <Dong nhan="Người tiếp nhận">{t.createdByName}</Dong>
                <Dong nhan="Khách hàng">{t.customer.fullName} – {t.customer.phone}</Dong>
                <Dong nhan="Thiết bị">{t.device.modelName}</Dong>
                <Dong nhan="IMEI / Serial">{t.device.imei || t.device.serialNo}</Dong>
                <Dong nhan="Ngày mua">{ngay(t.device.purchaseDate)}</Dong>
                <Dong nhan="Số tháng bảo hành">{t.device.warrantyMonths}</Dong>
              </div>
              <div>
                <Dong nhan="Nhóm sự cố">{t.categoryName}</Dong>
                <Dong nhan="Mức ưu tiên">{t.priority}</Dong>
                <Dong nhan="Hạn SLA">
                  {thoiGian(t.slaDueAt)}
                  {!['HOAN_TAT', 'DA_DONG', 'DA_HUY'].includes(t.status) && <small className={t.isOverdue ? 'danger' : 'muted'}> ({conLai(t.slaDueAt)})</small>}
                </Dong>
                <div className="kv">
                  <span>Tình trạng bảo hành</span>
                  <span className="val bold">{TEN_BAO_HANH[t.warrantyStatus]}</span>
                  {t.isUnverified && <span className="flag">⚑ chưa xác minh bảo hành</span>}
                </div>
                <div className="kv top"><span>Mô tả lỗi</span><span className="val tall">{t.issueDescription}</span></div>

                {/* NFR-06: nhân viên tiếp nhận mở được M3 nhưng KHÔNG thấy khung Duyệt bảo hành */}
                {t.isUnverified && user.role === 'QUAN_LY' && (
                  <div className="box approve-box">
                    <h2>Duyệt bảo hành (chỉ Quản lý TTBH · UC06)</h2>
                    <div className="kv">
                      <span>Lý do (bắt buộc khi từ chối)</span>
                      <input className="val" value={lyDo} onChange={(e) => setLyDo(e.target.value)} />
                    </div>
                    {tt.error && <p className="field-error indent-right" role="alert">{tt.error.message} (GWT-10)</p>}
                    <div className="actions">
                      <button className="btn-dark" disabled={tt.loading} onClick={() => lam(() => ticketsApi.duyetBaoHanh(t.id))}>Duyệt</button>
                      <button className="btn-outline" disabled={tt.loading} onClick={() => lam(() => ticketsApi.tuChoiBaoHanh(t.id, lyDo))}>Từ chối</button>
                    </div>
                  </div>
                )}
                {/* QT-06: chỉ hiện các bước được phép theo vòng đời Hình 6.2 (server trả allowedNextStatuses) */}
                {t.allowedNextStatuses.some((s) => s !== 'DA_HUY') && (
                  <div className="actions">
                    {t.allowedNextStatuses.filter((s) => s !== 'DA_HUY').map((s) => (
                      <button key={s} className="btn-outline" disabled={tt.loading} onClick={() => lam(() => ticketsApi.doiTrangThai(t.id, s))}>
                        Chuyển trạng thái → {TEN_TRANG_THAI[s]}
                      </button>
                    ))}
                  </div>
                )}
                {/* QT-13: không xoá phiếu – khách huỷ khi phiếu còn MỚI / ĐÃ PHÂN CÔNG, bắt buộc lý do */}
                {t.allowedNextStatuses.includes('DA_HUY') && (
                  <div className="kv">
                    <span>Lý do khách huỷ</span>
                    <input className="val" value={lyDoHuy} onChange={(e) => setLyDoHuy(e.target.value)} />
                    <button className="btn-outline" disabled={tt.loading} onClick={() => lam(() => ticketsApi.huyPhieu(t.id, lyDoHuy))}>Huỷ phiếu</button>
                  </div>
                )}
                {tt.error && !(t.isUnverified && user.role === 'QUAN_LY') && <p className="field-error" role="alert">{tt.error.message}</p>}
              </div>
            </div>
          </>
        )}
      </DataState>

      <h2 className="section-title">Lịch sử trạng thái (UC08)</h2>
      <DataState loading={lichSu.loading} error={lichSu.error} data={lichSu.data} onRetry={lichSu.taiLai}
        empty={{ message: 'Phiếu chưa có dòng lịch sử nào.' }}>
        {(logs) => (
          <div className="table-wrap">
            <table className="grid-table">
              <thead><tr><th>Thời điểm</th><th>Hành động</th><th>Từ → Đến</th><th>Người thực hiện</th><th>Ghi chú</th></tr></thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.id}>
                    <td>{thoiGian(isoTuCsdl(l.changed_at))}</td>
                    <td>{TEN_HANH_DONG[l.action]}</td>
                    <td>{l.from_status ? TEN_TRANG_THAI[l.from_status] : '—'} → {TEN_TRANG_THAI[l.to_status]}</td>
                    <td>{l.changed_by_name}</td>
                    <td>{l.note || ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DataState>
    </section>
  );
}
