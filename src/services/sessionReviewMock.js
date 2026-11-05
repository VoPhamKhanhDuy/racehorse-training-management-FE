// MOCK "báo cáo & đánh giá buổi tập" — lưu localStorage (key "sessionReviews"), CHƯA có API BE.
// Tách riêng khỏi trainingApi.js (API thật) để khi BE xong chỉ cần thay file này bằng lời gọi API, không sửa các trang.
// Mỗi hàm là 1 endpoint dự kiến (xem TODO). LƯU Ý: localStorage theo từng trình duyệt — demo bằng 1 trình duyệt, đổi tài khoản giữa các role.
import { REPORT_DISTANCE_MAX, REPORT_NOTE_MAX, REVIEW_COMMENT_MAX, hasSessionStarted } from "../utils/sessionReview";
import { seedDemoSessionRecords } from "../data/demoTrainingSessions";

const STORE_KEY = "sessionReviews";
const CHANGED_EVENT = "sessionReviews:changed";

function readAll() {
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeAll(value) {
  try {
    window.localStorage.setItem(STORE_KEY, JSON.stringify(value));
  } catch {
    // localStorage bị chặn → bỏ qua (mock chỉ phục vụ demo)
  }
  window.dispatchEvent(new Event(CHANGED_EVENT));
}

// Cho các trang tự tải lại khi báo cáo / đánh giá đổi (cùng tab qua sự kiện nội bộ, tab khác qua "storage")
export function subscribeSessionReviews(callback) {
  const onStorage = (e) => {
    if (e.key === STORE_KEY || e.key === null) callback();
  };
  window.addEventListener(CHANGED_EVENT, callback);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(CHANGED_EVENT, callback);
    window.removeEventListener("storage", onStorage);
  };
}

// Bản ghi nền của 1 buổi: giữ vài trường của buổi để Chủ ngựa đọc được mà không cần gọi API của Trainer
function baseRecord(session, existing) {
  return {
    sessionId: session.sessionId,
    horseId: session.horseId ?? existing?.horseId ?? null,
    horseName: session.horseName ?? existing?.horseName ?? "",
    trainingDate: session.trainingDate,
    startTime: session.startTime,
    sessionTitle: session.sessionTitle ?? "",
    report: existing?.report ?? null,
    review: existing?.review ?? null,
  };
}

// TODO: thay bằng API BE — GET /api/trainer/training-sessions (thêm report + review vào từng buổi) và GET /api/training-assignments/me (thêm report)
// Trả map sessionId → { report, review, ... }
// Mỗi lần đọc: (1) xóa mọi báo cáo / đánh giá gắn với buổi CHƯA đến giờ bắt đầu (dữ liệu lỗi từ trước); (2) gieo dữ liệu demo 1 lần (xem data/demoTrainingSessions.js)
export async function getSessionReviewMap() {
  const original = readAll();
  const pruned = Object.fromEntries(Object.entries(original).filter(([, r]) => !r.trainingDate || hasSessionStarted(r)));
  const result = seedDemoSessionRecords(pruned);
  if (JSON.stringify(result) !== JSON.stringify(original)) writeAll(result); // chỉ ghi khi có thay đổi (tránh lặp vô hạn qua sự kiện)
  return result;
}

// ---- GROOM ----

// TODO: thay bằng API BE — POST /api/groom/training-sessions/{id}/report
// data: { result: Completed|Abandoned|NotTrained, actualDistanceKm?, horseReaction: Good|Normal|Tired|Abnormal, note? (≤ 300 ký tự) }
export async function submitSessionReport(session, data, groomName) {
  if (!hasSessionStarted(session)) throw new Error("Chưa đến giờ tập, chưa thể báo cáo buổi này.");
  if (!data.result) throw new Error("Vui lòng chọn kết quả buổi tập.");
  if (!data.horseReaction) throw new Error("Vui lòng chọn phản ứng của ngựa.");
  const note = (data.note ?? "").trim();
  if (note.length > REPORT_NOTE_MAX) throw new Error(`Ghi chú tối đa ${REPORT_NOTE_MAX} ký tự.`);
  let km = null;
  if (data.result !== "NotTrained" && data.actualDistanceKm !== "" && data.actualDistanceKm != null) {
    km = Number(data.actualDistanceKm);
    if (!Number.isFinite(km) || km < 0 || km > REPORT_DISTANCE_MAX) throw new Error(`Quãng đường thực tế từ 0 đến ${REPORT_DISTANCE_MAX} km.`);
  }
  const all = readAll();
  const record = baseRecord(session, all[session.sessionId]);
  record.report = {
    result: data.result,
    actualDistanceKm: km,
    horseReaction: data.horseReaction,
    note,
    reportedByName: groomName,
    reportedAt: new Date().toISOString(),
  };
  writeAll({ ...all, [session.sessionId]: record });
  return record;
}

// ---- TRAINER ----

// TODO: thay bằng API BE — POST /api/trainer/training-sessions/{id}/review
// data: { score: 1–10, assessment: Progress|Stable|Attention, comment (≤ 500 ký tự), visibleToOwner }
export async function submitSessionReview(session, data, trainerName) {
  const all = readAll();
  const existing = all[session.sessionId];
  if (!hasSessionStarted(session)) throw new Error("Buổi tập chưa diễn ra, chưa thể đánh giá.");
  if (!existing?.report) throw new Error("Buổi tập chưa có báo cáo của nhân viên chăm sóc.");
  const score = Number(data.score);
  if (!Number.isInteger(score) || score < 1 || score > 10) throw new Error("Điểm phong độ từ 1 đến 10.");
  if (!data.assessment) throw new Error("Vui lòng chọn nhận định.");
  const comment = (data.comment ?? "").trim();
  if (!comment) throw new Error("Vui lòng nhập nhận xét.");
  if (comment.length > REVIEW_COMMENT_MAX) throw new Error(`Nhận xét tối đa ${REVIEW_COMMENT_MAX} ký tự.`);
  const record = baseRecord(session, existing);
  record.review = {
    score,
    assessment: data.assessment,
    comment,
    visibleToOwner: Boolean(data.visibleToOwner),
    trainerName,
    reviewedAt: new Date().toISOString(),
  };
  writeAll({ ...all, [session.sessionId]: record });
  return record;
}

// ---- OWNER ----

// TODO: thay bằng API BE — GET /api/owner/session-reviews?limit=5 (đánh giá có visibleToOwner của mọi ngựa thuộc chủ, mới nhất trước)
// KHÔNG trả báo cáo thô của Groom. horses: [{ HorseID, Ten }] — khớp theo mã ngựa, thiếu mã thì khớp theo tên
export async function getOwnerSessionReviews(horses, limit = 5) {
  const ids = new Set(horses.map((h) => Number(h.HorseID)));
  const names = new Set(horses.map((h) => h.Ten));
  return Object.values(readAll())
    .filter((r) => r.review?.visibleToOwner && hasSessionStarted(r) && (r.horseId != null ? ids.has(Number(r.horseId)) : names.has(r.horseName)))
    .sort((a, b) => b.trainingDate.localeCompare(a.trainingDate) || b.review.reviewedAt.localeCompare(a.review.reviewedAt))
    .slice(0, limit)
    .map((r) => ({
      sessionId: r.sessionId,
      horseId: r.horseId,
      horseName: r.horseName,
      date: r.trainingDate,
      score: r.review.score,
      assessment: r.review.assessment,
      comment: r.review.comment,
      trainerName: r.review.trainerName,
    }));
}
