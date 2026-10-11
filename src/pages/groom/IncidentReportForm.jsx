import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import FormField from "../../components/FormField";
import LoadingState from "../../components/LoadingState";
import SelectField from "../../components/SelectField";
import useAuth from "../../hooks/useAuth";
import IncidentFormContext from "./IncidentFormContext";
import IncidentImageField from "./IncidentImageField";
import { createIncidentReport, getCareTasks, getHorses, getStableNumbers } from "../../services/careService";
import { addAuditLog } from "../../services/auditService";
import { INCIDENT_DESCRIPTION_MAX, INCIDENT_TYPES } from "../../data/incidentOptions";
import { todayISO } from "../../utils/date";
import { toUserID } from "../../utils/userId";

const BACK_TO_LIST = "/groom/incidents";

// Ngày mặc định hôm nay (tính lúc mở form, không phải lúc tải module)
const createEmptyForm = () => ({ HorseID: "", LoaiSuCo: "", MoTa: "", Ngay: todayISO(), HinhAnh: "" });

// Kiểm tra form, trả { field: thông báo }. Mô tả, hình ảnh không bắt buộc (lỗi ảnh báo ngay lúc chọn).
function validateReport(form) {
  const errors = {};
  if (!form.HorseID) errors.HorseID = "Vui lòng chọn ngựa.";
  if (!form.LoaiSuCo) errors.LoaiSuCo = "Vui lòng chọn loại sự cố.";
  if (form.MoTa.trim().length > INCIDENT_DESCRIPTION_MAX) errors.MoTa = `Mô tả tối đa ${INCIDENT_DESCRIPTION_MAX} ký tự.`;
  if (!form.Ngay) errors.Ngay = "Vui lòng chọn ngày.";
  else if (form.Ngay > todayISO()) errors.Ngay = "Ngày không được ở tương lai.";
  return errors;
}

// Gửi báo cáo sự cố (/groom/incidents/new): GroomID luôn là nhân viên đang đăng nhập. Gửi xong không sửa/xóa được.
// Ngựa do nhân viên phụ trách (có CARETASK của mình) xếp lên đầu danh sách chọn.
export default function IncidentReportForm() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const groomId = toUserID(user.id);

  const [form, setForm] = useState(createEmptyForm);
  const [horses, setHorses] = useState([]);
  const [stables, setStables] = useState({});
  const [myHorseIds, setMyHorseIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // TODO: thay bằng gọi API thật khi BE xong (hiện đọc từ mock careService)
  useEffect(() => {
    let ignore = false;
    Promise.all([getHorses(), getStableNumbers(), getCareTasks(groomId)]).then(([horseList, stableMap, taskList]) => {
      if (ignore) return;
      setHorses([...horseList].sort((a, b) => a.Ten.localeCompare(b.Ten, "vi")));
      setStables(stableMap);
      setMyHorseIds(new Set(taskList.map((t) => t.HorseID)));
      setLoading(false);
    });
    return () => {
      ignore = true;
    };
  }, [groomId]);

  const myHorses = horses.filter((h) => myHorseIds.has(h.HorseID));
  const otherHorses = horses.filter((h) => !myHorseIds.has(h.HorseID));
  const selectedHorse = horses.find((h) => String(h.HorseID) === form.HorseID);

  const setField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateReport(form);
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setSubmitting(true);
    try {
      const report = await createIncidentReport(form, groomId);
      addAuditLog({
        UserID: groomId,
        HanhDong: "Gửi báo cáo sự cố",
        TargetTable: "INCIDENTREPORT",
        TargetID: report.ReportID,
        targetLabel: selectedHorse?.Ten,
      });
      navigate(BACK_TO_LIST, { state: { toast: { text: "Đã gửi báo cáo sự cố" } } });
    } catch (err) {
      setErrors({ form: err.message || "Không gửi được báo cáo, vui lòng thử lại." });
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingState />;

  const renderOption = (horse) => (
    <option key={horse.HorseID} value={horse.HorseID}>
      {horse.Ten}
      {stables[horse.HorseID] ? ` – Chuồng ${stables[horse.HorseID]}` : ""}
    </option>
  );

  return (
    <div className="mx-auto max-w-5xl">
      <Link to={BACK_TO_LIST} className="text-sm font-medium text-brass-deep hover:underline">
        ← Quay lại báo cáo sự cố
      </Link>
      <h1 className="mt-3 font-serif text-2xl font-semibold tracking-tight text-ink sm:text-[1.75rem]">Gửi báo cáo sự cố</h1>

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
              {myHorses.length > 0 && <optgroup label="Ngựa bạn phụ trách">{myHorses.map(renderOption)}</optgroup>}
              {otherHorses.length > 0 && (
                <optgroup label={myHorses.length > 0 ? "Ngựa khác" : "Tất cả ngựa"}>{otherHorses.map(renderOption)}</optgroup>
              )}
            </SelectField>
          </div>

          <fieldset aria-invalid={Boolean(errors.LoaiSuCo)}>
            <legend className="mb-1.5 block font-serif text-sm font-semibold text-stone">Loại sự cố</legend>
            <div className="flex flex-wrap gap-2">
              {INCIDENT_TYPES.map((type) => {
                const checked = form.LoaiSuCo === type;
                return (
                  <label
                    key={type}
                    className={`cursor-pointer rounded-full border px-3.5 py-1.5 text-sm transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brass/40 ${
                      checked
                        ? "border-brass bg-brass/15 font-medium text-brass-deep"
                        : `bg-white text-ink hover:border-stone/40 ${errors.LoaiSuCo ? "border-rust" : "border-stone/25"}`
                    }`}
                  >
                    <input
                      type="radio"
                      name="LoaiSuCo"
                      value={type}
                      checked={checked}
                      onChange={() => setField("LoaiSuCo", type)}
                      className="sr-only"
                    />
                    {type}
                  </label>
                );
              })}
            </div>
            {errors.LoaiSuCo && <p className="mt-1.5 text-sm text-rust">{errors.LoaiSuCo}</p>}
          </fieldset>

          <div>
            <label htmlFor="MoTa" className="mb-1 block font-serif text-sm font-semibold text-stone">
              Mô tả
            </label>
            <textarea
              id="MoTa"
              name="MoTa"
              rows={3}
              placeholder="Mô tả ngắn điều đã xảy ra"
              aria-invalid={Boolean(errors.MoTa)}
              aria-describedby="MoTa-count"
              value={form.MoTa}
              onChange={(e) => setField("MoTa", e.target.value)}
              className={`w-full resize-y border-b bg-transparent px-1 py-2 text-ink outline-none transition-colors placeholder:text-stone/50 ${
                errors.MoTa ? "border-rust" : "border-stone/50 focus:border-brass"
              }`}
            />
            <div className="mt-1 flex items-start justify-between gap-4">
              {errors.MoTa ? <p className="text-sm text-rust">{errors.MoTa}</p> : <span />}
              <span
                id="MoTa-count"
                className={`shrink-0 text-xs tabular-nums ${form.MoTa.trim().length > INCIDENT_DESCRIPTION_MAX ? "text-rust" : "text-stone"}`}
              >
                {form.MoTa.trim().length}/{INCIDENT_DESCRIPTION_MAX}
              </span>
            </div>
          </div>

          <div className="sm:max-w-xs">
            <FormField
              variant="line"
              label="Ngày"
              id="Ngay"
              name="Ngay"
              type="date"
              max={todayISO()}
              value={form.Ngay}
              onChange={(e) => setField("Ngay", e.target.value)}
              error={errors.Ngay}
            />
          </div>

          <IncidentImageField
            value={form.HinhAnh}
            error={errors.HinhAnh}
            onChange={(dataUrl) => setField("HinhAnh", dataUrl)}
            onError={(message) => setErrors((prev) => ({ ...prev, HinhAnh: message }))}
          />

          <div className="flex justify-end gap-3 border-t border-stone/20 pt-5">
            <Link
              to={BACK_TO_LIST}
              className="rounded-sm border border-stone/30 px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-stone/50 hover:bg-black/[0.03]"
            >
              Hủy
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary"
            >
              {submitting ? "Đang gửi..." : "Gửi báo cáo"}
            </button>
          </div>
        </form>

        <aside className="rounded-lg border border-stone/15 bg-white px-5 py-5 lg:sticky lg:top-24">
          <IncidentFormContext horse={selectedHorse} stable={selectedHorse && stables[selectedHorse.HorseID]} />
        </aside>
      </div>
    </div>
  );
}
