// Kết quả khám suy ra từ bệnh án (MEDICALRECORD chỉ có ChanDoan, PhacDo, ViTriChanThuong — CHƯA có trường "kết quả khám" riêng).
// Dữ liệu thực tế: trường ViTriChanThuong đôi khi chứa kết quả bình thường ("Sức khỏe tốt", "Không phát hiện dấu hiệu bất thường"…)
// thay vì vị trí. Hàm này tách 2 trường hiển thị:
// - kết quả bình thường → result = nội dung đó, location = ""
// - có vị trí thật (Lưng, Chân trước…) → result = "Có chấn thương", location = vị trí, abnormal = true
// - để trống → result = "", location = ""
// TODO(BE): thêm trường KetQuaKham vào MEDICALRECORD để bỏ phần suy đoán này; ViTriChanThuong chỉ chứa vị trí.
const NORMAL_RESULT = /^(sức khỏe tốt|không phát hiện|không có|không bất thường|bình thường|ổn định)/i;

export function examOutcome(record) {
  const raw = (record.ViTriChanThuong ?? "").trim();
  if (!raw) return { result: "", location: "", abnormal: false };
  if (NORMAL_RESULT.test(raw)) return { result: raw, location: "", abnormal: false };
  return { result: "Có chấn thương", location: raw, abnormal: true };
}
