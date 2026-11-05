import { useCallback, useEffect, useState } from "react";
import Toast from "../../components/Toast";
import {
  approvePlan,
  getOwnerPlanApprovals,
  markNoticesRead,
  rejectPlan,
  requestPlanChanges,
  subscribePlanApprovals,
} from "../../services/planApprovalMock";
import { PLAN_APPROVAL } from "../../utils/planStatus";
import OwnerPlanApprovalDialog from "./OwnerPlanApprovalDialog";
import OwnerPlanApprovalRow from "./OwnerPlanApprovalRow";

// Lưới cột bảng (từ md), DÙNG CHUNG cho tiêu đề và mọi hàng: Ngựa | Giáo án | Huấn luyện viên | Thời gian | nút (120px). Dưới md mỗi hàng xếp dọc.
const GRID_CLASS = "md:grid md:grid-cols-[minmax(0,1.4fr)_minmax(0,1.8fr)_minmax(0,1.3fr)_minmax(0,1.3fr)_136px] md:items-center";

// Khối "Kế hoạch huấn luyện" đầu trang Lịch trình của Chủ ngựa (MOCK — services/planApprovalMock.js).
// Bảng phẳng, mỗi kế hoạch MỘT hàng (chờ duyệt lên trên); bấm vào mở modal chi tiết ở giữa màn hình, duyệt ở đó.
// Kế hoạch Nháp không bao giờ hiện (getOwnerPlanApprovals đã loại). Không có kế hoạch nào → không render gì.
export default function OwnerPlanApprovals({ horses }) {
  const [records, setRecords] = useState([]);
  const [openPlanId, setOpenPlanId] = useState(null);
  const [toast, setToast] = useState(null);
  const horseIds = horses.map((h) => h.HorseID);
  const idsKey = horseIds.join(",");

  const load = useCallback(async () => {
    setRecords(await getOwnerPlanApprovals(horseIds));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey]);

  useEffect(() => {
    load();
    // Mở trang = đã xem thông báo; Trainer gửi / sửa lại (cùng trình duyệt) thì tải lại ngay
    markNoticesRead("horse_owner", { horseIds });
    return subscribePlanApprovals(() => {
      markNoticesRead("horse_owner", { horseIds });
      load();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load]);

  const closeDialog = useCallback(() => setOpenPlanId(null), []);
  const closeToast = useCallback(() => setToast(null), []);

  if (records.length === 0) return null;

  // Chờ duyệt lên trên, rồi tới các kế hoạch đã quyết định (mỗi nhóm mới nhất trước)
  const sorted = [...records].sort(
    (a, b) => Number(b.status === PLAN_APPROVAL.PENDING) - Number(a.status === PLAN_APPROVAL.PENDING)
  );
    const openRecord = records.find((r) => r.planId === openPlanId) ?? null;
  const horseById = Object.fromEntries(horses.map((h) => [h.HorseID, h]));

  const handleApprove = async (planId) => {
    await approvePlan(planId);
    await load();
    setOpenPlanId(null);
    setToast({ text: "Đã đồng ý kế hoạch" });
  };
  const handleReject = async (planId, note) => {
    await rejectPlan(planId, note);
    await load();
    setOpenPlanId(null);
    setToast({ text: "Đã từ chối giáo án" });
  };
  const handleRequestChanges = async (planId, note) => {
    await requestPlanChanges(planId, note);
    await load();
    setOpenPlanId(null);
    setToast({ text: "Đã gửi yêu cầu chỉnh sửa" });
  };

  return (
    // Rộng hết bề ngang nội dung của trang (nằm phía trên 2 cột "Sắp tới" / "Nhận xét gần đây")
    <section aria-label="Kế hoạch huấn luyện" className="mt-8">
      <h2 className="font-serif text-xl font-semibold text-[#2b2118]">Kế hoạch huấn luyện</h2>

      {/* -mx-3 + px-3 trong hàng: chữ thẳng lề với tiêu đề, nền hover vẫn có khoảng thở */}
      <div className="-mx-3 mt-4">
        <div className={`${GRID_CLASS} hidden border-b border-stone/20 px-3 pb-2.5 text-[13px] text-[#6b6055]`}>
          <span className="pr-4">Ngựa</span>
          <span className="pr-4">Giáo án</span>
          <span className="pr-4">Huấn luyện viên</span>
          <span className="pr-4">Thời gian</span>
          <span aria-hidden="true" />
        </div>
        <ul className="border-b border-stone/20">
          {sorted.map((record) => (
            <OwnerPlanApprovalRow
              key={record.planId}
              record={record}
              horse={horseById[record.horseId]}
              gridClass={GRID_CLASS}
              onOpen={() => setOpenPlanId(record.planId)}
            />
          ))}
        </ul>
      </div>

      {openRecord && (
        <OwnerPlanApprovalDialog
          key={`${openRecord.planId}-${openRecord.status}`}
          record={openRecord}
          horse={horseById[openRecord.horseId]}
          onClose={closeDialog}
          onApprove={handleApprove}
          onRequestChanges={handleRequestChanges}
          onReject={handleReject}
        />
      )}

      <Toast toast={toast} onClose={closeToast} />
    </section>
  );
}
