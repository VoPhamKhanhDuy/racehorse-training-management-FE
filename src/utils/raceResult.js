// Kết quả thi đấu (RACEREGISTRATION.ThuHang): null = chưa có kết quả; 0 = không xếp hạng; 1, 2, 3… = thứ hạng
export const NO_RANK = 0;
export const PODIUM_MAX = 3; // hạng 1–3 nổi bật hơn

export const hasResult = (registration) => registration?.ThuHang !== null && registration?.ThuHang !== undefined;

export const isPodiumRank = (rank) => Number.isInteger(rank) && rank >= 1 && rank <= PODIUM_MAX;

// Kết quả "đã nhập đủ": có thứ hạng và, nếu thuộc hạng 1–3, đã có tiền thưởng. Hạng lưu dở (có hạng mà thiếu tiền thưởng) KHÔNG tính là đã nhập.
export const isResultComplete = (registration) =>
  hasResult(registration) && (!isPodiumRank(registration.ThuHang) || (registration.TienThuong !== null && registration.TienThuong !== undefined));

// Hạng bằng chữ: 1 → "Nhất", 2 → "Nhì", 3 → "Ba", còn lại "Hạng N"
export function formatRankWord(thuHang) {
  return { 1: "Nhất", 2: "Nhì", 3: "Ba" }[thuHang] ?? formatRank(thuHang);
}

// 2 → "Hạng 2"; 0 → "Không xếp hạng"; null → ""
export function formatRank(thuHang) {
  if (thuHang === null || thuHang === undefined) return "";
  return thuHang === NO_RANK ? "Không xếp hạng" : `Hạng ${thuHang}`;
}
