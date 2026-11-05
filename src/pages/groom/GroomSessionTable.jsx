import useTrainingOptions from "../../hooks/useTrainingOptions";
import { hasSessionStarted } from "../../utils/sessionReview";
import { formatKm } from "../../utils/trainingFormat";

const TH = "border-r border-[#E3E3E3] px-[14px] text-[13px] font-semibold text-[#1f1f1f] last:border-r-0";
const TD = "border-r border-b border-[#E3E3E3] px-[14px] py-3 align-middle text-sm text-[#1f1f1f] last:border-r-0";

// Bảng buổi tập được giao hôm nay (bảng trung tính: nền trắng, viền #E3E3E3, header #F5F5F5, kẻ ô, không zebra, hover #FAFAFA).
// Cột: Giờ | Ngựa | Buổi tập (+ mặt đường · cường độ) | Quãng đường kế hoạch | Trạng thái (dấu tích: Chưa xác nhận / Đã hoàn thành xanh lá) | Thao tác ("Báo cáo" / "Xem").
// Buổi CHƯA ĐẾN GIỜ bắt đầu: ô tích và nút "Báo cáo" bị vô hiệu, ghi chữ xám "Chưa đến giờ tập" (mock cũng chặn lưu).
// records: báo cáo của Groom (hooks/useSessionReviews). Màu nhấn cam: chấm "Chưa tập" + nút "Báo cáo".
export default function GroomSessionTable({ sessions, records, onOpen }) {
  const { label } = useTrainingOptions({ remote: false });

  return (
    <section aria-label="Buổi tập hôm nay">
      <h2 className="mb-3 font-serif text-xl font-semibold text-[#2b2118]">Buổi tập hôm nay</h2>
      <div className="overflow-hidden rounded-[4px] border border-[#E3E3E3] bg-white">
        <table className="w-full table-fixed border-collapse text-left">
          <colgroup>
            <col style={{ width: "12%" }} />
            <col style={{ width: "18%" }} />
            <col style={{ width: "26%" }} />
            <col style={{ width: "13%" }} />
            <col style={{ width: "18%" }} />
            <col style={{ width: "13%" }} />
          </colgroup>
          <thead>
            <tr className="h-11 border-b border-[#E3E3E3] bg-[#F5F5F5]">
              <th className={TH}>Giờ</th>
              <th className={TH}>Ngựa</th>
              <th className={TH}>Buổi tập</th>
              <th className={`${TH} text-right`}>Quãng đường</th>
              <th className={TH}>Trạng thái</th>
              <th className={`${TH} text-center`}>Thao tác</th>
            </tr>
          </thead>
          <tbody className="[&>tr:last-child>td]:border-b-0">
            {sessions.map((session) => {
              const reported = Boolean(records[session.sessionId]?.report);
              const started = hasSessionStarted(session);
              const subtitle = [session.surface && label("surfaces", session.surface), session.intensityLevel && label("intensityLevels", session.intensityLevel)]
                .filter(Boolean)
                .join(" · ");
              return (
                <tr key={session.sessionId} className="h-14 bg-white">
                  <td className={`${TD} whitespace-nowrap tabular-nums`}>{session.startTime}</td>
                  <td className={TD}>
                    <span className="block truncate font-semibold" title={session.horseName}>
                      {session.horseName}
                    </span>
                  </td>
                  <td className={TD}>
                    <span className="block truncate" title={session.sessionTitle}>
                      {session.sessionTitle}
                    </span>
                    {subtitle && <span className="block truncate text-xs text-[#6b6b6b]">{subtitle}</span>}
                  </td>
                  <td className={`${TD} text-right whitespace-nowrap tabular-nums`}>{formatKm(session.distanceKm)}</td>
                  <td className={TD}>
                    {/* Dấu tích: bấm → mở khung báo cáo (chỉ tích xong khi đã lưu báo cáo); đã báo cáo thì tích sẵn */}
                    <label className={`flex items-center gap-2.5 ${reported || !started ? "cursor-default" : "cursor-pointer"}`}>
                      <input
                        type="checkbox"
                        checked={reported}
                        disabled={reported || !started}
                        onChange={() => !reported && started && onOpen(session)}
                        aria-label={`Báo cáo buổi tập ${session.horseName}`}
                        className="h-[18px] w-[18px] shrink-0 cursor-pointer accent-[#c2570c] disabled:cursor-default"
                      />
                      <span className={`whitespace-nowrap ${reported ? "font-semibold text-[#4d6b2a]" : "font-medium"}`}>
                        {reported ? "Đã hoàn thành" : "Chưa xác nhận"}
                      </span>
                    </label>
                  </td>
                  <td className={`${TD} text-center`}>
                    {reported ? (
                      <button type="button" onClick={() => onOpen(session)} className="cursor-pointer text-sm font-medium text-[#c2570c] hover:underline">
                        Xem
                      </button>
                    ) : !started ? (
                      <span className="text-[13px] whitespace-nowrap text-[#6b6b6b]">Chưa đến giờ tập</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onOpen(session)}
                        className="inline-flex h-9 cursor-pointer items-center rounded-[4px] border border-stone/25 bg-white px-4 text-sm font-semibold text-[#c2570c] transition-colors hover:border-[#c2570c]/50"
                      >
                        Báo cáo
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
