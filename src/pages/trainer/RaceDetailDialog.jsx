import { useState } from "react";
import { Link } from "react-router-dom";
import CenterDialog from "../../components/CenterDialog";
import ConfirmDialog from "../../components/ConfirmDialog";
import useAuth from "../../hooks/useAuth";
import { addAuditLog } from "../../services/auditService";
import { setRaceRegistrationPrize, updateRaceResult } from "../../services/raceService";
import { formatCurrency } from "../../utils/currency";
import { formatDate, todayISO } from "../../utils/date";
import { isReadyHealth } from "../../utils/healthGroups";
import { NO_RANK, PODIUM_MAX, formatRank, hasResult } from "../../utils/raceResult";
import { stepText } from "../../utils/raceRegistration";
import { toUserID } from "../../utils/userId";

const TH = "px-2 pb-2 text-left text-[13px] font-semibold text-[#1f1f1f]";
const TD = "px-2 py-2.5 align-middle text-sm text-[#1f1f1f]";
const OUTLINE_BUTTON =
  "inline-flex h-10 cursor-pointer items-center rounded-[4px] border border-stone/25 bg-white px-5 text-sm font-semibold text-ink transition-colors hover:border-stone/50 disabled:cursor-not-allowed disabled:opacity-60";
const INPUT =
  "h-9 w-full rounded-[4px] border bg-white px-2.5 text-sm text-[#1f1f1f] outline-none transition-colors focus:border-brass disabled:cursor-not-allowed disabled:bg-stone/5 disabled:text-[#B5B5B5]";

const resultText = (rank) => (rank === null ? "chưa có kết quả" : rank === NO_RANK ? "không xếp hạng" : `hạng ${rank}`);
const digitsOnly = (value) => value.replace(/\D/g, "");
const formatDigits = (digits) => (digits ? Number(digits).toLocaleString("vi-VN") : "");

// Khung chi tiết 1 giải (modal giữa màn hình, đầu + chân cố định):
// - Giải SẮP TỚI: thông tin giải + bảng ngựa đã đăng ký (Ngựa | Tình trạng | Ngày đăng ký | "Hủy đăng ký" có xác nhận). KHÔNG đăng ký trực tiếp ở đây
//   (đăng ký thực hiện ở /trainer/race-registrations — luồng Chủ ngựa → Quản lý duyệt); hủy thì không cần duyệt.
// - Giải ĐÃ DIỄN RA: bảng ngựa tham gia (Thứ hạng, Tiền thưởng), "Lưu" lưu cả nhóm; sửa kết quả đã có thì hỏi xác nhận.
// Thứ hạng: để trống = chưa có kết quả, 0 = không xếp hạng, 1, 2, 3… không trùng nhau trong cùng giải. Tiền thưởng chỉ nhập được cho hạng 1–3.
export default function RaceDetailDialog({ race, regs, pendingRegs = [], onOpenHorse, onOpenInfo, horseName, lockedHorseIds, healthByHorse, onClose, onCancelRegistration, onSaved }) {
  const isPast = race.Ngay < todayISO();
  const { user } = useAuth();
  const trainerId = toUserID(user.id);
  const [cancelTarget, setCancelTarget] = useState(null); // đăng ký đang chờ xác nhận hủy
  const [cancelling, setCancelling] = useState(false);
  const [ranks, setRanks] = useState(() => Object.fromEntries(regs.map((r) => [r.HorseID, hasResult(r) ? String(r.ThuHang) : ""])));
  const [prizes, setPrizes] = useState(() => Object.fromEntries(regs.map((r) => [r.HorseID, r.TienThuong != null ? String(r.TienThuong) : ""])));
  const [confirmEdit, setConfirmEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [editing, setEditing] = useState(false); // giải đã diễn ra: false = xem thứ hạng / tiền thưởng, true = nhập / sửa

  // ---- Kiểm tra thứ hạng ----
  const rankOf = (horseId) => (ranks[horseId] === "" || ranks[horseId] === undefined ? null : Number(ranks[horseId]));
  const rankErrors = {};
  regs.forEach((reg) => {
    const raw = ranks[reg.HorseID];
    if (raw === "" || raw === undefined) return;
    const rank = Number(raw);
    if (!Number.isInteger(rank) || rank < 0) {
      rankErrors[reg.HorseID] = "Nhập số nguyên từ 0";
      return;
    }
    const clash = rank >= 1 ? regs.find((other) => other.HorseID !== reg.HorseID && rankOf(other.HorseID) === rank) : null;
    if (clash) rankErrors[reg.HorseID] = `Hạng ${rank} đã gán cho ${horseName(clash.HorseID)}`;
  });
  const hasErrors = Object.keys(rankErrors).length > 0;
  const podium = (horseId) => {
    const rank = rankOf(horseId);
    return rank !== null && rank >= 1 && rank <= PODIUM_MAX;
  };

  const changedRanks = regs.filter((r) => rankOf(r.HorseID) !== (hasResult(r) ? r.ThuHang : null));
  const changedPrizes = regs.filter((r) => podium(r.HorseID) && prizes[r.HorseID] !== (r.TienThuong != null ? String(r.TienThuong) : "") && prizes[r.HorseID] !== "");
  const editsExisting = changedRanks.some((r) => hasResult(r));

  const doSave = async () => {
    setSaving(true);
    setSaveError("");
    const updated = [];
    try {
      for (const reg of changedRanks) {
        const rank = rankOf(reg.HorseID);
        if (rank === null) continue; // không xóa được kết quả đã nhập (BE chưa hỗ trợ) — bỏ qua dòng để trống
        const { registration } = await updateRaceResult(race.RaceID, reg.HorseID, rank);
        updated.push(registration);
        addAuditLog({
          UserID: trainerId,
          HanhDong: `Cập nhật kết quả thi đấu: ${race.TenGiai} – ${horseName(reg.HorseID)} ${resultText(rank)}`,
          TargetTable: "RACEREGISTRATION",
          TargetID: race.RaceID,
          targetLabel: horseName(reg.HorseID),
        });
      }
      for (const reg of changedPrizes) {
        const saved = await setRaceRegistrationPrize(race.RaceID, reg.HorseID, Number(prizes[reg.HorseID]));
        const index = updated.findIndex((u) => u.HorseID === saved.HorseID);
        if (index >= 0) updated[index] = saved;
        else updated.push(saved);
      }
      onSaved(updated, "Đã lưu kết quả thi đấu");
    } catch (err) {
      // Đã lưu được vài dòng thì cập nhật lại bảng bên ngoài, khung vẫn mở để sửa tiếp
      if (updated.length > 0) onSaved(updated, null);
      setSaveError(err.message || "Không lưu được kết quả, vui lòng thử lại.");
      setSaving(false);
      setConfirmEdit(false);
    }
  };

  const handleSave = () => {
    if (hasErrors) return;
    if (changedRanks.length === 0 && changedPrizes.length === 0) {
      onClose();
      return;
    }
    if (editsExisting) setConfirmEdit(true);
    else doSave();
  };

  const handleConfirmCancel = async () => {
    setCancelling(true);
    await onCancelRegistration(cancelTarget);
    setCancelling(false);
    setCancelTarget(null);
  };

  // Tên ngựa là link → chi tiết đăng ký của riêng ngựa đó
  const horseLink = (reg) => (
    <button
      type="button"
      onClick={() => onOpenHorse(reg.RaceID, reg.HorseID)}
      title={horseName(reg.HorseID)}
      className="block max-w-full cursor-pointer truncate text-left font-medium text-[#1f1f1f] hover:underline"
    >
      {horseName(reg.HorseID)}
    </button>
  );

  const statusOf = (horseId) => {
    if (lockedHorseIds.has(horseId)) return { text: "Đang khóa tập", warn: true };
    const health = healthByHorse[horseId];
    if (!health) return { text: "—", warn: false };
    return isReadyHealth(health) ? { text: "Đủ điều kiện", warn: false } : { text: health, warn: true };
  };

  const header = (
    <div>
      <h2 className="font-serif text-xl leading-tight font-semibold text-[#2b2118]">{race.TenGiai}</h2>
      <p className="mt-1 text-sm text-[#6b6055]">
        {formatDate(race.Ngay)} · {race.DiaDiem}
      </p>
    </div>
  );

  // Hủy nhập: trả các ô về giá trị đang lưu rồi quay lại chế độ xem
  const cancelEditing = () => {
    setRanks(Object.fromEntries(regs.map((r) => [r.HorseID, hasResult(r) ? String(r.ThuHang) : ""])));
    setPrizes(Object.fromEntries(regs.map((r) => [r.HorseID, r.TienThuong != null ? String(r.TienThuong) : ""])));
    setSaveError("");
    setEditing(false);
  };

  const footer = isPast ? (
    <div>
      {saveError && <p className="mb-3 text-sm text-alert">{saveError}</p>}
      <div className="flex flex-wrap items-center justify-end gap-3">
        <button type="button" onClick={() => onOpenInfo(race.RaceID)} disabled={saving} className="mr-auto cursor-pointer text-sm font-semibold text-[#c2570c] hover:underline">
          Xem thông tin giải
        </button>
        <button type="button" onClick={editing ? cancelEditing : onClose} disabled={saving} className={OUTLINE_BUTTON}>
          {editing ? "Hủy" : "Đóng"}
        </button>
        {regs.length > 0 &&
          (editing ? (
            <button type="button" onClick={handleSave} disabled={saving || hasErrors} className="btn-primary">
              {saving ? "Đang lưu..." : "Lưu"}
            </button>
          ) : (
            <button type="button" onClick={() => setEditing(true)} className="btn-primary">
              {regs.some(hasResult) ? "Sửa kết quả" : "Nhập kết quả"}
            </button>
          ))}
      </div>
    </div>
  ) : (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <span className="flex flex-wrap items-center gap-x-5 gap-y-1">
        <button type="button" onClick={() => onOpenInfo(race.RaceID)} className="cursor-pointer text-sm font-semibold text-[#c2570c] hover:underline">
          Xem thông tin giải
        </button>
        <Link to="/trainer/race-registrations" className="text-sm font-semibold text-[#c2570c] hover:underline">
          Đăng ký thêm ngựa
        </Link>
      </span>
      <button type="button" onClick={onClose} className={OUTLINE_BUTTON}>
        Đóng
      </button>
    </div>
  );

  return (
    <>
      <CenterDialog label={race.TenGiai} header={header} footer={footer} onClose={onClose} busy={saving || cancelling}>
        <h3 className="font-serif text-base font-semibold text-[#2b2118]">{isPast ? "Ngựa tham gia" : "Ngựa đã đăng ký"}</h3>
        {regs.length === 0 ? (
          <p className="mt-3 text-sm text-[#6b6055]">{isPast ? "Không có ngựa nào tham gia giải này." : "Chưa có ngựa nào đăng ký giải này."}</p>
        ) : isPast && !editing ? (
          <table className="mt-3 w-full table-fixed border-collapse">
            <colgroup>
              <col style={{ width: "40%" }} />
              <col style={{ width: "30%" }} />
              <col style={{ width: "30%" }} />
            </colgroup>
            <thead>
              <tr className="border-b border-[#E3E3E3]">
                <th className={TH}>Ngựa</th>
                <th className={TH}>Thứ hạng</th>
                <th className={`${TH} text-right`}>Tiền thưởng</th>
              </tr>
            </thead>
            <tbody>
              {regs.map((reg) => (
                <tr key={reg.HorseID} className="border-b border-[#E3E3E3] last:border-b-0">
                  <td className={TD}>{horseLink(reg)}</td>
                  <td className={TD}>{hasResult(reg) ? formatRank(reg.ThuHang) : <span className="text-[#B5B5B5]">—</span>}</td>
                  <td className={`${TD} text-right tabular-nums`}>
                    {reg.TienThuong != null ? formatCurrency(reg.TienThuong) : <span className="text-[#B5B5B5]">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : isPast ? (
          <>
            <table className="mt-3 w-full table-fixed border-collapse">
              <colgroup>
                <col style={{ width: "34%" }} />
                <col style={{ width: "26%" }} />
                <col style={{ width: "40%" }} />
              </colgroup>
              <thead>
                <tr className="border-b border-[#E3E3E3]">
                  <th className={TH}>Ngựa</th>
                  <th className={TH}>Thứ hạng</th>
                  <th className={TH}>Tiền thưởng</th>
                </tr>
              </thead>
              <tbody>
                {regs.map((reg) => (
                  <tr key={reg.HorseID} className="border-b border-[#E3E3E3] align-top last:border-b-0">
                    <td className={`${TD} pt-4`}>{horseLink(reg)}</td>
                    <td className={TD}>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        inputMode="numeric"
                        aria-label={`Thứ hạng ${horseName(reg.HorseID)}`}
                        value={ranks[reg.HorseID]}
                        onChange={(e) => setRanks((prev) => ({ ...prev, [reg.HorseID]: e.target.value }))}
                        className={`${INPUT} ${rankErrors[reg.HorseID] ? "border-alert" : "border-stone/25"}`}
                      />
                      {rankErrors[reg.HorseID] && <p className="mt-1 text-xs text-alert">{rankErrors[reg.HorseID]}</p>}
                    </td>
                    <td className={TD}>
                      <div className="relative">
                        <input
                          type="text"
                          inputMode="numeric"
                          aria-label={`Tiền thưởng ${horseName(reg.HorseID)}`}
                          disabled={!podium(reg.HorseID)}
                          value={podium(reg.HorseID) ? formatDigits(prizes[reg.HorseID]) : ""}
                          placeholder={podium(reg.HorseID) ? "0" : "—"}
                          onChange={(e) => setPrizes((prev) => ({ ...prev, [reg.HorseID]: digitsOnly(e.target.value) }))}
                          className={`${INPUT} border-stone/25 pr-7 text-right tabular-nums`}
                        />
                        {podium(reg.HorseID) && <span className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-sm text-[#6b6b6b]">đ</span>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-3 text-[13px] text-[#6b6b6b]">Để trống nếu chưa có kết quả, nhập 0 nếu không xếp hạng. Tiền thưởng chỉ nhập được cho hạng 1–{PODIUM_MAX}.</p>
          </>
        ) : (
          <table className="mt-3 w-full table-fixed border-collapse">
            <colgroup>
              <col style={{ width: "30%" }} />
              <col style={{ width: "28%" }} />
              <col style={{ width: "22%" }} />
              <col style={{ width: "20%" }} />
            </colgroup>
            <thead>
              <tr className="border-b border-[#E3E3E3]">
                <th className={TH}>Ngựa</th>
                <th className={TH}>Tình trạng</th>
                <th className={TH}>Ngày đăng ký</th>
                <th className={`${TH} text-right`}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {regs.map((reg) => {
                const status = statusOf(reg.HorseID);
                return (
                  <tr key={reg.HorseID} className={`border-b border-[#E3E3E3] last:border-b-0 ${status.warn ? "bg-[#FBF8F2]" : ""}`}>
                    <td className={TD}>{horseLink(reg)}</td>
                    <td className={`${TD} ${status.warn ? "font-semibold text-[#9e5954]" : ""}`}>{status.text}</td>
                    <td className={`${TD} whitespace-nowrap tabular-nums`}>{reg.NgayDangKy ? formatDate(reg.NgayDangKy) : "—"}</td>
                    <td className={`${TD} text-right`}>
                      <button
                        type="button"
                        onClick={() => setCancelTarget(reg)}
                        className={`cursor-pointer text-sm whitespace-nowrap hover:underline ${
                          status.warn ? "font-semibold text-[#9e5954]" : "font-medium text-[#6b6b6b]"
                        }`}
                      >
                        Hủy đăng ký
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        {!isPast && pendingRegs.length > 0 && (
          <section className="mt-6 border-t border-stone/15 pt-6">
            <h3 className="font-serif text-base font-semibold text-[#2b2118]">Đang chờ duyệt</h3>
            <table className="mt-3 w-full table-fixed border-collapse">
              <colgroup>
                <col style={{ width: "45%" }} />
                <col style={{ width: "55%" }} />
              </colgroup>
              <thead>
                <tr className="border-b border-[#E3E3E3]">
                  <th className={TH}>Ngựa</th>
                  <th className={TH}>Bước hiện tại</th>
                </tr>
              </thead>
              <tbody>
                {pendingRegs.map((r) => (
                  <tr key={r.id} className="border-b border-[#E3E3E3] last:border-b-0">
                    <td className={`${TD} font-medium`}>{r.horseName}</td>
                    <td className={TD}>{stepText(r)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-2 text-[13px] text-[#6b6b6b]">Chưa tính vào danh sách ngựa của giải cho tới khi được duyệt.</p>
          </section>
        )}
      </CenterDialog>

      <ConfirmDialog
        open={Boolean(cancelTarget)}
        title="Hủy đăng ký"
        message={cancelTarget ? `Hủy đăng ký ${horseName(cancelTarget.HorseID)} khỏi ${race.TenGiai}?` : ""}
        confirmLabel="Hủy đăng ký"
        cancelLabel="Giữ lại"
        loading={cancelling}
        onConfirm={handleConfirmCancel}
        onCancel={() => setCancelTarget(null)}
      />
      <ConfirmDialog
        open={confirmEdit}
        title="Sửa kết quả thi đấu"
        message="Kết quả này đã được nhập. Bạn có chắc muốn thay đổi?"
        confirmLabel="Lưu thay đổi"
        cancelLabel="Không"
        danger={false}
        loading={saving}
        onConfirm={doSave}
        onCancel={() => setConfirmEdit(false)}
      />
    </>
  );
}
