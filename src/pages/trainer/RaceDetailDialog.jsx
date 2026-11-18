import { useState } from "react";
import { Link } from "react-router-dom";
import CenterDialog from "../../components/CenterDialog";
import ConfirmDialog from "../../components/ConfirmDialog";
import { formatCurrency } from "../../utils/currency";
import { formatDate, todayISO } from "../../utils/date";
import { isReadyHealth } from "../../utils/healthGroups";
import { formatRank, isResultComplete } from "../../utils/raceResult";
import { stepText } from "../../utils/raceRegistration";

const TH = "px-2 pb-2 text-left text-[13px] font-semibold text-[#1f1f1f]";
const TD = "px-2 py-2.5 align-middle text-sm text-[#1f1f1f]";
const OUTLINE_BUTTON =
  "inline-flex h-10 cursor-pointer items-center rounded-[4px] border border-stone/25 bg-white px-5 text-sm font-semibold text-ink transition-colors hover:border-stone/50 disabled:cursor-not-allowed disabled:opacity-60";


// Khung chi tiết 1 giải (modal giữa màn hình, đầu + chân cố định):
// - Giải SẮP TỚI: thông tin giải + bảng ngựa đã đăng ký (Ngựa | Tình trạng | Ngày đăng ký | "Hủy đăng ký" có xác nhận). KHÔNG đăng ký trực tiếp ở đây
//   (đăng ký thực hiện ở /trainer/race-registrations — luồng Chủ ngựa → Quản lý duyệt); hủy thì không cần duyệt.
// - Giải ĐÃ DIỄN RA: CHỈ XEM thứ hạng + tiền thưởng. Kết quả do Quản lý CLB nhập (/manager/race-results); HLV không nhập / sửa ở đây.
export default function RaceDetailDialog({ race, regs, pendingRegs = [], onOpenHorse, onOpenInfo, horseName, lockedHorseIds, healthByHorse, onClose, onCancelRegistration }) {
  const isPast = race.Ngay < todayISO();
  const [cancelTarget, setCancelTarget] = useState(null); // đăng ký đang chờ xác nhận hủy
  const [cancelling, setCancelling] = useState(false);

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

  const footer = isPast ? (
    <div className="flex flex-wrap items-center justify-end gap-3">
      <button type="button" onClick={() => onOpenInfo(race.RaceID)} className="mr-auto cursor-pointer text-sm font-semibold text-[#c2570c] hover:underline">
        Xem thông tin giải
      </button>
      <button type="button" onClick={onClose} className={OUTLINE_BUTTON}>
        Đóng
      </button>
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
      <CenterDialog label={race.TenGiai} header={header} footer={footer} onClose={onClose} busy={cancelling}>
        <h3 className="font-serif text-base font-semibold text-[#2b2118]">{isPast ? "Ngựa tham gia" : "Ngựa đã đăng ký"}</h3>
        {regs.length === 0 ? (
          <p className="mt-3 text-sm text-[#6b6055]">{isPast ? "Không có ngựa nào tham gia giải này." : "Chưa có ngựa nào đăng ký giải này."}</p>
        ) : isPast ? (
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
                  <td className={TD}>{isResultComplete(reg) ? formatRank(reg.ThuHang) : <span className="text-[#B5B5B5]">—</span>}</td>
                  <td className={`${TD} text-right tabular-nums`}>
                    {isResultComplete(reg) && reg.TienThuong != null ? formatCurrency(reg.TienThuong) : <span className="text-[#B5B5B5]">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
        {isPast && regs.length > 0 && !regs.every(isResultComplete) && (
          <p className="mt-3 text-[13px] text-[#6b6b6b]">Kết quả do Quản lý CLB nhập sau giải. Ngựa chưa có kết quả sẽ hiện "—".</p>
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
    </>
  );
}
