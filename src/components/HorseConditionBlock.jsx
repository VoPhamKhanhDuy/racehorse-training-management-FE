import useHorseCondition from "../hooks/useHorseCondition";
import { formatDate } from "../utils/date";
import { isReadyHealth } from "../utils/healthGroups";

// Khối "Tình trạng ngựa" (chỉ đọc) trong khung đăng ký thi đấu: sức khỏe gần nhất + khóa tập đang hiệu lực.
// Ngựa đang khóa tập hoặc sức khỏe chưa "Đủ điều kiện" → dòng cảnh báo cam đậm để chủ ngựa / quản lý cân nhắc. KHÔNG chặn việc duyệt.
export default function HorseConditionBlock({ horseId }) {
  const { loading, health, lock, healthKnown, lockKnown } = useHorseCondition(horseId);
  const notReady = health && !isReadyHealth(health.TrangThai);

  return (
    <section className="mt-6 border-t border-stone/15 pt-6">
      <h3 className="font-serif text-base font-semibold text-[#2b2118]">Tình trạng ngựa</h3>
      {loading ? (
        <p className="mt-3 text-sm text-[#6b6055]">Đang tải...</p>
      ) : (
        <>
          {(lock || notReady) && (
            <div className="mt-3 space-y-0.5 text-sm font-semibold text-[#c2570c]">
              {lock && <p>Ngựa đang bị khóa tập</p>}
              {notReady && <p>Sức khỏe chưa đủ điều kiện</p>}
            </div>
          )}
          <dl className="mt-3 space-y-2 text-sm">
            <div className="grid grid-cols-[130px_minmax(0,1fr)] gap-x-4">
              <dt className="text-[#6b6055]">Sức khỏe gần nhất</dt>
              <dd className="text-[#2b2118]">
                {health ? `${health.TrangThai}${health.NgayCapNhat ? ` · cập nhật ${formatDate(String(health.NgayCapNhat).slice(0, 10))}` : ""}` : healthKnown ? "Chưa có dữ liệu" : "Chưa có thông tin"}
              </dd>
            </div>
            <div className="grid grid-cols-[130px_minmax(0,1fr)] gap-x-4">
              <dt className="text-[#6b6055]">Khóa tập</dt>
              <dd className="text-[#2b2118]">
                {lock
                  ? `${lock.LyDo || "Đang khóa"}${lock.NgayGo ? ` · hết hạn ${formatDate(lock.NgayGo)}` : ""}`
                  : lockKnown
                    ? "Không có"
                    : "Chưa có thông tin"}
              </dd>
            </div>
          </dl>
        </>
      )}
    </section>
  );
}
