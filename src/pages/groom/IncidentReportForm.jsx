import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import LoadingState from "../../components/LoadingState";
import useAuth from "../../hooks/useAuth";
import IncidentImageField from "./IncidentImageField";
import { createIncidentReport, getCareTasks, getHorses, getStableNumbers } from "../../services/careService";
import { addAuditLog } from "../../services/auditService";
import { INCIDENT_DESCRIPTION_MAX, INCIDENT_TYPES } from "../../data/incidentOptions";
import { todayISO } from "../../utils/date";
import { toUserID } from "../../utils/userId";

const BACK_TO_LIST = "/groom/incidents";

const LABEL = "mb-1.5 block text-[13px] font-semibold text-[#4a3f33]";
const FOCUS_RING = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c2570c]";
const fieldClass = (hasError) =>
  `h-10 w-full rounded-[4px] border bg-white px-3 text-sm text-[#2b2118] outline-none transition-colors placeholder:text-[#6b6055]/70 focus:border-[#c2570c] ${
    hasError ? "border-[#c0262d]" : "border-[#cfc4ad]"
  }`;
const ERROR_TEXT = "mt-1.5 text-sm text-[#c0262d]";

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
    <div className="mx-auto w-full max-w-[1100px] md:px-8">
      <Link to={BACK_TO_LIST} className={`text-sm text-[#c2570c] hover:underline ${FOCUS_RING}`}>
        ← Báo cáo sự cố
      </Link>
      <h1 className="mt-3 font-serif text-[30px] leading-tight font-semibold tracking-tight text-[#2b2118]">Gửi báo cáo sự cố</h1>

      <div className="mt-6 max-w-[720px]">
        <form onSubmit={handleSubmit} noValidate className="min-w-0 space-y-5 rounded-[4px] border border-[#d9cfba] bg-white p-6">
          {errors.form && (
            <p className="rounded-[4px] border border-l-4 border-[#d9cfba] border-l-[#c0262d] bg-white px-4 py-3 text-sm text-[#c0262d]">
              {errors.form}
            </p>
          )}

          <div>
            <label htmlFor="HorseID" className={LABEL}>
              Ngựa
            </label>
            <select
              id="HorseID"
              name="HorseID"
              value={form.HorseID}
              onChange={(e) => setField("HorseID", e.target.value)}
              aria-invalid={Boolean(errors.HorseID)}
              className={`${fieldClass(errors.HorseID)} cursor-pointer`}
            >
              <option value="">Chọn ngựa</option>
              {myHorses.length > 0 && <optgroup label="Ngựa bạn phụ trách">{myHorses.map(renderOption)}</optgroup>}
              {otherHorses.length > 0 && (
                <optgroup label={myHorses.length > 0 ? "Ngựa khác" : "Tất cả ngựa"}>{otherHorses.map(renderOption)}</optgroup>
              )}
            </select>
            {errors.HorseID && <p className={ERROR_TEXT}>{errors.HorseID}</p>}
          </div>

          <fieldset aria-invalid={Boolean(errors.LoaiSuCo)}>
            <legend className={LABEL}>Loại sự cố</legend>
            <div className="flex flex-wrap gap-2">
              {INCIDENT_TYPES.map((type) => {
                const checked = form.LoaiSuCo === type;
                return (
                  <label
                    key={type}
                    className={`flex h-10 cursor-pointer items-center rounded-[4px] border px-4 text-sm transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[#c2570c] ${
                      checked
                        ? "border-[#c2570c] bg-[#fbf3e6] font-semibold text-[#2b2118]"
                        : `bg-white text-[#2b2118] hover:bg-[#f0efec] ${errors.LoaiSuCo ? "border-[#c0262d]" : "border-[#cfc4ad]"}`
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
            {errors.LoaiSuCo && <p className={ERROR_TEXT}>{errors.LoaiSuCo}</p>}
          </fieldset>

          <div>
            <label htmlFor="MoTa" className={LABEL}>
              Mô tả
            </label>
            <textarea
              id="MoTa"
              name="MoTa"
              rows={4}
              placeholder="Mô tả ngắn điều đã xảy ra"
              aria-invalid={Boolean(errors.MoTa)}
              aria-describedby="MoTa-count"
              value={form.MoTa}
              onChange={(e) => setField("MoTa", e.target.value)}
              className={`min-h-[120px] w-full resize-y rounded-[4px] border bg-white px-3 py-2.5 text-sm text-[#2b2118] outline-none transition-colors placeholder:text-[#6b6055]/70 focus:border-[#c2570c] ${
                errors.MoTa ? "border-[#c0262d]" : "border-[#cfc4ad]"
              }`}
            />
            <div className="mt-1 flex items-start justify-between gap-4">
              {errors.MoTa ? <p className="text-sm text-[#c0262d]">{errors.MoTa}</p> : <span />}
              <span
                id="MoTa-count"
                className={`shrink-0 text-[13px] tabular-nums ${form.MoTa.trim().length > INCIDENT_DESCRIPTION_MAX ? "text-[#c0262d]" : "text-[#6b6055]"}`}
              >
                {form.MoTa.trim().length}/{INCIDENT_DESCRIPTION_MAX}
              </span>
            </div>
          </div>

          <div className="w-full sm:w-[220px]">
            <label htmlFor="Ngay" className={LABEL}>
              Ngày
            </label>
            <input
              id="Ngay"
              name="Ngay"
              type="date"
              max={todayISO()}
              value={form.Ngay}
              onChange={(e) => setField("Ngay", e.target.value)}
              aria-invalid={Boolean(errors.Ngay)}
              className={fieldClass(errors.Ngay)}
            />
            {errors.Ngay && <p className={ERROR_TEXT}>{errors.Ngay}</p>}
          </div>

          <IncidentImageField
            value={form.HinhAnh}
            error={errors.HinhAnh}
            onChange={(dataUrl) => setField("HinhAnh", dataUrl)}
            onError={(message) => setErrors((prev) => ({ ...prev, HinhAnh: message }))}
          />

          <div className="flex justify-end gap-3 border-t border-[#d9cfba] pt-5">
            <Link
              to={BACK_TO_LIST}
              className={`inline-flex h-10 items-center rounded-[4px] border border-[#cfc4ad] bg-white px-5 text-sm font-semibold text-[#2b2118] transition-colors hover:bg-[#f0efec] ${FOCUS_RING}`}
            >
              Hủy
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className={`h-10 cursor-pointer rounded-[4px] bg-[#c2570c] px-5 text-sm font-semibold whitespace-nowrap text-white transition-colors hover:bg-[#a8480a] disabled:cursor-wait disabled:opacity-60 ${FOCUS_RING}`}
            >
              {submitting ? "Đang gửi..." : "Gửi báo cáo"}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
