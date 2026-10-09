import { daysFromToday } from "../utils/date";

// Mock data — khớp bảng TRAININGSESSION trong ERD (chỉ số + đánh giá phong độ sau buổi tập)
// NhipTim: nhịp/phút, VanToc: m/s, ChiSoTap: "Tốt" | "Khá" | "Trung bình" | "Kém"
const trainingSessions = [
  { SessionID: 1, HorseID: 2, NhipTim: 152, VanToc: 15.1, ChiSoTap: "Khá", NhanXet: "Tốc độ ổn, cần cải thiện đoạn cuối", Ngay: daysFromToday(-2) },
  { SessionID: 2, HorseID: 6, NhipTim: 138, VanToc: 15.8, ChiSoTap: "Tốt", NhanXet: "Phong độ xuất sắc, sẵn sàng tăng cự ly", Ngay: daysFromToday(-2) },
  { SessionID: 3, HorseID: 1, NhipTim: 140, VanToc: 14.2, ChiSoTap: "Tốt", NhanXet: "Ổn định, hồi phục nhanh", Ngay: daysFromToday(-1) },
  { SessionID: 4, HorseID: 4, NhipTim: 165, VanToc: 12.6, ChiSoTap: "Trung bình", NhanXet: "Nhịp tim cao, giảm khối lượng buổi sau", Ngay: daysFromToday(-1) },
  { SessionID: 5, HorseID: 5, NhipTim: 172, VanToc: 11.4, ChiSoTap: "Kém", NhanXet: "Có dấu hiệu mệt, báo bác sĩ thú y theo dõi", Ngay: daysFromToday(-1) },
  { SessionID: 6, HorseID: 1, NhipTim: 142, VanToc: 14.5, ChiSoTap: "Tốt", NhanXet: "Giữ nhịp tốt suốt cự ly", Ngay: daysFromToday(0) },
  // Các buổi tập cũ hơn — đủ dữ liệu cho biểu đồ ở trang Báo cáo hiệu suất
  { SessionID: 7, HorseID: 1, NhipTim: 145, VanToc: 14, ChiSoTap: "Tốt", NhanXet: "Bứt tốc tốt ở 400m cuối", Ngay: daysFromToday(-3) },
  { SessionID: 8, HorseID: 1, NhipTim: 148, VanToc: 13.8, ChiSoTap: "Khá", NhanXet: "Vào cua hơi rộng", Ngay: daysFromToday(-5) },
  { SessionID: 9, HorseID: 1, NhipTim: 150, VanToc: 13.6, ChiSoTap: "Khá", NhanXet: "Cần thêm bài sức bền", Ngay: daysFromToday(-8) },
  { SessionID: 10, HorseID: 2, NhipTim: 150, VanToc: 14.9, ChiSoTap: "Khá", NhanXet: "Xuất phát chậm", Ngay: daysFromToday(-4) },
  { SessionID: 11, HorseID: 2, NhipTim: 147, VanToc: 15, ChiSoTap: "Tốt", NhanXet: "Giữ tốc độ đều", Ngay: daysFromToday(-6) },
  { SessionID: 12, HorseID: 2, NhipTim: 155, VanToc: 14.6, ChiSoTap: "Trung bình", NhanXet: "Mất nhịp giữa bài", Ngay: daysFromToday(-9) },
  { SessionID: 13, HorseID: 6, NhipTim: 140, VanToc: 15.5, ChiSoTap: "Tốt", NhanXet: "Hồi phục nhanh sau bài chạy", Ngay: daysFromToday(-3) },
  { SessionID: 14, HorseID: 6, NhipTim: 143, VanToc: 15.3, ChiSoTap: "Tốt", NhanXet: "Phong độ ổn định", Ngay: daysFromToday(-7) },
  { SessionID: 15, HorseID: 4, NhipTim: 160, VanToc: 12.9, ChiSoTap: "Trung bình", NhanXet: "Nhịp tim còn cao", Ngay: daysFromToday(-5) },
  { SessionID: 16, HorseID: 4, NhipTim: 162, VanToc: 12.7, ChiSoTap: "Trung bình", NhanXet: "Cần giảm khối lượng", Ngay: daysFromToday(-10) },
  { SessionID: 17, HorseID: 5, NhipTim: 158, VanToc: 12.2, ChiSoTap: "Khá", NhanXet: "Đã đỡ mệt hơn tuần trước", Ngay: daysFromToday(-6) },
  { SessionID: 18, HorseID: 3, NhipTim: 150, VanToc: 13.1, ChiSoTap: "Khá", NhanXet: "Ngựa non, làm quen đường đất", Ngay: daysFromToday(-4) },
];

export default trainingSessions;
