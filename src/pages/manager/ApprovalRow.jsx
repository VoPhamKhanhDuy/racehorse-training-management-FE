import { daysSince, formatDate, formatDaysAgo } from "../../utils/date";

const PROCESSED_LABELS = { approved: "Đã duyệt", rejected: "Đã từ chối" };

// Cột Hành động dính mép phải: trên màn hẹp bảng cuộn ngang nhưng nút luôn nhìn thấy
// Bảng dùng border-separate (sticky + border-collapse bị lỗi vẽ viền) nên kẻ dòng trên từng ô
const CELL = "border-b border-b-stone/15 px-4 py-2.5";
// pl-6: phủ kín phần đệm của cột kế bên để không lộ mép chữ khi bảng cuộn ngang
const ACTION_CELL = `${CELL} sticky right-0 bg-white pl-6 text-right whitespace-nowrap`;

// Vạch ưu tiên bên trái theo số ngày đã chờ duyệt (chỉ dòng đang chờ)
const WATCH_AFTER_DAYS = 3; // từ 3 ngày: cần để ý
const URGENT_AFTER_DAYS = 6; // quá 5 ngày: cần xử lý gấp

function getPriorityBorder(account) {
  if (account.status !== "pending") return "border-l-transparent";
  const waitingDays = daysSince(account.createdAt);
  if (waitingDays >= URGENT_AFTER_DAYS) return "border-l-alert";
  if (waitingDays >= WATCH_AFTER_DAYS) return "border-l-brass";
  return "border-l-stone/20";
}

// 1 dòng trong bảng duyệt tài khoản
export default function ApprovalRow({ account, roleName, onApprove, onReject }) {
  const initial = account.fullName.trim().charAt(0).toUpperCase();

  return (
    <tr>
      <td className={`${CELL} border-l-4 ${getPriorityBorder(account)}`}>
        <div className="flex items-center gap-2.5">
          {/* Cùng kiểu avatar ở Header, thu nhỏ cho vừa dòng bảng */}
          <span
            aria-hidden="true"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brass/20 font-serif text-sm font-semibold text-brass-deep"
          >
            {initial}
          </span>
          <span className="font-serif text-base leading-snug font-semibold whitespace-nowrap text-ink">
            {account.fullName}
          </span>
        </div>
      </td>
      <td className={`${CELL} text-stone`}>{account.email}</td>
      <td className={`${CELL} whitespace-nowrap text-stone`}>{roleName}</td>
      <td className={`${CELL} whitespace-nowrap`}>
        {formatDate(account.createdAt)}
        <span className="text-stone"> · {formatDaysAgo(account.createdAt)}</span>
      </td>
      <td className={ACTION_CELL}>
        {account.status === "pending" ? (
          // 2 nút đặc cùng kiểu: Duyệt xanh (tông badge "Đủ điều kiện"), Từ chối đỏ (--color-alert,
          // cùng màu nút xác nhận nguy hiểm trong ConfirmDialog). Cả 2 đều qua ConfirmDialog.
          <div className="inline-flex items-center gap-2">
            <button
              type="button"
              onClick={() => onApprove(account)}
              className="cursor-pointer rounded-md bg-green-700 px-3 py-1 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-green-800"
            >
              Duyệt
            </button>
            <button
              type="button"
              onClick={() => onReject(account)}
              className="cursor-pointer rounded-md bg-alert px-3 py-1 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-alert/90"
            >
              Từ chối
            </button>
          </div>
        ) : (
          <span className="text-xs text-stone">{PROCESSED_LABELS[account.status]}</span>
        )}
      </td>
    </tr>
  );
}
