import {
  CalendarCheck,
  CalendarDays,
  ClipboardList,
  FileCheck,
  FolderOpen,
  HeartPulse,
  History,
  LayoutDashboard,
  LayoutGrid,
  ListChecks,
  Package,
  ShieldAlert,
  Stethoscope,
  Syringe,
  TrendingUp,
  TriangleAlert,
  Trophy,
  UserCheck,
  Users,
  Wallet,
} from "lucide-react";

// Menu sidebar của từng role (roleId → danh sách mục). icon: component từ lucide-react
const roleMenus = {
  head_trainer: [
    { label: "Giáo Án Tập Luyện", path: "/trainer/plans", icon: ClipboardList },
    { label: "Lịch Tập", path: "/trainer/schedule", icon: CalendarDays },
    { label: "Buổi Tập", path: "/trainer/sessions", icon: TrendingUp },
    { label: "Đăng Ký Thi Đấu", path: "/trainer/race-registrations", icon: FileCheck },
    { label: "Kết Quả Thi Đấu", path: "/trainer/races", icon: Trophy },
    { label: "Hồ Sơ Ngựa", path: "/trainer/horses", icon: FolderOpen },
    { label: "Dashboard", path: "/trainer/dashboard", icon: LayoutDashboard },
  ],
  veterinarian: [
    { label: "Tổng Quan Sức Khỏe", path: "/vet/overview", icon: HeartPulse },
    { label: "Khám Bệnh", path: "/vet/exams", icon: Stethoscope },
    { label: "Sự Cố", path: "/vet/incidents", icon: TriangleAlert },
    { label: "Lệnh Khóa Huấn Luyện", path: "/vet/locks", icon: ShieldAlert },
    { label: "Lịch Tiêm Phòng", path: "/vet/vaccinations", icon: Syringe },
    { label: "Dashboard", path: "/vet/dashboard", icon: LayoutDashboard },
  ],
  groom: [
    { label: "Công Việc Hôm Nay", path: "/groom/tasks", icon: ListChecks },
    { label: "Lịch Tập Được Giao", path: "/groom/training", icon: CalendarCheck },
    { label: "Chuồng Trại", path: "/groom/stable", icon: LayoutGrid },
    { label: "Báo Cáo Sự Cố", path: "/groom/incidents", icon: TriangleAlert },
    { label: "Vật Tư", path: "/groom/supplies", icon: Package },
  ],
  horse_owner: [
    { label: "Ngựa Của Tôi", path: "/owner/horses", icon: FolderOpen },
    { label: "Sức Khỏe", path: "/owner/health", icon: HeartPulse },
    { label: "Lịch Trình", path: "/owner/schedule", icon: CalendarDays },
    { label: "Thi Đấu", path: "/owner/races", icon: Trophy },
    { label: "Chi Phí", path: "/owner/finance", icon: Wallet },
  ],
  // Sắp theo mức ưu tiên công việc: việc cốt lõi/cần xử lý nhanh lên trên, xem định kỳ/audit xuống dưới
  club_manager: [
    { label: "Quản Lý Hồ Sơ Ngựa", path: "/manager/horses", icon: FolderOpen },
    { label: "Duyệt Tài Khoản", path: "/manager/approvals", icon: UserCheck },
    { label: "Đăng Ký Thi Đấu", path: "/manager/race-registrations", icon: Trophy },
    { label: "Kết Quả Thi Đấu", path: "/manager/race-results", icon: Trophy },
    { label: "Quản Lý Nhân Sự", path: "/manager/staff", icon: Users },
    { label: "Quản Lý Vật Tư", path: "/manager/supplies", icon: Package },
    { label: "Sự Cố", path: "/manager/incidents", icon: TriangleAlert },
    // Ẩn tạm: Báo cáo hiệu suất & tài chính (/manager/reports)
    { label: "Chi Phí & Tiền Thưởng", path: "/manager/finance", icon: Wallet },
    { label: "Nhật Ký Thao Tác", path: "/manager/audit-log", icon: History },
    { label: "Dashboard", path: "/manager/dashboard", icon: LayoutDashboard },
  ],
};

export default roleMenus;
