import {
  CalendarCheck,
  CalendarDays,
  ClipboardList,
  FileCheck,
  FolderOpen,
  HeartPulse,
  History,
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
    { label: "Giáo án tập luyện", path: "/trainer/plans", icon: ClipboardList },
    { label: "Lịch tập", path: "/trainer/schedule", icon: CalendarDays },
    { label: "Buổi tập", path: "/trainer/sessions", icon: TrendingUp },
    { label: "Đăng ký thi đấu", path: "/trainer/race-registrations", icon: FileCheck },
    { label: "Kết quả thi đấu", path: "/trainer/races", icon: Trophy },
    { label: "Hồ sơ ngựa", path: "/trainer/horses", icon: FolderOpen },
  ],
  veterinarian: [
    { label: "Tổng quan sức khỏe", path: "/vet/overview", icon: HeartPulse },
    { label: "Khám bệnh", path: "/vet/exams", icon: Stethoscope },
    { label: "Sự cố", path: "/vet/incidents", icon: TriangleAlert },
    { label: "Lệnh khóa huấn luyện", path: "/vet/locks", icon: ShieldAlert },
    { label: "Lịch tiêm phòng", path: "/vet/vaccinations", icon: Syringe },
  ],
  groom: [
    { label: "Công việc hôm nay", path: "/groom/tasks", icon: ListChecks },
    { label: "Lịch tập được giao", path: "/groom/training", icon: CalendarCheck },
    { label: "Chuồng trại", path: "/groom/stable", icon: LayoutGrid },
    { label: "Báo cáo sự cố", path: "/groom/incidents", icon: TriangleAlert },
    { label: "Vật tư", path: "/groom/supplies", icon: Package },
  ],
  horse_owner: [
    { label: "Ngựa của tôi", path: "/owner/horses", icon: FolderOpen },
    { label: "Sức khỏe", path: "/owner/health", icon: HeartPulse },
    { label: "Lịch trình", path: "/owner/schedule", icon: CalendarDays },
    { label: "Thi đấu", path: "/owner/races", icon: Trophy },
    { label: "Chi phí", path: "/owner/finance", icon: Wallet },
  ],
  // Sắp theo mức ưu tiên công việc: việc cốt lõi/cần xử lý nhanh lên trên, xem định kỳ/audit xuống dưới
  club_manager: [
    { label: "Quản lý hồ sơ ngựa", path: "/manager/horses", icon: FolderOpen },
    { label: "Duyệt tài khoản", path: "/manager/approvals", icon: UserCheck },
    { label: "Đăng ký thi đấu", path: "/manager/race-registrations", icon: Trophy },
    { label: "Kết quả thi đấu", path: "/manager/race-results", icon: Trophy },
    { label: "Quản lý nhân sự", path: "/manager/staff", icon: Users },
    { label: "Quản lý vật tư", path: "/manager/supplies", icon: Package },
    { label: "Sự cố", path: "/manager/incidents", icon: TriangleAlert },
    // Ẩn tạm: Báo cáo hiệu suất & tài chính (/manager/reports)
    { label: "Chi phí & tiền thưởng", path: "/manager/finance", icon: Wallet },
    { label: "Nhật ký thao tác", path: "/manager/audit-log", icon: History },
  ],
};

export default roleMenus;
