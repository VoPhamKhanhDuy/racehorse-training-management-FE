import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import FormField from "../../components/FormField";
import HorseAvatar from "../../components/HorseAvatar";
import LoadingState from "../../components/LoadingState";
import useAuth from "../../hooks/useAuth";
import ChoiceChips from "./ChoiceChips";
import ExamFormContext from "./ExamFormContext";
import {
  createMedicalRecord,
  getActiveTrainingLocks,
  getHealthStatuses,
  getHorses,
  getMedicalRecordById,
  getMedicalRecords,
  getVets,
  isLatestMedicalRecord,
  shouldAutoLock,
  updateMedicalRecord,
} from "../../services/vetService";
import {
  HEALTH_STATES,
  INJURY_LOCATIONS,
  INJURY_SEPARATOR,
  MEDICAL_LIMITS,
  NO_INJURY,
} from "../../data/medicalRecordOptions";
import { addAuditLog } from "../../services/auditService";
import { todayISO } from "../../utils/date";
import { toUserID } from "../../utils/userId";

// Ngày khám mặc định hôm nay (tính lúc mở form, không phải lúc tải module)
const createEmptyForm = () => ({ HorseID: "", Ngay: todayISO(), ChanDoan: "", injuries: [], PhacDo: "", TrangThai: "" });

// Kiểm tra form; showHealth: có hiện ô "Tình trạng sức khỏe sau khám" không. Trả { field: thông báo }
function validateExam(form, showHealth) {
  const errors = {};
  const { ChanDoan, PhacDo } = MEDICAL_LIMITS;
  if (!form.HorseID) errors.HorseID = "Vui lòng chọn ngựa.";
  if (!form.Ngay) errors.Ngay = "Vui lòng chọn ngày khám.";
  else if (form.Ngay > todayISO()) errors.Ngay = "Ngày khám không được ở tương lai.";

  const diagnosis = form.ChanDoan.trim();
  if (!diagnosis) errors.ChanDoan = "Vui lòng nhập chẩn đoán.";
  else if (diagnosis.length < ChanDoan.min || diagnosis.length > ChanDoan.max) {
    errors.ChanDoan = `Chẩn đoán phải từ ${ChanDoan.min} đến ${ChanDoan.max} ký tự.`;
  }

  if (form.injuries.length === 0) errors.injuries = `Vui lòng chọn ít nhất một vị trí, hoặc "${NO_INJURY}".`;

  const treatment = form.PhacDo.trim();
  if (!treatment) errors.PhacDo = "Vui lòng nhập phác đồ điều trị.";
  else if (treatment.length < PhacDo.min || treatment.length > PhacDo.max) {
    errors.PhacDo = `Phác đồ điều trị phải từ ${PhacDo.min} đến ${PhacDo.max} ký tự.`;
  }

  if (showHealth && !form.TrangThai) errors.TrangThai = "Vui lòng chọn tình trạng sức khỏe sau khám.";
  return errors;
}

// "Chân trước trái, Gân" → ["Chân trước trái", "Gân"]
const parseInjuries = (text) => (!text ? [] : text === NO_INJURY ? [NO_INJURY] : text.split(INJURY_SEPARATOR));

// Ghi lần khám (/vet/exams/new, ?horse= điền sẵn ngựa) và sửa bệnh án (/vet/exams/:id/edit).
// VetID luôn là bác sĩ đang đăng nhập; chỉ bác sĩ đã ghi được sửa; không đổi ngựa khi sửa; không có xóa.
export default function MedicalExamForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const currentVetId = toUserID(user.id);

  const [form, setForm] = useState(createEmptyForm);
  const [horses, setHorses] = useState([]);
  const [healthList, setHealthList] = useState([]);
  const [locks, setLocks] = useState([]);
  const [records, setRecords] = useState([]);
  const [vets, setVets] = useState([]);
  const [showHealth, setShowHealth] = useState(true); // khi sửa: chỉ hiện nếu là lần khám mới nhất của ngựa
  const [loading, setLoading] = useState(true);
  const [blockedReason, setBlockedReason] = useState("");
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // TODO: thay bằng gọi API thật khi BE xong (hiện đọc từ mock vetService)
  useEffect(() => {
    let ignore = false;
    Promise.all([
      getHorses(),
      getHealthStatuses(),
      getActiveTrainingLocks(),
      getMedicalRecords(),
      getVets(),
      isEdit ? getMedicalRecordById(id) : null,
      isEdit ? isLatestMedicalRecord(id) : true,
    ]).then(([horseList, healthStatuses, lockList, recordList, vetList, record, isLatest]) => {
      if (ignore) return;
      setHorses([...horseList].sort((a, b) => a.Ten.localeCompare(b.Ten, "vi")));
      setHealthList(healthStatuses);
      setLocks(lockList);
      setRecords(recordList);
      setVets(vetList);
      const currentHealth = (horseId) => healthStatuses.find((h) => h.HorseID === Number(horseId))?.TrangThai ?? "";

      if (isEdit) {
        if (!record) setBlockedReason("Bệnh án này không tồn tại.");
        else if (record.VetID !== currentVetId) setBlockedReason("Bạn chỉ được sửa bệnh án do chính mình ghi.");
        else {
          setForm({
            HorseID: String(record.HorseID),
            Ngay: record.Ngay,
            ChanDoan: record.ChanDoan,
            injuries: parseInjuries(record.ViTriChanThuong),
            PhacDo: record.PhacDo,
            TrangThai: currentHealth(record.HorseID),
          });
          setShowHealth(isLatest);
        }
      } else {
        // Vào từ bộ lọc sổ khám bệnh (?horse=) thì điền sẵn ngựa
        const presetHorse = horseList.find((h) => String(h.HorseID) === searchParams.get("horse"));
        if (presetHorse) {
          setForm((prev) => ({ ...prev, HorseID: String(presetHorse.HorseID), TrangThai: currentHealth(presetHorse.HorseID) }));
        }
      }
      setLoading(false);
    });
    return () => {
      ignore = true;
    };
  }, [id, isEdit, currentVetId, searchParams]);

  const selectedHorse = horses.find((h) => String(h.HorseID) === form.HorseID);
  const selectedHealth = healthList.find((h) => String(h.HorseID) === form.HorseID);
  const selectedLock = locks.find((l) => String(l.HorseID) === form.HorseID);
  const lockedByName = selectedLock ? vets.find((v) => v.UserID === selectedLock.VetID)?.HoTen : undefined;
  const horseRecords = records.filter((r) => String(r.HorseID) === form.HorseID);
  // Dòng nhắc ở thẻ ngữ cảnh: lưu lúc này sẽ tự động đặt lệnh khóa huấn luyện
  const willAutoLock = showHealth && Boolean(selectedHorse) && shouldAutoLock(form.injuries, form.TrangThai, Boolean(selectedLock));

  const setField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  // Đổi ngựa: tình trạng sau khám mặc định bằng tình trạng hiện tại của ngựa đó
  const handleHorseChange = (horseId) => {
    const health = healthList.find((h) => String(h.HorseID) === horseId)?.TrangThai ?? "";
    setForm((prev) => ({ ...prev, HorseID: horseId, TrangThai: health }));
    setErrors((prev) => ({ ...prev, HorseID: undefined, TrangThai: undefined }));
  };

  // "Không có chấn thương" loại trừ mọi vị trí khác và ngược lại
  const toggleInjury = (location) => {
    setForm((prev) => {
      if (location === NO_INJURY) return { ...prev, injuries: prev.injuries.includes(NO_INJURY) ? [] : [NO_INJURY] };
      const others = prev.injuries.filter((i) => i !== NO_INJURY);
      const injuries = others.includes(location) ? others.filter((i) => i !== location) : [...others, location];
      return { ...prev, injuries };
    });
    setErrors((prev) => ({ ...prev, injuries: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateExam(form, showHealth);
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setSubmitting(true);
    try {
      const data = { ...form, TrangThai: showHealth ? form.TrangThai : undefined };
      const { record, lock } = isEdit
        ? await updateMedicalRecord(id, data, currentVetId)
        : await createMedicalRecord(data, currentVetId);
      const horseName = selectedHorse?.Ten ?? "ngựa";
      // Service tự đặt lệnh khóa khi có chấn thương + "Đang điều trị" + chưa bị khóa → ghi nhật ký, toast kèm liên kết
      if (lock) {
        addAuditLog({
          UserID: currentVetId,
          HanhDong: "Tự động đặt lệnh khóa huấn luyện",
          TargetTable: "TRAININGLOCK",
          TargetID: lock.LockID,
          targetLabel: horseName,
        });
      }
      navigate(`/vet/exams?horse=${record.HorseID}`, {
        state: {
          toast: lock
            ? {
                text: `Đã lưu bệnh án và tự động đặt lệnh khóa huấn luyện cho ${horseName}.`,
                link: { to: `/vet/locks?horse=${record.HorseID}`, label: "Xem lệnh khóa" },
              }
            : { text: "Đã lưu bệnh án" },
        },
      });
    } catch (err) {
      setErrors({ form: err.message || "Không lưu được bệnh án, vui lòng thử lại." });
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingState />;

  if (blockedReason) {
    return (
      <div className="mx-auto max-w-2xl border-y border-stone/40 px-6 py-16 text-center">
        <h1 className="font-serif text-2xl font-semibold tracking-tight text-ink sm:text-[1.75rem]">Không thể sửa bệnh án</h1>
        <p className="mt-2 text-stone">{blockedReason}</p>
        <Link to="/vet/exams" className="mt-6 inline-block font-semibold text-brass-deep hover:underline">
          ← Quay lại sổ khám bệnh
        </Link>
      </div>
    );
  }

  const backToList = `/vet/exams${form.HorseID ? `?horse=${form.HorseID}` : ""}`;

  return (
    <div className="mx-auto max-w-5xl">
      <Link to={backToList} className="text-sm font-medium text-brass-deep hover:underline">
        ← Quay lại sổ khám bệnh
      </Link>
      <h1 className="mt-3 font-serif text-2xl font-semibold tracking-tight text-ink sm:text-[1.75rem]">
        {isEdit ? "Sửa bệnh án" : "Ghi lần khám"}
      </h1>

      {/* 2 cột: form bên trái, ngữ cảnh ngựa bên phải (dính khi cuộn). Dưới lg ngữ cảnh xuống dưới form. */}
      <div className="mt-6 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-10">
        <form onSubmit={handleSubmit} noValidate className="min-w-0 space-y-6 border-t border-stone/20 pt-6">
          {errors.form && <p className="rounded-sm border-l-2 border-rust bg-rust/5 px-4 py-3 text-sm text-rust">{errors.form}</p>}

          <ChoiceChips
            legend="Ngựa"
            name="HorseID"
            options={horses}
            getKey={(horse) => String(horse.HorseID)}
            renderOption={(horse) => (
              <>
                <HorseAvatar horse={horse} size={22} />
                {horse.Ten}
              </>
            )}
            value={form.HorseID}
            disabledOption={(horse) => isEdit && String(horse.HorseID) !== form.HorseID}
            hint={isEdit ? "Không đổi được ngựa của bệnh án đã ghi." : undefined}
            error={errors.HorseID}
            onChange={handleHorseChange}
          />

          <div className="sm:max-w-xs">
            <FormField
              variant="line"
              label="Ngày khám"
              id="Ngay"
              name="Ngay"
              type="date"
              max={todayISO()}
              value={form.Ngay}
              onChange={(e) => setField("Ngay", e.target.value)}
              error={errors.Ngay}
            />
          </div>

          <FormField
            variant="line"
            label="Chẩn đoán"
            id="ChanDoan"
            name="ChanDoan"
            placeholder="Ví dụ: Viêm gân gấp chân trước trái"
            value={form.ChanDoan}
            onChange={(e) => setField("ChanDoan", e.target.value)}
            error={errors.ChanDoan}
          />

          <ChoiceChips
            legend="Vị trí chấn thương"
            name="ViTriChanThuong"
            multiple
            options={[NO_INJURY, ...INJURY_LOCATIONS]}
            value={form.injuries}
            error={errors.injuries}
            onChange={toggleInjury}
          />

          <div>
            <label htmlFor="PhacDo" className="mb-1 block font-serif text-sm font-semibold text-stone">
              Phác đồ điều trị
            </label>
            <textarea
              id="PhacDo"
              name="PhacDo"
              rows={5}
              placeholder="Ví dụ: Nghỉ tập 2 tuần, chườm lạnh 2 lần/ngày, tái khám sau 14 ngày."
              aria-invalid={Boolean(errors.PhacDo)}
              aria-describedby="PhacDo-count"
              value={form.PhacDo}
              onChange={(e) => setField("PhacDo", e.target.value)}
              className={`w-full resize-y border-b bg-transparent px-1 py-2 text-ink outline-none transition-colors placeholder:text-stone/50 ${
                errors.PhacDo ? "border-rust" : "border-stone/50 focus:border-brass"
              }`}
            />
            <div className="mt-1 flex items-start justify-between gap-4">
              {errors.PhacDo ? <p className="text-sm text-rust">{errors.PhacDo}</p> : <span />}
              <span
                id="PhacDo-count"
                className={`shrink-0 text-xs tabular-nums ${form.PhacDo.trim().length > MEDICAL_LIMITS.PhacDo.max ? "text-rust" : "text-stone"}`}
              >
                {form.PhacDo.trim().length}/{MEDICAL_LIMITS.PhacDo.max}
              </span>
            </div>
          </div>

          {showHealth && (
            <ChoiceChips
              legend="Tình trạng sức khỏe sau khám"
              name="TrangThai"
              options={HEALTH_STATES}
              value={form.TrangThai}
              hint="Chỉ cập nhật tình trạng hiện tại của ngựa nếu ngày khám không cũ hơn lần cập nhật gần nhất."
              error={errors.TrangThai}
              onChange={(value) => setField("TrangThai", value)}
            />
          )}

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
              className="cursor-pointer rounded-sm bg-brass px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-brass/85 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Đang lưu..." : "Lưu bệnh án"}
            </button>
          </div>
        </form>

        <aside className="rounded-lg border border-stone/15 bg-white px-5 py-5 lg:sticky lg:top-24">
          <ExamFormContext
            horse={selectedHorse}
            health={selectedHealth}
            lock={selectedLock}
            lockedByName={lockedByName}
            records={horseRecords}
            editingRecordId={isEdit ? Number(id) : undefined}
            note={willAutoLock ? "Lưu với tình trạng Đang điều trị và có chấn thương sẽ tự động khóa huấn luyện." : undefined}
          />
        </aside>
      </div>
    </div>
  );
}
