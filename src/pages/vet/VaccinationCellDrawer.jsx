import { Link } from "react-router-dom";
import Drawer from "../../components/Drawer";
import HorseAvatar from "../../components/HorseAvatar";
import { VACCINE_PENDING } from "../../data/vaccinationOptions";
import { formatDate } from "../../utils/date";
import { getVaccineState } from "../../utils/healthAlerts";

const HISTORY_COUNT = 5;
const STATE_TEXT = { "Quá hạn": "font-medium text-brass-deep", "Sắp tới": "text-bark", "Chờ tiêm": "text-stone", "Đã tiêm": "text-ink" };

// Ngăn chi tiết 1 ô ma trận (ngựa × loại): lịch sử của cặp đó (mới nhất trước, tối đa 5).
// Chân: có lịch chưa tiêm → nút "Đã tiêm" + link "Sửa"; luôn có "+ Hẹn lần tiếp". Lịch đã tiêm không sửa/xóa.
export default function VaccinationCellDrawer({ horse, type, items, onMarkDone, onClose }) {
  const history = [...items].sort((a, b) => b.NgayHen.localeCompare(a.NgayHen)).slice(0, HISTORY_COUNT);
  // Lịch chưa tiêm có NgayHen sớm nhất (đúng bản ghi đại diện của ô)
  const pending = items.filter((v) => v.TrangThai === VACCINE_PENDING).sort((a, b) => a.NgayHen.localeCompare(b.NgayHen))[0];

  return (
    <Drawer
      open
      narrow
      label={`${horse.Ten} · ${type}`}
      onClose={onClose}
      header={
        <div className="flex items-center gap-3">
          <HorseAvatar horse={horse} size={40} />
          <p className="min-w-0 font-serif text-lg leading-tight font-semibold text-ink">
            {horse.Ten} <span className="text-stone">·</span> {type}
          </p>
        </div>
      }
      footer={
        <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-2">
          <Link
            to={`/vet/vaccinations/new?${new URLSearchParams({ horse: horse.HorseID, type })}`}
            className="text-sm font-medium text-brass-deep underline-offset-2 hover:underline"
          >
            + Hẹn lần tiếp
          </Link>
          {pending && (
            <>
              <Link
                to={`/vet/vaccinations/${pending.ScheduleID}/edit`}
                className="text-sm text-stone underline-offset-2 hover:text-ink hover:underline"
              >
                Sửa
              </Link>
              <button
                type="button"
                onClick={() => onMarkDone(pending)}
                className="cursor-pointer rounded-sm border border-brass px-4 py-2 text-sm font-semibold text-brass-deep transition-colors hover:bg-brass/10"
              >
                Đã tiêm
              </button>
            </>
          )}
        </div>
      }
    >
      <h3 className="pt-4 text-xs text-stone">Lịch sử</h3>
      {history.length === 0 ? (
        <p className="py-4 text-sm text-stone">Chưa có lịch nào cho loại này.</p>
      ) : (
        <ul className="mt-1">
          {history.map((item) => {
            const state = getVaccineState(item);
            return (
              <li key={item.ScheduleID} className="border-b border-stone/15 py-2.5 text-sm last:border-b-0">
                <span className="text-ink tabular-nums">{formatDate(item.NgayHen)}</span>
                <span className="text-stone"> · </span>
                <span className={STATE_TEXT[state]}>{state}</span>
              </li>
            );
          })}
        </ul>
      )}
    </Drawer>
  );
}
