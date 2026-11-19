import { useEffect, useState } from "react";
import CenterDialog from "../../components/CenterDialog";
import SelectField from "../../components/SelectField";
import TextAreaField from "../../components/TextAreaField";
import useAuth from "../../hooks/useAuth";
import useHorseCondition from "../../hooks/useHorseCondition";
import { createRaceRegistration, getRaceOptions, submitRaceRegistration } from "../../services/raceRegistrationApi";
import { getHorses } from "../../services/trainingApi";
import { formatCurrency } from "../../utils/currency";
import { formatDate, todayISO } from "../../utils/date";
import { isBlockingHealth, isReadyHealth } from "../../utils/healthGroups";
import { RR_NOTE_MAX } from "../../utils/raceRegistration";

const OUTLINE_BUTTON =
  "inline-flex h-10 cursor-pointer items-center rounded-[4px] border border-stone/25 bg-white px-5 text-sm font-semibold text-ink transition-colors hover:border-stone/50 disabled:cursor-not-allowed disabled:opacity-60";

// Lý do chặn đăng ký: ngựa đang khóa tập, hoặc sức khỏe thuộc nhóm chặn (chấn thương / cách ly / đang điều trị) — giống BE.
function blockReasons({ health, lock }) {
  const reasons = [];
  if (lock) reasons.push(lock.LyDo ? `Ngựa đang bị khóa tập: ${lock.LyDo}` : "Ngựa đang bị khóa tập");
  if (health && isBlockingHealth(health.TrangThai)) reasons.push(`Ngựa đang ${health.TrangThai.toLowerCase()}`);
  return reasons;
}

// Dưới ô chọn ngựa: lý do chặn (khóa nút lưu / gửi), hoặc cảnh báo mềm khi sức khỏe chưa đủ điều kiện nhưng không bị chặn
function ConditionNotice({ condition }) {
  if (condition.loading) return null;
  const reasons = blockReasons(condition);
  if (reasons.length > 0) {
    return (
      <div role="alert" className="space-y-0.5 text-sm font-semibold text-alert">
        {reasons.map((reason) => (
          <p key={reason}>{reason}</p>
        ))}
        <p className="font-normal text-[#6b6055]">Không thể lưu hoặc gửi đăng ký cho ngựa này.</p>
      </div>
    );
  }
  if (condition.health && !isReadyHealth(condition.health.TrangThai)) {
    return (
      <div className="space-y-0.5 text-sm font-semibold text-[#c2570c]">
        <p>Sức khỏe chưa đủ điều kiện</p>
        <p className="font-normal text-[#6b6055]">Vẫn có thể gửi, chủ ngựa và quản lý sẽ thấy thông tin này khi duyệt.</p>
      </div>
    );
  }
  return null;
}

// Tạo đăng ký thi đấu (Trainer): chọn ngựa, cuộc đua (còn hạn đăng ký), ghi chú → "Lưu nháp" hoặc "Gửi duyệt" (gửi thẳng cho chủ ngựa).
// onCreated(text): trang cha đóng khung + hiện thông báo.
export default function RaceRegistrationCreateDialog({ onClose, onCreated, initialRaceId = null }) {
  const { user } = useAuth();
  const [horses, setHorses] = useState([]);
  const [races, setRaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [form, setForm] = useState({ horseId: "", raceId: initialRaceId != null ? String(initialRaceId) : "", note: "" });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let ignore = false;
    Promise.all([getHorses(), getRaceOptions()])
      .then(([horseList, raceList]) => {
        if (ignore) return;
        setHorses(horseList);
        // Chỉ cuộc đua chưa quá hạn đăng ký
        setRaces(raceList.filter((r) => r.registrationDeadline >= todayISO()));
        setLoading(false);
      })
      .catch((err) => {
        if (ignore) return;
        setLoadError(err.message || "Không tải được danh sách ngựa / cuộc đua.");
        setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, []);

  const setField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const race = races.find((r) => String(r.RaceID) === form.raceId);
  const horse = horses.find((h) => String(h.horseId) === form.horseId);

  // Ngựa đã chọn: chờ biết tình trạng rồi mới cho lưu; khóa tập / chấn thương / cách ly / đang điều trị thì khóa nút lưu và gửi
  const condition = useHorseCondition(form.horseId);
  const conditionPending = Boolean(form.horseId) && condition.loading;
  const blocked = Boolean(form.horseId) && !condition.loading && blockReasons(condition).length > 0;
  const saveDisabled = busy || loading || conditionPending || blocked;

  const save = async (andSubmit) => {
    if (saveDisabled) return;
    const nextErrors = {};
    if (!form.horseId) nextErrors.horseId = "Vui lòng chọn ngựa";
    if (!form.raceId) nextErrors.raceId = "Vui lòng chọn cuộc đua";
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    setBusy(true);
    setSubmitError("");
    try {
      const record = await createRaceRegistration({ horse, race, note: form.note }, user.fullName);
      if (andSubmit) await submitRaceRegistration(record.id, user.fullName);
      onCreated(andSubmit ? "Đã gửi đăng ký cho chủ ngựa duyệt" : "Đã lưu nháp đăng ký");
    } catch (err) {
      setSubmitError(err.message || "Không lưu được đăng ký, vui lòng thử lại.");
      setBusy(false);
    }
  };

  const header = <h2 className="font-serif text-xl leading-tight font-semibold text-[#2b2118]">Tạo đăng ký thi đấu</h2>;

  const footer = (
    <div>
      {submitError && <p className="mb-3 text-sm text-alert">{submitError}</p>}
      <div className="flex justify-end gap-3">
        <button type="button" onClick={onClose} disabled={busy} className={OUTLINE_BUTTON}>
          Hủy
        </button>
        <button type="button" onClick={() => save(false)} disabled={saveDisabled} className={OUTLINE_BUTTON}>
          Lưu nháp
        </button>
        <button type="button" onClick={() => save(true)} disabled={saveDisabled} className="btn-primary disabled:cursor-not-allowed disabled:opacity-60">
          {busy ? "Đang lưu..." : "Gửi duyệt"}
        </button>
      </div>
    </div>
  );

  return (
    <CenterDialog label="Tạo đăng ký thi đấu" header={header} footer={footer} onClose={onClose} busy={busy}>
      {loading ? (
        <p className="py-6 text-center text-sm text-[#6b6055]">Đang tải...</p>
      ) : loadError ? (
        <p className="py-6 text-sm text-alert">{loadError}</p>
      ) : (
        <div className="space-y-5 pt-1">
          <SelectField
            variant="outline"
            label="Ngựa"
            id="rrHorse"
            value={form.horseId}
            onChange={(e) => setField("horseId", e.target.value)}
            error={errors.horseId}
          >
            <option value="">Chọn ngựa</option>
            {horses.map((h) => (
              <option key={h.horseId} value={h.horseId}>
                {h.name}
              </option>
            ))}
          </SelectField>
          {form.horseId && <ConditionNotice condition={condition} />}
          <SelectField
            variant="outline"
            label="Cuộc đua"
            id="rrRace"
            value={form.raceId}
            onChange={(e) => setField("raceId", e.target.value)}
            error={errors.raceId}
          >
            <option value="">Chọn cuộc đua</option>
            {races.map((r) => (
              <option key={r.RaceID} value={r.RaceID}>
                {r.TenGiai} · {formatDate(r.Ngay)}
              </option>
            ))}
          </SelectField>
          {race && (
            <p className="text-[13px] text-[#6b6055]">
              {race.DiaDiem} · hạn đăng ký {formatDate(race.registrationDeadline)} · lệ phí {race.entryFee != null ? formatCurrency(race.entryFee) : "chưa cập nhật"}
            </p>
          )}
          <TextAreaField
            label="Ghi chú"
            id="rrNote"
            rows={3}
            value={form.note}
            maxLength={RR_NOTE_MAX}
            radiusClass="rounded-[4px]"
            placeholder="Không bắt buộc"
            onChange={(e) => setField("note", e.target.value)}
          />
        </div>
      )}
    </CenterDialog>
  );
}
