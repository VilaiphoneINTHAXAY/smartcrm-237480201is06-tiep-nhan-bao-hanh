// DataState – xử lý BA trạng thái cho mọi màn hình: đang tải · rỗng · lỗi (buổi 9, A3).
export function DataState({ loading, error, data, empty, onRetry, children }) {
  if (loading) {
    return (
      <div className="state state-loading" role="status">
        <div className="skeleton" /><div className="skeleton" /><div className="skeleton short" />
        <p>Đang tải dữ liệu…</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="state state-error" role="alert">
        <p><strong>Không tải được dữ liệu.</strong> {error.message}</p>
        {onRetry && <button onClick={onRetry}>Thử lại</button>}
      </div>
    );
  }
  const rong = !data || (Array.isArray(data) && data.length === 0);
  if (rong) {
    return (
      <div className="state state-empty">
        <p>{empty?.message || 'Chưa có dữ liệu nào.'}</p>
        {empty?.action}
      </div>
    );
  }
  return children(data);
}
