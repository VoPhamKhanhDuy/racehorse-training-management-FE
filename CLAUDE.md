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
Mở link hiện ra (thường `http://localhost:5173`) trên trình duyệt.

## Tech stack
- React 18 + Vite
- React Router (`react-router-dom`) cho điều hướng
- Tailwind CSS cho styling — KHÔNG viết CSS thuần trong file `.css` riêng trừ khi thật cần thiết
- Chưa có backend thật — dùng mock data (JSON/array) trong `src/data/`
- Chưa cần TypeScript, dùng JavaScript thường (`.jsx`)

## Cấu trúc thư mục (bắt buộc theo đúng, không tự đổi tên folder)

```
src/
  components/       # Component dùng chung nhiều nơi (Button, Table, Sidebar, Header, Modal...)
  pages/
    auth/           # Login, Register, PendingApproval
    trainer/        # Các trang của Head Trainer
    vet/            # Các trang của Veterinarian
    groom/          # Các trang của Groom/Stable Hand
    owner/          # Các trang của Horse Owner
    manager/        # Các trang của Club Manager
  routes/           # Cấu hình route + ProtectedRoute (chặn theo role)
  hooks/            # Custom hook dùng chung (vd useAuth)
  context/          # AuthContext (lưu user + role đang đăng nhập)
  services/         # (Để trống trước) Chỗ gọi API khi nối backend thật sau này
  utils/            # Hàm tiện ích (format ngày tháng, validate form...)
  data/             # Mock data (horses.js, users.js, schedules.js...)
  assets/
    images/         # Ảnh
    fonts/          # Font chữ
  styles/           # CSS global, cấu hình theme
  App.jsx           # Component gốc, khai báo layout/route
  main.jsx          # Entry point, render App vào DOM
public/             # File tĩnh phục vụ trực tiếp (favicon, robots.txt)
```

File nào đặt sai vị trí (vd component dùng chung mà để trong `pages/`, hoặc mock data để lẫn trong `components/`) coi như sai cấu trúc, phải sửa lại trước khi merge.

**Quy tắc:** mỗi thành viên code role nào thì CHỈ tạo file trong đúng folder role đó (`pages/<role>/`). Component dùng chung mới cho vào `components/`. Việc này để tránh conflict khi merge code trên GitHub.

## Quy tắc đặt tên
- Tên component: PascalCase — `TrainingPlanForm.jsx`, `HorseCard.jsx`
- Tên file không phải component (data, util, hook): camelCase — `mockHorses.js`, `useAuth.js`
- Tên biến/hàm: camelCase tiếng Anh, KHÔNG dùng tiếng Việt không dấu trong code (vd viết `injuryStatus` chứ không viết `tinhtrangchanthuong`)
- Text hiển thị trên giao diện (UI): tiếng Việt có dấu đầy đủ

## Quy tắc code component
- Ưu tiên function component + hook, KHÔNG dùng class component
- Mỗi file chỉ nên chứa 1 component chính
- Nếu 1 trang có logic phức tạp, tách nhỏ thành nhiều component con thay vì viết 1 file dài
- Dữ liệu giả (mock) luôn để trong `src/data/`, KHÔNG hard-code mảng dữ liệu trực tiếp trong file trang

## Cấu trúc mock data (bắt buộc theo đúng field, khớp ERD — để tránh mỗi người đặt tên field khác nhau)

```js
// data/horses.js — khớp bảng HORSE
{ HorseID: 1, Ten: "Thunder", Giong: "Thoroughbred", Tuoi: 4, CanNang: 450, DongDoi: "A", OwnerID: 4 }

// data/trainingPlans.js — khớp bảng TRAININGPLAN
{ PlanID: 1, HorseID: 1, CuLy: 1200, KhoiLuong: 80, MatSan: "Đường đất", GiaiDoan: "Nền tảng", CreatedBy: 1 }

// data/trainingSchedules.js — khớp bảng TRAININGSCHEDULE
{ ScheduleID: 1, HorseID: 1, GroomID: 3, Ngay: "2026-10-08", Gio: "06:30" }

// data/trainingSessions.js — khớp bảng TRAININGSESSION (đánh giá phong độ)
{ SessionID: 1, HorseID: 1, NhipTim: 140, VanToc: 14.2, ChiSoTap: "Tốt", NhanXet: "Ổn định", Ngay: "2026-10-08" }

// data/users.js — tài khoản đăng nhập phía FE (giữ format riêng, roleId là mã RBAC ở mục dưới)
{ id: "U001", fullName: "Nguyễn Văn A", email: "...", password: "...", roleId: "head_trainer" }
```
TRAININGSCHEDULE gán theo GroomID (người thực hiện lịch), không phải TrainerID — HLV chỉ tạo TRAININGPLAN (CreatedBy), còn lịch tập hằng ngày do Groom thực hiện theo kế hoạch đó.

Khi thêm entity mới (HealthRecord, Injury, Supply...), thêm file mới trong `data/` theo đúng field đã định nghĩa trong ERD — không tự đặt tên field khác đi.

## RBAC (phân quyền)
- Role hiện tại lưu trong `AuthContext` (`src/context/AuthContext.jsx`)
- Mỗi route trong `src/routes/` phải bọc bằng `<ProtectedRoute allowedRoles={[...]}>` để chặn user vào nhầm trang không thuộc role của mình
- 5 mã role hợp lệ (roleId), PHẢI khớp đúng với giá trị trong bảng ROLE của ERD — nếu ERD dùng tên khác thì sửa lại 5 mã dưới đây cho khớp trước khi code:
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
