import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Footprints, HeartPulse, Info, MoreHorizontal, Send, UtensilsCrossed, Wrench } from "lucide-react";
import LoadingState from "../../components/LoadingState";
import HorseAvatar from "../../components/HorseAvatar";
import useAuth from "../../hooks/useAuth";
import IncidentImageField from "./IncidentImageField";
import { createIncidentReport, getCareTasks, getHorses, getStableNumbers } from "../../services/careService";
import { addAuditLog } from "../../services/auditService";
import { HEALTH_INCIDENT_TYPES, INCIDENT_DESCRIPTION_MAX, INCIDENT_TYPES } from "../../data/incidentOptions";
import { formatDate, todayISO } from "../../utils/date";
import { toUserID } from "../../utils/userId";
import DateInput from "../../components/DateInput";

const BACK_TO_LIST = "/groom/incidents";

const TYPE_ICON = {
  "Vết thương": HeartPulse,
  "Khập khiễng": Footprints,
  "Bỏ ăn": UtensilsCrossed,
  "Chuồng/thiết bị hỏng": Wrench,
  Khác: MoreHorizontal,
};

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
  const [loadError, setLoadError] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let ignore = false;
    Promise.all([getHorses(), getStableNumbers(), getCareTasks(groomId)])
      .then(([horseList, stableMap, taskList]) => {
        if (ignore) return;
        setHorses([...horseList].sort((a, b) => a.Ten.localeCompare(b.Ten, "vi")));
        setStables(stableMap);
        setMyHorseIds(new Set(taskList.map((t) => t.HorseID)));
        setLoading(false);
      })
      .catch((err) => {
        if (ignore) return;
        setLoadError(err.message || "Không tải được dữ liệu.");
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

  if (loadError) {
    return (
      <div className="mx-auto max-w-5xl">
        <p className="border-l-2 border-rust bg-rust/5 px-4 py-3 text-sm text-rust">{loadError}</p>
      </div>
    );
  }

  const renderOption = (horse) => (
    <option key={horse.HorseID} value={horse.HorseID}>
      {horse.Ten}
      {stables[horse.HorseID] ? ` – Chuồng ${stables[horse.HorseID]}` : ""}
    </option>
  );

  const isHealthType = HEALTH_INCIDENT_TYPES.includes(form.LoaiSuCo);
  const handlerText = !form.LoaiSuCo
    ? "Chọn loại sự cố để biết bộ phận tiếp nhận"
    : isHealthType
      ? "Bác sĩ thú y hoặc Quản lý CLB"
      : "Quản lý CLB";

  return (
    <div className="w-full">
      <Link to={BACK_TO_LIST} className={`inline-flex items-center gap-1 text-sm font-medium text-[#c2570c] hover:underline ${FOCUS_RING}`}>
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Báo cáo sự cố
      </Link>
      <h1 className="mt-3 font-serif text-[30px] leading-tight font-semibold tracking-tight text-[#2b2118]">Gửi báo cáo sự cố</h1>
      <p className="mt-1 text-sm text-[#4a3f33]">Ghi nhận nhanh sự cố về sức khỏe ngựa hoặc chuồng trại để bộ phận liên quan xử lý kịp thời.</p>

      <div className="mt-6 grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <form onSubmit={handleSubmit} noValidate className="min-w-0 overflow-hidden rounded-[6px] border border-[#cfc4ad] bg-white shadow-xs">
          <div className="border-b border-[#ece5d8] bg-[#faf7f2] px-6 py-3.5">
            <h2 className="text-sm font-semibold text-[#2b2118]">Thông tin sự cố</h2>
            <p className="text-xs text-[#6b6055]">Các mục có dấu * là bắt buộc. Báo cáo đã gửi sẽ không sửa được.</p>
          </div>

          <div className="space-y-6 p-6">
          {errors.form && (
            <p className="rounded-[4px] border border-l-4 border-[#d9cfba] border-l-[#c0262d] bg-white px-4 py-3 text-sm text-[#c0262d]">
              {errors.form}
            </p>
          )}

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-[minmax(0,1fr)_220px]">
          <div>
            <label htmlFor="HorseID" className={LABEL}>
              Ngựa <span className="text-[#c0262d]">*</span>
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

          <div>
            <label htmlFor="Ngay" className={LABEL}>
              Ngày xảy ra <span className="text-[#c0262d]">*</span>
            </label>
            <DateInput
              id="Ngay"
              name="Ngay"
              max={todayISO()}
              value={form.Ngay}
              onChange={(e) => setField("Ngay", e.target.value)}
              aria-invalid={Boolean(errors.Ngay)}
              className={fieldClass(errors.Ngay)}
            />
            {errors.Ngay && <p className={ERROR_TEXT}>{errors.Ngay}</p>}
          </div>
          </div>

          <fieldset aria-invalid={Boolean(errors.LoaiSuCo)}>
            <legend className={LABEL}>
              Loại sự cố <span className="text-[#c0262d]">*</span>
            </legend>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-5">
              {INCIDENT_TYPES.map((type) => {
                const checked = form.LoaiSuCo === type;
                const Icon = TYPE_ICON[type] ?? MoreHorizontal;
                return (
                  <label
                    key={type}
                    className={`flex min-h-[64px] cursor-pointer flex-col items-center justify-center gap-1.5 rounded-[6px] border px-3 py-2.5 text-center text-[13px] transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[#c2570c] ${
                      checked
                        ? "border-[#c2570c] bg-[#fbf3e6] font-semibold text-[#2b2118] shadow-[inset_0_0_0_1px_#c2570c]"
                        : `bg-white text-[#2b2118] hover:border-[#b9ab90] hover:bg-[#faf7f2] ${errors.LoaiSuCo ? "border-[#c0262d]" : "border-[#cfc4ad]"}`
                    }`}
                  >
                    <Icon className={`h-[18px] w-[18px] ${checked ? "text-[#c2570c]" : "text-[#8a7b66]"}`} aria-hidden="true" />
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
              Mô tả chi tiết
            </label>
            <textarea
              id="MoTa"
              name="MoTa"
              rows={4}
              placeholder="Ví dụ: Ngựa va vào hàng rào, chân trước bên trái bị trầy, đi hơi khập khiễng..."
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

          <IncidentImageField
            value={form.HinhAnh}
            error={errors.HinhAnh}
            onChange={(dataUrl) => setField("HinhAnh", dataUrl)}
            onError={(message) => setErrors((prev) => ({ ...prev, HinhAnh: message }))}
          />
          </div>

          <div className="flex justify-end gap-3 border-t border-[#ece5d8] bg-[#faf7f2]/60 px-6 py-4">
            <Link
              to={BACK_TO_LIST}
              className={`inline-flex h-10 items-center rounded-[4px] border border-[#cfc4ad] bg-white px-5 text-sm font-semibold text-[#2b2118] transition-colors hover:bg-[#f0efec] ${FOCUS_RING}`}
            >
              Hủy
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className={`inline-flex h-10 cursor-pointer items-center gap-2 rounded-[4px] bg-[#c2570c] px-5 text-sm font-semibold whitespace-nowrap text-white transition-colors hover:bg-[#a8480a] disabled:cursor-wait disabled:opacity-60 ${FOCUS_RING}`}
            >
              <Send className="h-4 w-4" aria-hidden="true" />
              {submitting ? "Đang gửi..." : "Gửi báo cáo"}
            </button>
          </div>
        </form>

        {/* Cột phải: tóm tắt trực tiếp + hướng dẫn */}
        <aside className="space-y-4 lg:sticky lg:top-4">
          <div className="overflow-hidden rounded-[6px] border border-[#cfc4ad] bg-white shadow-xs">
            <div className="border-b border-[#ece5d8] bg-[#faf7f2] px-4 py-3">
              <h2 className="text-sm font-semibold text-[#2b2118]">Tóm tắt báo cáo</h2>
            </div>
            <div className="p-4">
              {selectedHorse ? (
                <div className="flex items-center gap-3">
                  <HorseAvatar horse={selectedHorse} size={48} square />
                  <div className="min-w-0">
                    <p className="truncate font-serif text-base font-semibold text-[#2b2118]">{selectedHorse.Ten}</p>
                    <p className="truncate text-xs text-[#6b6055]">
                      {[selectedHorse.Giong, stables[selectedHorse.HorseID] && `Chuồng ${stables[selectedHorse.HorseID]}`].filter(Boolean).join(" · ") || "—"}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="rounded-[4px] border border-dashed border-[#cfc4ad] bg-[#faf7f2] px-3 py-4 text-center text-xs text-[#6b6055]">Chưa chọn ngựa</p>
              )}

              <dl className="mt-4 space-y-2.5 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-[#6b6055]">Loại sự cố</dt>
                  <dd className="font-semibold text-[#2b2118]">{form.LoaiSuCo || "—"}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-[#6b6055]">Ngày xảy ra</dt>
                  <dd className="font-medium text-[#2b2118] tabular-nums">{form.Ngay ? formatDate(form.Ngay) : "—"}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-[#6b6055]">Hình ảnh</dt>
                  <dd className="font-medium text-[#2b2118]">{form.HinhAnh ? "Đã đính kèm" : "Chưa có"}</dd>
                </div>
              </dl>

              <div className="mt-4 rounded-[4px] border border-[#e3d9c6] bg-[#faf7f2] px-3 py-2.5">
                <p className="text-xs text-[#6b6055]">Bộ phận tiếp nhận</p>
                <p className="mt-0.5 text-sm font-semibold text-[#2b2118]">{handlerText}</p>
              </div>
            </div>
          </div>

          <div className="rounded-[6px] border border-[#e3d9c6] bg-[#faf7f2] p-4">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-[#2b2118]">
              <Info className="h-4 w-4 text-[#c2570c]" aria-hidden="true" />
              Lưu ý khi báo cáo
            </h2>
            <ul className="mt-2 list-disc space-y-1.5 pl-5 text-xs leading-relaxed text-[#4a3f33]">
              <li>Ghi rõ vị trí chấn thương, biểu hiện bất thường của ngựa.</li>
              <li>Chụp ảnh cận cảnh giúp bác sĩ đánh giá nhanh hơn.</li>
              <li>Trường hợp khẩn cấp, liên hệ trực tiếp bác sĩ thú y sau khi gửi.</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
