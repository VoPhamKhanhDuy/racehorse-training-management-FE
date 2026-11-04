import StatusText from "../../components/StatusText";
import useTrainingOptions from "../../hooks/useTrainingOptions";
import { daysBetween, formatDate } from "../../utils/date";
import { formatDateTime } from "../../utils/trainingFormat";

// Khung thông tin giáo án (chỉ hiển thị): bảng nhãn–giá trị 2 cột, mỗi dòng 2 cặp; cặp không có dữ liệu thì ẩn.
// Mục tiêu / Ghi chú trải cả 2 cột. Màn hẹp (<768px): 1 cột.
function Pair({ label, children, wide = false, divider = false }) {
  return (
    <div
      className={`grid grid-cols-[140px_minmax(0,1fr)] ${wide ? "md:col-span-2" : ""} ${divider ? "md:border-r md:border-[#d9cfba]" : ""}`}
    >
      <dt className="flex items-start border-r border-[#d9cfba] bg-[#f6f0e3] px-4 py-2.5 text-[13px] font-semibold text-[#6b6055]">{label}</dt>
      <dd className="min-w-0 px-4 py-2.5 text-sm whitespace-pre-line text-[#2b2118]">{children}</dd>
    </div>
  );
}

function Row({ children }) {
  return <div className="grid border-b border-[#d9cfba] last:border-b-0 md:grid-cols-2">{children}</div>;
}

export default function PlanInfoTable({ plan }) {
  const { label } = useTrainingOptions();
  const days = plan.startDate && plan.endDate ? daysBetween(plan.startDate, plan.endDate) + 1 : null;
  const createdAt = formatDateTime(plan.createdAt);
  const updatedAt = plan.updatedAt ? formatDateTime(plan.updatedAt) : "";

  return (
    <dl className="overflow-hidden rounded border border-[#b9ab90] bg-white">
      <Row>
        <Pair label="Ngựa" divider={Boolean(plan.trainingType)} wide={!plan.trainingType}>
          {plan.horseName}
        </Pair>
        {plan.trainingType && <Pair label="Loại giáo án">{label("planTypes", plan.trainingType)}</Pair>}
      </Row>
      <Row>
        <Pair label="Thời gian" divider>
          {formatDate(plan.startDate)} – {formatDate(plan.endDate)}
          {days ? ` · ${days} ngày` : ""}
        </Pair>
        <Pair label="Trạng thái">
          <StatusText code={plan.status}>{label("planStatuses", plan.status)}</StatusText>
        </Pair>
      </Row>
      {plan.objective && (
        <Row>
          <Pair label="Mục tiêu" wide>
            {plan.objective}
          </Pair>
        </Row>
      )}
      {plan.notes && (
        <Row>
          <Pair label="Ghi chú" wide>
            {plan.notes}
          </Pair>
        </Row>
      )}
      {(createdAt || updatedAt) && (
        <Row>
          {createdAt && (
            <Pair label="Lập lúc" divider={Boolean(updatedAt)} wide={!updatedAt}>
              {createdAt}
            </Pair>
          )}
          {updatedAt && (
            <Pair label="Cập nhật lúc" wide={!createdAt}>
              {updatedAt}
            </Pair>
          )}
        </Row>
      )}
    </dl>
  );
}
