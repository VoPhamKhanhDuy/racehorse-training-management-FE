import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import FormField from "../../components/FormField";
import HorseIcon from "../../components/HorseIcon";
import LoadingState from "../../components/LoadingState";
import HorseSummary from "./HorseSummary";
import { SESSION_LIMITS, SESSION_UNITS } from "../../data/trainingSessionOptions";
import {
  createTrainingSession,
  getActiveTrainingLocks,
  getHealthStatuses,
  getHorses,
  getTrainingSessions,
  updateTrainingSession,
} from "../../services/trainerService";
import { formatDate, todayISO } from "../../utils/date";

const emptyForm = { HorseID: "", Ngay: "", NhipTim: "", VanToc: "", ChiSoTap: "", NhanXet: "" };
const LEGEND = "mb-1.5 block font-serif text-sm font-semibold text-stone";
const NUMBER_FIELDS = [
  { name: "NhipTim", label: "Nhịp tim", suffix: SESSION_UNITS.NhipTim, step: "1", inputMode: "numeric" },
  { name: "VanToc", label: "Vận tốc", suffix: SESSION_UNITS.VanToc, step: "0.1", inputMode: "decimal" },
  { name: "ChiSoTap", label: "Chỉ số tập", suffix: "/100", step: "1", inputMode: "numeric" },
];

// Chip chọn ngựa — cùng kiểu pill lọc; ngựa đang khóa tập thì mờ, không chọn được
const chipClass = (active, disabled) =>
  `flex items-center gap-2 rounded-full border py-1 pr-3.5 pl-1 text-sm transition-colors ${
    disabled
      ? "cursor-not-allowed border-stone/15 bg-white text-stone/45"
      : active
        ? "cursor-pointer border-brass bg-brass/15 font-medium text-brass-deep"
        : "cursor-pointer border-stone/25 bg-white text-ink hover:border-stone/40"
  }`;

// Form buổi tập (TRAININGSESSION), dùng chung cho /trainer/sessions/new?horse=ID và /trainer/sessions/:id/edit.
// Bố cục 2 cột như form giáo án: form trái, ngữ cảnh ngựa phải (3 buổi gần nhất).
// Ràng buộc: bắt buộc ngựa/ngày/3 chỉ số; số trong giới hạn; ngày không ở tương lai; mỗi ngựa 1 buổi/ngày;
// ngựa đang khóa tập không ghi nhận buổi mới (sửa buổi cũ của ngựa đã khóa thì vẫn được).
export default function TrainingSessionForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const today = todayISO();
  const [form, setForm] = useState({ ...emptyForm, Ngay: today });
  const [originalHorseId, setOriginalHorseId] = useState(null); // ngựa của buổi đang sửa
  const [horses, setHorses] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [healthStatuses, setHealthStatuses] = useState([]);
  const [lockedHorseIds, setLockedHorseIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // TODO: thay bằng gọi API thật khi BE xong (hiện đọc từ mock trainerService)
  useEffect(() => {
    let ignore = false;
    Promise.all([getHorses(), getTrainingSessions(), getHealthStatuses(), getActiveTrainingLocks()]).then(
      ([horseList, sessionList, healthList, lockList]) => {
        if (ignore) return;
        const locked = new Set(lockList.map((l) => l.HorseID));
        setHorses([...horseList].sort((a, b) => a.Ten.localeCompare(b.Ten, "vi")));
        setSessions(sessionList);
        setHealthStatuses(healthList);
        setLockedHorseIds(locked);
        if (isEdit) {
          const session = sessionList.find((s) => s.SessionID === Number(id));
          if (!session) setNotFound(true);
          else {
            setOriginalHorseId(session.HorseID);
            setForm({
              HorseID: String(session.HorseID),
              Ngay: session.Ngay,
              NhipTim: String(session.NhipTim),
              VanToc: String(session.VanToc),
              ChiSoTap: String(session.ChiSoTap),
              NhanXet: session.NhanXet ?? "",
            });
          }
        } else {
          // Điền sẵn ngựa đang chọn ở trang danh sách (bỏ qua nếu ngựa đang khóa tập)
          const horseParam = searchParams.get("horse");
          if (horseList.some((h) => String(h.HorseID) === horseParam) && !locked.has(Number(horseParam))) {
            setForm((prev) => ({ ...prev, HorseID: horseParam }));
          }
        }
        setLoading(false);
      }
    );
    return () => {
      ignore = true;
    };
  }, [id, isEdit, searchParams]);

  const editingId = isEdit ? Number(id) : null;
  const selectedHorse = horses.find((h) => h.HorseID === Number(form.HorseID));
  // Ngựa đang khóa tập: không chọn được, trừ chính ngựa của buổi đang sửa
  const isHorseBlocked = (horseId) => lockedHorseIds.has(horseId) && horseId !== originalHorseId;
  const recentSessions = sessions
    .filter((s) => s.HorseID === Number(form.HorseID) && s.SessionID !== editingId)
    .sort((a, b) => b.Ngay.localeCompare(a.Ngay))
    .slice(0, 3);
  const backToList = form.HorseID ? `/trainer/sessions?horse=${form.HorseID}` : "/trainer/sessions";

  const setField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    // Đổi ngựa hoặc ngày có thể hết trùng → xóa lỗi trùng ngày đang hiện
    setErrors((prev) => ({ ...prev, [name]: undefined, ...(name === "HorseID" && { Ngay: undefined }) }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.HorseID) newErrors.HorseID = "Vui lòng chọn ngựa";
    else if (isHorseBlocked(Number(form.HorseID)))
      newErrors.HorseID = "Ngựa đang bị khóa tập, không thể ghi nhận buổi tập mới.";

    if (!form.Ngay) newErrors.Ngay = "Vui lòng chọn ngày tập";
    else if (form.Ngay > today) newErrors.Ngay = "Ngày tập không được ở tương lai";
    else if (
      form.HorseID &&
      sessions.some((s) => s.HorseID === Number(form.HorseID) && s.Ngay === form.Ngay && s.SessionID !== editingId)
    )
      newErrors.Ngay = "Ngựa này đã có buổi tập trong ngày đã chọn.";

    for (const field of NUMBER_FIELDS) {
      const raw = form[field.name].trim();
      const value = Number(raw);
      const { min, max } = SESSION_LIMITS[field.name];
      if (!raw) newErrors[field.name] = `Vui lòng nhập ${field.label.toLowerCase()}`;
      else if (!Number.isFinite(value)) newErrors[field.name] = `${field.label} chỉ nhận số`;
      else if (value < min || value > max) newErrors[field.name] = `${field.label} phải trong khoảng ${min}–${max}`;
    }
    if (form.NhanXet.length > SESSION_LIMITS.NhanXetMaxLength)
      newErrors.NhanXet = `Nhận xét tối đa ${SESSION_LIMITS.NhanXetMaxLength} ký tự`;
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setSubmitting(true);
    try {
      if (isEdit) await updateTrainingSession(id, form);
      else await createTrainingSession(form);
      navigate(backToList, { state: { message: "Đã lưu buổi tập" } });
    } catch (err) {
      setErrors({ form: err.message || "Không lưu được buổi tập, vui lòng thử lại." });
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingState />;

  if (notFound) {
    return (
      <div className="mx-auto max-w-2xl border-y border-stone/40 px-6 py-16 text-center">
        <h1 className="font-serif text-2xl font-semibold tracking-tight text-ink sm:text-[1.75rem]">Không tìm thấy buổi tập</h1>
        <p className="mt-2 text-stone">Buổi tập này không tồn tại.</p>
        <Link to="/trainer/sessions" className="mt-6 inline-block font-semibold text-brass-deep hover:underline">
          ← Quay lại kết quả buổi tập
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      <Link to={backToList} className="text-sm font-medium text-brass-deep hover:underline">
        ← Quay lại kết quả buổi tập
      </Link>
      <h1 className="mt-3 font-serif text-2xl font-semibold tracking-tight text-ink sm:text-[1.75rem]">
        {isEdit ? "Sửa buổi tập" : "Ghi nhận buổi tập"}
      </h1>

      {/* 2 cột như form giáo án: form trái, ngữ cảnh ngựa phải (dính khi cuộn). Dưới lg ngữ cảnh xuống dưới form. */}
      <div className="mt-6 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-10">
        <form onSubmit={handleSubmit} noValidate className="space-y-5 border-t border-stone/20 pt-6">
          {errors.form && (
            <p className="rounded-sm border-l-2 border-alert bg-alert/5 px-4 py-3 text-sm text-alert">{errors.form}</p>
          )}

          <fieldset>
            <legend className={LEGEND}>Ngựa</legend>
            <div role="radiogroup" aria-label="Ngựa" className="flex flex-wrap gap-2">
              {horses.map((horse) => {
                const blocked = isHorseBlocked(horse.HorseID);
                const active = form.HorseID === String(horse.HorseID);
                return (
                  <button
                    key={horse.HorseID}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    disabled={blocked}
                    title={blocked ? "Ngựa đang bị khóa tập" : undefined}
                    onClick={() => setField("HorseID", String(horse.HorseID))}
                    className={chipClass(active, blocked)}
                  >
                    <span className={`flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-stone/10 text-stone ${blocked ? "opacity-50" : ""}`}>
                      {horse.photo ? (
                        <img src={horse.photo} alt="" className="h-full w-full object-cover object-[center_25%]" />
                      ) : (
                        <HorseIcon className="h-3 w-3" />
                      )}
                    </span>
                    {horse.Ten}
                  </button>
                );
              })}
            </div>
            {errors.HorseID && <p className="mt-1.5 text-sm text-alert">{errors.HorseID}</p>}
          </fieldset>

          <div className="sm:max-w-[16rem]">
            <FormField
              variant="outline"
              label="Ngày tập"
              id="Ngay"
              name="Ngay"
              type="date"
              max={today}
              value={form.Ngay}
              onChange={(e) => setField("Ngay", e.target.value)}
              error={errors.Ngay}
            />
          </div>

          <div className="grid gap-x-5 gap-y-5 sm:grid-cols-3">
            {NUMBER_FIELDS.map((field) => (
              <FormField
                key={field.name}
                variant="outline"
                label={field.label}
                id={field.name}
                name={field.name}
                type="number"
                min={SESSION_LIMITS[field.name].min}
                max={SESSION_LIMITS[field.name].max}
                step={field.step}
                inputMode={field.inputMode}
                suffix={field.suffix}
                value={form[field.name]}
                onChange={(e) => setField(field.name, e.target.value)}
                error={errors[field.name]}
              />
            ))}
          </div>

          <div>
            <label htmlFor="NhanXet" className={LEGEND}>
              Nhận xét <span className="font-sans text-xs font-normal text-stone">(không bắt buộc)</span>
            </label>
            {/* Textarea cùng kiểu ô viền (FormField variant "outline") */}
            <textarea
              id="NhanXet"
              rows={3}
              maxLength={SESSION_LIMITS.NhanXetMaxLength}
              value={form.NhanXet}
              onChange={(e) => setField("NhanXet", e.target.value)}
              aria-invalid={Boolean(errors.NhanXet)}
              aria-describedby="NhanXetCount"
              className={`w-full resize-y rounded-md border bg-white px-3.5 py-2.5 text-ink outline-none transition-colors placeholder:text-stone/50 focus:ring-2 focus:ring-brass/20 ${
                errors.NhanXet ? "border-alert" : "border-stone/25 focus:border-brass"
              }`}
            />
            <div className="mt-1 flex justify-between gap-4 text-xs">
              <span className="text-alert">{errors.NhanXet}</span>
              <span id="NhanXetCount" className="text-stone tabular-nums">
                {form.NhanXet.length}/{SESSION_LIMITS.NhanXetMaxLength}
              </span>
            </div>
          </div>

          {/* Hàng nút căn phải: Hủy (viền) + Lưu buổi tập (nền cam, không kéo hết chiều ngang) */}
          <div className="flex justify-end gap-3 border-t border-stone/20 pt-5">
            <Link
              to={backToList}
              className="rounded-sm border border-stone/25 bg-white px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:border-stone/40"
            >
              Hủy
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="cursor-pointer rounded-sm bg-brass px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-brass/85 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Đang lưu..." : "Lưu buổi tập"}
            </button>
          </div>
        </form>

        <aside className="rounded-lg border border-stone/15 bg-white px-5 py-5 lg:sticky lg:top-24">
          {selectedHorse ? (
            <div className="space-y-5">
              <HorseSummary
                horse={selectedHorse}
                healthStatus={healthStatuses.find((h) => h.HorseID === selectedHorse.HorseID)?.TrangThai}
              />
              <section aria-label="3 buổi gần nhất" className="border-t border-stone/15 pt-4">
                <h3 className="font-serif text-base font-semibold text-ink">3 buổi gần nhất</h3>
                {recentSessions.length === 0 ? (
                  <p className="mt-2 text-sm text-stone">Chưa có buổi tập nào được ghi nhận.</p>
                ) : (
                  <ul className="mt-1">
                    {recentSessions.map((s) => (
                      <li key={s.SessionID} className="border-b border-stone/15 py-2 text-sm last:border-b-0">
                        <span className="font-medium text-ink tabular-nums">{formatDate(s.Ngay)}</span>
                        <span className="text-stone tabular-nums">
                          {" "}
                          · {s.NhipTim} {SESSION_UNITS.NhipTim} · {s.VanToc.toLocaleString("vi-VN")} {SESSION_UNITS.VanToc} · chỉ số{" "}
                          {s.ChiSoTap}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          ) : (
            <p className="py-6 text-center text-sm text-stone">Chọn ngựa để xem thông tin và các buổi tập gần nhất.</p>
          )}
        </aside>
      </div>
    </div>
  );
}
