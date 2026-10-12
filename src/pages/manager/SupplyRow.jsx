import { Link } from "react-router-dom";
import { Minus, Pencil, Plus, Trash2 } from "lucide-react";
import actionButtonColors from "../../utils/actionButtonStyles";

// Kẻ dòng trên từng ô vì bảng dùng border-separate (giống bảng nhân sự)
const CELL = "border-b border-b-stone/15 px-4 py-2.5";
// Cột Hành động dính mép phải: màn hẹp cuộn ngang nhưng nút luôn nhìn thấy; pl-6 che mép chữ cột kế bên
const ACTION_CELL = `${CELL} sticky right-0 bg-white pl-6 text-right whitespace-nowrap`;
// 4 nút chỉ có icon (tooltip + aria-label đọc tên đầy đủ), outline màu theo ý nghĩa — cùng bộ màu với /manager/staff
const ICON_BUTTON =
  "inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border bg-white transition-colors sm:h-8 sm:w-8";

// 1 dòng trong bảng vật tư
export default function SupplyRow({ supply, managerName, onStockIn, onStockOut, onDelete }) {
  return (
    <tr>
      <td className={CELL}>
        <p className="font-serif text-base leading-snug font-semibold text-ink">{supply.TenVatTu}</p>
        {/* Màn hẹp: ẩn cột Loại (dưới md) và Số lượng tồn (dưới sm) cho bảng vừa khung, hiện thành dòng nhỏ dưới tên */}
        <p className="text-xs text-stone md:hidden">
          {supply.Loai}
          <span className="sm:hidden"> · Tồn {supply.SoLuongTon.toLocaleString("vi-VN")}</span>
        </p>
      </td>
      <td className={`${CELL} hidden whitespace-nowrap text-stone md:table-cell`}>{supply.Loai}</td>
      <td className={`${CELL} hidden text-right font-medium whitespace-nowrap text-ink tabular-nums sm:table-cell`}>
        {supply.SoLuongTon.toLocaleString("vi-VN")}
      </td>
      <td className={`${CELL} hidden whitespace-nowrap text-stone xl:table-cell`}>{managerName ?? "—"}</td>
      <td className={ACTION_CELL}>
        <div className="inline-flex items-center gap-1 sm:gap-1.5">
          <button
            type="button"
            onClick={() => onStockIn(supply)}
            title="Nhập kho"
            aria-label={`Nhập kho ${supply.TenVatTu}`}
            className={`${ICON_BUTTON} ${actionButtonColors.moss}`}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => onStockOut(supply)}
            title="Xuất kho"
            aria-label={`Xuất kho ${supply.TenVatTu}`}
            className={`${ICON_BUTTON} ${actionButtonColors.amber}`}
          >
            <Minus className="h-4 w-4" aria-hidden="true" />
          </button>
          <Link
            to={`/manager/supplies/${supply.SupplyID}/edit`}
            title="Sửa"
            aria-label={`Sửa ${supply.TenVatTu}`}
            className={`${ICON_BUTTON} ${actionButtonColors.blue}`}
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
          <button
            type="button"
            onClick={() => onDelete(supply)}
            title="Xóa"
            aria-label={`Xóa ${supply.TenVatTu}`}
            className={`${ICON_BUTTON} ${actionButtonColors.red}`}
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      </td>
    </tr>
  );
}
