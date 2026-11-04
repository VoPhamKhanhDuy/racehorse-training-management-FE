// Giờ chuẩn của từng loại việc chăm sóc — dùng cho "phiếu việc trong ngày" của nhân viên chăm sóc.
// LƯU Ý: ERD CARETASK hiện CHƯA có trường giờ, nên giờ lấy theo LoaiViec ở đây — xác nhận lại với BE
// (nếu BE thêm trường giờ vào CARETASK thì đọc từ bản ghi, bỏ map này).
// Thứ tự khai báo = thứ tự trong ngày. gio: "HH:mm"; ca: khóa của CARE_SHIFTS.
export const CARE_TASK_SCHEDULE = {
  "Cho ăn buổi sáng": { gio: "06:00", ca: "Sáng" },
  "Dọn chuồng": { gio: "08:00", ca: "Sáng" },
  "Tắm và chải lông": { gio: "10:00", ca: "Sáng" },
  "Kiểm tra móng": { gio: "14:00", ca: "Chiều" },
  "Vệ sinh yên cương": { gio: "15:30", ca: "Chiều" },
  "Cho ăn buổi chiều": { gio: "17:00", ca: "Chiều" },
};

// Các ca làm việc (theo thứ tự hiển thị)
export const CARE_SHIFTS = {
  "Sáng": { label: "Ca sáng", tu: "05:30", den: "11:30" },
  "Chiều": { label: "Ca chiều", tu: "12:00", den: "18:00" },
};

// Khung giờ làm việc chung: chỉ trong khung này mới đánh dấu "Trễ" cho việc chưa xong quá giờ chuẩn
export const CARE_WORK_WINDOW = {
  tu: Object.values(CARE_SHIFTS).map((s) => s.tu).sort()[0],
  den: Object.values(CARE_SHIFTS).map((s) => s.den).sort().at(-1),
};

// Giờ chuẩn của 1 loại việc ("" nếu loại việc lạ)
export const getTaskTime = (loaiViec) => CARE_TASK_SCHEDULE[loaiViec]?.gio ?? "";

// "HH:mm" → số phút từ 0h
export const toMinutes = (hhmm) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};
