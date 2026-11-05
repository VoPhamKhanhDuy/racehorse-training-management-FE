// Báo cáo & đánh giá buổi tập: Groom BÁO CÁO sự thật (có tập không, bao nhiêu km, ngựa phản ứng ra sao),
// Trainer ĐÁNH GIÁ (điểm 1–10, nhận định, nhận xét, có hiển thị cho chủ ngựa không). Chủ ngựa chỉ thấy đánh giá được bật hiển thị.

export const REPORT_RESULTS = [
  { code: "Completed", label: "Hoàn thành" },
  { code: "Abandoned", label: "Bỏ dở" },
  { code: "NotTrained", label: "Không tập" },
];

export const HORSE_REACTIONS = [
  { code: "Good", label: "Tốt" },
  { code: "Normal", label: "Bình thường" },
  { code: "Tired", label: "Mệt" },
  { code: "Abnormal", label: "Có dấu hiệu bất thường" },
];

export const ASSESSMENTS = [
  { code: "Progress", label: "Tiến bộ", color: "text-[#4d6b2a]" },
  { code: "Stable", label: "Ổn định", color: "text-[#4a3f33]" },
  { code: "Attention", label: "Cần chú ý", color: "text-[#c2570c]" },
];

export const REPORT_NOTE_MAX = 300;
export const REVIEW_COMMENT_MAX = 500;
export const REPORT_DISTANCE_MAX = 50;

const findLabel = (list, code) => list.find((item) => item.code === code)?.label ?? code ?? "";
export const resultLabel = (code) => findLabel(REPORT_RESULTS, code);
export const reactionLabel = (code) => findLabel(HORSE_REACTIONS, code);
export const assessmentLabel = (code) => findLabel(ASSESSMENTS, code);
export const assessmentColor = (code) => ASSESSMENTS.find((item) => item.code === code)?.color ?? "text-[#4a3f33]";

// ---- Trạng thái hiển thị của buổi tập ----
// Đã lên lịch → (quá giờ mà Groom chưa báo cáo) Chờ báo cáo → Hoàn thành / Bỏ dở / Không tập (Groom báo) → Đã đánh giá (Trainer chấm)
const STATE_LABELS = {
  Scheduled: "Đã lên lịch",
  InProgress: "Đang tập",
  AwaitingReport: "Chờ báo cáo",
  Completed: "Hoàn thành",
  Abandoned: "Bỏ dở",
  NotTrained: "Không tập",
  Reviewed: "Đã đánh giá",
  Cancelled: "Đã hủy",
};

// Màu chữ lấy từ bảng màu trạng thái có sẵn
const STATE_COLORS = {
  Scheduled: "text-[#4a3f33]",
  InProgress: "text-[#946330]",
  AwaitingReport: "text-[#c2570c]",
  Completed: "text-[#4d6b2a]",
  Abandoned: "text-[#9e5954]",
  NotTrained: "text-[#9e5954]",
  Reviewed: "text-[#4d6b2a]",
  Cancelled: "text-[#8a7f6e]",
};

export const sessionStateLabel = (state) => STATE_LABELS[state] ?? state;
export const sessionStateColor = (state) => STATE_COLORS[state] ?? "text-[#6b6055]";

// Buổi đã qua giờ kết thúc (hoặc giờ bắt đầu nếu không có giờ kết thúc)?
export function isSessionPast(session, now = new Date()) {
  if (!session.trainingDate) return false;
  const time = session.endTime || session.startTime || "23:59";
  return new Date(`${session.trainingDate}T${time}`) < now;
}

// record: bản ghi báo cáo / đánh giá của buổi (services/sessionReviewMock.js) hoặc undefined
export function sessionState(session, record) {
  if (session.status === "Cancelled") return "Cancelled";
  if (record?.review) return "Reviewed";
  if (record?.report) return record.report.result;
  if (session.status === "Completed") return "Completed";
  if (session.status === "InProgress") return "InProgress";
  return isSessionPast(session) ? "AwaitingReport" : "Scheduled";
}

// Tính vào "hoàn thành" / km thực tế: có báo cáo thì theo kết quả Groom báo, không thì theo trạng thái BE
export function isCompletedSession(session, record) {
  return record?.report ? record.report.result === "Completed" : session.status === "Completed";
}

export function actualDistanceOf(session, record) {
  if (record?.report) return record.report.actualDistanceKm;
  return session.status === "Completed" ? session.actualDistanceKm : null;
}

export function scoreOf(session, record) {
  return record?.review?.score ?? session.performanceScore ?? null;
}

// ---- 4 tình trạng của buổi tập (suy ra từ ngày giờ + báo cáo của Groom + đánh giá của Trainer) — dùng cho bộ lọc và khung chi tiết ----
export const STAGES = [
  { code: "Upcoming", label: "Chưa diễn ra" },
  { code: "AwaitingReport", label: "Chờ báo cáo" },
  { code: "AwaitingReview", label: "Chờ đánh giá" },
  { code: "Reviewed", label: "Đã đánh giá" },
];

export function sessionStage(session, record) {
  if (record?.review) return "Reviewed";
  if (record?.report) return "AwaitingReview";
  return isSessionPast(session) ? "AwaitingReport" : "Upcoming";
}

// Màu chữ cột "Trạng thái" của bảng buổi tập theo 4 tình trạng (màu có sẵn trong hệ thống)
const STAGE_COLORS = {
  Upcoming: "text-[#4a3f33]",
  AwaitingReport: "text-[#c2570c]",
  AwaitingReview: "text-[#9e5954]",
  Reviewed: "text-[#4d6b2a]",
};
export const stageColor = (stage) => STAGE_COLORS[stage] ?? "text-[#6b6055]";
export const stageLabel = (stage) => STAGES.find((item) => item.code === stage)?.label ?? stage;
