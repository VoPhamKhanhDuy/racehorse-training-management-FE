// Danh mục + đơn vị hiển thị cho FEEDINGPLAN. ĐƠN VỊ LÀ GIẢ ĐỊNH (ERD chỉ lưu số) — xác nhận lại với BE.
export const FEED_MEALS = ["Sáng", "Chiều", "Tối"]; // Bua, theo thứ tự trong ngày

// Các thành phần của 1 bữa: field trong FEEDINGPLAN → nhãn + đơn vị
export const FEED_COMPONENTS = [
  { field: "NguCoc", label: "Ngũ cốc", unit: "kg" },
  { field: "Co", label: "Cỏ", unit: "kg" },
  { field: "Vitamin", label: "Vitamin", unit: "g" },
];
