// Đánh giá buổi tập của Trainer và việc GỬI đánh giá cho chủ ngựa — gọi BE thật (services/trainingApi.js).
// Giữ tên file và tên hàm cũ để các trang không phải sửa; dạng dữ liệu trả về không đổi.
// Trainer đọc đánh giá qua session.review (API danh sách buổi tập, xem utils/sessionReview.js); Chủ ngựa đọc qua getOwnerSessionReviews.
import {
  getOwnerSessionReviewList,
  sendTrainerSessionReviewToOwner,
  submitTrainerSessionReview,
  updateTrainerSessionReview,
} from "./trainingApi";
import { reviewFromApi } from "../utils/sessionReview";

// POST /api/trainer/training-sessions/{id}/review (lần đầu) hoặc PUT (sửa khi chưa gửi chủ ngựa)
// data: { score: 1–10, assessment: Progress|Stable|Attention, comment (≤ 500 ký tự) } — lưu xong chủ ngựa CHƯA thấy
// Trả về đánh giá dạng { score, assessment, comment, trainerName, reviewedAt, sentToOwner, sentAt }
export async function submitSessionReview(session, data) {
  const body = { score: Number(data.score), assessment: data.assessment, comment: (data.comment ?? "").trim() };
  if (session.review) return reviewFromApi(await updateTrainerSessionReview(session.sessionId, body));
  try {
    return reviewFromApi(await submitTrainerSessionReview(session.sessionId, body));
  } catch (err) {
    // Danh sách trên màn hình cũ hơn BE (đã lưu ở lần bấm trước) → coi như sửa đánh giá chưa gửi
    if (err.status === 409 && err.code === "CONFLICT") return reviewFromApi(await updateTrainerSessionReview(session.sessionId, body));
    throw err;
  }
}

// POST /api/trainer/training-sessions/{id}/review/send-to-owner — gửi rồi thì không sửa được nữa
export async function sendEvaluationToOwner(sessionId) {
  return reviewFromApi(await sendTrainerSessionReviewToOwner(sessionId));
}

// GET /api/owner/session-reviews — đánh giá ĐÃ GỬI, chỉ của ngựa thuộc chủ đang đăng nhập (BE lọc), mới nhất trước.
// Nguồn DUY NHẤT cho cả "Nhận xét gần đây" và "Nhật ký hoạt động". limit = 0 → không giới hạn.
// horses: [{ HorseID }] — đúng 1 ngựa thì lọc theo ngựa đó (trang chi tiết ngựa)
export async function getOwnerSessionReviews(horses, limit = 5) {
  const list = await getOwnerSessionReviewList({ horseId: horses.length === 1 ? horses[0].HorseID : undefined, limit: limit || undefined });
  return list.map((r) => ({
    sessionId: r.sessionId,
    horseId: r.horseId,
    horseName: r.horseName,
    date: r.trainingDate,
    sessionTitle: r.sessionTitle,
    score: r.score,
    assessment: r.assessment,
    comment: r.comment,
    trainerName: r.trainerName,
    sentAt: r.sentAt,
  }));
}
