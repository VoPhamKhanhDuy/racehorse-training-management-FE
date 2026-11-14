import { useState } from "react";
import TablePager from "./TablePager";
import { formatCurrency } from "../utils/currency";
import { daysBetween, formatDate, todayISO } from "../utils/date";
import { isReadyHealth } from "../utils/healthGroups";
import { formatRank } from "../utils/raceResult";
import { RR_STATUS, stepText } from "../utils/raceRegistration";
import { formatDateTime } from "../utils/trainingFormat";

const PAGE_SIZE = 10;
const TH = "border-r border-[#E3E3E3] px-[14px] text-[13px] font-semibold text-[#1f1f1f] last:border-r-0";
const TD = "border-r border-b border-[#E3E3E3] px-[14px] py-3 align-middle text-sm text-[#1f1f1f] last:border-r-0";
const EMPTY = <span className="text-[#B5B5B5]">—</span>;

const historyAt = (record, step, action) => record.history.filter((h) => h.step === step && h.action === action).at(-1)?.at;
const lastActivityAt = (record) => record.history.at(-1)?.at ?? record.createdAt;
// "từ 05/11 14:30": formatDateTime cho "dd/MM/yyyy HH:mm" → bỏ năm
const shortDateTime = (iso) => formatDateTime(iso).replace(/\/\d{4}/, "");

function Stacked({ main, sub, mainClass = "" }) {
  return (
    <>
      <span className={`block truncate ${mainClass}`} title={typeof main === "string" ? main : undefined}>
        {main}
      </span>
      {sub && <span className="block truncate text-xs text-[#6b6b6b]">{sub}</span>}
    </>
  );
}

// Bảng danh sách đăng ký thi đấu, cột theo vai trò + tab (bảng trung tính: nền trắng, viền #E3E3E3, header #F5F5F5, không zebra,
// hover #FAFAFA, bo 4px; MỘT màu nhấn cam cho việc cần làm). Chân bảng chuẩn "Hiển thị a–b trong n đăng ký" + phân trang.
// - Quản lý / Chủ ngựa, tab "pending" (chờ mình duyệt): thông tin phục vụ quyết định + nút "Xem & duyệt"
// - Quản lý / Chủ ngựa, tab "done" (đã xử lý): cùng cột, cuối là "Kết quả" (chữ trung tính, không tô màu) + "Xem"
// - Trainer: cột "Trạng thái" đủ nghĩa + dòng phụ thời điểm; chấm cam khi cần Trainer làm gì (Nháp chưa gửi, bị từ chối chưa xem lý do)
// context: { lockedHorseIds: Set, healthByHorse: {horseId: trạng thái}, ownerNameByHorse: {horseId: tên chủ ngựa} }
export default function RaceRegistrationTable({ records, role, tab = "pending", context, onSelect, emptyText }) {
  const [page, setPage] = useState(1);
  const today = todayISO();
  const isTrainer = role === "head_trainer";
  const isManager = role === "club_manager";
  const isPending = tab === "pending";

  if (records.length === 0) {
    return <div className="rounded-[4px] border border-[#E3E3E3] bg-white py-12 text-center text-sm text-[#6b6b6b]">{emptyText}</div>;
  }

  // ---- Nội dung từng loại ô ----
  const horseCell = (r) => <Stacked main={r.horseName} mainClass="font-semibold" sub={isManager ? (context.ownerNameByHorse[r.horseId] ?? null) : null} />;
  const raceCell = (r, withCountdown) => {
    const left = daysBetween(today, r.raceDate);
    const sub = withCountdown ? `${formatDate(r.raceDate)}${left > 0 ? ` · Còn ${left} ngày` : left === 0 ? " · Hôm nay" : ""}` : formatDate(r.raceDate);
    return <Stacked main={r.raceName} sub={sub} />;
  };
  const feeCell = (r) => (r.entryFee != null ? <span className="whitespace-nowrap tabular-nums">{formatCurrency(r.entryFee)}</span> : <span className="text-[#6b6b6b]">Chưa cập nhật</span>);
  const conditionCell = (r) => {
    if (context.lockedHorseIds.has(Number(r.horseId))) return <span className="font-semibold text-[#9e5954]">Đang khóa tập</span>;
    const health = context.healthByHorse[Number(r.horseId)];
    if (!health) return EMPTY;
    return isReadyHealth(health) ? "Đủ điều kiện" : <span className="font-semibold text-[#9e5954]">{health}</span>;
  };
  const dateTimeCell = (iso) => (iso ? <span className="whitespace-nowrap tabular-nums">{formatDateTime(iso)}</span> : EMPTY);

  // Kết quả (tab "Đã xử lý") — chủ ngựa thấy hạng từ /api/races/registrations nếu đã nhập
  const resultText = (r) => {
    switch (r.status) {
      case RR_STATUS.APPROVED: {
        if (r.thuHang !== null && r.thuHang !== undefined) {
          return formatRank(r.thuHang) || "Đã duyệt";
        }
        return "Đã duyệt";
      }
      case RR_STATUS.PENDING_MANAGER:
        return "Chờ quản lý duyệt";
      case RR_STATUS.REJECTED:
        if (r.rejectedBy === "Owner") return isManager ? "Chủ ngựa từ chối" : "Bạn đã từ chối";
        return isManager ? "Bạn đã từ chối" : "Bị từ chối bởi quản lý";
      case RR_STATUS.WITHDRAWN:
        return "Đã rút";
      case RR_STATUS.EXPIRED:
        return "Hết hạn";
      default:
        return stepText(r);
    }
  };

  // Trainer: chấm cam khi cần làm gì
  const trainerNeedsAction = (r) => r.status === RR_STATUS.DRAFT || (r.status === RR_STATUS.REJECTED && r.trainerSeen === false);

  const viewButton = (r, label, strong) => (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onSelect(r);
      }}
      className={`cursor-pointer text-sm whitespace-nowrap text-[#c2570c] hover:underline ${strong ? "font-semibold" : "font-medium"}`}
    >
      {label}
    </button>
  );
  const reviewButton = (r) => (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onSelect(r);
      }}
      className="inline-flex h-9 cursor-pointer items-center rounded-[4px] border border-stone/25 bg-white px-3 text-sm font-semibold whitespace-nowrap text-[#c2570c] transition-colors hover:border-[#c2570c]/50"
    >
      Xem &amp; duyệt
    </button>
  );

  // ---- Cấu hình cột ----
  const stt = { key: "stt", label: "STT", width: 5, center: true, hideBelow: true, render: (r, i) => <span className="text-[#6b6b6b] tabular-nums">{i + 1}</span> };
  let columns;
  if (isTrainer) {
    columns = [
      stt,
      { key: "horse", label: "Ngựa", width: 17, render: (r) => <Stacked main={r.horseName} mainClass="font-semibold" /> },
      { key: "race", label: "Cuộc đua", width: 27, render: (r) => raceCell(r, false) },
      { key: "deadline", label: "Hạn đăng ký", width: 14, render: (r) => <span className="whitespace-nowrap tabular-nums">{formatDate(r.registrationDeadline)}</span> },
      {
        key: "status",
        label: "Trạng thái",
        width: 25,
        render: (r) => (
          <>
            <span className="inline-flex items-center gap-1.5 font-medium">
              {trainerNeedsAction(r) && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#c2570c]" aria-hidden="true" />}
              {stepText(r)}
            </span>
            <span className="block truncate text-xs text-[#6b6b6b]">từ {shortDateTime(lastActivityAt(r))}</span>
          </>
        ),
      },
      { key: "detail", label: "Chi tiết", width: 12, center: true, render: (r) => viewButton(r, "Xem", trainerNeedsAction(r)) },
    ];
  } else {
    const proposer = { key: "trainer", label: "Huấn luyện viên đề xuất", width: 13, render: (r) => <Stacked main={r.trainerName} /> };
    // Chủ ngựa: cột "Gửi lúc"; Quản lý không có cột thời gian (đã bỏ cột "Chủ ngựa đồng ý")
    const time = isManager ? null : { key: "sentAt", label: "Gửi lúc", width: 12, render: (r) => dateTimeCell(historyAt(r, "Trainer", "Gửi duyệt")) };
    columns = [
      stt,
      { key: "horse", label: "Ngựa", width: isManager ? 16 : 14, render: horseCell },
      { key: "race", label: "Cuộc đua", width: isManager ? 22 : 18, render: (r) => raceCell(r, isManager) },
      proposer,
      ...(time ? [time] : []),
      { key: "fee", label: "Lệ phí", width: 10, render: feeCell },
      { key: "condition", label: "Tình trạng ngựa", width: 12, render: conditionCell },
      isPending
        ? { key: "action", label: "Hành động", width: 12, center: true, render: reviewButton }
        : { key: "result", label: "Kết quả", width: 12, render: (r) => <span className="font-medium">{resultText(r)}</span> },
      ...(isPending ? [] : [{ key: "detail", label: "Chi tiết", width: 6, center: true, render: (r) => viewButton(r, "Xem", false) }]),
    ];
    // Tab "Chờ duyệt" không có cột Chi tiết riêng → chia lại độ rộng cho đủ 100%
  }
  const total = columns.reduce((sum, c) => sum + c.width, 0);

  const pageCount = Math.max(1, Math.ceil(records.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const offset = (currentPage - 1) * PAGE_SIZE;
  const pageItems = records.slice(offset, offset + PAGE_SIZE);

  return (
    <div className="overflow-hidden rounded-[4px] border border-[#E3E3E3] bg-white">
      <table className="w-full table-fixed border-collapse text-left">
        <colgroup>
          {columns.map((c) => (
            <col key={c.key} style={{ width: `${(c.width / total) * 100}%` }} className={c.hideBelow ? "max-[899px]:hidden" : ""} />
          ))}
        </colgroup>
        <thead>
          <tr className="h-11 border-b border-[#E3E3E3] bg-[#F5F5F5]">
            {columns.map((c) => (
              <th key={c.key} className={`${TH} ${c.center ? "text-center" : ""} ${c.hideBelow ? "max-[899px]:hidden" : ""}`}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="[&>tr:last-child>td]:border-b-0">
          {pageItems.map((record, index) => (
            <tr key={record.id} onClick={() => onSelect(record)} className="h-14 cursor-pointer bg-white transition-colors hover:bg-[#FAFAFA]">
              {columns.map((c) => (
                <td key={c.key} className={`${TD} ${c.center ? "text-center" : ""} ${c.hideBelow ? "max-[899px]:hidden" : ""}`}>
                  {c.render(record, offset + index)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <TablePager page={currentPage} pageCount={pageCount} total={records.length} pageSize={PAGE_SIZE} unit="đăng ký" onPage={setPage} />
    </div>
  );
}
