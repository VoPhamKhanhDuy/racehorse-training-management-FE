// "đã tiêm" → "Đã tiêm"
export const capitalizeFirst = (text = "") => text.charAt(0).toUpperCase() + text.slice(1);

// So sánh chuỗi không phân biệt hoa thường (theo tiếng Việt)
export const sameText = (a, b) => a.toLocaleLowerCase("vi") === b.toLocaleLowerCase("vi");

// Bỏ khoảng trắng đầu/cuối và gộp nhiều khoảng trắng liên tiếp thành 1
export const collapseSpaces = (text) => text.trim().replace(/\s+/g, " ");
