// Nhãn hiển thị TIẾNG ANH của giới tính ngựa (Stallion / Mare / Gelding) dùng ở mọi màn hình.
// Giá trị lưu và gửi API vẫn là "Ngựa đực" / "Ngựa cái" / "Ngựa thiến"; BE hoặc dữ liệu cũ có thể trả mã tiếng Anh
// (Male, Female, Gelding...) → đều đổi sang nhãn tiếng Anh, giá trị lạ thì in nguyên văn.
const GENDER_LABELS = {
  "ngựa đực": "Stallion",
  "ngựa cái": "Mare",
  "ngựa thiến": "Gelding",
  male: "Stallion",
  stallion: "Stallion",
  female: "Mare",
  mare: "Mare",
  gelding: "Gelding",
};

export function genderLabel(value) {
  if (!value) return "";
  return GENDER_LABELS[String(value).normalize("NFC").trim().toLowerCase()] ?? value;
}
