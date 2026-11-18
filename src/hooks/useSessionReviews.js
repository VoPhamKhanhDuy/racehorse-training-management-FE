// Trước đây trả map sessionId → bản ghi báo cáo / đánh giá lưu localStorage. Nay báo cáo (session.report) và đánh giá (session.review)
// đi kèm từng buổi tập từ API (xem utils/sessionReview.js) nên hook không còn dữ liệu riêng; giữ lại map rỗng để các trang cũ chưa phải sửa.
// TODO: bỏ hook này cùng tham số `record` ở các trang Groom / Trainer khi dọn dẹp.
const NO_RECORDS = {};

export default function useSessionReviews() {
  return NO_RECORDS;
}
