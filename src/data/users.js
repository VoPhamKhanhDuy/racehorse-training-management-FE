// Mock data — khớp bảng USER trong ERD
// Tài khoản demo để test đăng nhập (mật khẩu chung: 123456)
const users = [
  { id: "U001", fullName: "Trần Văn Trưởng", email: "trainer@equitrack.vn", password: "123456", roleId: "head_trainer" },
  { id: "U002", fullName: "Nguyễn Thị Vet", email: "vet@equitrack.vn", password: "123456", roleId: "veterinarian" },
  { id: "U003", fullName: "Lê Văn Groom", email: "groom@equitrack.vn", password: "123456", roleId: "groom" },
  { id: "U004", fullName: "Phạm Thị Owner", email: "owner@equitrack.vn", password: "123456", roleId: "horse_owner" },
  { id: "U005", fullName: "Hoàng Văn Manager", email: "manager@equitrack.vn", password: "123456", roleId: "club_manager" },
  { id: "U006", fullName: "Đặng Minh Khoa", email: "owner2@equitrack.vn", password: "123456", roleId: "horse_owner" },
  { id: "U007", fullName: "Vũ Thu Hà", email: "owner3@equitrack.vn", password: "123456", roleId: "horse_owner" },
];

export default users;
