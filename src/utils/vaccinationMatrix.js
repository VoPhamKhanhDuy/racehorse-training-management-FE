import { VACCINE_PENDING, VACCINE_TYPES } from "../data/vaccinationOptions";
import { getVaccineState } from "./healthAlerts";

// Cột của ma trận ngựa × loại: các Loai có trong dữ liệu, thứ tự cố định theo VACCINE_TYPES, rồi loại khác A–Z
export function getVaccineColumns(items) {
  const present = [...new Set(items.map((v) => v.Loai))];
  const fixed = VACCINE_TYPES.filter((type) => present.includes(type));
  const others = present.filter((type) => !VACCINE_TYPES.includes(type)).sort((a, b) => a.localeCompare(b, "vi"));
  return [...fixed, ...others];
}

// Bản ghi đại diện cho 1 ô (ngựa × loại): lịch chưa tiêm có NgayHen sớm nhất; không có thì lịch đã tiêm gần nhất;
// không có gì → null. Trả { item, state } với state từ getVaccineState.
export function getCellRepresentative(pairItems, today) {
  const pending = pairItems.filter((v) => v.TrangThai === VACCINE_PENDING).sort((a, b) => a.NgayHen.localeCompare(b.NgayHen));
  const done = pairItems.filter((v) => v.TrangThai !== VACCINE_PENDING).sort((a, b) => b.NgayHen.localeCompare(a.NgayHen));
  const item = pending[0] ?? done[0];
  return item ? { item, state: getVaccineState(item, today) } : null;
}
