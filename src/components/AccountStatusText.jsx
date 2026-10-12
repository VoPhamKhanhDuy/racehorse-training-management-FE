// Trạng thái tài khoản (USER) hiển thị bằng CHỮ màu, đậm 600 — không chấm, không badge, không nền.
// Màu lấy từ biến CSS --color-account-* trong styles/index.css. Dùng chung: màn Đã gửi đăng ký, Nhân sự,
// Duyệt tài khoản, thông báo lỗi Đăng nhập.
const STATUS_TONES = {
  "Chờ duyệt": "pending",
  "Đã duyệt": "active",
  "Đang hoạt động": "active",
  "Từ chối": "blocked",
  "Đã từ chối": "blocked",
  "Bị khóa": "blocked",
  "Đã khóa": "blocked",
};

const TONE_CLASSES = {
  pending: "text-account-pending",
  active: "text-account-active",
  blocked: "text-account-blocked",
};

// Class màu + độ đậm theo nhãn trạng thái ("" nếu nhãn lạ)
export function getAccountStatusStyle(status) {
  const tone = STATUS_TONES[status];
  return tone ? `font-semibold ${TONE_CLASSES[tone]}` : "";
}

// children: chữ hiển thị khác nhãn (vd "chờ duyệt" viết thường trong câu) nhưng vẫn tô màu theo status
export default function AccountStatusText({ status, className = "", children }) {
  return <span className={`${getAccountStatusStyle(status)} ${className}`}>{children ?? status}</span>;
}
