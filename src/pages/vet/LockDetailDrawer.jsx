import { Link } from "react-router-dom";
import Drawer from "../../components/Drawer";
import HorseAvatar from "../../components/HorseAvatar";
import { getLockDays } from "../../utils/trainingLock";
import { formatDate } from "../../utils/date";

const ROW = "grid grid-cols-[110px_minmax(0,1fr)] gap-x-4 border-b border-stone/15 py-3.5 text-sm last:border-b-0";
const LABEL = "text-xs text-stone";

// Ngăn chi tiết 1 lệnh khóa, dạng sổ (nhãn trái – giá trị phải): lý do, thời gian, bác sĩ đặt, lần khám liên quan
// (khám cùng ngày đặt), tác động (chỉ khi đang khóa). Chân: nút "Gỡ khóa" khi đang khóa. Không có xóa (giữ lịch sử).
// impact: { schedules, races } — số buổi tập sắp tới / giải đã đăng ký sắp diễn ra của ngựa (0 thì bỏ dòng số)
export default function LockDetailDrawer({ lock, horse, vetName, relatedExam, impact, onRelease, onClose }) {
  if (!lock) return null;
  const active = !lock.NgayGo;
  // Mỗi ý 1 dòng riêng, chỉ dòng có số > 0
  const impactLines = [
    impact.schedules > 0 && `${impact.schedules} buổi tập sắp tới bị chặn`,
    impact.races > 0 && `${impact.races} giải đang đăng ký`,
  ].filter(Boolean);

  return (
    <Drawer
      open
      label={`Lệnh khóa huấn luyện của ${horse?.Ten ?? "ngựa"}`}
      onClose={onClose}
      header={
        <div className="flex items-center gap-3">
          <HorseAvatar horse={horse} size={40} />
          <p className="min-w-0 truncate font-serif text-lg leading-tight font-semibold text-ink">{horse?.Ten ?? `Ngựa #${lock.HorseID}`}</p>
          <span
            className={`inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${
              active ? "bg-brass/15 text-brass-deep" : "bg-stone/10 text-stone"
            }`}
          >
            {active ? "Đang khóa" : "Đã gỡ"}
          </span>
        </div>
      }
      footer={
        active && (
          <button
            type="button"
            onClick={onRelease}
            className="cursor-pointer rounded-sm border border-brass px-4 py-2 text-sm font-semibold text-brass-deep transition-colors hover:bg-brass/10"
          >
            Gỡ khóa
          </button>
        )
      }
    >
      <dl>
        <div className={ROW}>
          <dt className={LABEL}>Lý do</dt>
          <dd className="text-ink">{lock.LyDo}</dd>
        </div>
        <div className={ROW}>
          <dt className={LABEL}>Ngày đặt</dt>
          <dd className="text-ink tabular-nums">{formatDate(lock.NgayDat)}</dd>
        </div>
        {active ? (
          <div className={ROW}>
            <dt className={LABEL}>Đã khóa</dt>
            <dd className="font-medium text-brass-deep">{getLockDays(lock)} ngày</dd>
          </div>
        ) : (
          <>
            <div className={ROW}>
              <dt className={LABEL}>Ngày gỡ</dt>
              <dd className="text-ink tabular-nums">{formatDate(lock.NgayGo)}</dd>
            </div>
            <div className={ROW}>
              <dt className={LABEL}>Thời gian khóa</dt>
              <dd className="text-ink">{getLockDays(lock)} ngày</dd>
            </div>
          </>
        )}
        <div className={ROW}>
          <dt className={LABEL}>Bác sĩ đặt</dt>
          <dd className="text-ink">BS. {vetName ?? "Không rõ"}</dd>
        </div>
        {relatedExam && (
          <div className={ROW}>
            <dt className={LABEL}>Lần khám liên quan</dt>
            <dd className="text-ink">
              <p>
                {formatDate(relatedExam.Ngay)} · {relatedExam.ChanDoan}
              </p>
              <Link
                to={`/vet/exams?horse=${lock.HorseID}`}
                className="mt-1 inline-block font-medium text-brass-deep underline-offset-2 hover:underline"
              >
                Xem lần khám
              </Link>
            </dd>
          </div>
        )}
        {active && (
          <div className={ROW}>
            <dt className={LABEL}>Tác động</dt>
            <dd className="text-ink">
              <p>Ngựa này không thể được xếp lịch tập và không thể đăng ký thi đấu cho đến khi gỡ khóa.</p>
              {impactLines.map((line) => (
                <p key={line} className="mt-1 text-stone">
                  {line}
                </p>
              ))}
            </dd>
          </div>
        )}
      </dl>
    </Drawer>
  );
}
