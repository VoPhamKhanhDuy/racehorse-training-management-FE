// Mock data — khớp bảng USER trong ERD
// Tài khoản demo để test đăng nhập (mật khẩu chung: 123456)
// status: "pending" (Chủ ngựa vừa đăng ký, chờ Quản lý CLB duyệt) | "approved" | "rejected"
// isActive: false = tài khoản bị Quản lý CLB khóa, không đăng nhập được (khác status: status là bước duyệt đăng ký)
// mustChangePassword: true = tài khoản nhân sự mới đang dùng mật khẩu mặc định, phải đổi ở lần đăng nhập đầu
// createdAt: ngày đăng ký/tạo tài khoản ("YYYY-MM-DD")
import { daysFromToday } from "../utils/date";

const users = [
  { id: "U001", fullName: "Trần Văn Trưởng", email: "trainer@equitrack.vn", password: "123456", roleId: "head_trainer", status: "approved", isActive: true, mustChangePassword: false, createdAt: "2026-08-01" },
  { id: "U002", fullName: "Nguyễn Thị Vet", email: "vet@equitrack.vn", password: "123456", roleId: "veterinarian", status: "approved", isActive: true, mustChangePassword: false, createdAt: "2026-08-01" },
  { id: "U003", fullName: "Lê Văn Groom", email: "groom@equitrack.vn", password: "123456", roleId: "groom", status: "approved", isActive: true, mustChangePassword: false, createdAt: "2026-08-01" },
  { id: "U004", fullName: "Phạm Thị Owner", email: "owner@equitrack.vn", password: "123456", roleId: "horse_owner", status: "approved", isActive: true, mustChangePassword: false, createdAt: "2026-08-05" },
  { id: "U005", fullName: "Hoàng Văn Manager", email: "manager@equitrack.vn", password: "123456", roleId: "club_manager", status: "approved", isActive: true, mustChangePassword: false, createdAt: "2026-08-01" },
  { id: "U006", fullName: "Đặng Minh Khoa", email: "owner2@equitrack.vn", password: "123456", roleId: "horse_owner", status: "approved", isActive: true, mustChangePassword: false, createdAt: "2026-08-12" },
  { id: "U007", fullName: "Vũ Thu Hà", email: "owner3@equitrack.vn", password: "123456", roleId: "horse_owner", status: "approved", isActive: true, mustChangePassword: false, createdAt: "2026-08-20" },
  // Demo trang Duyệt tài khoản — ngày đăng ký tính lùi từ hôm nay để "X ngày trước" luôn hợp lý
  { id: "U008", fullName: "Bùi Quốc Bảo", email: "pending1@equitrack.vn", password: "123456", roleId: "horse_owner", status: "pending", isActive: true, mustChangePassword: false, createdAt: daysFromToday(-5) },
  { id: "U009", fullName: "Trịnh Mai Lan", email: "pending2@equitrack.vn", password: "123456", roleId: "horse_owner", status: "pending", isActive: true, mustChangePassword: false, createdAt: daysFromToday(-2) },
  { id: "U010", fullName: "Ngô Đức Huy", email: "pending3@equitrack.vn", password: "123456", roleId: "horse_owner", status: "pending", isActive: true, mustChangePassword: false, createdAt: daysFromToday(0) },
  { id: "U011", fullName: "Lý Thanh Tùng", email: "rejected@equitrack.vn", password: "123456", roleId: "horse_owner", status: "rejected", isActive: true, mustChangePassword: false, createdAt: daysFromToday(-9) },
  // Demo trang Quản lý nhân sự: 1 tài khoản đã bị khóa
  { id: "U012", fullName: "Phan Văn Tài", email: "groom2@equitrack.vn", password: "123456", roleId: "groom", status: "approved", isActive: false, mustChangePassword: false, createdAt: "2026-08-15" },
];

export default users;
