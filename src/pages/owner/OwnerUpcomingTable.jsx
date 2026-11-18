import { useState } from "react";
import HorseAvatar from "../../components/HorseAvatar";
import { formatDayMonth, shortWeekdayName, todayISO } from "../../utils/date";
import { formatKm, formatMinutes } from "../../utils/trainingFormat";

const ROW_LIMIT = 10;
const TH = "border-r border-[#E3E3E3] px-[14px] text-[13px] font-semibold text-[#1f1f1f] last:border-r-0";
const TD = "border-r border-b border-[#E3E3E3] px-[14px] py-2.5 align-middle text-sm text-[#1f1f1f] last:border-r-0";

// Bảng "Sắp tới" của Chủ ngựa (chỉ xem): Ngày | Giờ | Ngựa | Nội dung | Loại. Bảng trung tính (khung trắng viền #E3E3E3, header #F5F5F5, kẻ ô,
// không zebra, hover #FAFAFA). Gom theo ngày: chỉ hàng đầu của ngày hiện ngày (hôm nay thêm dòng phụ "Hôm nay"). Tối đa 10 hàng,
// nhiều hơn có "Xem tất cả". items: [{ key, isRace, horseId, date, time, title, sub }] đã sắp tăng dần (giải thi đấu lên trước trong ngày).
export default function OwnerUpcomingTable({ items, horseById }) {
  const [showAll, setShowAll] = useState(false);
  const today = todayISO();

  if (items.length === 0) return <p className="text-sm text-[#4a3f33]">Chưa có lịch sắp tới</p>;

  const visible = showAll ? items : items.slice(0, ROW_LIMIT);
  const hidden = items.length - visible.length;

  return (
    <div className="overflow-hidden rounded-[4px] border border-[#E3E3E3] bg-white">
      <table className="w-full table-fixed border-collapse text-left">
        <colgroup>
          <col style={{ width: "16%" }} />
          <col style={{ width: "10%" }} />
          <col style={{ width: "24%" }} />
          <col style={{ width: "36%" }} />
          <col style={{ width: "14%" }} />
        </colgroup>
        <thead>
          <tr className="h-11 border-b border-[#E3E3E3] bg-[#F5F5F5]">
            <th className={TH}>Ngày</th>
            <th className={TH}>Giờ</th>
            <th className={TH}>Ngựa</th>
            <th className={TH}>Nội dung</th>
            <th className={TH}>Loại</th>
          </tr>
        </thead>
        <tbody className="[&>tr:last-child>td]:border-b-0">
          {visible.map((item, index) => {
            const firstOfDay = index === 0 || visible[index - 1].date !== item.date;
            const horse = horseById[item.horseId];
            return (
              <tr key={item.key} className="h-[52px] bg-white transition-colors hover:bg-[#FAFAFA]">
                <td className={`${TD} whitespace-nowrap tabular-nums`}>
                  {firstOfDay && (
                    <>
                      <span className="block font-medium">
                        {shortWeekdayName(item.date)} {formatDayMonth(item.date)}
                      </span>
                      {item.date === today && <span className="block text-xs font-semibold">Hôm nay</span>}
                    </>
                  )}
                </td>
                <td className={`${TD} whitespace-nowrap tabular-nums`}>{item.time || <span className="text-[#B5B5B5]">—</span>}</td>
                <td className={TD}>
                  <span className="flex min-w-0 items-center gap-2.5">
                    <HorseAvatar horse={horse} size={32} square />
                    <span className="truncate font-semibold" title={horse?.Ten}>
                      {horse?.Ten ?? `Ngựa #${item.horseId}`}
                    </span>
                  </span>
                </td>
                <td className={TD}>
                  <span className="block truncate" title={item.title}>
                    {item.title}
                  </span>
                  {item.sub && <span className="block truncate text-xs text-[#6b6b6b]">{item.sub}</span>}
                </td>
                <td className={`${TD} ${item.isRace ? "font-semibold" : ""}`}>{item.isRace ? "Thi đấu" : "Buổi tập"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="flex min-h-11 flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-[#E3E3E3] bg-white px-4 py-2 text-[13px] text-[#6b6b6b]">
        <span>
          Hiển thị 1–{visible.length} trong {items.length} buổi
        </span>
        {hidden > 0 && (
          <button type="button" onClick={() => setShowAll(true)} className="cursor-pointer font-semibold text-[#c2570c] hover:underline">
            Xem tất cả
          </button>
        )}
      </div>
    </div>
  );
}

// "2,2 km · 40 phút" cho dòng phụ của buổi tập (bỏ phần nào không có)
export function sessionSubText(distanceKm, durationMinutes) {
  return [distanceKm != null ? formatKm(distanceKm) : null, durationMinutes != null ? formatMinutes(durationMinutes) : null].filter(Boolean).join(" · ");
}
