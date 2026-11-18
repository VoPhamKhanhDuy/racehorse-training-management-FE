import { useState } from "react";
import useSessionReviews from "../../hooks/useSessionReviews";
import useTrainingOptions from "../../hooks/useTrainingOptions";
import { formatDayMonth, shortWeekdayName, todayISO } from "../../utils/date";
import { actualDistanceOf, sessionStage, stageColor, stageLabel } from "../../utils/sessionReview";
import { formatKm, formatMinutes } from "../../utils/trainingFormat";

const PAGE_SIZE = 10;
const TH = "border-r border-[#E3E3E3] px-[14px] text-[13px] font-semibold text-[#1f1f1f] last:border-r-0";
const TD = "border-r border-b border-[#E3E3E3] px-[14px] py-3 align-middle text-sm text-[#1f1f1f] last:border-r-0";

const ACTION_LINK = "cursor-pointer text-sm font-medium text-[#c2570c] hover:underline";

const byDateTime = (a, b) => `${a.trainingDate} ${a.startTime}`.localeCompare(`${b.trainingDate} ${b.startTime}`);

// Bảng dữ liệu buổi tập (TrainingSession): header – body – footer, kẻ ô đầy đủ, không cuộn ngang (table-layout: fixed).
// MỘT tông trung tính (#1f1f1f / #6b6b6b / viền #E3E3E3) + MỘT màu nhấn cam đậm chỉ cho việc cần làm (chấm "Chờ đánh giá", link "Xem" của hàng đó).
// Cột: STT | Ngày giờ (bấm để đổi thứ tự) | Ngựa (+ người phụ trách) | Buổi tập (+ mặt đường · cường độ) | Quãng đường | Trạng thái | Chi tiết.
// showHorse = false (trang chi tiết giáo án): bỏ cột Ngựa. Dưới 1100px ẩn cột STT, .
// Trạng thái theo 5 tình trạng (chưa diễn ra / chờ báo cáo / chờ đánh giá / đã đánh giá / đã gửi chủ ngựa) từ báo cáo của Groom + đánh giá của Trainer; chữ trung tính.
// Chân bảng: "Hiển thị a–b trong n buổi" + phân trang 10 dòng/trang. Chỉ link "Xem" mở chi tiết → onSelect(sessionId); bấm dòng / trạng thái không làm gì.
export default function SessionTable({ sessions, onSelect, onSend, showHorse = false, emptyText = "Không có buổi tập nào." }) {
  const { label } = useTrainingOptions();
  const records = useSessionReviews();
  const today = todayISO();
  const [sortDir, setSortDir] = useState("asc");
  const [page, setPage] = useState(1);

  if (sessions.length === 0) {
    return (
      <div className="rounded-[4px] border border-[#E3E3E3] bg-white py-12 text-center text-sm text-[#6b6b6b]">{emptyText}</div>
    );
  }

  const sorted = [...sessions].sort((a, b) => (sortDir === "asc" ? byDateTime(a, b) : byDateTime(b, a)));
  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const offset = (currentPage - 1) * PAGE_SIZE;
  const pageItems = sorted.slice(offset, offset + PAGE_SIZE);

  // Độ rộng cột theo % (tổng 100%); không có cột Ngựa thì chia phần đó cho cột Buổi tập
  const widths = { stt: 4, date: 12, horse: showHorse ? 16 : 0, session: showHorse ? 27 : 43, distance: 14, status: 14, detail: 13 };
  const col = (key, hideClass = "") => <col style={{ width: `${widths[key]}%` }} className={hideClass} />;
  const HIDE_STT = "max-[1099px]:hidden";

  return (
    <div className="overflow-hidden rounded-[4px] border border-[#E3E3E3] bg-white">
      <table className="w-full table-fixed border-collapse text-left">
        <colgroup>
          {col("stt", HIDE_STT)}
          {col("date")}
          {showHorse && col("horse")}
          {col("session")}
          {col("distance")}
          {col("status")}
          {col("detail")}
        </colgroup>
        <thead>
          <tr className="h-11 border-b border-[#E3E3E3] bg-[#F5F5F5]">
            <th className={`${TH} text-center ${HIDE_STT}`}>STT</th>
            <th className={TH} aria-sort={sortDir === "asc" ? "ascending" : "descending"}>
              <button
                type="button"
                onClick={() => setSortDir((dir) => (dir === "asc" ? "desc" : "asc"))}
                className="group inline-flex cursor-pointer items-center gap-1.5 font-semibold outline-none focus-visible:underline"
                title="Đổi thứ tự sắp xếp"
              >
                Ngày giờ
                {/* Mũi tên đang sắp xếp luôn hiện; mũi tên còn lại chỉ hiện khi rê chuột vào tiêu đề */}
                <span className="flex flex-col text-[8px] leading-[9px] text-[#6b6b6b]" aria-hidden="true">
                  <span className={sortDir === "asc" ? "" : "opacity-0 group-hover:opacity-100"}>▲</span>
                  <span className={sortDir === "desc" ? "" : "opacity-0 group-hover:opacity-100"}>▼</span>
                </span>
              </button>
            </th>
            {showHorse && <th className={TH}>Ngựa</th>}
            <th className={TH}>Buổi tập</th>
            <th className={`${TH} text-right`}>Quãng đường</th>
            <th className={`${TH} text-center`}>Trạng thái</th>
            <th className={`${TH} text-center`}>Chi tiết</th>
          </tr>
        </thead>
        <tbody className="[&>tr:last-child>td]:border-b-0">
          {pageItems.map((session, index) => {
            const record = records[session.sessionId];
            const stage = sessionStage(session, record);
            const isToday = session.trainingDate === today;
            const actualKm = actualDistanceOf(session, record);
            const subtitle = [
              session.surface && label("surfaces", session.surface),
              session.intensityLevel && label("intensityLevels", session.intensityLevel),
            ]
              .filter(Boolean)
              .join(" · ");
            return (
              <tr key={session.sessionId} className="h-14 bg-white">

                <td className={`${TD} text-center text-[#6b6b6b] tabular-nums ${HIDE_STT}`}>{offset + index + 1}</td>
                <td className={`${TD} whitespace-nowrap`}>
                  <span className="block truncate font-medium text-[#1f1f1f]">
                    {shortWeekdayName(session.trainingDate)} {formatDayMonth(session.trainingDate)}
                  </span>
                  <span className="block truncate text-xs text-[#6b6b6b] tabular-nums" title={`${session.startTime}${session.endTime ? `–${session.endTime}` : ""}`}>
                    {isToday && <span className="font-semibold text-[#1f1f1f]">Hôm nay · </span>}
                    {session.startTime}
                  </span>
                </td>
                {showHorse && (
                  <td className={TD}>
                    <span className="block truncate font-medium text-[#1f1f1f]" title={session.horseName}>
                      {session.horseName}
                    </span>
                    <span className="block truncate text-xs text-[#6b6b6b]" title={session.assignedToName ?? undefined}>
                      {session.assignedToName ?? "Chưa phân công"}
                    </span>
                  </td>
                )}
                <td className={TD}>
                  <span className="block truncate text-[#1f1f1f]" title={session.sessionTitle}>
                    {session.sessionTitle}
                  </span>
                  {subtitle && (
                    <span className="block truncate text-xs text-[#6b6b6b]" title={subtitle}>
                      {subtitle}
                    </span>
                  )}
                </td>
                <td className={`${TD} text-right whitespace-nowrap tabular-nums`}>
                  <span className="block truncate">{formatKm(session.distanceKm)}</span>
                  <span className="block truncate text-xs text-[#6b6b6b]">
                    {actualKm != null ? `Thực tế ${formatKm(actualKm)}` : formatMinutes(session.durationMinutes)}
                  </span>
                </td>
                <td className={`${TD} text-center`}>
                  {/* Chỉ hiển thị, không bấm được */}
                  <span className={`text-sm font-semibold ${stageColor(stage)}`}>{stageLabel(stage)}</span>
                </td>
                <td className={`${TD} text-center`}>
                  {/* Chờ đánh giá → "Đánh giá"; Đã đánh giá → "Gửi chủ ngựa" + "Sửa"; còn lại (gồm Đã gửi chủ ngựa) → "Xem".
                      Trang không truyền onSend (chi tiết giáo án) thì luôn là "Xem". */}
                  <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
                    {onSend && stage === "AwaitingReview" ? (
                      <button type="button" onClick={() => onSelect(session.sessionId, { edit: true })} className={ACTION_LINK}>
                        Đánh giá
                      </button>
                    ) : onSend && stage === "Reviewed" ? (
                      <>
                        <button type="button" onClick={() => onSend(session.sessionId)} className={ACTION_LINK}>
                          Gửi chủ ngựa
                        </button>
                        <button
                          type="button"
                          onClick={() => onSelect(session.sessionId, { edit: true })}
                          className="cursor-pointer text-xs text-[#6b6b6b] underline underline-offset-2 hover:text-[#1f1f1f]"
                        >
                          Sửa
                        </button>
                      </>
                    ) : (
                      <button type="button" onClick={() => onSelect(session.sessionId)} className={ACTION_LINK}>
                        Xem
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="flex min-h-12 flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-[#E3E3E3] bg-white px-4 py-2 text-[13px] text-[#6b6b6b]">
        <span>
          Hiển thị {offset + 1}–{offset + pageItems.length} trong {sorted.length} buổi
        </span>
        <nav aria-label="Phân trang" className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="h-8 cursor-pointer rounded-[4px] border border-[#E3E3E3] bg-white px-3 font-medium text-[#1f1f1f] transition-colors hover:bg-[#FAFAFA] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Trước
          </button>
          {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setPage(n)}
              aria-current={n === currentPage ? "page" : undefined}
              className={`h-8 min-w-8 cursor-pointer rounded-[4px] border px-2 font-medium tabular-nums transition-colors ${
                n === currentPage
                  ? "border-[#1f1f1f] bg-[#1f1f1f] text-white"
                  : "border-[#E3E3E3] bg-white text-[#1f1f1f] hover:bg-[#FAFAFA]"
              }`}
            >
              {n}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setPage(currentPage + 1)}
            disabled={currentPage === pageCount}
            className="h-8 cursor-pointer rounded-[4px] border border-[#E3E3E3] bg-white px-3 font-medium text-[#1f1f1f] transition-colors hover:bg-[#FAFAFA] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Sau
          </button>
        </nav>
      </div>
    </div>
  );
}
