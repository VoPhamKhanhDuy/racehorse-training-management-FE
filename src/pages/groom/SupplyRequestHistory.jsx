import { REQUEST_STATUS } from "../../services/supplyRequestMock";
import { formatDate } from "../../utils/date";

const HEAD = "border-r border-[#E3E3E3] px-4 text-[13px] font-semibold text-[#1f1f1f] last:border-r-0";
const CELL = "border-r border-b border-[#E3E3E3] px-4 py-3 align-middle text-sm text-[#1f1f1f] last:border-r-0";
const MAX_ROWS = 5;

// Khối "Yêu cầu đã gửi" của Groom (dưới bảng vật tư): 5 yêu cầu gần nhất của chính người đăng nhập — STT | Ngày gửi | Vật tư | Số lượng đề nghị | Trạng thái.
// Chưa có yêu cầu nào thì không hiện. Dữ liệu MOCK (services/supplyRequestMock.js).
export default function SupplyRequestHistory({ requests, userName }) {
  const rows = requests.filter((r) => r.requestedBy === userName).slice(0, MAX_ROWS); // listSupplyRequests đã sắp mới nhất trước
  if (rows.length === 0) return null;

  return (
    <section aria-label="Yêu cầu đã gửi" className="mt-8">
      <h2 className="font-serif text-xl font-semibold text-[#2b2118]">Yêu cầu đã gửi</h2>
      <div className="mt-3 overflow-hidden rounded-[4px] border border-[#E3E3E3] bg-white">
        <table className="w-full table-fixed border-collapse text-left text-sm">
          <colgroup>
            <col style={{ width: "7%" }} />
            <col style={{ width: "16%" }} />
            <col style={{ width: "35%" }} />
            <col style={{ width: "22%" }} />
            <col style={{ width: "20%" }} />
          </colgroup>
          <thead>
            <tr className="h-11 border-b border-[#E3E3E3] bg-[#F5F5F5]">
              <th className={`${HEAD} text-center`}>STT</th>
              <th className={HEAD}>Ngày gửi</th>
              <th className={HEAD}>Vật tư</th>
              <th className={`${HEAD} text-right`}>Số lượng đề nghị</th>
              <th className={HEAD}>Trạng thái</th>
            </tr>
          </thead>
          <tbody className="[&>tr:last-child>td]:border-b-0">
            {rows.map((request, index) => (
              <tr key={request.id} className="h-[52px] bg-white transition-colors hover:bg-[#FAFAFA]">
                <td className={`${CELL} text-center text-[#6b6b6b] tabular-nums`}>{index + 1}</td>
                <td className={`${CELL} whitespace-nowrap tabular-nums`}>{formatDate(request.requestedAt)}</td>
                <td className={CELL}>
                  <span className="block truncate font-medium" title={request.supplyName}>
                    {request.supplyName}
                  </span>
                </td>
                <td className={`${CELL} text-right whitespace-nowrap tabular-nums`}>
                  {request.quantity.toLocaleString("vi-VN")}
                  {request.unit && <span className="text-[#6b6b6b]"> {request.unit}</span>}
                </td>
                <td className={`${CELL} whitespace-nowrap ${request.status === REQUEST_STATUS.PENDING ? "font-semibold" : "text-[#6b6b6b]"}`}>{request.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
