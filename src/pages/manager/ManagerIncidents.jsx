import { useCallback, useEffect, useState } from "react";
import { Search } from "lucide-react";
import LoadingState from "../../components/LoadingState";
import Toast from "../../components/Toast";
import useAuth from "../../hooks/useAuth";
import IncidentDetailPanel from "./IncidentDetailPanel";
import IncidentFilterTabs from "./IncidentFilterTabs";
import IncidentTableRow from "./IncidentTableRow";
import { getAllIncidentReports, updateIncidentStatus } from "../../services/careService";
import { addAuditLog } from "../../services/auditService";
import { HEALTH_INCIDENT_TYPES, INCIDENT_STATUS, INCIDENT_STATUSES } from "../../data/incidentOptions";
import { toUserID } from "../../utils/userId";

const FACILITY_TYPES = ["Chuồng/thiết bị hỏng"];

// Nhóm lọc theo loại sự cố; "Khác" = mọi loại không thuộc sức khỏe ngựa hoặc chuồng trại
const isHealth = (r) => HEALTH_INCIDENT_TYPES.includes(r.LoaiSuCo);
const isFacility = (r) => FACILITY_TYPES.includes(r.LoaiSuCo);
const TABS = [
  { value: "all", label: "Tất cả loại", match: () => true },
  { value: "health", label: "Sức khỏe ngựa", match: isHealth },
  { value: "facility", label: "Chuồng trại", match: isFacility },
  { value: "other", label: "Khác", match: (r) => !isHealth(r) && !isFacility(r) },
];

const STATUS_TABS = [
  { value: "all", label: "Mọi trạng thái", match: () => true },
  ...INCIDENT_STATUSES.map((s) => ({ value: s, label: s, match: (r) => r.TrangThai === s })),
];

const HEAD = "border-b border-[#b9ab90] bg-[#4a3a2a] px-4 py-3 font-medium whitespace-nowrap text-[#f3ede0]";

// Club Manager xem báo cáo sự cố của nhân sự chuồng trại (chỉ xem, cùng nguồn dữ liệu với trang Groom)
export default function ManagerIncidents() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all");
  const [keyword, setKeyword] = useState("");
  const [statusTab, setStatusTab] = useState("all");
  const [selected, setSelected] = useState(null);
  const [toast, setToast] = useState(null);
  const { user } = useAuth();

  // TODO: thay bằng gọi API thật khi BE xong (hiện đọc từ mock careService)
  useEffect(() => {
    let ignore = false;
    getAllIncidentReports().then((list) => {
      if (ignore) return;
      setReports(list);
      setLoading(false);
    });
    return () => {
      ignore = true;
    };
  }, []);

  const closeToast = useCallback(() => setToast(null), []);

  const normalizedKeyword = keyword.trim().toLowerCase();
  const activeTab = TABS.find((t) => t.value === tab);
  const activeStatus = STATUS_TABS.find((t) => t.value === statusTab);
  const visible = reports.filter(
    (r) => activeTab.match(r) && activeStatus.match(r) && r.HorseName.toLowerCase().includes(normalizedKeyword)
  );

  // Lưu trạng thái + ghi nhật ký; cập nhật danh sách và ngăn đang mở (lỗi ném lại cho ngăn hiện)
  const handleUpdate = async (report, changes) => {
    const managerId = toUserID(user.id);
    const updated = await updateIncidentStatus(report.ReportID, changes, managerId);
    addAuditLog({
      UserID: managerId,
      HanhDong: updated.TrangThai === INCIDENT_STATUS.DONE ? "Đánh dấu đã xử lý sự cố" : "Nhận xử lý sự cố",
      TargetTable: "INCIDENTREPORT",
      TargetID: updated.ReportID,
      targetLabel: report.HorseName,
    });
    const merged = { ...report, ...updated, HandlerName: user.fullName };
    setReports((prev) => prev.map((r) => (r.ReportID === merged.ReportID ? merged : r)));
    setSelected(null); // đóng ngăn để toast (nằm dưới lớp phủ) hiện rõ
    setToast({ text: updated.TrangThai === INCIDENT_STATUS.DONE ? "Đã đánh dấu đã xử lý" : "Đã nhận xử lý sự cố" });
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-serif text-2xl font-semibold tracking-tight text-[#2b2118] sm:text-[1.75rem]">Sự cố</h1>
      </div>

      {loading ? (
        <LoadingState />
      ) : (
        <div className="space-y-5">
          <div className="flex flex-col gap-3 border-b border-[#d9cfba] pb-3 md:flex-row md:items-end md:justify-between md:gap-6 md:pb-0">
            <IncidentFilterTabs
              tabs={STATUS_TABS.map((t) => ({ ...t, count: reports.filter(t.match).length }))}
              value={statusTab}
              onChange={setStatusTab}
              label="Lọc theo trạng thái"
            />

            <div className="flex flex-col gap-2 md:mb-2 md:flex-row">
              <label htmlFor="incidentTypeFilter" className="sr-only">
                Lọc theo loại sự cố
              </label>
              <select
                id="incidentTypeFilter"
                value={tab}
                onChange={(e) => setTab(e.target.value)}
                className="h-9 w-full cursor-pointer rounded-[4px] border border-[#cfc4ad] bg-white px-3 text-sm text-[#2b2118] outline-none focus:border-[#c2570c] md:w-48"
              >
                {TABS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label} ({reports.filter(t.match).length})
                  </option>
                ))}
              </select>

              <div className="relative w-full md:w-64">
              <label htmlFor="incidentKeyword" className="sr-only">
                Tìm theo tên ngựa
              </label>
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#6b6055]" />
              <input
                id="incidentKeyword"
                type="search"
                placeholder="Tìm theo tên ngựa..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="h-9 w-full rounded-[4px] border border-[#cfc4ad] bg-white pr-3 pl-9 text-sm text-[#2b2118] outline-none placeholder:text-[#6b6055]/70 focus:border-[#c2570c]"
              />
              </div>
            </div>
          </div>

          {visible.length === 0 ? (
            <p className="border-y border-[#d9cfba] py-12 text-center text-[#6b6055]">Chưa có báo cáo sự cố nào.</p>
          ) : (
            <div className="overflow-x-auto rounded-[4px] border border-[#b9ab90] bg-white">
              <table className="w-full border-separate border-spacing-0 text-left text-sm">
                <thead>
                  <tr>
                    <th className={HEAD}>Ngựa</th>
                    <th className={HEAD}>Loại sự cố</th>
                    <th className={HEAD}>Trạng thái</th>
                    <th className={HEAD}>Mô tả</th>
                    <th className={`${HEAD} hidden md:table-cell`}>Người báo</th>
                    <th className={`${HEAD} w-[130px] min-w-[130px] max-w-[130px] text-right`}>Ngày báo</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((r) => (
                    <IncidentTableRow key={r.ReportID} report={r} onSelect={setSelected} />
                  ))}
                </tbody>
              </table>
              <p className="px-4 py-3 text-sm text-[#6b6055] tabular-nums">
                Hiển thị {visible.length} / {reports.length} báo cáo
              </p>
            </div>
          )}
        </div>
      )}

      <IncidentDetailPanel
        key={selected?.ReportID}
        report={selected}
        onClose={() => setSelected(null)}
        onUpdate={handleUpdate}
      />
      <Toast toast={toast} onClose={closeToast} />
    </div>
  );
}
