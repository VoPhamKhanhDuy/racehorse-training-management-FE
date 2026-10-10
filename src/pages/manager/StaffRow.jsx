import { Link } from "react-router-dom";
import { Lock, LockOpen, Pencil } from "lucide-react";
import actionButtonColors from "../../utils/actionButtonStyles";
import { formatDate } from "../../utils/date";

// Kẻ dòng trên từng ô vì bảng dùng border-separate (giống bảng Duyệt tài khoản)
const CELL = "border-b border-b-stone/15 px-4 py-2.5";
// Cột Hành động dính mép phải: màn hẹp cuộn ngang nhưng nút luôn nhìn thấy; pl-6 che mép chữ cột kế bên
const ACTION_CELL = `${CELL} sticky right-0 bg-white pl-6 text-right whitespace-nowrap`;
// Nút phụ trên dòng: outline nền trắng, màu viền + chữ theo ý nghĩa (ACTION_COLORS), hover nền nhạt cùng tông.
// Dưới xl chỉ hiện icon (chữ vẫn đọc được bằng trình đọc màn hình) để bảng vừa khung, không đẩy cột khác ra ngoài.
const ACTION_BUTTON =
  "inline-flex cursor-pointer items-center gap-1.5 rounded-md border bg-white px-2 py-1.5 text-sm font-medium transition-colors xl:px-2.5 xl:py-1";
// Màu theo ý nghĩa: Sửa xanh dương, Khóa hổ phách, Mở khóa xanh rêu (bộ màu dùng chung ở utils/actionButtonStyles)
const ACTION_COLORS = {
  edit: actionButtonColors.blue,
  lock: actionButtonColors.amber,
  unlock: actionButtonColors.moss,
};
const ACTION_LABEL = "sr-only xl:not-sr-only";
// 2 nút cùng 1 độ rộng CỐ ĐỊNH (dư cho chữ dài nhất "Mở khóa", từ xl khi có chữ): cặp nút cân nhau, cột thẳng hàng dù đổi Khóa/Mở khóa
const BUTTON_WIDTH = "justify-center whitespace-nowrap xl:w-26";

// Trạng thái: vạch dọc mảnh bo tròn cao bằng dòng chữ, cách chữ 8px — xanh rêu trầm #5c7a3f (tương phản ~4.6:1)
// cho đang hoạt động, xám stone cho đã khóa (vạch cùng độ đậm/tương phản với vạch xanh). Không nền, không chấm.
function StatusText({ isActive, className = "" }) {
  return (
    <span className={`inline-flex items-center gap-2 ${isActive ? "text-[#5c7a3f]" : "text-stone"} ${className}`}>
      <span aria-hidden="true" className={`h-[1em] w-[3px] shrink-0 rounded-full ${isActive ? "bg-[#5c7a3f]" : "bg-stone"}`} />
      {isActive ? "Đang hoạt động" : "Đã khóa"}
    </span>
  );
}

// 1 dòng trong bảng nhân sự
export default function StaffRow({ staff, roleName, onToggleActive }) {
  const initial = staff.fullName.trim().charAt(0).toUpperCase();
  const toggleLabel = staff.isActive ? "Khóa" : "Mở khóa";

  return (
    <tr>
      <td className={CELL}>
        <div className="flex items-center gap-2.5">
          {/* Cùng hình dáng avatar ở Header nhưng màu trung tính: cam chỉ dành cho nút tạo mới và pill lọc đang chọn */}
          <span
            aria-hidden="true"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-stone/15 font-serif text-sm font-semibold text-stone"
          >
            {initial}
          </span>
          <div>
            <p className="font-serif text-base leading-snug font-semibold whitespace-nowrap text-ink">{staff.fullName}</p>
            {/* Điện thoại: ẩn cột Trạng thái cho bảng vừa khung, hiện trạng thái thành dòng nhỏ dưới tên */}
            <StatusText isActive={staff.isActive} className="text-xs sm:hidden" />
          </div>
        </div>
      </td>
      <td className={`${CELL} hidden text-stone xl:table-cell`}>{staff.email}</td>
      <td className={`${CELL} hidden whitespace-nowrap text-stone md:table-cell`}>{roleName}</td>
      <td className={`${CELL} hidden whitespace-nowrap min-[1360px]:table-cell`}>{formatDate(staff.createdAt)}</td>
      <td className={`${CELL} hidden whitespace-nowrap sm:table-cell`}>
        <StatusText isActive={staff.isActive} />
      </td>
      <td className={ACTION_CELL}>
        <div className="inline-flex items-center gap-2">
          <Link to={`/manager/staff/${staff.id}/edit`} title="Sửa" className={`${ACTION_BUTTON} ${BUTTON_WIDTH} ${ACTION_COLORS.edit}`}>
            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
            <span className={ACTION_LABEL}>Sửa</span>
          </Link>
          <button
            type="button"
            onClick={() => onToggleActive(staff)}
            title={toggleLabel}
            className={`${ACTION_BUTTON} ${BUTTON_WIDTH} ${staff.isActive ? ACTION_COLORS.lock : ACTION_COLORS.unlock}`}
          >
            {staff.isActive ? (
              <Lock className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <LockOpen className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            <span className={ACTION_LABEL}>{toggleLabel}</span>
          </button>
        </div>
      </td>
    </tr>
  );
}
