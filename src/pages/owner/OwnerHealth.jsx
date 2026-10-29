import { useEffect, useState } from "react";
import LoadingState from "../../components/LoadingState";
import useAuth from "../../hooks/useAuth";
import OwnerHealthRow from "./OwnerHealthRow";
import OwnerVaccineStatus from "./OwnerVaccineStatus";
import { getActiveLockDates, getHealthStatuses, getOwnerHorses, getOwnerVaccinations } from "../../services/ownerService";
import { getVaccineState } from "../../utils/healthAlerts";
import { formatDate } from "../../utils/date";
import { toUserID } from "../../utils/userId";

const HEAD = "h-10 border-b border-[#b9ab90] bg-[#4a3a2a] px-4 py-0 text-[13px] font-semibold whitespace-nowrap text-[#f3ede0]";
const SECTION_TITLE = "font-serif text-xl font-semibold text-[#2b2118]";
const FRAME = "mt-3 overflow-x-auto rounded-[4px] border border-[#b9ab90] bg-white";
const VCELL = "border-b border-[#d9cfba] px-4 py-2 align-middle";
const isDone = (v) => v.TrangThai === "Đã tiêm";

// "Sức khỏe" của Chủ ngựa — CHỈ XEM, ngựa có HORSE.OwnerID = người đang đăng nhập. KHÔNG có chẩn đoán / phác đồ / bệnh án.
// Khối 1 "Tình trạng hiện tại": mỗi ngựa 1 hàng (sức khỏe, có thể thi đấu không, mũi tiêm tiếp theo).
// Khối 2 "Lịch tiêm phòng": mọi mũi tiêm của các ngựa, ngày tăng dần; mũi đã tiêm xếp sau cùng.
export default function OwnerHealth() {
  const { user } = useAuth();
  const ownerId = toUserID(user.id);

  const [horses, setHorses] = useState([]);
  const [healthByHorse, setHealthByHorse] = useState({});
  const [lockByHorse, setLockByHorse] = useState({});
  const [vaccinations, setVaccinations] = useState([]);
  const [loading, setLoading] = useState(true);

  // TODO: thay bằng gọi API thật khi BE xong (hiện đọc từ mock ownerService)
  useEffect(() => {
    let ignore = false;
    (async () => {
      const horseList = await getOwnerHorses(ownerId);
      const ids = horseList.map((h) => h.HorseID);
      const [healthList, locks, vaccineList] = await Promise.all([getHealthStatuses(), getActiveLockDates(ids), getOwnerVaccinations(ids)]);
      if (ignore) return;
      setHorses(horseList);
      setHealthByHorse(Object.fromEntries(healthList.map((h) => [h.HorseID, h])));
      setLockByHorse(locks);
      setVaccinations(vaccineList);
      setLoading(false);
    })();
    return () => {
      ignore = true;
    };
  }, [ownerId]);

  const horseName = (horseId) => horses.find((h) => h.HorseID === horseId)?.Ten ?? `Ngựa #${horseId}`;
  // vaccinations đã sắp NgayHen tăng dần: mũi chưa tiêm trước, đã tiêm sau cùng (mỗi nhóm vẫn theo ngày tăng dần)
  const schedule = [...vaccinations.filter((v) => !isDone(v)), ...vaccinations.filter(isDone)];

  return (
    <div className="mx-auto w-full max-w-[1180px] md:px-8">
      <div>
        <h1 className="font-serif text-[30px] leading-tight font-semibold tracking-tight text-[#2b2118]">Sức khỏe</h1>
        <p className="mt-1 text-sm text-[#4a3f33]">Tình trạng và lịch tiêm phòng của ngựa bạn.</p>
      </div>

      {loading ? (
        <LoadingState />
      ) : horses.length === 0 ? (
        <div className="mt-6 rounded-[4px] border border-[#d9cfba] bg-white py-16 text-center">
          <p className="font-serif text-lg font-semibold text-[#2b2118]">Chưa có ngựa nào gắn với tài khoản của bạn</p>
          <p className="mt-1.5 text-sm text-[#4a3f33]">Liên hệ Quản lý CLB để được thêm ngựa vào hồ sơ.</p>
        </div>
      ) : (
        <>
          <section aria-label="Tình trạng hiện tại" className="mt-8">
            <h2 className={SECTION_TITLE}>Tình trạng hiện tại</h2>
            <div className={FRAME}>
              <table className="w-full min-w-[720px] border-separate border-spacing-0 text-left text-sm">
                <thead>
                  <tr>
                    <th className={HEAD}>Ngựa</th>
                    <th className={HEAD}>Sức khỏe</th>
                    <th className={HEAD}>Thi đấu</th>
                    <th className={HEAD}>Tiêm tiếp theo</th>
                  </tr>
                </thead>
                <tbody className="[&>tr:last-child>td]:border-b-0">
                  {horses.map((horse) => (
                    <OwnerHealthRow
                      key={horse.HorseID}
                      horse={horse}
                      health={healthByHorse[horse.HorseID]}
                      lock={lockByHorse[horse.HorseID]}
                      nextVaccine={vaccinations.find((v) => v.HorseID === horse.HorseID && !isDone(v))}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section aria-label="Lịch tiêm phòng" className="mt-8">
            <h2 className={SECTION_TITLE}>Lịch tiêm phòng</h2>
            {schedule.length === 0 ? (
              <p className="mt-3 text-sm text-[#4a3f33]">Chưa có lịch tiêm nào.</p>
            ) : (
              <div className={FRAME}>
                <table className="w-full min-w-[640px] border-separate border-spacing-0 text-left text-sm">
                  <thead>
                    <tr>
                      <th className={HEAD}>Ngày</th>
                      <th className={HEAD}>Vắc-xin</th>
                      <th className={HEAD}>Ngựa</th>
                      <th className={`${HEAD} text-right`}>Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="[&>tr:last-child>td]:border-b-0">
                    {schedule.map((v) => {
                      // Quá hạn: chữ ba cột đầu dịu đi (#6b6055), không tô nền / gạch ngang; còn lại chữ mực
                      const overdue = !isDone(v) && getVaccineState(v) === "Quá hạn";
                      const text = overdue ? "text-[#6b6055]" : "text-[#2b2118]";
                      return (
                        <tr key={v.ScheduleID} className="h-11 transition-colors hover:bg-[#f0efec]">
                          <td className={`${VCELL} w-[140px] text-[15px] whitespace-nowrap tabular-nums ${text}`}>{formatDate(v.NgayHen)}</td>
                          <td className={`${VCELL} text-[15px] font-medium whitespace-nowrap ${text}`}>{v.Loai}</td>
                          <td className={`${VCELL} text-[15px] whitespace-nowrap ${overdue ? "text-[#6b6055]" : "text-[#4a3f33]"}`}>{horseName(v.HorseID)}</td>
                          <td className={`${VCELL} text-right whitespace-nowrap`}>
                            <OwnerVaccineStatus vaccination={v} className="text-sm font-medium" />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <p className="border-t border-[#d9cfba] px-4 py-3 text-sm text-[#4a3f33] tabular-nums">
                  Hiển thị {schedule.length} / {vaccinations.length} lịch tiêm
                </p>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
