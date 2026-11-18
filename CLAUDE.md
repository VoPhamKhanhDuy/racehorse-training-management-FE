# Racehorse Training & Management System — Quy tắc dự án

Đây là project SWP391: hệ thống quản lý huấn luyện ngựa đua, 5 role: **Head Trainer, Veterinarian, Groom/Stable Hand, Horse Owner, Club Manager**.

Khi AI (Claude Code, Copilot, ChatGPT...) hỗ trợ code trong project này, LUÔN tuân theo các quy tắc dưới đây để code đồng bộ giữa các thành viên.

## Cách chạy project (cho người mới clone về)
```bash
git clone <link-repo>
cd racehorse-app
npm install
npm run dev
```
Mở link hiện ra (thường `http://localhost:5173`) trên trình duyệt. Backend nằm ở `../racehorse_BE`.

## Tech stack
- React 19 + Vite, JavaScript thường (`.jsx`), chưa dùng TypeScript
- React Router (`react-router-dom`) cho điều hướng
- Tailwind CSS cho styling — KHÔNG viết CSS thuần / `.module.css` trừ khi thật cần thiết
- Đã có backend thật, gọi qua `src/services/apiClient.js` (kèm SignalR cho realtime)
- Một số tính năng BE chưa có vẫn dùng mock lưu localStorage (xem mục Mock)

## Cấu trúc thư mục (bắt buộc theo đúng, không tự đổi tên folder)

```
src/
  components/       # Component dùng chung từ 2 role trở lên (Modal, Drawer, DataTable, HorseCard...)
  pages/<role>/     # auth, trainer, vet, groom, owner, manager — trang và component riêng của role đó
  routes/           # Cấu hình route + ProtectedRoute (chặn theo role)
  hooks/            # Custom hook dùng chung (useAuth, useApiResource...)
  context/          # AuthContext (user + role đang đăng nhập)
  services/         # Gọi API BE (qua apiClient) và các lớp mock còn lại
  utils/            # Hàm thuần dùng chung (format ngày/số/tiền, trạng thái, validate...)
  config/           # Hằng số cấu hình (ngưỡng sức khỏe, thông tin CLB...)
  data/             # Hằng số/enum/lựa chọn cho form (*Options.js, roles.js...)
  assets/           # Ảnh, font
  styles/           # CSS global, theme
  App.jsx, main.jsx
public/             # File tĩnh (favicon, robots.txt)
```

Mỗi thành viên code role nào thì CHỈ tạo file trong `pages/<role>/` đó, không import file từ folder role khác. Cần dùng chung → chuyển vào `components/` (hoặc `utils/`, `hooks/`). File đặt sai vị trí coi như sai cấu trúc, phải sửa trước khi merge.

Ngoại lệ: `*FormContext.jsx` giữ cạnh form trong `pages/<role>/`, không chuyển sang `context/`.

## Quy ước code

**Phân tầng:** page → hook → service → apiClient. Page/component KHÔNG gọi `apiRequest`/`fetch` trực tiếp, chỉ gọi hàm trong `services/`. Component trong `components/` nhận dữ liệu qua props, không import `services/`.

**Gọi dữ liệu:** đọc dữ liệu bằng `useApiResource`, hiển thị lỗi bằng `ApiErrorNotice`. Không tự viết lại `useState(loading)` + `useEffect` + `try/catch` ở từng trang.

**Dùng chung:** helper dùng từ 2 nơi trở lên → `utils/` (số, ngày: `utils/date.js`, tiền: `utils/currency.js`). Không copy-paste `formatNumber`, `capitalizeFirst`... vào từng file. Ngày hiển thị dùng `formatDate`, không gọi `toLocaleDateString` trực tiếp. Màu/nhãn trạng thái lấy từ `utils/*Status`, không viết lại trong component.

**Kích thước:** mỗi file tối đa khoảng 250 dòng, 1 component chính/file. Vượt thì tách component con hoặc hook; logic không có JSX (tính toán, validate) đặt ở `utils/`.

**Component:** function component + hook, không dùng class component.

**Form:** dùng `createEmptyForm` cho state ban đầu; state/validate phức tạp đặt ở hook hoặc `*FormContext` cạnh form.

## Quy tắc đặt tên
- Component: PascalCase — `TrainingPlanForm.jsx`, `HorseCard.jsx`
- File không phải component (util, hook, service): camelCase — `useAuth.js`, `horseService.js`
- Code MỚI: biến, hàm, tham số, field dữ liệu đều camelCase tiếng Anh theo BE (`birthDate`, `injuryStatus`), KHÔNG dùng tiếng Việt không dấu
- Code CŨ còn field tiếng Việt (`NgaySinh`, `CanNang`, `NhipTim`...): giữ nguyên, CHƯA đổi hàng loạt
- File service MỚI đặt `<domain>Service.js`. Các `*Api.js` hiện có (`authApi`, `trainingApi`...) giữ nguyên, không đổi tên hàng loạt
- Text hiển thị trên giao diện (UI): tiếng Việt có dấu đầy đủ

## Mock
- Chỉ dùng mock khi BE chưa có endpoint. File mock đặt tên `*Mock.js` trong `services/`, lưu qua `persistedStore`, và có comment `// TODO(BE)` ghi endpoint dự kiến.
- Nối BE xong thì xóa mock và mọi chỗ gọi nó; không để file không ai import.
- Không hard-code mảng dữ liệu giả trực tiếp trong file trang.

## RBAC (phân quyền)
- Role hiện tại lưu trong `AuthContext` (`src/context/AuthContext.jsx`)
- Mỗi route trong `src/routes/` phải bọc bằng `<ProtectedRoute allowedRoles={[...]}>` để chặn user vào nhầm trang không thuộc role của mình
- 5 mã role hợp lệ (roleId), khớp với bảng ROLE:
  - `"head_trainer"` — Head Trainer / HLV trưởng
  - `"veterinarian"` — Veterinarian / Bác sĩ thú y
  - `"groom"` — Groom/Stable Hand / Nhân viên chăm sóc
  - `"horse_owner"` — Horse Owner / Chủ ngựa
  - `"club_manager"` — Club Manager / Quản lý CLB

## Git / GitHub
- Nhánh `main`: chỉ chứa bản ổn định để demo/nộp bài, KHÔNG push thẳng, KHÔNG merge feature trực tiếp vào đây
- Nhánh `dev`: nhánh làm việc chung của cả nhóm, mọi feature branch đều tách ra từ đây
- Mỗi thành viên checkout từ `dev` để tạo nhánh riêng, đặt tên theo mẫu `feature/<ten-nguoi>-<chuc-nang>` (bắt buộc có tên người làm để dễ truy ai đang làm gì, tránh 2 người trùng tên nhánh):
  ```bash
  git checkout dev
  git pull origin dev
  git checkout -b feature/duy-login
  ```
  Ví dụ khác: `feature/an-trainer-dashboard`, `feature/binh-vet-pages`, `feature/chi-owner-pages`
- Code xong → tạo Pull Request merge vào `dev` (không phải `main`), có người khác review rồi mới merge
- Khi cả nhóm đã test ổn trên `dev`, tạo 1 PR từ `dev` → `main` để chốt bản demo/nộp bài
- Commit message ngắn gọn, tiền tố rõ ràng: `feat:`, `fix:`, `style:`, `docs:`
