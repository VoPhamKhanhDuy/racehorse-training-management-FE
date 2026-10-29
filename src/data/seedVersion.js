// Phiên bản dữ liệu SEED (mock trong src/data). TĂNG số này mỗi khi sửa seed theo cách có thể lệch với dữ liệu người dùng
// đã lưu trong localStorage (đổi/thêm id, đổi email, đổi OwnerID...). Khi số trong localStorage khác số này, phần dữ liệu
// USER-CREATED đã lưu bị xóa để seed mới nạp lại sạch (xem services/accountService.js, services/persistedStore.js).
// Lịch sử: 4 → 5 khi bỏ TienThuong của Thunder – Cúp Tam Đảo (hạng Ba) để demo "Chưa nhập".
// 3 → 4 khi thêm bảng EXPENSE + trường TienThuong của RACEREGISTRATION (trang Chi phí của chủ ngựa).
// 2 → 3 khi seed lịch tập (trainingSchedules) giảm buổi tập sắp tới của ngựa chủ ngựa demo + thêm lớp lưu bền.
export const SEED_VERSION = 5;

// Id do người dùng tạo khi dùng app (đăng ký, tạo nhân sự...) bắt đầu từ số này — không bao giờ trùng id seed.
export const USER_CREATED_ID_START = 1000;
