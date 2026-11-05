// DỮ LIỆU MẪU CỤC BỘ (MOCK) để demo đủ 4 trạng thái buổi tập của Trainer — chờ BE / dữ liệu thật.
// TODO: xóa file này (và chỗ gọi trong TrainingSessions.jsx, services/sessionReviewMock.js) khi có buổi tập thật đã qua giờ trên API.
// Lý do: hôm nay mọi buổi tập thật đều ở tương lai nên chỉ có "Chưa diễn ra". Chưa kiểm chứng được API xếp lịch tuần có cho tạo buổi ở ngày đã qua hay không
// (form tạo buổi lẻ có min = hôm nay; BE chưa xác nhận) → dùng 4 buổi mẫu đã qua của Bamboo Wind, giao Le Hoang Nam (các ngày hôm nay −4 … −1, tính theo ngày chạy):
//   demo-1: chưa có báo cáo            → "Chờ báo cáo"
//   demo-2: Groom báo Hoàn thành       → "Chờ đánh giá"
//   demo-3: đã báo cáo + đã đánh giá   → "Đã đánh giá"
//   demo-4: Groom báo Bỏ dở kèm lý do  → "Chờ đánh giá"
import { daysFromToday } from "../utils/date";

const baseSession = {
  horseId: null,
  horseName: "Bamboo Wind",
  assignedToUserId: null,
  assignedToName: "Le Hoang Nam",
  status: "Scheduled",
  isDemo: true,
};

export function getDemoSessions() {
  return [
    { ...baseSession, sessionId: "demo-1", trainingDate: daysFromToday(-4), startTime: "06:30", endTime: "07:30", sessionTitle: "Phi chậm nền tảng", surface: "Dirt", intensityLevel: "Medium", distanceKm: 3, durationMinutes: 60 },
    { ...baseSession, sessionId: "demo-2", trainingDate: daysFromToday(-3), startTime: "06:30", endTime: "07:15", sessionTitle: "Nước kiệu hồi phục", surface: "Sand", intensityLevel: "Low", distanceKm: 4, durationMinutes: 45 },
    { ...baseSession, sessionId: "demo-3", trainingDate: daysFromToday(-2), startTime: "06:30", endTime: "07:30", sessionTitle: "Chạy biến tốc", surface: "Dirt", intensityLevel: "High", distanceKm: 2, durationMinutes: 60 },
    { ...baseSession, sessionId: "demo-4", trainingDate: daysFromToday(-1), startTime: "06:30", endTime: "07:30", sessionTitle: "Phi nước đại", surface: "Turf", intensityLevel: "High", distanceKm: 3, durationMinutes: 60 },
  ];
}

const isoAt = (date, time) => new Date(`${date}T${time}`).toISOString();

// Thêm báo cáo / đánh giá mẫu cho các buổi demo nếu chưa có (không ghi đè). Trả về chính map nếu không đổi gì.
export function seedDemoSessionRecords(map) {
  const [, s2, s3, s4] = getDemoSessions();
  const wanted = {
    "demo-2": { session: s2, report: { result: "Completed", actualDistanceKm: 4, horseReaction: "Good", note: "Ngựa giữ nhịp ổn định.", time: "08:00" } },
    "demo-3": {
      session: s3,
      report: { result: "Completed", actualDistanceKm: 2, horseReaction: "Normal", note: "", time: "08:10" },
      review: { score: 8, assessment: "Progress", comment: "Tốc độ ổn định, giữ được nhịp ở đoạn cuối.", visibleToOwner: true, time: "09:00" },
    },
    "demo-4": { session: s4, report: { result: "Abandoned", actualDistanceKm: 1.2, horseReaction: "Tired", note: "Ngựa mệt, dừng sớm theo yêu cầu của nhân viên.", time: "07:45" } },
  };
  let next = map;
  Object.entries(wanted).forEach(([id, { session, report, review }]) => {
    if (map[id]) return;
    if (next === map) next = { ...map };
    next[id] = {
      sessionId: id,
      horseId: null,
      horseName: session.horseName,
      trainingDate: session.trainingDate,
      startTime: session.startTime,
      sessionTitle: session.sessionTitle,
      report: { result: report.result, actualDistanceKm: report.actualDistanceKm, horseReaction: report.horseReaction, note: report.note, reportedByName: "Le Hoang Nam", reportedAt: isoAt(session.trainingDate, report.time) },
      review: review
        ? { score: review.score, assessment: review.assessment, comment: review.comment, visibleToOwner: review.visibleToOwner, trainerName: "Head Trainer", reviewedAt: isoAt(session.trainingDate, review.time) }
        : null,
    };
  });
  return next;
}
