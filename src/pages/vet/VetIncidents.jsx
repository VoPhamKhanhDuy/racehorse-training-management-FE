import { useCallback, useEffect, useState } from "react";
import { Search } from "lucide-react";
import LoadingState from "../../components/LoadingState";
import Toast from "../../components/Toast";
import useAuth from "../../hooks/useAuth";
import IncidentFilterTabs from "../manager/IncidentFilterTabs";
import VetIncidentDrawer from "./VetIncidentDrawer";
import VetIncidentRow from "./VetIncidentRow";
import { getHorses, getIncidentsForVet, getStableNumbers, updateHealthIncidentStatus } from "../../services/careService";
import { getActiveTrainingLocks } from "../../services/vetService";
import { addAuditLog } from "../../services/auditService";
import { INCIDENT_STATUS, INCIDENT_STATUSES } from "../../data/incidentOptions";
import { toUserID } from "../../utils/userId";

const STATUS_TABS = [
  { value: "all", label: "Mọi trạng thái", match: () => true },
  ...INCIDENT_STATUSES.map((s) => ({ value: s, label: s, match: (r) => r.TrangThai === s })),
];

const HEAD = "border-b border-[#b9ab90] bg-[#4a3a2a] px-4 py-3 text-[13px] font-semibold whitespace-nowrap text-[#f3ede0]";

// Bác sĩ thú y xử lý báo cáo sự cố về sức khỏe ngựa (Vết thương, Khập khiễng, Bỏ ăn) do nhân viên chăm sóc gửi.
// Dữ liệu mock chung với trang Groom / Manager (careService, store "incidentReports").
export default function VetIncidents() {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [horses, setHorses] = useState([]);
  const [stables, setStables] = useState({});
  const [lockDates, setLockDates] = useState({}); // HorseID → ngày đặt lệnh khóa đang hiệu lực (đọc từ kho lệnh khóa của Vet)
  const [loading, setLoading] = useState(true);
  const [statusTab, setStatusTab] = useState("all");
  const [keyword, setKeyword] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [toast, setToast] = useState(null);

  // TODO: thay bằng gọi API thật khi BE xong (hiện đọc từ mock careService)
  useEffect(() => {
    let ignore = false;
    // Không đọc được lệnh khóa thì bỏ qua (drawer chỉ không hiện dòng khóa tập)
    const locksPromise = getActiveTrainingLocks().catch(() => []);
    Promise.all([getIncidentsForVet(), getHorses(), getStableNumbers(), locksPromise]).then(([list, horseList, stableMap, lockList]) => {
      if (ignore) return;
      setLockDates(Object.fromEntries(lockList.map((l) => [l.HorseID, l.NgayDat])));
      setReports(list);
      setHorses(horseList);
      setStables(stableMap);
      setLoading(false);
    });
    return () => {
      ignore = true;
    };
  }, []);

  const closeToast = useCallback(() => setToast(null), []);
  const horseById = Object.fromEntries(horses.map((h) => [h.HorseID, h]));

  const normalizedKeyword = keyword.trim().toLowerCase();
  const activeStatus = STATUS_TABS.find((t) => t.value === statusTab);
  // Mới → Đang xử lý → Đã xử lý; trong mỗi nhóm giữ thứ tự mới nhất trước (sort ổn định)
  const statusRank = (r) => INCIDENT_STATUSES.indexOf(r.TrangThai);
  const visible = reports
    .filter((r) => activeStatus.match(r) && r.HorseName.toLowerCase().includes(normalizedKeyword))
    .sort((a, b) => statusRank(a) - statusRank(b));
  const selected = reports.find((r) => r.ReportID === selectedId) ?? null;

  // Lưu trạng thái + ghi nhật ký; cập nhật danh sách, đóng ngăn và báo toast (lỗi ném lại cho ngăn hiện)
  const handleUpdate = async (report, changes) => {
    const vetId = toUserID(user.id);
    const updated = await updateHealthIncidentStatus(report.ReportID, changes, vetId);
    addAuditLog({
      UserID: vetId,
      HanhDong: updated.TrangThai === INCIDENT_STATUS.DONE ? "Đánh dấu đã xử lý sự cố" : "Nhận xử lý sự cố",
      TargetTable: "INCIDENTREPORT",
      TargetID: updated.ReportID,
      targetLabel: report.HorseName,
    });
    const merged = { ...report, ...updated, HandlerName: user.fullName };
    setReports((prev) => prev.map((r) => (r.ReportID === merged.ReportID ? merged : r)));
    setSelectedId(null);
    setToast({ text: updated.TrangThai === INCIDENT_STATUS.DONE ? "Đã đánh dấu đã xử lý" : "Đã nhận xử lý sự cố" });
  };

  return (
    <div className="mx-auto w-full max-w-[1100px] md:px-8">
      <h1 className="font-serif text-[30px] leading-tight font-semibold tracking-tight text-[#2b2118]">Sự cố cần xử lý</h1>
      <p className="mt-1 text-sm text-[#4a3f33]">Báo cáo về sức khỏe ngựa từ nhân viên chăm sóc.</p>

      {loading ? (
        <LoadingState />
      ) : (
        <div className="mt-6 space-y-5">
          <div className="flex flex-col gap-3 border-b border-[#d9cfba] pb-3 md:flex-row md:items-end md:justify-between md:gap-6 md:pb-0">
            <IncidentFilterTabs
              tabs={STATUS_TABS.map((t) => ({ ...t, count: reports.filter(t.match).length }))}
              value={statusTab}
              onChange={setStatusTab}
              label="Lọc theo trạng thái"
            />

            <div className="relative w-full md:mb-2 md:w-64">
              <label htmlFor="vetIncidentKeyword" className="sr-only">
                Tìm theo tên ngựa
              </label>
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#6b6055]" aria-hidden="true" />
              <input
                id="vetIncidentKeyword"
                type="search"
                placeholder="Tìm theo tên ngựa..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="h-9 w-full rounded-[4px] border border-[#cfc4ad] bg-white pr-3 pl-9 text-sm text-[#2b2118] outline-none placeholder:text-[#6b6055]/70 focus:border-[#c2570c]"
              />
            </div>
          </div>

          {visible.length === 0 ? (
            <p className="rounded-[4px] border border-[#d9cfba] bg-white py-12 text-center text-sm text-[#4a3f33]">Chưa có sự cố nào cần xử lý.</p>
          ) : (
            <div className="overflow-x-auto rounded-[4px] border border-[#b9ab90] bg-white">
              <table className="w-full min-w-[720px] border-separate border-spacing-0 text-left text-sm">
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
                <tbody className="[&>tr:last-child>td]:border-b-0">
                  {visible.map((r) => (
                    <VetIncidentRow
                      key={r.ReportID}
                      report={r}
                      horse={horseById[r.HorseID]}
                      stable={stables[r.HorseID]}
                      onSelect={(report) => setSelectedId(report.ReportID)}
                    />
                  ))}
                </tbody>
              </table>
              <p className="border-t border-[#d9cfba] px-4 py-3 text-sm text-[#4a3f33] tabular-nums">
                Hiển thị {visible.length} / {reports.length} báo cáo
              </p>
            </div>
          )}
        </div>
      )}

      <VetIncidentDrawer
        key={selected?.ReportID}
        report={selected}
        horse={selected && horseById[selected.HorseID]}
        stable={selected && stables[selected.HorseID]}
        lockedSince={selected ? lockDates[selected.HorseID] : undefined}
        onClose={() => setSelectedId(null)}
        onUpdate={handleUpdate}
      />
      <Toast toast={toast} onClose={closeToast} />
    </div>
  );
}
