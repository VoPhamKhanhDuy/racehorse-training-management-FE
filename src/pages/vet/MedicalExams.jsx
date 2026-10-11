import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
import LoadingState from "../../components/LoadingState";
import Toast from "../../components/Toast";
import useAuth from "../../hooks/useAuth";
import HorseSelect from "./HorseSelect";
import ExamTableRow, { EXAM_GRID } from "./ExamTableRow";
import ExamDetailDrawer from "./ExamDetailDrawer";
import { getHorses, getMedicalRecords, getTrainingLocks, getVets } from "../../services/vetService";
import { EXAM_WINDOW_DAYS, NO_INJURY } from "../../data/medicalRecordOptions";
import { daysFromToday } from "../../utils/date";
import { toUserID } from "../../utils/userId";

const HEAD_CELL = "text-xs font-medium tracking-wide text-stone uppercase";

// Sổ bệnh án của bác sĩ thú y: mỗi lần khám (MEDICALRECORD) 1 hàng gọn, nhóm theo tháng, mới nhất trước;
// bấm 1 hàng mở ngăn chi tiết bên phải (phác đồ đầy đủ, lệnh khóa liên quan, nút Sửa nếu là người ghi).
// Lọc: ô tìm (tên ngựa / chẩn đoán / vị trí), dropdown Ngựa (?horse=ID trên URL), chip "Có chấn thương".
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

  // Nhóm theo tháng "YYYY-MM" (records đã sắp mới → cũ nên nhóm cũng mới → cũ)
  const groups = visibleRecords.reduce((acc, record) => {
    const key = record.Ngay.slice(0, 7);
    const last = acc[acc.length - 1];
    if (last?.key === key) last.records.push(record);
    else acc.push({ key, records: [record] });
    return acc;
  }, []);

  const selected = records.find((r) => r.RecordID === selectedId);
  // Lệnh khóa liên quan: đặt cho ngựa này đúng ngày khám
  const relatedLock = selected && locks.find((l) => l.HorseID === selected.HorseID && l.NgayDat === selected.Ngay);

  return (
    <div>
      <h1 className="mb-5 font-serif text-2xl font-semibold tracking-tight text-ink sm:text-[1.75rem]">Khám bệnh</h1>

      {loading ? (
        <LoadingState />
      ) : (
        <>
          {/* Thanh lọc 1 hàng; nút "+ Ghi lần khám" bên phải */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-72">
              <label htmlFor="examKeyword" className="sr-only">
                Tìm theo tên ngựa, chẩn đoán, vị trí
              </label>
              <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-stone" aria-hidden="true" />
              <input
                id="examKeyword"
                type="search"
                placeholder="Tìm ngựa, chẩn đoán, vị trí..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="h-9 w-full rounded-full border border-stone/20 bg-white pr-4 pl-10 text-sm text-ink outline-none transition-colors placeholder:text-stone/60 focus:border-brass"
              />
            </div>
            <HorseSelect horses={horses} value={horseFilter} onChange={selectHorse} />
            <button
              type="button"
              aria-pressed={injuryOnly}
              onClick={() => setInjuryOnly((prev) => !prev)}
              className={`h-9 cursor-pointer rounded-full border px-3.5 text-sm transition-colors ${
                injuryOnly ? "border-brass bg-brass/15 font-medium text-brass-deep" : "border-stone/25 bg-white text-ink hover:border-stone/40"
              }`}
            >
              Có chấn thương
            </button>
            <Link
              to={`/vet/exams/new${horseFilter ? `?horse=${horseFilter}` : ""}`}
              className="ml-auto rounded-sm border border-brass px-4 py-2 text-sm font-semibold whitespace-nowrap text-brass-deep transition-colors hover:bg-brass/10"
            >
              + Ghi lần khám
            </Link>
          </div>
          <p className="mt-2 text-[13px] text-stone">
            {recentCount} lần khám trong {EXAM_WINDOW_DAYS} ngày gần đây
          </p>

          {groups.length === 0 ? (
            <p className="mt-6 border-t border-stone/20 py-10 text-center text-sm text-stone">
              Chưa có lần khám nào khớp bộ lọc.{" "}
              <button type="button" onClick={clearFilters} className="cursor-pointer font-medium text-brass-deep underline-offset-2 hover:underline">
                Xóa bộ lọc
              </button>
            </p>
          ) : (
            // caret-transparent: không hiện con trỏ chữ trong vùng chỉ đọc (vd khi bật duyệt bằng con trỏ — F7)
            <div className="mt-5 caret-transparent">
              <div aria-hidden="true" className={`border-b border-stone/20 pr-2 pb-2 pl-3 ${EXAM_GRID}`}>
                <span className={HEAD_CELL}>Ngày</span>
                <span className={HEAD_CELL}>Ngựa</span>
                <span className={HEAD_CELL}>Chẩn đoán</span>
                <span className={`hidden min-[900px]:block ${HEAD_CELL}`}>Vị trí chấn thương</span>
                <span className={`hidden text-right min-[900px]:block ${HEAD_CELL}`}>Bác sĩ</span>
              </div>
              {groups.map((group) => {
                const [year, month] = group.key.split("-");
                return (
                  <section key={group.key} aria-label={`Tháng ${Number(month)}/${year}`}>
                    <h2 className="border-b border-stone/15 pt-5 pb-1.5 pl-3 text-xs font-medium tracking-wide text-stone uppercase select-none">
                      Tháng {Number(month)}/{year}
                    </h2>
                    <ul>
                      {group.records.map((record) => (
                        <ExamTableRow
                          key={record.RecordID}
                          record={record}
                          horse={horseById[record.HorseID]}
                          vetName={vetNames[record.VetID]}
                          selected={record.RecordID === selectedId}
                          onSelect={(r) => setSelectedId(r.RecordID)}
                        />
                      ))}
                    </ul>
                  </section>
                );
              })}
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
