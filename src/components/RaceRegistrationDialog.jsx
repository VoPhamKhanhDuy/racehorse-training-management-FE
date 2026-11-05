import { useState } from "react";
import CenterDialog from "./CenterDialog";
import ConfirmDialog from "./ConfirmDialog";
import HorseConditionBlock from "./HorseConditionBlock";
import TextAreaField from "./TextAreaField";
import {
  managerDecideRaceRegistration,
  ownerDecideRaceRegistration,
  submitRaceRegistration,
  withdrawRaceRegistration,
} from "../services/raceRegistrationMock";
import { formatCurrency } from "../utils/currency";
import { formatRank } from "../utils/raceResult";
import { formatDate } from "../utils/date";
import { RR_NOTE_MAX, RR_STATUS, stepProgress, stepText } from "../utils/raceRegistration";
import { formatDateTime } from "../utils/trainingFormat";

const SECTION_TITLE = "font-serif text-base font-semibold text-[#2b2118]";
const OUTLINE_BUTTON =
  "inline-flex h-10 cursor-pointer items-center rounded-[4px] border border-stone/25 bg-white px-5 text-sm font-semibold text-ink transition-colors hover:border-stone/50 disabled:cursor-not-allowed disabled:opacity-60";
const REJECT_BUTTON =
  "inline-flex h-10 cursor-pointer items-center rounded-[4px] border border-[#9e5954]/40 bg-white px-5 text-sm font-semibold text-[#9e5954] transition-colors hover:border-[#9e5954] hover:bg-[#9e5954]/10 disabled:cursor-not-allowed disabled:opacity-60";

function InfoRow({ label, children }) {
  return (
    <div className="grid grid-cols-[130px_minmax(0,1fr)] gap-x-4 text-sm">
      <dt className="text-[#6b6055]">{label}</dt>
      <dd className="min-w-0 text-[#2b2118]">{children}</dd>
    </div>
  );
}

// Khung chi tiết đăng ký thi đấu DÙNG CHUNG mọi vai trò (MOCK — services/raceRegistrationMock.js): ngựa, cuộc đua, tình trạng ngựa,
// "Tiến trình duyệt" 2 bước (Chủ ngựa, Quản lý). Chân khung tùy vai trò + trạng thái:
// - Trainer: Nháp → "Gửi duyệt" / "Rút đăng ký"; đang chờ → "Rút đăng ký"
// - Chủ ngựa: chờ chủ ngựa → "Đồng ý" (có xác nhận) / "Từ chối" (lý do bắt buộc)
// - Quản lý: chờ quản lý → "Duyệt" / "Từ chối" (lý do bắt buộc)
// role: head_trainer | horse_owner | club_manager; userName: người đang đăng nhập (ghi vào lịch sử).
// onChanged(text): trang cha đóng khung + hiện thông báo; ném lỗi thì hiện trong khung.
// Dùng lại cho trang Kết quả thi đấu của Trainer (chi tiết đăng ký của 1 ngựa): readOnly ẩn mọi hành động duyệt / rút / gửi;
// onBack ("Quay lại giải"), result (Thứ hạng + Tiền thưởng, chỉ đọc), onEditResult ("Nhập/Sửa kết quả" — giải đã diễn ra);
// record.direct = đăng ký cũ không qua luồng duyệt.
export default function RaceRegistrationDialog({ record, role, userName, onClose, onChanged, readOnly = false, onBack, result, onEditResult }) {
  const [mode, setMode] = useState("view"); // "view" | "reject"
  const [note, setNote] = useState("");
  const [noteError, setNoteError] = useState("");
  const [confirm, setConfirm] = useState(null); // "approve" | "withdraw"
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const { status } = record;
  const isTrainer = role === "head_trainer";
  const canDecide =
    !readOnly &&
    ((role === "horse_owner" && status === RR_STATUS.PENDING_OWNER) || (role === "club_manager" && status === RR_STATUS.PENDING_MANAGER));
  const canWithdraw = !readOnly && isTrainer && [RR_STATUS.DRAFT, RR_STATUS.PENDING_OWNER, RR_STATUS.PENDING_MANAGER].includes(status);
  const canSubmit = !readOnly && isTrainer && status === RR_STATUS.DRAFT;
  const approveLabel = role === "club_manager" ? "Duyệt" : "Đồng ý";

  const run = async (action, doneText) => {
    setBusy(true);
    setError("");
    try {
      const result = await action();
      onChanged(typeof doneText === "function" ? doneText(result) : doneText);
    } catch (err) {
      setError(err.message || "Không thực hiện được, vui lòng thử lại.");
      setConfirm(null);
      setBusy(false);
    }
  };

  const decide = (approve, reason) => {
    const fn = role === "club_manager" ? managerDecideRaceRegistration : ownerDecideRaceRegistration;
    return fn(record.id, { approve, note: reason }, userName);
  };

  const submitReject = () => {
    if (!note.trim()) {
      setNoteError("Vui lòng nhập lý do từ chối");
      return;
    }
    run(() => decide(false, note.trim()), "Đã từ chối đăng ký thi đấu");
  };

  const progress = stepProgress(record);

  const header = (
    <div>
      <h2 className="font-serif text-xl leading-tight font-semibold text-[#2b2118]">{record.raceName}</h2>
      <p className="mt-1 text-sm text-[#6b6055]">
        {record.horseName} · {stepText(record)}
      </p>
    </div>
  );

  let footer;
  if (readOnly) {
    footer = (
      <div className="flex flex-wrap items-center justify-end gap-3">
        {onBack && (
          <button type="button" onClick={onBack} className={`${OUTLINE_BUTTON} mr-auto`}>
            Quay lại giải
          </button>
        )}
        {onEditResult && (
          <button type="button" onClick={onEditResult} className={OUTLINE_BUTTON}>
            {result?.hasResult ? "Sửa kết quả" : "Nhập kết quả"}
          </button>
        )}
        <button type="button" onClick={onClose} className="btn-primary">
          Đóng
        </button>
      </div>
    );
  } else if (canDecide && mode === "reject") {
    footer = (
      <div>
        <TextAreaField
          label="Lý do từ chối"
          id="raceRejectNote"
          rows={3}
          value={note}
          maxLength={RR_NOTE_MAX}
          radiusClass="rounded-[4px]"
          hint="Đăng ký sẽ bị đóng, huấn luyện viên cần tạo đăng ký mới nếu muốn thử lại."
          onChange={(e) => {
            setNote(e.target.value);
            setNoteError("");
          }}
          error={noteError}
          autoFocus
        />
        {error && <p className="mt-2 text-sm text-alert">{error}</p>}
        <div className="mt-3 flex justify-end gap-3">
          <button type="button" onClick={() => setMode("view")} disabled={busy} className={OUTLINE_BUTTON}>
            Quay lại
          </button>
          <button type="button" onClick={submitReject} disabled={busy} className="btn-primary">
            {busy ? "Đang gửi..." : "Gửi từ chối"}
          </button>
        </div>
      </div>
    );
  } else {
    footer = (
      <div>
        {error && <p className="mb-3 text-sm text-alert">{error}</p>}
        <div className="flex flex-wrap justify-end gap-3">
          {canWithdraw && (
            <button type="button" onClick={() => setConfirm("withdraw")} disabled={busy} className={`${OUTLINE_BUTTON} mr-auto`}>
              Rút đăng ký
            </button>
          )}
          {canDecide && (
            <>
              <button type="button" onClick={() => setMode("reject")} disabled={busy} className={REJECT_BUTTON}>
                Từ chối
              </button>
              <button type="button" onClick={() => setConfirm("approve")} disabled={busy} className="btn-primary">
                {approveLabel}
              </button>
            </>
          )}
          {canSubmit && (
            <button type="button" onClick={() => run(() => submitRaceRegistration(record.id, userName), "Đã gửi đăng ký cho chủ ngựa duyệt")} disabled={busy} className="btn-primary">
              {busy ? "Đang gửi..." : "Gửi duyệt"}
            </button>
          )}
          {!canDecide && !canSubmit && (
            <button type="button" onClick={onClose} className={OUTLINE_BUTTON}>
              Đóng
            </button>
          )}
          {canSubmit && (
            <button type="button" onClick={onClose} disabled={busy} className={OUTLINE_BUTTON}>
              Đóng
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <CenterDialog label={`Đăng ký thi đấu ${record.horseName}`} header={header} footer={footer} onClose={onClose} busy={busy}>
        <section>
          <h3 className={SECTION_TITLE}>Thông tin đăng ký</h3>
          <dl className="mt-3 space-y-2">
            <InfoRow label="Ngựa">{record.horseName}</InfoRow>
            <InfoRow label="Cuộc đua">{record.raceName}</InfoRow>
            <InfoRow label="Ngày đua">{formatDate(record.raceDate)}</InfoRow>
            <InfoRow label="Địa điểm">{record.raceLocation || "—"}</InfoRow>
            <InfoRow label="Hạn đăng ký">{formatDate(record.registrationDeadline)}</InfoRow>
            <InfoRow label="Lệ phí">{record.entryFee != null ? formatCurrency(record.entryFee) : "Chưa cập nhật"}</InfoRow>
            <InfoRow label="Huấn luyện viên">{record.trainerName || "—"}</InfoRow>
            {record.note && (
              <InfoRow label="Ghi chú">
                <span className="whitespace-pre-line">{record.note}</span>
              </InfoRow>
            )}
          </dl>
        </section>

        <HorseConditionBlock horseId={record.horseId} />

        {result && (
          <section className="mt-6 border-t border-stone/15 pt-6">
            <h3 className={SECTION_TITLE}>Kết quả</h3>
            <dl className="mt-3 space-y-2">
              <InfoRow label="Thứ hạng">{result.hasResult ? formatRank(result.thuHang) : "Chưa có kết quả"}</InfoRow>
              <InfoRow label="Tiền thưởng">{result.tienThuong != null ? formatCurrency(result.tienThuong) : "—"}</InfoRow>
            </dl>
          </section>
        )}

        <section className="mt-6 border-t border-stone/15 pt-6">
          <h3 className={SECTION_TITLE}>Tiến trình duyệt</h3>
          {record.direct ? (
            <p className="mt-3 text-sm text-[#6b6055]">Đăng ký trực tiếp trước khi có luồng duyệt.</p>
          ) : (
          <ul className="mt-3 space-y-4">
            {progress.map((step) => (
              <li key={step.key} className="text-sm">
                <p className="flex items-baseline justify-between gap-4">
                  <span className="font-semibold text-[#2b2118]">{step.label}</span>
                  <span className={`font-semibold ${step.state === "Từ chối" ? "text-[#9e5954]" : step.state === "Đang chờ" ? "text-[#c2570c]" : step.state.startsWith("Đã") ? "text-[#4d6b2a]" : "text-[#6b6055]"}`}>
                    {step.state}
                  </span>
                </p>
                {step.entry && (
                  <p className="mt-0.5 text-[13px] text-[#6b6055]">
                    {step.entry.by} · {formatDateTime(step.entry.at)}
                  </p>
                )}
                {step.entry?.action === "Từ chối" && step.entry.note && (
                  <p className="mt-0.5 text-sm whitespace-pre-line text-[#2b2118]">Lý do: {step.entry.note}</p>
                )}
              </li>
            ))}
          </ul>
          )}
          {status === RR_STATUS.WITHDRAWN && <p className="mt-4 text-sm text-[#6b6055]">Huấn luyện viên đã rút đăng ký này.</p>}
          {status === RR_STATUS.EXPIRED && <p className="mt-4 text-sm text-[#6b6055]">Đã quá hạn đăng ký của cuộc đua.</p>}
        </section>
      </CenterDialog>

      <ConfirmDialog
        open={confirm === "approve"}
        title={`${approveLabel} đăng ký`}
        message={`${approveLabel} đăng ký thi đấu "${record.raceName}" của ${record.horseName}?`}
        confirmLabel={approveLabel}
        cancelLabel="Quay lại"
        danger={false}
        loading={busy}
        onConfirm={() =>
          run(
            () => decide(true),
            (result) =>
              role !== "club_manager"
                ? "Đã đồng ý đăng ký thi đấu"
                : result?.syncedToBE === false
                  ? "Đã duyệt. Chưa đồng bộ với hệ thống, cần BE cấp quyền."
                  : "Đã duyệt đăng ký thi đấu"
          )
        }
        onCancel={() => setConfirm(null)}
      />
      <ConfirmDialog
        open={confirm === "withdraw"}
        title="Rút đăng ký"
        message={`Rút đăng ký "${record.raceName}" của ${record.horseName}? Thao tác này không thể hoàn tác.`}
        confirmLabel="Rút"
        cancelLabel="Quay lại"
        loading={busy}
        onConfirm={() => run(() => withdrawRaceRegistration(record.id, userName), "Đã rút đăng ký")}
        onCancel={() => setConfirm(null)}
      />
    </>
  );
}
