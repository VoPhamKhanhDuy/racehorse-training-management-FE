import CenterDialog from "../../components/CenterDialog";
import { getRaceInfo } from "../../data/raceInfoMock";
import { raceRegistrationDeadline, sampleEntryFee } from "../../services/raceRegistrationMock";
import { formatCurrency } from "../../utils/currency";
import { daysBetween, formatDate, todayISO } from "../../utils/date";

const SECTION_TITLE = "font-serif text-base font-semibold text-[#2b2118]";
const OUTLINE_BUTTON =
  "inline-flex h-10 cursor-pointer items-center rounded-[4px] border border-stone/25 bg-white px-5 text-sm font-semibold text-ink transition-colors hover:border-stone/50";

function Row({ label, children, sub }) {
  return (
    <div className="grid grid-cols-[150px_minmax(0,1fr)] gap-x-4 text-sm">
      <dt className="text-[#6b6055]">{label}</dt>
      <dd className="min-w-0 text-[#2b2118]">
        {children}
        {sub && <span className="block text-[13px] text-[#6b6055] tabular-nums">{sub}</span>}
      </dd>
    </div>
  );
}

// Khung "Thông tin giải" (Trainer): mô tả và thông số để cân nhắc đăng ký ngựa nào. Mô tả / cự ly / giải thưởng / lịch trình là
// DỮ LIỆU MẪU (data/raceInfoMock.js) chờ BE; giải không có dữ liệu mẫu chỉ hiện tên, ngày, địa điểm + "Chưa có mô tả chi tiết".
// horseCount: số ngựa của CLB đã đăng ký giải (không truyền thì không hiện dòng này). onRegister(raceId): "Đăng ký ngựa" (chỉ khi còn hạn đăng ký).
export default function RaceInfoDialog({ race, horseCount, onRegister, onClose }) {
  const today = todayISO();
  const info = getRaceInfo(race);
  const isPast = race.Ngay < today;
  const deadline = raceRegistrationDeadline(race);
  const open = !isPast && deadline >= today;
  const daysToDeadline = daysBetween(today, deadline);
  const fee = sampleEntryFee(race.RaceID); // DỮ LIỆU MẪU chờ BE có entryFee

  const statusNode = isPast ? (
    "Đã diễn ra"
  ) : open ? (
    <span className="inline-flex items-center gap-1.5">
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#c2570c]" aria-hidden="true" />
      {daysToDeadline <= 0 ? "Đang mở đăng ký, hôm nay là hạn cuối" : `Đang mở đăng ký, còn ${daysToDeadline} ngày`}
    </span>
  ) : (
    "Đã hết hạn đăng ký"
  );

  const header = (
    <div>
      <h2 className="font-serif text-xl leading-tight font-semibold text-[#2b2118]">{race.TenGiai}</h2>
      <p className="mt-1 text-sm text-[#6b6055]">
        {formatDate(race.Ngay)} · {race.DiaDiem}
      </p>
      <p className="mt-1 text-sm font-medium text-[#1f1f1f]">{statusNode}</p>
    </div>
  );

  const footer = (
    <div className="flex justify-end gap-3">
      <button type="button" onClick={onClose} className={OUTLINE_BUTTON}>
        Đóng
      </button>
      {open && onRegister && (
        <button type="button" onClick={() => onRegister(race.RaceID)} className="btn-primary">
          Đăng ký ngựa
        </button>
      )}
    </div>
  );

  return (
    <CenterDialog label={`Thông tin giải ${race.TenGiai}`} header={header} footer={footer} onClose={onClose} wide>
      {info ? (
        <>
          <p className="text-sm leading-relaxed text-[#2b2118]">{info.description}</p>

          <section className="mt-6 border-t border-stone/15 pt-6">
            <h3 className={SECTION_TITLE}>Thông số</h3>
            <dl className="mt-3 space-y-2">
              <Row label="Hạng mục">{info.category}</Row>
              <Row label="Cự ly">{info.distance}</Row>
              <Row label="Điều kiện ngựa">{info.eligibility}</Row>
              <Row label="Hạn đăng ký">{formatDate(deadline)}</Row>
              <Row label="Lệ phí">{fee != null ? formatCurrency(fee) : "Chưa cập nhật"}</Row>
              <Row label="Tổng giải thưởng" sub={`Hạng 1: ${formatCurrency(info.payouts[0])} · Hạng 2: ${formatCurrency(info.payouts[1])} · Hạng 3: ${formatCurrency(info.payouts[2])}`}>
                {formatCurrency(info.prizePool)}
              </Row>
              {horseCount != null && <Row label="Ngựa CLB đã đăng ký">{horseCount}</Row>}
            </dl>
          </section>

          <section className="mt-6 border-t border-stone/15 pt-6">
            <h3 className={SECTION_TITLE}>Lịch trình ngày đua</h3>
            <ul className="mt-3 space-y-1.5">
              {info.schedule.map((item) => (
                <li key={item.time} className="grid grid-cols-[64px_minmax(0,1fr)] gap-x-4 text-sm">
                  <span className="text-[#6b6055] tabular-nums">{item.time}</span>
                  <span className="text-[#2b2118]">{item.label}</span>
                </li>
              ))}
            </ul>
          </section>
        </>
      ) : (
        <>
          <section>
            <dl className="space-y-2">
              <Row label="Hạn đăng ký">{formatDate(deadline)}</Row>
              <Row label="Lệ phí">{fee != null ? formatCurrency(fee) : "Chưa cập nhật"}</Row>
              {horseCount != null && <Row label="Ngựa CLB đã đăng ký">{horseCount}</Row>}
            </dl>
          </section>
          <p className="mt-6 text-sm text-[#6b6055]">Chưa có mô tả chi tiết.</p>
        </>
      )}
    </CenterDialog>
  );
}
