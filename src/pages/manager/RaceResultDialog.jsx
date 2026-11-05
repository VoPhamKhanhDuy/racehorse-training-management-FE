import { useRef, useState } from "react";
import CenterDialog from "../../components/CenterDialog";
import ConfirmDialog from "../../components/ConfirmDialog";
import { DEFAULT_SAMPLE_PAYOUTS, getRaceInfo } from "../../data/raceInfoMock";
import { formatDate } from "../../utils/date";
import { isPodiumRank, isResultComplete, hasResult, PODIUM_MAX } from "../../utils/raceResult";

const TH = "px-2 pb-2 text-left text-[13px] font-semibold text-[#1f1f1f]";
const TD = "px-2 py-2.5 align-top text-sm text-[#1f1f1f]";
const OUTLINE_BUTTON =
  "inline-flex h-10 cursor-pointer items-center rounded-[4px] border border-stone/25 bg-white px-5 text-sm font-semibold text-ink transition-colors hover:border-stone/50 disabled:cursor-not-allowed disabled:opacity-60";
const INPUT =
  "h-9 w-full rounded-[4px] border bg-white px-2.5 text-sm text-[#1f1f1f] outline-none transition-colors focus:border-[#c2570c] disabled:cursor-not-allowed disabled:bg-[#F5F5F5] disabled:text-[#B5B5B5]";

const digitsOnly = (value) => value.replace(/\D/g, "");
const formatDigits = (digits) => (digits ? Number(digits).toLocaleString("vi-VN") : "");
const savedRank = (reg) => (hasResult(reg) ? String(reg.ThuHang) : "");
const savedPrize = (reg) => (reg.TienThuong != null ? String(reg.TienThuong) : "");

// Khung nhập / sửa kết quả 1 giải đã diễn ra — CHỈ Quản lý CLB. Thứ hạng + tiền thưởng của từng ngựa lưu CÙNG MỘT LẦN bấm "Lưu":
// - Thứ hạng: để trống = chưa có kết quả, 0 = không xếp hạng, 1, 2, 3… không trùng nhau. Nhập hạng 1–3 → tự điền sẵn tiền thưởng theo cơ cấu giải
//   (DỮ LIỆU MẪU data/raceInfoMock.js, chờ BE; sửa tay thì không bị ghi đè).
// - Hạng 1–3 BẮT BUỘC có tiền thưởng (chặn lưu nếu thiếu) để không bao giờ lưu nửa vời "có hạng, thiếu thưởng".
// - Lưu tuần tự từng ngựa: hạng rồi tiền thưởng. Lỗi giữa chừng → dừng, báo rõ ngựa nào chưa lưu xong; dòng chưa đủ không tính "đã nhập".
// TODO(BE): gộp thành 1 endpoint (PUT /api/races/{id}/results, body [{ horseID, thuHang, tienThuong }]) chạy trong 1 transaction và cho role Manager gọi.
export default function RaceResultDialog({ race, regs, horseName, saveResult, onClose, onSaved }) {
  const [ranks, setRanks] = useState(() => Object.fromEntries(regs.map((r) => [r.HorseID, savedRank(r)])));
  const [prizes, setPrizes] = useState(() => Object.fromEntries(regs.map((r) => [r.HorseID, savedPrize(r)])));
  const [confirmEdit, setConfirmEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [showErrors, setShowErrors] = useState(false);

  const payouts = getRaceInfo(race)?.payouts ?? DEFAULT_SAMPLE_PAYOUTS;
  const prizeTouched = useRef(new Set(regs.filter((r) => r.TienThuong != null).map((r) => r.HorseID)));

  const rankOf = (horseId) => (ranks[horseId] === "" || ranks[horseId] === undefined ? null : Number(ranks[horseId]));
  const podium = (horseId) => isPodiumRank(rankOf(horseId));

  const handleRankChange = (horseId, value) => {
    setRanks((prev) => ({ ...prev, [horseId]: value }));
    if (prizeTouched.current.has(horseId)) return;
    const rank = value === "" ? null : Number(value);
    const payout = isPodiumRank(rank) ? payouts[rank - 1] : undefined;
    setPrizes((prev) => ({ ...prev, [horseId]: payout != null ? String(payout) : "" }));
  };

  // ---- Kiểm tra: thứ hạng hợp lệ + không trùng; hạng 1–3 phải có tiền thưởng ----
  const rankErrors = {};
  const prizeErrors = {};
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
    else if (isPodiumRank(rank) && !(Number(prizes[reg.HorseID]) > 0)) prizeErrors[reg.HorseID] = "Nhập tiền thưởng cho hạng 1–3";
  });
  const hasErrors = Object.keys(rankErrors).length > 0 || Object.keys(prizeErrors).length > 0;

  // Dòng cần gửi: đổi hạng, đổi tiền thưởng, hoặc đã có hạng nhưng còn thiếu tiền thưởng (lưu dở lần trước)
  const changed = regs.filter((reg) => {
    const rank = rankOf(reg.HorseID);
    if (rank === null) return false; // không xóa được kết quả đã nhập (BE chưa hỗ trợ) — bỏ qua dòng để trống
    return rank !== (hasResult(reg) ? reg.ThuHang : null) || (podium(reg.HorseID) && prizes[reg.HorseID] !== savedPrize(reg)) || !isResultComplete(reg);
  });
  const editsExisting = changed.some((r) => isResultComplete(r));

  const doSave = async () => {
    setSaving(true);
    setSaveError("");
    const updated = [];
    try {
      for (const reg of changed) {
        const rank = rankOf(reg.HorseID);
        // Đổi hạng thì BE xóa tiền thưởng cũ → luôn gửi lại tiền thưởng cho hạng 1–3 sau khi lưu hạng
        const saved = await saveResult(race, reg, rank, isPodiumRank(rank) ? Number(prizes[reg.HorseID]) : null);
        updated.push(saved);
      }
      onSaved(updated, "Đã lưu kết quả thi đấu");
    } catch (err) {
      if (err.partial) updated.push(err.partial); // đã lưu hạng nhưng lỗi ở tiền thưởng
      if (updated.length > 0) onSaved(updated, null); // dòng nào đã lưu xong thì cập nhật bảng bên ngoài, khung vẫn mở
      setSaveError(err.message || "Không lưu được kết quả, vui lòng thử lại.");
      setSaving(false);
      setConfirmEdit(false);
    }
  };

  const handleSave = () => {
    setShowErrors(true);
    if (hasErrors) return;
    if (changed.length === 0) {
      onClose();
      return;
    }
    if (editsExisting) setConfirmEdit(true);
    else doSave();
  };

  const header = (
    <div>
      <h2 className="font-serif text-xl leading-tight font-semibold text-[#2b2118]">{race.TenGiai}</h2>
      <p className="mt-1 text-sm text-[#6b6055]">
        {formatDate(race.Ngay)} · {race.DiaDiem}
      </p>
    </div>
  );

  const footer = (
    <div>
      {saveError && <p className="mb-3 text-sm text-alert">{saveError}</p>}
      <div className="flex flex-wrap items-center justify-end gap-3">
        <button type="button" onClick={onClose} disabled={saving} className={OUTLINE_BUTTON}>
          Hủy
        </button>
        <button type="button" onClick={handleSave} disabled={saving || regs.length === 0 || (showErrors && hasErrors)} className="btn-primary">
          {saving ? "Đang lưu..." : "Lưu"}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <CenterDialog label={`Kết quả ${race.TenGiai}`} header={header} footer={footer} onClose={onClose} busy={saving}>
        <h3 className="font-serif text-base font-semibold text-[#2b2118]">Ngựa tham gia</h3>
        {regs.length === 0 ? (
          <p className="mt-3 text-sm text-[#6b6055]">Không có ngựa nào tham gia giải này.</p>
        ) : (
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
                {regs.map((reg) => {
                  const prizeError = showErrors || prizeTouched.current.has(reg.HorseID) ? prizeErrors[reg.HorseID] : undefined;
                  return (
                    <tr key={reg.HorseID} className="border-b border-[#E3E3E3] last:border-b-0">
                      <td className={`${TD} pt-4 font-medium`}>
                        <span className="block truncate" title={horseName(reg.HorseID)}>
                          {horseName(reg.HorseID)}
                        </span>
                      </td>
                      <td className={TD}>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          inputMode="numeric"
                          aria-label={`Thứ hạng ${horseName(reg.HorseID)}`}
                          value={ranks[reg.HorseID]}
                          onChange={(e) => handleRankChange(reg.HorseID, e.target.value)}
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
                            onChange={(e) => {
                              prizeTouched.current.add(reg.HorseID);
                              setPrizes((prev) => ({ ...prev, [reg.HorseID]: digitsOnly(e.target.value) }));
                            }}
                            className={`${INPUT} pr-7 text-right tabular-nums ${prizeError ? "border-alert" : "border-stone/25"}`}
                          />
                          {podium(reg.HorseID) && <span className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-sm text-[#6b6b6b]">đ</span>}
                        </div>
                        {prizeError && <p className="mt-1 text-xs text-alert">{prizeError}</p>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="mt-3 text-[13px] text-[#6b6b6b]">
              Để trống nếu chưa có kết quả, nhập 0 nếu không xếp hạng. Hạng 1–{PODIUM_MAX} phải có tiền thưởng (tự điền theo cơ cấu giải, sửa được). Thứ hạng và tiền thưởng được lưu cùng lúc.
            </p>
          </>
        )}
      </CenterDialog>

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
