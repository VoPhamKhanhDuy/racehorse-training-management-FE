import { useState } from "react";
import CenterDialog from "../../components/CenterDialog";
import FormField from "../../components/FormField";
import TextAreaField from "../../components/TextAreaField";
import useCreateRace from "../../hooks/useCreateRace";
import { todayISO } from "../../utils/date";
import { formatDigitsVi } from "../../utils/number";
import {
  EMPTY_RACE_FORM,
  RACE_DESCRIPTION_MAX,
  RACE_LOCATION_MAX,
  RACE_NAME_MAX,
  hasRankPrize,
  prizeTotal,
  raceDateMin,
  validateRaceForm,
} from "../../utils/raceForm";

const OUTLINE_BUTTON =
  "inline-flex h-10 cursor-pointer items-center rounded-[4px] border border-stone/25 bg-white px-5 text-sm font-semibold text-ink transition-colors hover:border-stone/50 disabled:cursor-not-allowed disabled:opacity-60";

const digitsOnly = (value) => value.replace(/\D/g, "");

// Quản lý CLB > Tạo giải: tên, địa điểm, ngày đua, hạn đăng ký, cự ly, số ngựa tối đa, lệ phí, giải Nhất / Nhì / Ba, tổng giải thưởng, mô tả.
// Nhập ít nhất một hạng thì tổng tự tính (ô tổng chỉ đọc, BE cũng tính lại); không nhập hạng nào thì nhập tổng tay.
// Ô ngày không cho chọn ngày quá khứ (ngày đua từ ngày mai; hạn đăng ký từ hôm nay đến ngày đua). Giải mới có trạng thái Open.
// onCreated(race): trang cha đóng khung, hiện thông báo và tải lại danh sách giải.
export default function CreateRaceDialog({ onClose, onCreated }) {
  const today = todayISO();
  const [form, setForm] = useState(EMPTY_RACE_FORM);
  const [errors, setErrors] = useState({});
  const { busy, submitError, submit } = useCreateRace({ onCreated });

  const setField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };
  const onText = (name) => (e) => setField(name, e.target.value);
  const onDigits = (name) => (e) => setField(name, digitsOnly(e.target.value));

  // Ô tiền (VNĐ): chỉ nhận chữ số, hiển thị có dấu chấm phân cách hàng nghìn
  const rankEntered = hasRankPrize(form);
  const money = (name, label) => (
    <FormField
      variant="outline"
      label={label}
      id={`race-${name}`}
      inputMode="numeric"
      suffix="VNĐ"
      value={formatDigitsVi(form[name])}
      onChange={onDigits(name)}
      error={errors[name]}
    />
  );

  const save = () => {
    const next = validateRaceForm(form, today);
    setErrors(next);
    if (Object.keys(next).length === 0) submit(form);
  };

  const header = <h2 className="font-serif text-xl leading-tight font-semibold text-[#2b2118]">Tạo giải</h2>;
  const footer = (
    <div>
      {submitError && <p className="mb-3 text-sm text-alert">{submitError}</p>}
      <div className="flex justify-end gap-3">
        <button type="button" onClick={onClose} disabled={busy} className={OUTLINE_BUTTON}>
          Hủy
        </button>
        <button type="button" onClick={save} disabled={busy} className="btn-primary">
          {busy ? "Đang tạo..." : "Tạo giải"}
        </button>
      </div>
    </div>
  );

  return (
    <CenterDialog label="Tạo giải" header={header} footer={footer} onClose={onClose} busy={busy}>
      <div className="space-y-5 pt-1">
        <FormField variant="outline" requiredMark label="Tên giải" id="raceName" value={form.name} maxLength={RACE_NAME_MAX} onChange={onText("name")} error={errors.name} />
        <FormField variant="outline" label="Địa điểm" id="raceLocation" value={form.location} maxLength={RACE_LOCATION_MAX} onChange={onText("location")} error={errors.location} />
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField
            variant="outline"
            type="date"
            requiredMark
            label="Ngày đua"
            id="raceDate"
            name="raceDate"
            value={form.raceDate}
            min={raceDateMin(today)}
            onChange={onText("raceDate")}
            error={errors.raceDate}
          />
          <FormField
            variant="outline"
            type="date"
            requiredMark
            label="Hạn đăng ký"
            id="raceDeadline"
            name="deadline"
            value={form.deadline}
            min={today}
            max={form.raceDate || undefined}
            onChange={onText("deadline")}
            error={errors.deadline}
          />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField variant="outline" requiredMark label="Cự ly" id="raceDistance" inputMode="numeric" suffix="m" value={form.distance} onChange={onDigits("distance")} error={errors.distance} />
          <FormField variant="outline" requiredMark label="Số ngựa tối đa" id="raceMax" inputMode="numeric" value={form.maxParticipants} onChange={onDigits("maxParticipants")} error={errors.maxParticipants} />
        </div>
        {/* Mỗi ô tiền một dòng riêng cho đủ rộng hiển thị trọn "150.000.000" cùng chữ VNĐ */}
        {money("entryFee", "Lệ phí đăng ký")}
        {money("prizeFirst", "Giải Nhất")}
        {money("prizeSecond", "Giải Nhì")}
        {money("prizeThird", "Giải Ba")}
        <FormField
          variant="outline"
          label="Tổng giải thưởng"
          id="racePrize"
          inputMode="numeric"
          suffix="VNĐ"
          readOnly={rankEntered}
          value={formatDigitsVi(rankEntered ? String(prizeTotal(form)) : form.prizePool)}
          onChange={onDigits("prizePool")}
          error={errors.prizePool}
        />
        {rankEntered && <p className="-mt-3 text-[13px] text-[#6b6055]">Tự tính = Nhất + Nhì + Ba.</p>}
        <TextAreaField
          label="Mô tả / điều kiện tham gia"
          id="raceDescription"
          rows={4}
          value={form.description}
          maxLength={RACE_DESCRIPTION_MAX}
          radiusClass="rounded-[4px]"
          onChange={onText("description")}
          error={errors.description}
        />
      </div>
    </CenterDialog>
  );
}
