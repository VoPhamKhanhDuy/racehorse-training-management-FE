import { Link } from "react-router-dom";
import CenterDialog from "../../components/CenterDialog";
import HorseAvatar from "../../components/HorseAvatar";
import { VACCINE_PENDING } from "../../data/vaccinationOptions";
import { daysBetween, daysSince, formatDate, todayISO } from "../../utils/date";
import { getVaccineState } from "../../utils/healthAlerts";

const HISTORY_COUNT = 5;
const OUTLINE_BUTTON =
  "inline-flex h-10 cursor-pointer items-center rounded-[4px] border border-stone/25 bg-white px-5 text-sm font-semibold text-[#1f1f1f] transition-colors hover:border-stone/50";
const TH = "py-2 text-left text-[13px] font-semibold text-[#1f1f1f]";

// Mô tả tình trạng hiện tại của 1 lịch: "Quá hạn 22 ngày" / "Còn 3 ngày" / "Chờ tiêm" / "Đã tiêm"
function stateText(item, state, today) {
  if (state === "Quá hạn") return `Quá hạn ${daysSince(item.NgayHen)} ngày`;
  if (state === "Sắp tới") {
    const left = daysBetween(today, item.NgayHen);
    return left <= 0 ? "Hôm nay" : `Còn ${left} ngày`;
  }
  return state;
}

// Chi tiết 1 ô ma trận (ngựa × loại) — MODAL giữa màn hình (≤ 520px): tình trạng hiện tại, ngày hẹn kế tiếp, "Lịch sử các mũi tiêm" (tối đa 5, mới nhất trước).
// Dữ liệu chỉ có ngày + trạng thái (chưa có bác sĩ / ghi chú từng mũi). Chân: "Đóng" trái; phải = nút chính theo tình trạng:
// - có lịch chưa tiêm → "Ghi mũi tiêm" (xác nhận đã tiêm, như nút "Đã tiêm" cũ) + link "Sửa lịch hẹn"
// - đã tiêm hết → "Hẹn lần tiếp" (form Thêm lịch điền sẵn ngựa + loại); chưa có lịch → "Thêm lịch".
export default function VaccinationCellDialog({ horse, type, items, blocked = false, onMarkDone, onClose }) {
  const today = todayISO();
  const history = [...items].sort((a, b) => b.NgayHen.localeCompare(a.NgayHen)).slice(0, HISTORY_COUNT);
  // Lịch chưa tiêm có NgayHen sớm nhất (đúng bản ghi đại diện của ô)
  const pending = items.filter((v) => v.TrangThai === VACCINE_PENDING).sort((a, b) => a.NgayHen.localeCompare(b.NgayHen))[0];
  const latestDone = items.filter((v) => v.TrangThai !== VACCINE_PENDING).sort((a, b) => b.NgayHen.localeCompare(a.NgayHen))[0];
  const current = pending ?? latestDone;
  const currentState = current ? getVaccineState(current, today) : null;
  const newScheduleLink = `/vet/vaccinations/new?${new URLSearchParams({ horse: horse.HorseID, type })}`;

  const header = (
    <div className="flex items-center gap-3">
      <HorseAvatar horse={horse} size={40} square />
      <h2 className="min-w-0 truncate font-serif text-lg leading-tight font-semibold text-[#2b2118]">
        {type} · {horse.Ten}
      </h2>
    </div>
  );

  const footer = (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <button type="button" onClick={onClose} className={OUTLINE_BUTTON}>
        Đóng
      </button>
      <span className="flex flex-wrap items-center gap-4">
        {pending ? (
          <>
            <Link to={`/vet/vaccinations/${pending.ScheduleID}/edit`} className="text-sm font-semibold text-[#6b6b6b] hover:text-[#1f1f1f] hover:underline">
              Sửa lịch hẹn
            </Link>
            <button type="button" onClick={() => onMarkDone(pending)} className="btn-primary">
              Ghi mũi tiêm
            </button>
          </>
        ) : (
          <Link to={newScheduleLink} className="btn-primary">
            {current ? "Hẹn lần tiếp" : "Thêm lịch"}
          </Link>
        )}
      </span>
    </div>
  );

  return (
    <CenterDialog label={`${type} · ${horse.Ten}`} header={header} footer={footer} onClose={onClose} busy={blocked} maxWidth={520}>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
        <div>
          <dt className="text-xs text-[#6b6055]">Tình trạng hiện tại</dt>
          <dd className="mt-0.5 font-semibold text-[#1f1f1f]">{current ? stateText(current, currentState, today) : "Chưa có lịch"}</dd>
        </div>
        <div>
          <dt className="text-xs text-[#6b6055]">{pending ? "Ngày hẹn kế tiếp" : "Mũi tiêm gần nhất"}</dt>
          <dd className="mt-0.5 text-[#2b2118] tabular-nums">{current ? formatDate(current.NgayHen) : "—"}</dd>
        </div>
      </dl>

      <section className="mt-6">
        <h3 className="font-serif text-base font-semibold text-[#2b2118]">Lịch sử các mũi tiêm</h3>
        {history.length === 0 ? (
          <p className="mt-2 text-sm text-[#6b6055]">Chưa có lịch nào cho loại này.</p>
        ) : (
          <table className="mt-2 w-full table-fixed border-collapse text-sm">
            <colgroup>
              <col style={{ width: "40%" }} />
              <col />
            </colgroup>
            <thead>
              <tr className="border-b border-[#E3E3E3]">
                <th className={TH}>Ngày</th>
                <th className={TH}>Tình trạng</th>
              </tr>
            </thead>
            <tbody>
              {history.map((item) => {
                const state = getVaccineState(item, today);
                return (
                  <tr key={item.ScheduleID} className="border-b border-[#E3E3E3] last:border-b-0">
                    <td className="py-2.5 text-[#1f1f1f] tabular-nums">{formatDate(item.NgayHen)}</td>
                    <td className={`py-2.5 ${state === "Quá hạn" ? "font-semibold text-[#c2570c]" : "text-[#1f1f1f]"}`}>{stateText(item, state, today)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </CenterDialog>
  );
}
