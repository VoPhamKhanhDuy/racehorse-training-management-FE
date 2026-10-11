// Kết quả thi đấu (RACEREGISTRATION.ThuHang): null = chưa có kết quả; 0 = không xếp hạng; 1, 2, 3… = thứ hạng
export const NO_RANK = 0;
export const PODIUM_MAX = 3; // hạng 1–3 nổi bật hơn

export const hasResult = (registration) => registration?.ThuHang !== null && registration?.ThuHang !== undefined;

// 2 → "Hạng 2"; 0 → "Không xếp hạng"; null → ""
export function formatRank(thuHang) {
  if (thuHang === null || thuHang === undefined) return "";
  return thuHang === NO_RANK ? "Không xếp hạng" : `Hạng ${thuHang}`;
}
