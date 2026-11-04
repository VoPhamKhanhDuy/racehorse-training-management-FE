// Danh mục + giới hạn cho VACCINATIONSCHEDULE — form lịch tiêm, danh sách và vetService dùng chung

// Gợi ý cho ô Loại (vẫn cho tự gõ loại khác) — gồm cả tiêm phòng và tẩy giun
export const VACCINE_TYPES = ["Cúm ngựa", "Uốn ván", "Viêm não Nhật Bản", "Dại", "Tẩy giun"];

// Giá trị TrangThai được LƯU (Quá hạn / Sắp tới chỉ là trạng thái hiển thị, xem getVaccineState)
export const VACCINE_PENDING = "Chờ tiêm";
export const VACCINE_DONE = "Đã tiêm";

export const VACCINE_TYPE_LIMITS = { min: 2, max: 50 }; // số ký tự Loai
export const DUPLICATE_PENDING_VACCINE = "Ngựa này đã có lịch chờ tiêm cùng loại.";
