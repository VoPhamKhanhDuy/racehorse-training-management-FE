import { daysFromToday } from "../utils/date";

// Mock data — khớp bảng TRAININGSESSION trong ERD (kết quả + đánh giá phong độ sau mỗi buổi tập)
// NhipTim: bpm, VanToc: km/h, ChiSoTap: chỉ số tập thang 0–100 (đơn vị/giới hạn ở data/trainingSessionOptions.js)
// Ngay = hôm nay − n (n từ 1 đến 21), không có buổi trong tương lai; mỗi ngựa tối đa 1 buổi mỗi ngày.
// Mỗi ngựa một xu hướng (viết tay, có buổi thụt): Thunder — đi ngang; Lightning — tăng rồi chững; Storm — 4 buổi cũ, trước khi khóa tập; Blaze — tăng ổn định; Shadow — giảm nhẹ 3 buổi gần nhất; Spirit — tăng rồi chững.
// Nhịp tim 165–198 bpm, dao động 5–12 bpm giữa các buổi liên tiếp.
// Các ngày 1–3 khớp lịch tập đã qua (tỷ lệ hoàn thành lịch ở trang Báo cáo).
const trainingSessions = [
  { SessionID: 1, HorseID: 3, NhipTim: 191, VanToc: 47.1, ChiSoTap: 57, NhanXet: "Ra mồ hôi nhiều, theo dõi lượng nước", Ngay: daysFromToday(-21) },
  { SessionID: 2, HorseID: 5, NhipTim: 180, VanToc: 48.5, ChiSoTap: 63, NhanXet: "Lệch nhẹ sang trái khi chạy thẳng", Ngay: daysFromToday(-21) },
  { SessionID: 3, HorseID: 6, NhipTim: 175, VanToc: 53.1, ChiSoTap: 70, NhanXet: "Hào hứng quá đầu bài, cần kìm nhịp", Ngay: daysFromToday(-21) },
  { SessionID: 4, HorseID: 1, NhipTim: 172, VanToc: 54.6, ChiSoTap: 76, NhanXet: "Giữ nhịp ổn định ở 600m cuối", Ngay: daysFromToday(-20) },
  { SessionID: 5, HorseID: 2, NhipTim: 186, VanToc: 49.8, ChiSoTap: 62, NhanXet: "Xuất phát chậm, đoạn giữa ổn", Ngay: daysFromToday(-19) },
  { SessionID: 6, HorseID: 4, NhipTim: 194, VanToc: 46.2, ChiSoTap: 58, NhanXet: "Hơi ngần ngại khi tăng tốc lần hai", Ngay: daysFromToday(-19) },
  { SessionID: 7, HorseID: 3, NhipTim: 183, VanToc: 48.8, ChiSoTap: 62, NhanXet: "Còn lệch hướng ở đoạn thẳng thứ hai", Ngay: daysFromToday(-18) },
  { SessionID: 8, HorseID: 5, NhipTim: 172, VanToc: 50.1, ChiSoTap: 69, NhanXet: "Phản ứng với hiệu lệnh nhanh hơn tuần trước", Ngay: daysFromToday(-18) },
  { SessionID: 9, HorseID: 6, NhipTim: 167, VanToc: 55.4, ChiSoTap: 76, NhanXet: "Giữ đầu thấp, dáng chạy đẹp", Ngay: daysFromToday(-18) },
  { SessionID: 10, HorseID: 1, NhipTim: 181, VanToc: 55.3, ChiSoTap: 79, NhanXet: "Vào cua gọn, sải chân đều", Ngay: daysFromToday(-17) },
  { SessionID: 11, HorseID: 2, NhipTim: 178, VanToc: 51.6, ChiSoTap: 68, NhanXet: "Đáp ứng tốt bài biến tốc", Ngay: daysFromToday(-16) },
  { SessionID: 12, HorseID: 5, NhipTim: 178, VanToc: 51.4, ChiSoTap: 72, NhanXet: "Cân bằng tốt khi đổi chân ở khúc cua", Ngay: daysFromToday(-16) },
  { SessionID: 13, HorseID: 3, NhipTim: 177, VanToc: 49, ChiSoTap: 63, NhanXet: "Vấp nhẹ ở khúc cua thứ hai, không đau", Ngay: daysFromToday(-15) },
  { SessionID: 14, HorseID: 4, NhipTim: 186, VanToc: 47.5, ChiSoTap: 63, NhanXet: "Bài đầu sau nghỉ, giữ cường độ thấp", Ngay: daysFromToday(-15) },
  { SessionID: 15, HorseID: 1, NhipTim: 170, VanToc: 54.1, ChiSoTap: 73, NhanXet: "Hơi nặng chân đoạn đầu, cần theo dõi", Ngay: daysFromToday(-14) },
  { SessionID: 16, HorseID: 6, NhipTim: 176, VanToc: 57.2, ChiSoTap: 81, NhanXet: "Tốc độ đều suốt bài, ít dao động", Ngay: daysFromToday(-14) },
  { SessionID: 17, HorseID: 2, NhipTim: 189, VanToc: 53.2, ChiSoTap: 71, NhanXet: "Sải dài hơn trên mặt sân cỏ", Ngay: daysFromToday(-13) },
  { SessionID: 18, HorseID: 3, NhipTim: 188, VanToc: 48.1, ChiSoTap: 60, NhanXet: "Bài nhẹ phục hồi, ngựa thoải mái", Ngay: daysFromToday(-12) },
  { SessionID: 19, HorseID: 4, NhipTim: 191, VanToc: 48.9, ChiSoTap: 67, NhanXet: "Sải chân đều hơn tuần trước", Ngay: daysFromToday(-12) },
  { SessionID: 20, HorseID: 5, NhipTim: 170, VanToc: 52.6, ChiSoTap: 76, NhanXet: "Giữ được tốc độ mục tiêu ba vòng liên tiếp", Ngay: daysFromToday(-12) },
  { SessionID: 21, HorseID: 1, NhipTim: 178, VanToc: 55, ChiSoTap: 78, NhanXet: "Hồi phục nhịp tim nhanh sau bài chạy", Ngay: daysFromToday(-11) },
  { SessionID: 22, HorseID: 6, NhipTim: 171, VanToc: 58.6, ChiSoTap: 86, NhanXet: "Phục hồi nhanh sau bài nặng", Ngay: daysFromToday(-11) },
  { SessionID: 23, HorseID: 2, NhipTim: 180, VanToc: 54.9, ChiSoTap: 79, NhanXet: "Tăng tốc mượt, không bị gồng", Ngay: daysFromToday(-10) },
  { SessionID: 24, HorseID: 5, NhipTim: 176, VanToc: 53, ChiSoTap: 79, NhanXet: "Nhịp chân dứt khoát, tinh thần tốt", Ngay: daysFromToday(-9) },
  { SessionID: 25, HorseID: 6, NhipTim: 165, VanToc: 58.9, ChiSoTap: 88, NhanXet: "Tập trung tốt, ít bị phân tâm", Ngay: daysFromToday(-9) },
  { SessionID: 26, HorseID: 1, NhipTim: 168, VanToc: 54.4, ChiSoTap: 75, NhanXet: "Chạy đều, chưa bứt được ở cuối", Ngay: daysFromToday(-8) },
  { SessionID: 27, HorseID: 4, NhipTim: 182, VanToc: 48.4, ChiSoTap: 65, NhanXet: "Chậm nhịp ở 200m đầu rồi lấy lại được", Ngay: daysFromToday(-8) },
  { SessionID: 28, HorseID: 2, NhipTim: 172, VanToc: 55.1, ChiSoTap: 80, NhanXet: "Theo kịp ngựa dẫn tốc suốt bài", Ngay: daysFromToday(-7) },
  { SessionID: 29, HorseID: 1, NhipTim: 176, VanToc: 55.6, ChiSoTap: 80, NhanXet: "Bứt tốc tốt ở 400m cuối", Ngay: daysFromToday(-6) },
  { SessionID: 30, HorseID: 6, NhipTim: 173, VanToc: 58.3, ChiSoTap: 85, NhanXet: "Tốc độ chững lại, giữ cường độ hiện tại", Ngay: daysFromToday(-6) },
  { SessionID: 31, HorseID: 4, NhipTim: 177, VanToc: 50.6, ChiSoTap: 72, NhanXet: "Tốc độ cải thiện rõ so với tuần trước", Ngay: daysFromToday(-5) },
  { SessionID: 32, HorseID: 5, NhipTim: 184, VanToc: 52.1, ChiSoTap: 74, NhanXet: "Mỏi rõ ở vòng cuối, chưa nên tăng cự ly", Ngay: daysFromToday(-5) },
  { SessionID: 33, HorseID: 2, NhipTim: 179, VanToc: 54.6, ChiSoTap: 77, NhanXet: "Chưa vượt được mốc tốc độ tuần trước", Ngay: daysFromToday(-4) },
  { SessionID: 34, HorseID: 1, NhipTim: 185, VanToc: 54.2, ChiSoTap: 72, NhanXet: "Thở gấp hơn thường lệ, giảm cường độ buổi sau", Ngay: daysFromToday(-3) },
  { SessionID: 35, HorseID: 5, NhipTim: 190, VanToc: 51.2, ChiSoTap: 70, NhanXet: "Nhịp chân chậm dần, cần xem lại khẩu phần", Ngay: daysFromToday(-3) },
  { SessionID: 36, HorseID: 2, NhipTim: 171, VanToc: 55.3, ChiSoTap: 81, NhanXet: "Giữ phong độ, chưa có bước tiến mới", Ngay: daysFromToday(-2) },
  { SessionID: 37, HorseID: 6, NhipTim: 166, VanToc: 59, ChiSoTap: 87, NhanXet: "Ổn định ở mức cao, chưa tăng thêm", Ngay: daysFromToday(-2) },
  { SessionID: 38, HorseID: 1, NhipTim: 174, VanToc: 54.9, ChiSoTap: 77, NhanXet: "Ổn định, có thể giữ giáo án hiện tại", Ngay: daysFromToday(-1) },
  { SessionID: 39, HorseID: 4, NhipTim: 170, VanToc: 52.1, ChiSoTap: 78, NhanXet: "Thời gian chạy tốt nhất trong tháng", Ngay: daysFromToday(-1) },
  { SessionID: 40, HorseID: 5, NhipTim: 196, VanToc: 50.4, ChiSoTap: 66, NhanXet: "Hụt hơi ở đoạn cuối, cần theo dõi", Ngay: daysFromToday(-1) },
];

export default trainingSessions;
