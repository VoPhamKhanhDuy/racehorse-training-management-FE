import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
import LoadingState from "../../components/LoadingState";
import Toast from "../../components/Toast";
import useAuth from "../../hooks/useAuth";
import ExamTableRow from "./ExamTableRow";
import ExamDetailDrawer from "./ExamDetailDrawer";
import { getHorses, getMedicalRecords, getTrainingLocks, getVets } from "../../services/vetService";
import { EXAM_WINDOW_DAYS, NO_INJURY } from "../../data/medicalRecordOptions";
import { daysFromToday } from "../../utils/date";
import { toUserID } from "../../utils/userId";

const HEAD = "border-b border-[#b9ab90] bg-[#4a3a2a] px-4 py-3 text-[13px] font-semibold whitespace-nowrap text-[#f3ede0]";
const FOCUS_RING = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c2570c]";

// Sổ bệnh án của bác sĩ thú y: mỗi lần khám (MEDICALRECORD) 1 hàng bảng, mới nhất trước;
// bấm 1 hàng mở ngăn chi tiết bên phải (phác đồ đầy đủ, lệnh khóa liên quan, nút Sửa nếu là người ghi).
// Lọc: ô tìm (tên ngựa / chẩn đoán / vị trí), dropdown Ngựa (?horse=ID trên URL), ô bật/tắt "Có chấn thương".
// Form gửi toast sang qua location.state ("Đã lưu bệnh án", kèm liên kết "Xem lệnh khóa" nếu vừa tự động khóa huấn luyện).
export default function MedicalExams() {
  const { user } = useAuth();
  const currentVetId = toUserID(user.id);
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [records, setRecords] = useState([]);
  const [horses, setHorses] = useState([]);
  const [locks, setLocks] = useState([]);
  const [vetNames, setVetNames] = useState({});
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [injuryOnly, setInjuryOnly] = useState(false);
  const [selectedId, setSelectedId] = useState(null); // RecordID đang mở trong ngăn chi tiết
  const [toast, setToast] = useState(location.state?.toast ?? null); // { text, link }

  // Đọc xong thông báo từ form thì xóa khỏi history để Back/F5 không hiện lại
  useEffect(() => {
    if (location.state) navigate({ search: location.search }, { replace: true, state: null });
  }, [location.state, location.search, navigate]);

  // TODO: thay bằng gọi API thật khi BE xong (hiện đọc từ mock vetService)
  useEffect(() => {
    let ignore = false;
    Promise.all([getMedicalRecords(), getHorses(), getTrainingLocks(), getVets()]).then(([recordList, horseList, lockList, vetList]) => {
      if (ignore) return;
      setRecords(recordList);
      setHorses([...horseList].sort((a, b) => a.Ten.localeCompare(b.Ten, "vi")));
      setLocks(lockList);
      setVetNames(Object.fromEntries(vetList.map((v) => [v.UserID, v.HoTen])));
      setLoading(false);
    });
    return () => {
      ignore = true;
    };
  }, []);

  const closeToast = useCallback(() => setToast(null), []);
  const closeDrawer = useCallback(() => setSelectedId(null), []);

  const horseById = Object.fromEntries(horses.map((h) => [h.HorseID, h]));
  const horseFilter = horseById[searchParams.get("horse")] ? Number(searchParams.get("horse")) : null;
  const selectHorse = (horseId) => setSearchParams(horseId ? { horse: horseId } : {});
  const clearFilters = () => {
    setKeyword("");
    setInjuryOnly(false);
    setSearchParams({});
  };

  // Lọc kết hợp AND: ngựa, có chấn thương, từ khóa (tên ngựa / chẩn đoán / vị trí chấn thương)
  const normalizedKeyword = keyword.trim().toLocaleLowerCase("vi");
  const hasInjury = (r) => r.ViTriChanThuong && r.ViTriChanThuong !== NO_INJURY;
  const visibleRecords = records.filter(
    (r) =>
      (!horseFilter || r.HorseID === horseFilter) &&
      (!injuryOnly || hasInjury(r)) &&
      (!normalizedKeyword ||
        [horseById[r.HorseID]?.Ten, r.ChanDoan, hasInjury(r) ? r.ViTriChanThuong : ""].some((text) =>
          text?.toLocaleLowerCase("vi").includes(normalizedKeyword)
        ))
  );
  const windowStart = daysFromToday(-EXAM_WINDOW_DAYS);
  const recentCount = visibleRecords.filter((r) => r.Ngay >= windowStart).length;

  const selected = records.find((r) => r.RecordID === selectedId);
  // Lệnh khóa liên quan: đặt cho ngựa này đúng ngày khám
  const relatedLock = selected && locks.find((l) => l.HorseID === selected.HorseID && l.NgayDat === selected.Ngay);

  return (
    <div className="mx-auto w-full max-w-[1280px] md:px-8">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
        <div>
          <h1 className="font-serif text-[30px] leading-tight font-semibold tracking-tight text-[#2b2118]">Khám bệnh</h1>
          {!loading && (
            <p className="mt-1 text-sm text-[#4a3f33]">
              {recentCount} lần khám trong {EXAM_WINDOW_DAYS} ngày gần đây
            </p>
          )}
        </div>
        <Link
          to={`/vet/exams/new${horseFilter ? `?horse=${horseFilter}` : ""}`}
          className={`inline-flex h-10 items-center rounded-[4px] bg-[#c2570c] px-5 text-sm font-semibold whitespace-nowrap text-white transition-colors hover:bg-[#a8480a] ${FOCUS_RING}`}
        >
          + Ghi lần khám
        </Link>
      </div>

      {loading ? (
        <LoadingState />
      ) : (
        <>
          {/* Thanh lọc 1 hàng: tìm kiếm, chọn ngựa, bật/tắt "Có chấn thương" */}
          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="relative w-full sm:w-[300px]">
              <label htmlFor="examKeyword" className="sr-only">
                Tìm theo tên ngựa, chẩn đoán, vị trí
              </label>
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#6b6055]" aria-hidden="true" />
              <input
                id="examKeyword"
                type="search"
                placeholder="Tìm ngựa, chẩn đoán, vị trí..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="h-9 w-full rounded-[4px] border border-[#cfc4ad] bg-white pr-3 pl-9 text-sm text-[#2b2118] outline-none placeholder:text-[#6b6055]/70 focus:border-[#c2570c]"
              />
            </div>
            <label htmlFor="examHorse" className="sr-only">
              Lọc theo ngựa
            </label>
            <select
              id="examHorse"
              value={horseFilter ?? ""}
              onChange={(e) => selectHorse(e.target.value ? Number(e.target.value) : null)}
              className="h-9 w-full cursor-pointer rounded-[4px] border border-[#cfc4ad] bg-white px-3 text-sm text-[#2b2118] outline-none focus:border-[#c2570c] sm:w-48"
            >
              <option value="">Tất cả ngựa</option>
              {horses.map((h) => (
                <option key={h.HorseID} value={h.HorseID}>
                  {h.Ten}
                </option>
              ))}
            </select>
            <button
              type="button"
              aria-pressed={injuryOnly}
              onClick={() => setInjuryOnly((prev) => !prev)}
              className={`h-9 cursor-pointer rounded-[4px] border px-3.5 text-sm transition-colors ${FOCUS_RING} ${
                injuryOnly ? "border-[#c2570c] bg-[#fbf3e6] font-semibold text-[#2b2118]" : "border-[#cfc4ad] bg-white text-[#2b2118] hover:bg-[#f0efec]"
              }`}
            >
              Có chấn thương
            </button>
          </div>

          {visibleRecords.length === 0 ? (
            <p className="mt-5 rounded-[4px] border border-[#d9cfba] bg-white py-12 text-center text-sm text-[#4a3f33]">
              Không có lần khám nào phù hợp.{" "}
              <button type="button" onClick={clearFilters} className={`cursor-pointer font-semibold text-[#c2570c] underline-offset-2 hover:underline ${FOCUS_RING}`}>
                Xóa bộ lọc
              </button>
            </p>
          ) : (
            // caret-transparent: không hiện con trỏ chữ trong vùng chỉ đọc (vd khi bật duyệt bằng con trỏ — F7)
            <div className="mt-5 overflow-x-auto rounded-[4px] border border-[#b9ab90] bg-white caret-transparent">
              <table className="w-full min-w-[760px] border-separate border-spacing-0 text-left text-sm">
                <thead>
                  <tr>
                    <th className={HEAD}>Ngựa</th>
                    <th className={HEAD}>Chẩn đoán</th>
                    <th className={HEAD}>Vị trí chấn thương</th>
                    <th className={`${HEAD} text-right`}>Ngày khám</th>
                  </tr>
                </thead>
                <tbody className="[&>tr:last-child>td]:border-b-0">
                  {visibleRecords.map((record) => (
                    <ExamTableRow
                      key={record.RecordID}
                      record={record}
                      horse={horseById[record.HorseID]}
                      vetName={vetNames[record.VetID]}
                      selected={record.RecordID === selectedId}
                      onSelect={(r) => setSelectedId(r.RecordID)}
                    />
                  ))}
                </tbody>
              </table>
              <p className="border-t border-[#d9cfba] px-4 py-3 text-sm text-[#4a3f33] tabular-nums">
                Hiển thị {visibleRecords.length} / {records.length} lần khám
              </p>
            </div>
          )}
        </>
      )}

      <ExamDetailDrawer
        record={selected}
        horse={selected && horseById[selected.HorseID]}
        vetName={selected && vetNames[selected.VetID]}
        lock={relatedLock}
        canEdit={selected?.VetID === currentVetId}
        onClose={closeDrawer}
      />

      <Toast toast={toast} onClose={closeToast} />
    </div>
  );
}
