import { useState } from "react";
import CenterDialog from "../../components/CenterDialog";
import TextAreaField from "../../components/TextAreaField";
import useCancelRace from "../../hooks/useCancelRace";
import { formatDate } from "../../utils/date";

export const CANCEL_REASON_MAX = 500;

const OUTLINE_BUTTON =
  "inline-flex h-10 cursor-pointer items-center rounded-[4px] border border-stone/25 bg-white px-5 text-sm font-semibold text-ink transition-colors hover:border-stone/50 disabled:cursor-not-allowed disabled:opacity-60";
const DANGER_BUTTON =
  "inline-flex h-10 cursor-pointer items-center rounded-[4px] bg-[#b3473f] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#9c3b34] disabled:cursor-not-allowed disabled:opacity-60";

// Quản lý CLB > Hủy giải, xác nhận 2 bước trong cùng một dialog:
// bước 1 "reason": nhập lý do (bắt buộc, tối đa 500 ký tự) → "Tiếp tục";
// bước 2 "confirm": hỏi lại, hiện lại lý do → "Quay lại" (về bước 1, giữ nguyên lý do) hoặc "Xác nhận hủy giải" (mới gọi API).
// Giải chỉ chuyển sang "Đã hủy", không bị xóa. onCancelled(race): trang cha đóng khung, ghi nhật ký và tải lại bảng.
export default function CancelRaceDialog({ race, onClose, onCancelled }) {
  const [step, setStep] = useState("reason");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const { busy, submitError, submit } = useCancelRace({ onCancelled });

  const goConfirm = () => {
    if (!reason.trim()) {
      setError("Vui lòng nhập lý do hủy giải");
      return;
    }
    setStep("confirm");
  };

  const header = (
    <div>
      <h2 className="font-serif text-xl leading-tight font-semibold text-[#2b2118]">Hủy giải</h2>
      <p className="mt-1 text-sm text-[#6b6055]">
        {race.TenGiai} · {formatDate(race.Ngay)}
      </p>
    </div>
  );

  const footer =
    step === "reason" ? (
      <div className="flex justify-end gap-3">
        <button type="button" onClick={onClose} className={OUTLINE_BUTTON}>
          Không hủy
        </button>
        <button type="button" onClick={goConfirm} className="btn-primary">
          Tiếp tục
        </button>
      </div>
    ) : (
      <div>
        {submitError && <p className="mb-3 text-sm text-alert">{submitError}</p>}
        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => setStep("reason")} disabled={busy} className={OUTLINE_BUTTON}>
            Quay lại
          </button>
          <button type="button" onClick={() => submit(race.RaceID, reason.trim())} disabled={busy} className={DANGER_BUTTON}>
            {busy ? "Đang hủy..." : "Xác nhận hủy giải"}
          </button>
        </div>
      </div>
    );

  return (
    <CenterDialog label={`Hủy giải ${race.TenGiai}`} header={header} footer={footer} onClose={onClose} busy={busy}>
      {step === "reason" ? (
        <>
          <p className="mb-4 text-sm text-[#2b2118]">
            Giải sẽ chuyển sang trạng thái "Đã hủy" và không thể mở lại. Nhập lý do để tiếp tục.
          </p>
          <TextAreaField
            label="Lý do hủy giải"
            id="cancelRaceReason"
            rows={4}
            value={reason}
            maxLength={CANCEL_REASON_MAX}
            radiusClass="rounded-[4px]"
            onChange={(e) => {
              setReason(e.target.value);
              setError("");
            }}
            error={error}
            autoFocus
          />
        </>
      ) : (
        <>
          <p className="text-sm text-[#2b2118]">
            Bạn có chắc muốn hủy giải <span className="font-semibold">{race.TenGiai}</span>? Các đăng ký đang chờ duyệt sẽ bị từ chối và không thể hoàn tác.
          </p>
          <div className="mt-4">
            <p className="text-sm text-[#6b6055]">Lý do hủy</p>
            <p className="mt-1 text-sm whitespace-pre-line text-[#2b2118]">{reason.trim()}</p>
          </div>
        </>
      )}
    </CenterDialog>
  );
}
