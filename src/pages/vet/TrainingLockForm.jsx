import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import FormField from "../../components/FormField";
import LoadingState from "../../components/LoadingState";
import SelectField from "../../components/SelectField";
import useAuth from "../../hooks/useAuth";
import ExamFormContext from "./ExamFormContext";
import {
  createTrainingLock,
  getActiveTrainingLocks,
  getHealthStatuses,
  getHorses,
  getMedicalRecords,
} from "../../services/vetService";
import { addAuditLog } from "../../services/auditService";
import { LOCK_REASON_LIMITS, TREATMENT_STATE } from "../../data/medicalRecordOptions";
import { todayISO } from "../../utils/date";
import { toUserID } from "../../utils/userId";

// Kiểm tra form; trả { field: thông báo }
function validateLock(form) {
  const errors = {};
  const { min, max } = LOCK_REASON_LIMITS;
  if (!form.HorseID) errors.HorseID = "Vui lòng chọn ngựa.";
  const reason = form.LyDo.trim();
  if (!reason) errors.LyDo = "Vui lòng nhập lý do khóa huấn luyện.";
  else if (reason.length < min || reason.length > max) errors.LyDo = `Lý do phải từ ${min} đến ${max} ký tự.`;
  if (!form.NgayDat) errors.NgayDat = "Vui lòng chọn ngày đặt.";
  else if (form.NgayDat > todayISO()) errors.NgayDat = "Ngày đặt không được ở tương lai.";
  return errors;
}

// Đặt lệnh khóa huấn luyện thủ công (/vet/locks/new, ?horse= điền sẵn). Chỉ liệt kê ngựa chưa có lệnh khóa đang hiệu lực.
// VetID = bác sĩ đang đăng nhập. Lưu xong: tình trạng sức khỏe tự chuyển "Đang điều trị" (vetService), ghi nhật ký, về danh sách.
export default function TrainingLockForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const currentVetId = toUserID(user.id);

  const [form, setForm] = useState(() => ({ HorseID: "", LyDo: "", NgayDat: todayISO() }));
  const [horses, setHorses] = useState([]); // chỉ ngựa chưa bị khóa
  const [healthList, setHealthList] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // TODO: thay bằng gọi API thật khi BE xong (hiện đọc từ mock vetService)
  useEffect(() => {
    let ignore = false;
    Promise.all([getHorses(), getActiveTrainingLocks(), getHealthStatuses(), getMedicalRecords()]).then(
      ([horseList, lockList, healthStatuses, recordList]) => {
        if (ignore) return;
        const lockedIds = new Set(lockList.map((l) => l.HorseID));
        const available = horseList.filter((h) => !lockedIds.has(h.HorseID)).sort((a, b) => a.Ten.localeCompare(b.Ten, "vi"));
        setHorses(available);
        setHealthList(healthStatuses);
        setRecords(recordList);
        // Vào từ bộ lọc (?horse=) thì điền sẵn — chỉ khi ngựa đó chưa bị khóa
        const preset = available.find((h) => String(h.HorseID) === searchParams.get("horse"));
        if (preset) setForm((prev) => ({ ...prev, HorseID: String(preset.HorseID) }));
        setLoading(false);
      }
    );
    return () => {
      ignore = true;
    };
  }, [searchParams]);

  const selectedHorse = horses.find((h) => String(h.HorseID) === form.HorseID);
  const selectedHealth = healthList.find((h) => String(h.HorseID) === form.HorseID);
  const horseRecords = records.filter((r) => String(r.HorseID) === form.HorseID);
  const reasonLength = form.LyDo.trim().length;

  const setField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateLock(form);
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setSubmitting(true);
    try {
      const lock = await createTrainingLock(form, currentVetId);
      const horseName = selectedHorse?.Ten ?? "ngựa";
      addAuditLog({
        UserID: currentVetId,
        HanhDong: "Đặt lệnh khóa huấn luyện",
        TargetTable: "TRAININGLOCK",
        TargetID: lock.LockID,
        targetLabel: horseName,
      });
      navigate(`/vet/locks?horse=${lock.HorseID}`, { state: { toast: { text: `Đã đặt lệnh khóa huấn luyện cho ${horseName}` } } });
    } catch (err) {
      setErrors({ form: err.message || "Không đặt được lệnh khóa, vui lòng thử lại." });
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingState />;

  const backToList = `/vet/locks${form.HorseID ? `?horse=${form.HorseID}` : ""}`;

  return (
    <div className="mx-auto max-w-5xl">
      <Link to={backToList} className="text-sm font-medium text-brass-deep hover:underline">
        ← Quay lại lệnh khóa huấn luyện
      </Link>
      <h1 className="mt-3 font-serif text-2xl font-semibold tracking-tight text-ink sm:text-[1.75rem]">Đặt lệnh khóa huấn luyện</h1>

      {/* 2 cột: form bên trái, ngữ cảnh ngựa bên phải (dính khi cuộn). Dưới lg ngữ cảnh xuống dưới form. */}
      <div className="mt-6 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-10">
        <form onSubmit={handleSubmit} noValidate className="min-w-0 space-y-6 border-t border-stone/20 pt-6">
          {errors.form && <p className="rounded-sm border-l-2 border-rust bg-rust/5 px-4 py-3 text-sm text-rust">{errors.form}</p>}

          <div className="sm:max-w-sm">
            <SelectField
              variant="line"
              label="Ngựa"
              id="HorseID"
              name="HorseID"
              value={form.HorseID}
              onChange={(e) => setField("HorseID", e.target.value)}
              error={errors.HorseID}
            >
              <option value="">Chọn ngựa</option>
              {horses.map((horse) => (
                <option key={horse.HorseID} value={horse.HorseID}>
                  {horse.Ten} — {horse.Giong}
                </option>
              ))}
            </SelectField>
            {horses.length === 0 && <p className="mt-1.5 text-xs text-stone">Tất cả ngựa đều đang có lệnh khóa hiệu lực.</p>}
          </div>

          <div>
            <label htmlFor="LyDo" className="mb-1 block font-serif text-sm font-semibold text-stone">
              Lý do
            </label>
            <textarea
              id="LyDo"
              name="LyDo"
              rows={4}
              placeholder="Ví dụ: Viêm gân chân trước, nghỉ tập để theo dõi hồi phục."
              aria-invalid={Boolean(errors.LyDo)}
              aria-describedby="LyDo-count"
              value={form.LyDo}
              onChange={(e) => setField("LyDo", e.target.value)}
              className={`w-full resize-y border-b bg-transparent px-1 py-2 text-ink outline-none transition-colors placeholder:text-stone/50 ${
                errors.LyDo ? "border-rust" : "border-stone/50 focus:border-brass"
              }`}
            />
            <div className="mt-1 flex items-start justify-between gap-4">
              {errors.LyDo ? <p className="text-sm text-rust">{errors.LyDo}</p> : <span />}
              <span
                id="LyDo-count"
                className={`shrink-0 text-xs tabular-nums ${reasonLength > LOCK_REASON_LIMITS.max ? "text-rust" : "text-stone"}`}
              >
                {reasonLength}/{LOCK_REASON_LIMITS.max}
              </span>
            </div>
          </div>

          <div className="sm:max-w-xs">
            <FormField
              variant="line"
              label="Ngày đặt"
              id="NgayDat"
              name="NgayDat"
              type="date"
              max={todayISO()}
              value={form.NgayDat}
              onChange={(e) => setField("NgayDat", e.target.value)}
              error={errors.NgayDat}
            />
          </div>

          <div className="flex justify-end gap-3 border-t border-stone/20 pt-5">
            <Link
              to={backToList}
              className="rounded-sm border border-stone/30 px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-stone/50 hover:bg-black/[0.03]"
            >
              Hủy
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary"
            >
              {submitting ? "Đang lưu..." : "Đặt lệnh khóa"}
            </button>
          </div>
        </form>

        <aside className="rounded-lg border border-stone/15 bg-white px-5 py-5 lg:sticky lg:top-24">
          <ExamFormContext
            horse={selectedHorse}
            health={selectedHealth}
            records={horseRecords}
            note={
              selectedHorse && selectedHealth?.TrangThai !== TREATMENT_STATE
                ? "Đặt lệnh khóa sẽ chuyển tình trạng sức khỏe của ngựa sang Đang điều trị."
                : undefined
            }
          />
        </aside>
      </div>
    </div>
  );
}
