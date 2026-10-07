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
];

export default trainingSessions;
