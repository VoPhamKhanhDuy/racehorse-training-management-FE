import { useEffect, useState } from "react";
import CenterDialog from "../../components/CenterDialog";
import TablePager from "../../components/TablePager";
import useAuth from "../../hooks/useAuth";
import { REQUEST_STATUS, listSupplyRequests, markSupplyRequestDone, subscribeSupplyRequests } from "../../services/supplyRequestMock";
import { formatDate } from "../../utils/date";

const PAGE_SIZE = 5;
const HEAD = "border-r border-[#E3E3E3] px-4 text-[13px] font-semibold text-[#1f1f1f] last:border-r-0";
const CELL = "border-r border-b border-[#E3E3E3] px-4 py-3 align-middle text-sm text-[#1f1f1f] last:border-r-0";
const OUTLINE_BUTTON =
  "inline-flex h-10 cursor-pointer items-center rounded-[4px] border border-stone/25 bg-white px-5 text-sm font-semibold text-ink transition-colors hover:border-stone/50 disabled:cursor-not-allowed disabled:opacity-60";

// Khối "Yêu cầu bổ sung từ nhân viên" ở Quản lý vật tư: STT | Ngày gửi | Vật tư | Số lượng đề nghị | Ghi chú | Người gửi | Trạng thái.
// Chờ xử lý lên trước; bấm dòng Chờ xử lý → khung chi tiết + "Đánh dấu đã xử lý" (chỉ đổi trạng thái, KHÔNG trừ / cộng kho — nhập kho làm ở từng vật tư).
// Menu "Quản lý vật tư" hiện huy hiệu "Mới" khi còn yêu cầu chờ (hooks/useSupplyRequestBadge.js).
// MOCK — services/supplyRequestMock.js (TODO(BE): nối API khi có endpoint). Không có yêu cầu nào thì khối không hiện.
export default function SupplyRequestsPanel() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const load = () => listSupplyRequests().then(setRequests);
    load();
    return subscribeSupplyRequests(load);
  }, []);

  if (requests.length === 0) return null;

  const rows = [...requests].sort(
    (a, b) => Number(b.status === REQUEST_STATUS.PENDING) - Number(a.status === REQUEST_STATUS.PENDING) || b.requestedAt.localeCompare(a.requestedAt)
  );
  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const offset = (currentPage - 1) * PAGE_SIZE;
  const amountText = (r) => `${r.quantity.toLocaleString("vi-VN")}${r.unit ? ` ${r.unit}` : ""}`;

  const handleDone = async () => {
    await markSupplyRequestDone(selected.id, user.fullName);
    setSelected(null);
  };

  return (
    <section aria-label="Yêu cầu bổ sung từ nhân viên">
      <h2 className="font-serif text-xl font-semibold text-[#2b2118]">Yêu cầu bổ sung từ nhân viên</h2>
      <div className="mt-3 overflow-hidden rounded-[4px] border border-[#E3E3E3] bg-white">
        <table className="w-full table-fixed border-collapse text-left text-sm">
          <colgroup>
            <col style={{ width: "6%" }} />
            <col style={{ width: "12%" }} />
            <col style={{ width: "22%" }} />
            <col style={{ width: "15%" }} />
            <col style={{ width: "21%" }} />
            <col style={{ width: "14%" }} />
            <col style={{ width: "10%" }} />
          </colgroup>
          <thead>
            <tr className="h-11 border-b border-[#E3E3E3] bg-[#F5F5F5]">
              <th className={`${HEAD} text-center`}>STT</th>
              <th className={HEAD}>Ngày gửi</th>
              <th className={HEAD}>Vật tư</th>
              <th className={`${HEAD} text-right`}>Số lượng đề nghị</th>
              <th className={HEAD}>Ghi chú</th>
              <th className={HEAD}>Người gửi</th>
              <th className={HEAD}>Trạng thái</th>
            </tr>
          </thead>
          <tbody className="[&>tr:last-child>td]:border-b-0">
            {rows.slice(offset, offset + PAGE_SIZE).map((request, index) => {
              const pending = request.status === REQUEST_STATUS.PENDING;
              return (
                <tr
                  key={request.id}
                  onClick={pending ? () => setSelected(request) : undefined}
                  onKeyDown={pending ? (e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), setSelected(request)) : undefined}
                  tabIndex={pending ? 0 : undefined}
                  className={`h-[52px] bg-white transition-colors hover:bg-[#FAFAFA] ${pending ? "cursor-pointer outline-none focus-visible:bg-[#FAFAFA]" : ""}`}
                >
                  <td className={`${CELL} text-center text-[#6b6b6b] tabular-nums`}>{offset + index + 1}</td>
                  <td className={`${CELL} whitespace-nowrap tabular-nums`}>{formatDate(request.requestedAt)}</td>
                  <td className={CELL}>
                    <span className="block truncate font-medium" title={request.supplyName}>
                      {request.supplyName}
                    </span>
                  </td>
                  <td className={`${CELL} text-right whitespace-nowrap tabular-nums`}>{amountText(request)}</td>
                  <td className={`${CELL} text-[#6b6b6b]`}>
                    <span className="block truncate" title={request.note}>
                      {request.note || "—"}
                    </span>
                  </td>
                  <td className={CELL}>
                    <span className="block truncate" title={request.requestedBy}>
                      {request.requestedBy}
                    </span>
                  </td>
                  <td className={`${CELL} whitespace-nowrap ${pending ? "font-semibold" : "text-[#6b6b6b]"}`}>{request.status}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <TablePager page={currentPage} pageCount={pageCount} total={rows.length} pageSize={PAGE_SIZE} unit="yêu cầu" onPage={setPage} />
      </div>

      {selected && (
        <CenterDialog
          label="Yêu cầu bổ sung vật tư"
          maxWidth={460}
          onClose={() => setSelected(null)}
          header={<h2 className="font-serif text-xl leading-tight font-semibold text-[#2b2118]">Yêu cầu bổ sung vật tư</h2>}
          footer={
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setSelected(null)} className={OUTLINE_BUTTON}>
                Đóng
              </button>
              <button type="button" onClick={handleDone} className="btn-primary">
                Đánh dấu đã xử lý
              </button>
            </div>
          }
        >
          <dl className="space-y-3 text-sm">
            {[
              ["Vật tư", selected.supplyName],
              ["Số lượng đề nghị", amountText(selected)],
              ["Người gửi", selected.requestedBy],
              ["Ngày gửi", formatDate(selected.requestedAt)],
              ["Ghi chú", selected.note || "—"],
            ].map(([label, value]) => (
              <div key={label} className="grid grid-cols-[140px_1fr] gap-3">
                <dt className="text-[#6b6b6b]">{label}</dt>
                <dd className="text-[#1f1f1f] [overflow-wrap:anywhere]">{value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-[13px] text-[#6b6b6b]">Đánh dấu đã xử lý chỉ đổi trạng thái yêu cầu, không thay đổi tồn kho.</p>
        </CenterDialog>
      )}
    </section>
  );
}
