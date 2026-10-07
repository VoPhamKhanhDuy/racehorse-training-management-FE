import {
  Activity,
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
  UserCheck,
  Users,
  Wheat,
} from "lucide-react";

// Menu sidebar của từng role (roleId → danh sách mục). icon: component từ lucide-react
const roleMenus = {
  head_trainer: [
    { label: "Giáo án huấn luyện", path: "/trainer/plans", icon: ClipboardList },
    { label: "Lịch tập", path: "/trainer/schedule", icon: CalendarDays },
    { label: "Dashboard thể lực", path: "/trainer/dashboard", icon: Activity },
    { label: "Đánh giá phong độ", path: "/trainer/performance", icon: TrendingUp },
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
  club_manager: [
    { label: "Quản lý hồ sơ ngựa", path: "/manager/horses", icon: FolderOpen },
    { label: "Quản lý nhân sự", path: "/manager/staff", icon: Users },
    { label: "Quản lý vật tư", path: "/manager/supplies", icon: Package },
    { label: "Báo cáo hiệu suất & tài chính", path: "/manager/reports", icon: ChartColumn },
    { label: "Nhật ký thao tác", path: "/manager/audit-log", icon: History },
    { label: "Duyệt tài khoản", path: "/manager/approvals", icon: UserCheck },
  ],
};

export default roleMenus;
