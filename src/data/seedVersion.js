// Phiên bản dữ liệu SEED (mock trong src/data). TĂNG số này mỗi khi sửa seed theo cách có thể lệch với dữ liệu người dùng
// đã lưu trong localStorage (đổi/thêm id, đổi email, đổi OwnerID...). Khi số trong localStorage khác số này, phần dữ liệu
// USER-CREATED đã lưu bị xóa để seed mới nạp lại sạch (xem services/accountService.js).
export const SEED_VERSION = 2;

// Id do người dùng tạo khi dùng app (đăng ký, tạo nhân sự...) bắt đầu từ số này — không bao giờ trùng id seed.
export const USER_CREATED_ID_START = 1000;
