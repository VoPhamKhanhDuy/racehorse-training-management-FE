import { useState } from "react";
import { ChevronDown } from "lucide-react";
import CenterDialog from "../../components/CenterDialog";
import TextAreaField from "../../components/TextAreaField";
import { REQUEST_NOTE_MAX, REQUEST_STATUS } from "../../services/supplyRequestMock";
import { SUPPLY_STATES, getSupplyState, supplyDisplayName, supplyMinimum, supplyUnit } from "../../config/supplyConfig";

const LABEL = "mb-1.5 block text-[13px] font-semibold text-[#1f1f1f]";
const FIELD =
  "h-10 w-full rounded-[4px] border bg-white px-3.5 text-sm text-[#1f1f1f] outline-none transition-colors focus:border-[#c2570c]";
const OUTLINE_BUTTON =
  "inline-flex h-10 cursor-pointer items-center rounded-[4px] border border-stone/25 bg-white px-5 text-sm font-semibold text-ink transition-colors hover:border-stone/50 disabled:cursor-not-allowed disabled:opacity-60";

const byName = (a, b) => supplyDisplayName(a).localeCompare(supplyDisplayName(b), "vi");

// Khung "Yêu cầu bổ sung vật tư" (modal giữa, ≤460px) — mở từ nút ở đầu trang. Chọn vật tư (nhóm "Cần bổ sung" lên trước) + Số lượng đề nghị
// (số nguyên > 0, kèm đơn vị) + Ghi chú (≤300 ký tự). Vật tư đang có yêu cầu "Chờ xử lý" → lỗi dưới ô chọn và không gửi trùng.
// onSubmit({ supply, quantity, note }) ném lỗi nếu gửi không được; lỗi hiện trong khung.
export default function SupplyRestockDialog({ supplies, requests, onSubmit, onClose }) {
  const [supplyId, setSupplyId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const supply = supplies.find((s) => String(s.SupplyID) === supplyId);
  const unit = supply ? supplyUnit(supply) : "";
  const low = supplies.filter((s) => getSupplyState(s) !== SUPPLY_STATES.OK).sort(byName);
  const enough = supplies.filter((s) => getSupplyState(s) === SUPPLY_STATES.OK).sort(byName);
  const hasPending = supply ? requests.some((r) => r.supplyId === supply.SupplyID && r.status === REQUEST_STATUS.PENDING) : false;
  const quantityValue = Number(quantity);
  const quantityValid = quantity !== "" && Number.isInteger(quantityValue) && quantityValue > 0;
  const canSubmit = Boolean(supply) && quantityValid && !hasPending;

  const optionText = (s) => `${supplyDisplayName(s)} (còn ${s.SoLuongTon.toLocaleString("vi-VN")}${supplyUnit(s) ? ` ${supplyUnit(s)}` : ""})`;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setBusy(true);
    try {
      await onSubmit({ supply, quantity: quantityValue, note });
    } catch (err) {
      setError(err.message || "Không gửi được yêu cầu, vui lòng thử lại.");
      setBusy(false);
    }
  };

  return (
    <CenterDialog
      label="Yêu cầu bổ sung vật tư"
      maxWidth={460}
      busy={busy}
      onClose={onClose}
      header={
        <div>
          <h2 className="font-serif text-xl leading-tight font-semibold text-[#2b2118]">Yêu cầu bổ sung vật tư</h2>
          <p className="mt-1 text-sm text-[#6b6b6b]">Yêu cầu này sẽ được gửi đến Quản lý CLB.</p>
        </div>
      }
      footer={
        <div>
          {error && <p className="mb-3 text-sm text-alert">{error}</p>}
          <div className="flex items-center justify-between gap-3">
            <button type="button" onClick={onClose} disabled={busy} className={OUTLINE_BUTTON}>
              Hủy
            </button>
            <button type="button" onClick={handleSubmit} disabled={busy || !canSubmit} className="btn-primary">
              {busy ? "Đang gửi..." : "Gửi yêu cầu"}
            </button>
          </div>
        </div>
      }
    >
      <div>
        <label htmlFor="restockSupply" className={LABEL}>
          Vật tư
        </label>
        <div className="relative">
          <select
            id="restockSupply"
            value={supplyId}
            onChange={(e) => {
              setSupplyId(e.target.value);
              setError("");
            }}
            aria-invalid={hasPending}
            className={`${FIELD} cursor-pointer appearance-none pr-9 ${hasPending ? "border-alert" : "border-stone/25"}`}
          >
            <option value="">Chọn vật tư</option>
            {low.length > 0 && (
              <optgroup label="Cần bổ sung">
                {low.map((s) => (
                  <option key={s.SupplyID} value={s.SupplyID}>
                    {optionText(s)}
                  </option>
                ))}
              </optgroup>
            )}
            {enough.length > 0 && (
              <optgroup label="Còn đủ">
                {enough.map((s) => (
                  <option key={s.SupplyID} value={s.SupplyID}>
                    {optionText(s)}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
          <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-[#6b6b6b]" aria-hidden="true" />
        </div>
        {hasPending && <p className="mt-1 text-sm text-alert">Vật tư này đã có yêu cầu đang chờ xử lý.</p>}
        {supply && !hasPending && (
          <p className="mt-1 text-xs text-[#6b6b6b]">
            Hiện có {supply.SoLuongTon.toLocaleString("vi-VN")}
            {unit && ` ${unit}`} · Mức tối thiểu {supplyMinimum(supply).toLocaleString("vi-VN")}
            {unit && ` ${unit}`}
          </p>
        )}
      </div>

      <div className="mt-4">
        <label htmlFor="restockQty" className={LABEL}>
          Số lượng đề nghị
        </label>
        <div className="relative">
          <input
            id="restockQty"
            type="number"
            min="1"
            step="1"
            inputMode="numeric"
            value={quantity}
            onChange={(e) => {
              setQuantity(e.target.value);
              setError("");
            }}
            className={`${FIELD} border-stone/25 ${unit ? "pr-14" : ""}`}
          />
          {unit && <span className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-sm text-[#6b6b6b]">{unit}</span>}
        </div>
      </div>

      <div className="mt-4">
        <TextAreaField
          label="Ghi chú"
          labelClassName={LABEL}
          id="restockNote"
          rows={3}
          value={note}
          maxLength={REQUEST_NOTE_MAX}
          radiusClass="rounded-[4px]"
          placeholder="Không bắt buộc"
          onChange={(e) => setNote(e.target.value)}
        />
      </div>
    </CenterDialog>
  );
}
