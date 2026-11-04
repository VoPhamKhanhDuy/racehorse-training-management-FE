import { Link } from "react-router-dom";
import { SESSION_UNITS } from "../../data/trainingSessionOptions";
import { formatDate } from "../../utils/date";

const RECENT_COUNT = 3;

// Khối "Buổi tập gần đây" trong chi tiết ngựa: 3 buổi mới nhất theo Ngay (TRAININGSESSION).
// "Xem tất cả" mở trang Kết quả buổi tập với đúng ngựa này.
export default function HorseRecentSessions({ horseId, sessions }) {
  const recent = [...sessions]
    .sort((a, b) => b.Ngay.localeCompare(a.Ngay) || b.SessionID - a.SessionID)
    .slice(0, RECENT_COUNT);

  return (
    <section aria-label="Buổi tập gần đây" className="mt-6 border-t border-stone/15 pt-5">
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="font-serif text-base font-semibold text-ink">Buổi tập gần đây</h3>
        <Link to={`/trainer/sessions?horse=${horseId}`} className="text-sm font-medium text-brass-deep underline-offset-2 hover:underline">
          Xem tất cả
        </Link>
      </div>

      {recent.length === 0 ? (
        <p className="mt-3 text-sm text-stone">Chưa có buổi tập nào được ghi nhận</p>
      ) : (
        <ul className="mt-2">
          {recent.map((session) => (
            // Desktop: 4 cột ngày | nhịp tim | vận tốc | nhận xét; điện thoại: nhận xét xuống dòng dưới
            <li
              key={session.SessionID}
              className="grid grid-cols-[5.5rem_4.5rem_1fr] gap-x-3 gap-y-0.5 border-b border-stone/15 py-2.5 text-sm last:border-b-0 sm:grid-cols-[5.5rem_4.5rem_5.5rem_1fr]"
            >
              <span className="text-ink tabular-nums">{formatDate(session.Ngay)}</span>
              <span className="text-ink tabular-nums">
                {session.NhipTim} {SESSION_UNITS.NhipTim}
              </span>
              <span className="text-ink tabular-nums">
                {session.VanToc.toLocaleString("vi-VN")} {SESSION_UNITS.VanToc}
              </span>
              <span className="col-span-3 truncate text-stone sm:col-span-1" title={session.NhanXet}>
                {session.NhanXet}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
