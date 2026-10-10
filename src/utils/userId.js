// TODO: bỏ khi BE trả UserID dạng số — users.js phía FE đang dùng id "U001",
// còn ERD tham chiếu USER bằng số (CreatedBy, GroomID, OwnerID)
export function toUserID(feUserId) {
  return Number(String(feUserId).replace(/\D/g, ""));
}
