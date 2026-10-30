# Kiến trúc ĐÃ HIỆN THỰC – Bài tập 2 (luồng L2, track SE)

Sơ đồ dưới đây vẽ theo **mã nguồn thực tế** ở tag v0.2, không phải sơ đồ dự kiến của BT1
(`docs/architecture.drawio`). Các điểm khác BT1 ghi ở TD-04 và TD-09 trong `docs/thay-doi-thiet-ke.md`.
Ảnh tĩnh của sơ đồ: `docs/architecture-thuc-te.png`.

```mermaid
flowchart TB
  subgraph L1["Lớp 1 – Trình bày · src/frontend/src (React 18 + Vite)"]
    P["pages/: LoginPage · ReceiveDevicePage (M1) · TicketListPage (M2) · TicketDetailPage (M3)"]
    DS["components/DataState.jsx – đang tải · rỗng · lỗi + Thử lại"]
    C["api/: client.js + auth/customers/tickets.api.js – lớp gọi API DUY NHẤT"]
    P --> DS
    P --> C
  end
  subgraph L2["Lớp 2 – API · src/backend/routes + middleware + app.js (Express 5)"]
    MW["middleware/auth.js – phiên 30 phút (401), vai trò (403)"]
    R["routes/: auth · customer · ticket – chỉ dịch HTTP ↔ nghiệp vụ"]
    EH["app.js – bảng mã nghiệp vụ → mã HTTP, định dạng lỗi { error, message, fields }"]
  end
  subgraph L3["Lớp 3 – Nghiệp vụ · src/backend/services + validators + rules (không biết HTTP)"]
    V["validators/: customer · ticket – định dạng dữ liệu vào"]
    S["services/: CustomerService · TicketService · AuthService · ticket.contract (hợp đồng dữ liệu)"]
    RU["rules/ (hàm thuần): warranty BR-02/QT-05 · classification BR-04 · sla BR-05/QT-04 · phone QT-02/QT-15"]
    S --> V
    S --> RU
  end
  subgraph L4["Lớp 4 – Truy cập dữ liệu · src/backend/repositories (nơi DUY NHẤT viết SQL)"]
    RP["customer · device · ticket (kèm issue_category, ticket_status_log) · user"]
  end
  DB[("SQLite · node:sqlite · data/smartcrm.db<br/>migrations/001, 002 + seeds/ (npm run migrate)")]
  C -- "HTTP REST/JSON · Authorization: Bearer" --> MW
  MW --> R
  R --> S
  S --> RP
  RP --> DB
  classDef l1 fill:#DBEAFE,stroke:#2563EB,color:#1E3A8A
  classDef l2 fill:#DCFCE7,stroke:#16A34A,color:#14532D
  classDef l3 fill:#FEF3C7,stroke:#D97706,color:#78350F
  classDef l4 fill:#F3E8FF,stroke:#9333EA,color:#581C87
  classDef db fill:#FEE2E2,stroke:#DC2626,color:#7F1D1D
  class P,DS,C l1
  class MW,R,EH l2
  class V,S,RU l3
  class RP l4
  class DB db
  style L1 fill:#EFF6FF,stroke:#2563EB,stroke-width:2px
  style L2 fill:#F0FDF4,stroke:#16A34A,stroke-width:2px
  style L3 fill:#FFFBEB,stroke:#D97706,stroke-width:2px
  style L4 fill:#FAF5FF,stroke:#9333EA,stroke-width:2px
```

| Lớp | Thư mục | Kiểm chứng ranh giới |
|---|---|---|
| Trình bày | `src/frontend/src/pages`, `components`, `api` | Mọi lệnh `fetch` chỉ nằm trong `api/client.js` |
| API | `src/backend/routes`, `middleware`, `app.js` | Chỉ nơi này có `req`, `res`, mã HTTP |
| Nghiệp vụ | `src/backend/services`, `validators`, `rules` | Không có `req`, `res`, `status(`, `SELECT` (S2) |
| Truy cập dữ liệu | `src/backend/repositories` | Không có quy tắc nghiệp vụ, mọi SQL tham số hoá |
| Lưu trữ | `migrations/`, `seeds/`, `src/backend/migrate.js` | Dựng từ CSDL trống, chạy lại không nhân đôi (S3, C5) |
| Kiểm thử | `tests/` (`npm test`) | CSDL trong bộ nhớ hoặc repository giả, không phụ thuộc máy |

Chiều gọi chỉ đi xuống: trình bày → API → nghiệp vụ → truy cập dữ liệu → CSDL.
