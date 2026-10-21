import HorseIcon from "../../components/HorseIcon";
import { formatDayMonth, formatHorseAge } from "../../utils/date";

// Cột dính cần nền đặc: hàng thường (kể cả hàng ngựa khóa tập) nền trắng; hàng đang rê chuột = xám mờ #f0efec
const BG_HOVER_ROW = "bg-[#f0efec]";
// Tình trạng bình thường: so sánh không phân biệt hoa/thường và dạng dấu Unicode
const isHealthy = (health) => /^(tốt|đủ điều kiện)$/.test((health ?? "").normalize("NFC").trim().toLowerCase());

// Ô đầu hàng (dính trái khi cuộn ngang): ảnh 40px + tên + "Giống · tuổi" + dòng sức khỏe.
// Dòng sức khỏe: khóa tập / đang điều trị (đỏ đậm) | tình trạng bình thường (olive) | tình trạng cần chú ý (nâu vàng).
// Buổi tập gần nhất: xem bằng title khi rê chuột vào tên. Điện thoại: chỉ còn ảnh + tên rút gọn.
export default function RaceHorseCell({ horse, info, highlighted }) {
  const { blockReason, health, lastSession, trainedRecently } = info;
  const trainingHint = !trainedRecently
    ? "Chưa tập 14 ngày gần đây"
    : `Buổi tập gần nhất ${formatDayMonth(lastSession)}`;
  const healthText = blockReason ?? health;
  const healthClass = blockReason ? "font-semibold text-[#c0262d]" : isHealthy(health) ? "text-[#4d6b2a]" : "text-[#946330]";

  return (
    <th
      scope="row"
      className={`sticky left-0 z-10 border-r border-b border-[#d9cfba] p-2 text-left font-normal sm:px-3 sm:py-2 ${
        highlighted ? BG_HOVER_ROW : "bg-white"
      }`}
    >
      <div className="flex items-center gap-2 sm:gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded bg-[#f0ede6] text-[#b8ad98] sm:h-9 sm:w-9">
          {horse.photo ? (
            <img src={horse.photo} alt="" className="h-full w-full object-cover object-[center_25%]" />
          ) : (
            <HorseIcon className="h-4 w-4" />
          )}
        </span>
        <div className="min-w-0">
          <p title={trainingHint} className="truncate font-serif text-sm leading-tight font-semibold text-[#2b2118] sm:text-sm">
            {horse.Ten}
          </p>
          <p className="hidden truncate text-xs text-[#6b6055] sm:block">
            {[horse.Giong, formatHorseAge(horse.NgaySinh)].filter(Boolean).join(" · ")}
          </p>
          {healthText && <p className={`hidden truncate text-xs sm:block ${healthClass}`}>{healthText}</p>}
        </div>
      </div>
    </th>
  );
}
