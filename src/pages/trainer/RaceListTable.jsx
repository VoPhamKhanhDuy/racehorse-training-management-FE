import { useState } from "react";
import { Link } from "react-router-dom";
import TablePager from "../../components/TablePager";
import { daysBetween, formatDate, todayISO } from "../../utils/date";
import { hasResult } from "../../utils/raceResult";

const PAGE_SIZE = 10;
const MAX_NAMES = 3;
const TH = "border-r border-[#E3E3E3] px-[14px] text-[13px] font-semibold text-[#1f1f1f] last:border-r-0";
const TD = "border-r border-b border-[#E3E3E3] px-[14px] py-3 align-middle text-sm text-[#1f1f1f] last:border-r-0";

// Bảng giải đua — mỗi hàng một giải (bảng trung tính, kẻ ô, không zebra, không cuộn ngang). Hàng KHÔNG bấm được; 3 điểm bấm khác nhau:
// tên giải → "Thông tin giải"; nút cột "Thao tác" → danh sách ngựa (hủy đăng ký / nhập kết quả); tên ngựa → chi tiết đăng ký của ngựa đó.
// tab "upcoming": STT | Giải đấu | Ngày (+ "Còn n ngày") | Ngựa đã đăng ký | Số ngựa | Thao tác ("Quản lý ngựa")
// tab "past": STT | Giải đấu | Ngày | Ngựa tham gia | Kết quả ("Đã nhập a/b") | Thao tác ("Nhập kết quả" cam đậm nếu thiếu, "Xem kết quả" nếu đủ)
// rows: [{ race, regs }] — regs là các đăng ký (RACEREGISTRATION) của giải. Màu nhấn cam chỉ cho việc cần làm.
export default function RaceListTable({ rows, tab, horseName, lockedHorseIds, onOpen, onOpenInfo, onOpenHorse, emptyText }) {
  const [page, setPage] = useState(1);
  const today = todayISO();
  const isPast = tab === "past";

  if (rows.length === 0) {
    return <div className="rounded-[4px] border border-[#E3E3E3] bg-white py-12 text-center text-sm text-[#6b6b6b]">{emptyText}</div>;
  }

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const offset = (currentPage - 1) * PAGE_SIZE;
  const pageRows = rows.slice(offset, offset + PAGE_SIZE);

  return (
    <div className="overflow-hidden rounded-[4px] border border-[#E3E3E3] bg-white">
      <table className="w-full table-fixed border-collapse text-left">
        <colgroup>
          <col style={{ width: "5%" }} className="max-[899px]:hidden" />
          <col style={{ width: "27%" }} />
          <col style={{ width: "14%" }} />
          <col style={{ width: "27%" }} />
          <col style={{ width: isPast ? "14%" : "8%" }} />
          <col style={{ width: isPast ? "13%" : "13%" }} />
        </colgroup>
        <thead>
          <tr className="h-11 border-b border-[#E3E3E3] bg-[#F5F5F5]">
            <th className={`${TH} text-center max-[899px]:hidden`}>STT</th>
            <th className={TH}>Giải đấu</th>
            <th className={TH}>Ngày</th>
            <th className={TH}>{isPast ? "Ngựa tham gia" : "Ngựa đã đăng ký"}</th>
            <th className={`${TH} ${isPast ? "" : "text-center"}`}>{isPast ? "Kết quả" : "Số ngựa"}</th>
            <th className={`${TH} text-center`}>Thao tác</th>
          </tr>
        </thead>
        <tbody className="[&>tr:last-child>td]:border-b-0">
          {pageRows.map(({ race, regs, pendingCount }, index) => {
            const daysLeft = daysBetween(today, race.Ngay);
            const entered = regs.filter(hasResult).length;
            const missing = regs.length > 0 && entered < regs.length;
            const shown = regs.slice(0, MAX_NAMES);
            return (
              <tr key={race.RaceID} className="h-14 bg-white">
                <td className={`${TD} text-center text-[#6b6b6b] tabular-nums max-[899px]:hidden`}>{offset + index + 1}</td>
                <td className={TD}>
                  {/* Tên giải → khung "Thông tin giải"; nút ở cột "Thao tác" → khung danh sách ngựa */}
                  <button
                    type="button"
                    onClick={() => onOpenInfo(race.RaceID)}
                    title={race.TenGiai}
                    className="block max-w-full cursor-pointer truncate text-left font-semibold text-[#1f1f1f] hover:underline"
                  >
                    {race.TenGiai}
                  </button>
                  <span className="block truncate text-xs text-[#6b6b6b]" title={race.DiaDiem}>
                    {race.DiaDiem}
                  </span>
                </td>
                <td className={`${TD} whitespace-nowrap tabular-nums`}>
                  {formatDate(race.Ngay)}
                  {!isPast && (
                    <span className={`block text-xs ${daysLeft <= 3 ? "font-semibold text-[#c2570c]" : "text-[#6b6b6b]"}`}>
                      {daysLeft <= 0 ? "Hôm nay" : `Còn ${daysLeft} ngày`}
                    </span>
                  )}
                </td>
                <td className={TD}>
                  {regs.length === 0 ? (
                    <span className="text-[#B5B5B5]">—</span>
                  ) : (
                    <span className="block truncate" title={regs.map((r) => horseName(r.HorseID)).join(", ")}>
                      {shown.map((reg, i) => {
                        const locked = !isPast && lockedHorseIds.has(reg.HorseID);
                        return (
                          <span key={reg.HorseID}>
                            {i > 0 && ", "}
                            {/* Bấm tên ngựa → chi tiết đăng ký của riêng ngựa đó (không mở khung giải) */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenHorse(race.RaceID, reg.HorseID);
                              }}
                              className={`cursor-pointer hover:underline ${locked ? "text-[#9e5954]" : "text-[#1f1f1f]"}`}
                            >
                              {horseName(reg.HorseID)}
                              {locked ? " (khóa tập)" : ""}
                            </button>
                          </span>
                        );
                      })}
                      {regs.length > MAX_NAMES && <span className="text-[#6b6b6b]"> +{regs.length - MAX_NAMES}</span>}
                    </span>
                  )}
                  {!isPast && pendingCount > 0 && (
                    <Link
                      to="/trainer/race-registrations"
                      onClick={(e) => e.stopPropagation()}
                      className="mt-0.5 block truncate text-xs text-[#6b6b6b] hover:text-[#1f1f1f] hover:underline"
                    >
                      + {pendingCount} đăng ký đang chờ duyệt
                    </Link>
                  )}
                </td>
                <td className={`${TD} ${isPast ? "" : "text-center tabular-nums"}`}>
                  {isPast ? (
                    regs.length === 0 ? (
                      <span className="text-[#B5B5B5]">—</span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 font-medium">
                        {missing && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#c2570c]" aria-hidden="true" />}
                        {entered === 0 ? "Chưa nhập kết quả" : `Đã nhập ${entered}/${regs.length}`}
                      </span>
                    )
                  ) : (
                    regs.length
                  )}
                </td>
                <td className={`${TD} text-center`}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpen(race.RaceID);
                    }}
                    className={`cursor-pointer text-sm whitespace-nowrap hover:underline ${
                      isPast && missing ? "font-semibold text-[#c2570c]" : "font-medium text-[#1f1f1f]"
                    }`}
                  >
                    {!isPast ? "Quản lý ngựa" : missing ? "Nhập kết quả" : "Xem kết quả"}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <TablePager page={currentPage} pageCount={pageCount} total={rows.length} pageSize={PAGE_SIZE} unit="giải" onPage={setPage} />
    </div>
  );
}
