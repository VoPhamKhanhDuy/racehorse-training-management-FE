import HorseProfileSection from "./HorseProfileSection";
import { SESSION_UNITS } from "../../data/trainingSessionOptions";
import { formatDate } from "../../utils/date";

const RECENT_COUNT = 5;

// 4 cột số liệu; nhận xét xuống dòng dưới, chỉ thành cột thứ 5 khi đủ rộng (xl)
const ROW_GRID =
  "grid grid-cols-[5.5rem_4.5rem_5.25rem_2.5rem] gap-x-3 xl:grid-cols-[5.5rem_4.5rem_5.25rem_2.5rem_minmax(0,1fr)]";

// Mục "Buổi tập gần đây" trong hồ sơ ngựa: 5 buổi TRAININGSESSION mới nhất (sessions đã sắp mới → cũ)
export default function HorseProfileSessions({ horseId, sessions, className }) {
  const recent = sessions.slice(0, RECENT_COUNT);

  return (
    <HorseProfileSection
      title="Buổi tập gần đây"
      link={{ to: `/trainer/sessions?horse=${horseId}`, label: "Xem tất cả kết quả →" }}
      className={className}
    >
      {recent.length === 0 ? (
        <p className="text-sm text-stone">Chưa có buổi tập nào được ghi nhận.</p>
      ) : (
        <>
          <div aria-hidden="true" className={`${ROW_GRID} border-b border-stone/20 pb-1.5 text-xs text-stone`}>
            <span>ngày</span>
            <span>nhịp tim</span>
            <span>vận tốc</span>
            <span>chỉ số</span>
            <span className="hidden xl:block">nhận xét</span>
          </div>
          <ul>
            {recent.map((session) => (
              <li key={session.SessionID} className={`${ROW_GRID} items-baseline gap-y-0.5 border-b border-stone/15 py-2.5 text-sm last:border-b-0`}>
                <span className="text-ink tabular-nums">{formatDate(session.Ngay)}</span>
                <span className="text-ink tabular-nums">
                  {session.NhipTim} {SESSION_UNITS.NhipTim}
                </span>
                <span className="text-ink tabular-nums">
                  {session.VanToc.toLocaleString("vi-VN")} {SESSION_UNITS.VanToc}
                </span>
                <span className="font-serif text-lg leading-none font-semibold text-bark tabular-nums" title="Chỉ số tập (0–100)">
                  {session.ChiSoTap}
                </span>
                <span className="col-span-4 truncate text-stone xl:col-span-1" title={session.NhanXet}>
                  {session.NhanXet || "—"}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </HorseProfileSection>
  );
}
