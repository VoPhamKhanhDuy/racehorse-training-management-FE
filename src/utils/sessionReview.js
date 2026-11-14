// Báo cáo & đánh giá buổi tập: Groom BÁO CÁO sự thật (có tập không, bao nhiêu km, ngựa phản ứng ra sao),
// Trainer ĐÁNH GIÁ (điểm 1–10, nhận định, nhận xét) rồi GỬI cho chủ ngựa (review.sentToOwner). Chủ ngựa chỉ thấy đánh giá đã gửi; đã gửi thì không sửa được.

export const REPORT_RESULTS = [
  { code: "Completed", label: "Hoàn thành" },
  { code: "Abandoned", label: "Bỏ dở" },
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
  Sent: "Đã gửi chủ ngựa",
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
  Sent: "text-[#4d6b2a]",
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

// Buổi đã ĐẾN GIỜ BẮT ĐẦU chưa? (Groom chỉ được báo cáo, Trainer chỉ được đánh giá khi đã đến giờ) — thiếu giờ thì coi là đầu ngày
export function hasSessionStarted(session, now = new Date()) {
  if (!session.trainingDate) return false;
  return new Date(`${session.trainingDate}T${session.startTime || "00:00"}`) <= now;
}

// Đánh giá của BE (session.review: { score, assessment, comment, reviewedByName, reviewedAt, sentToOwnerAt }) → dạng dùng trong giao diện
export const reviewFromApi = (dto) =>
  dto
    ? {
        score: dto.score,
        assessment: dto.assessment,
        comment: dto.comment,
        trainerName: dto.reviewedByName,
        reviewedAt: dto.reviewedAt,
        sentToOwner: Boolean(dto.sentToOwnerAt),
        sentAt: dto.sentToOwnerAt ?? null,
      }
    : null;

// Báo cáo (session.report, Groom) và đánh giá (session.review, Trainer) đều đến từ API cùng buổi tập; chỉ có giá trị khi buổi đã đến giờ bắt đầu.
// Tham số thứ hai của các hàm bên dưới được giữ cho các nơi gọi cũ nhưng không còn dùng.
const validRecord = (session) => {
  if (!hasSessionStarted(session)) return undefined;
  return { report: session.report ?? null, review: reviewFromApi(session.review) };
};
export const sessionRecord = validRecord;

// record: bản ghi báo cáo / đánh giá của buổi (services/sessionReviewMock.js) hoặc undefined
export function sessionState(session, record) {
  record = validRecord(session, record);
  if (session.status === "Cancelled") return "Cancelled";
  if (record?.review) return record.review.sentToOwner ? "Sent" : "Reviewed";
  if (record?.report) return record.report.result;
  if (session.status === "Completed") return "Completed";
  if (session.status === "InProgress") return "InProgress";
  return hasSessionStarted(session) ? "AwaitingReport" : "Scheduled";
}

// Tính vào "hoàn thành" / km thực tế: có báo cáo thì theo kết quả Groom báo, không thì theo trạng thái BE
export function isCompletedSession(session, record) {
  record = validRecord(session, record);
  return record?.report ? record.report.result === "Completed" : session.status === "Completed";
}

export function actualDistanceOf(session, record) {
  record = validRecord(session, record);
  if (record?.report) return record.report.actualDistanceKm;
  return session.status === "Completed" ? session.actualDistanceKm : null;
}

export function scoreOf(session, record) {
  record = validRecord(session, record);
  return record?.review?.score ?? session.performanceScore ?? null;
}

// ---- 4 tình trạng của buổi tập (suy ra từ ngày giờ + báo cáo của Groom + đánh giá của Trainer) — dùng cho bộ lọc và khung chi tiết ----
export const STAGES = [
  { code: "Upcoming", label: "Chưa diễn ra" },
  { code: "AwaitingReport", label: "Chờ báo cáo" },
  { code: "AwaitingReview", label: "Chờ đánh giá" },
  { code: "Reviewed", label: "Đã đánh giá" },
  { code: "Sent", label: "Đã gửi chủ ngựa" },
];

// Chưa đến giờ bắt đầu → luôn "Chưa diễn ra"; đã đến giờ → Chờ báo cáo / Chờ đánh giá / Đã đánh giá
export function sessionStage(session, record) {
  record = validRecord(session, record);
  if (!hasSessionStarted(session)) return "Upcoming";
  if (!record?.report) return "AwaitingReport";
  if (record.review) return record.review.sentToOwner ? "Sent" : "Reviewed";
  return "AwaitingReview";
}

// Màu chữ cột "Trạng thái" của bảng buổi tập theo 4 tình trạng (màu có sẵn trong hệ thống)
const STAGE_COLORS = {
  Upcoming: "text-[#4a3f33]",
  AwaitingReport: "text-[#c2570c]",
  AwaitingReview: "text-[#9e5954]",
  Reviewed: "text-[#4d6b2a]",
  Sent: "text-[#4d6b2a]",
};
export const stageColor = (stage) => STAGE_COLORS[stage] ?? "text-[#6b6055]";
export const stageLabel = (stage) => STAGES.find((item) => item.code === stage)?.label ?? stage;
