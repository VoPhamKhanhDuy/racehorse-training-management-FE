import {
  Bandage,
  CalendarDays,
  ChartColumn,
  ClipboardList,
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
  Wheat,
} from "lucide-react";

// Menu sidebar của từng role (roleId → danh sách mục). icon: component từ lucide-react
const roleMenus = {
  head_trainer: [
    { label: "Giáo án tập luyện", path: "/trainer/plans", icon: ClipboardList },
    { label: "Lịch tập", path: "/trainer/schedule", icon: CalendarDays },
    { label: "Kết quả buổi tập", path: "/trainer/sessions", icon: TrendingUp },
    { label: "Đăng ký thi đấu", path: "/trainer/races", icon: Trophy },
    { label: "Hồ sơ ngựa", path: "/trainer/horses", icon: FolderOpen },
  ],
  veterinarian: [
    { label: "Hồ sơ khám bệnh", path: "/vet/records", icon: Stethoscope },
    { label: "Chấn thương", path: "/vet/injuries", icon: Bandage },
    { label: "Cảnh báo & khóa huấn luyện", path: "/vet/alerts", icon: ShieldAlert },
    { label: "Lịch tiêm phòng/tẩy giun", path: "/vet/vaccination", icon: Syringe },
  ],
  groom: [
    { label: "Sơ đồ chuồng trại", path: "/groom/stable-map", icon: LayoutGrid },
    { label: "Khẩu phần ăn", path: "/groom/feed", icon: Wheat },
    { label: "Công việc hằng ngày", path: "/groom/tasks", icon: ListChecks },
    { label: "Báo cáo sự cố", path: "/groom/incidents", icon: TriangleAlert },
  ],
  horse_owner: [
    { label: "Hồ sơ ngựa", path: "/owner/horses", icon: FolderOpen },
    { label: "Sức khỏe & thành tích", path: "/owner/health", icon: HeartPulse },
    { label: "Báo cáo chi phí/doanh thu", path: "/owner/reports", icon: ChartColumn },
  ],
  // Sắp theo mức ưu tiên công việc: việc cốt lõi/cần xử lý nhanh lên trên, xem định kỳ/audit xuống dưới
  club_manager: [
    { label: "Quản lý hồ sơ ngựa", path: "/manager/horses", icon: FolderOpen },
    { label: "Duyệt tài khoản", path: "/manager/approvals", icon: UserCheck },
    { label: "Quản lý nhân sự", path: "/manager/staff", icon: Users },
    { label: "Quản lý vật tư", path: "/manager/supplies", icon: Package },
    { label: "Báo cáo hiệu suất & tài chính", path: "/manager/reports", icon: ChartColumn },
    { label: "Nhật ký thao tác", path: "/manager/audit-log", icon: History },
  ],
};

export default roleMenus;
