import { useEffect, useState } from "react";
import TablePager from "../../components/TablePager";
import RaceInfoDialog from "../trainer/RaceInfoDialog";
import { getRaceRegistrations, getRaces } from "../../services/raceService";
import { formatCurrency } from "../../utils/currency";
import { formatDate, todayISO } from "../../utils/date";
import { canCancelRace, isCancelledRace, raceStatusLabel } from "../../utils/raceStatus";

const PAGE_SIZE = 10;
const TH = "border-r border-[#E3E3E3] px-[14px] text-[13px] font-semibold text-[#1f1f1f] last:border-r-0";
const TD = "border-r border-b border-[#E3E3E3] px-[14px] py-3 align-middle text-sm text-[#1f1f1f] last:border-r-0";

// Tab "Giải đua" của Quản lý CLB (trang Đăng ký thi đấu): mọi giải, mới nhất trước, kể cả giải đã hủy (nhãn "Đã hủy", không còn thao tác).
// "Hủy giải" gọi onCancel(race); tải lại khi trang cha đổi key (sau khi tạo / hủy giải).
export default function ManagerRaceTable({ onCancel }) {
  const [races, setRaces] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [infoRaceId, setInfoRaceId] = useState(null);
  const today = todayISO();

  useEffect(() => {
    let ignore = false;
    Promise.all([getRaces(), getRaceRegistrations().catch(() => [])])
      .then(([raceList, regList]) => {
        if (ignore) return;
        setRaces([...raceList].sort((a, b) => b.Ngay.localeCompare(a.Ngay)));
        setRegistrations(regList);
        setLoading(false);
      })
      .catch((err) => {
        if (ignore) return;
        setError(err.message || "Không tải được danh sách giải.");
        setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, []);

  if (loading) return <p className="py-10 text-center text-sm text-[#6b6b6b]">Đang tải...</p>;
  if (error) return <p className="border-l-2 border-rust bg-rust/5 px-4 py-3 text-sm text-rust">{error}</p>;
  if (races.length === 0) {
    return <div className="rounded-[4px] border border-[#E3E3E3] bg-white py-12 text-center text-sm text-[#6b6b6b]">Chưa có giải nào. Bấm "Tạo giải" để thêm giải đầu tiên.</div>;
  }

  const pageCount = Math.max(1, Math.ceil(races.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const offset = (currentPage - 1) * PAGE_SIZE;
  const infoRace = races.find((r) => r.RaceID === infoRaceId) ?? null;

  return (
    <div className="overflow-hidden rounded-[4px] border border-[#E3E3E3] bg-white">
      <table className="w-full table-fixed border-collapse text-left">
        <colgroup>
          <col style={{ width: "34%" }} />
          <col style={{ width: "13%" }} />
          <col style={{ width: "14%" }} />
          <col style={{ width: "15%" }} />
          <col style={{ width: "14%" }} />
          <col style={{ width: "10%" }} />
        </colgroup>
        <thead>
          <tr className="h-11 border-b border-[#E3E3E3] bg-[#F5F5F5]">
            <th className={TH}>Giải đấu</th>
            <th className={TH}>Ngày</th>
            <th className={TH}>Hạn đăng ký</th>
            <th className={TH}>Lệ phí</th>
            <th className={TH}>Trạng thái</th>
            <th className={`${TH} text-center`}>Thao tác</th>
          </tr>
        </thead>
        <tbody className="[&>tr:last-child>td]:border-b-0">
          {races.slice(offset, offset + PAGE_SIZE).map((race) => {
            const cancelled = isCancelledRace(race);
            const td = cancelled ? TD.replace("text-[#1f1f1f]", "text-[#8a8a8a]") : TD; // giải đã hủy: cả hàng chữ xám nhạt
            return (
              <tr key={race.RaceID} className={`h-14 ${cancelled ? "bg-[#FAFAFA] text-[#6b6b6b]" : "bg-white"}`}>
                <td className={td}>
                  <button
                    type="button"
                    onClick={() => setInfoRaceId(race.RaceID)}
                    title={race.TenGiai}
                    className={`block max-w-full cursor-pointer truncate text-left font-semibold hover:underline ${cancelled ? "text-[#6b6b6b]" : "text-[#1f1f1f]"}`}
                  >
                    {race.TenGiai}
                  </button>
                  <span className="block truncate text-xs text-[#6b6b6b]" title={race.DiaDiem}>
                    {race.DiaDiem}
                  </span>
                </td>
                <td className={`${td} whitespace-nowrap tabular-nums`}>{formatDate(race.Ngay)}</td>
                <td className={`${td} whitespace-nowrap tabular-nums`}>{formatDate(race.registrationDeadline)}</td>
                <td className={`${td} whitespace-nowrap tabular-nums`}>{race.entryFee != null ? formatCurrency(race.entryFee) : "Chưa cập nhật"}</td>
                <td className={td}>
                  <span className={cancelled ? "font-semibold text-[#b3473f]" : ""}>{raceStatusLabel(race, today)}</span>
                </td>
                <td className={`${td} text-center`}>
                  {canCancelRace(race, today) && (
                    <button
                      type="button"
                      onClick={() => onCancel(race)}
                      className="cursor-pointer text-sm font-semibold whitespace-nowrap text-[#b3473f] hover:underline"
                    >
                      Hủy giải
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <TablePager page={currentPage} pageCount={pageCount} total={races.length} pageSize={PAGE_SIZE} unit="giải" onPage={setPage} />

      {infoRace && (
        <RaceInfoDialog
          race={infoRace}
          horseCount={registrations.filter((r) => r.RaceID === infoRace.RaceID).length}
          onClose={() => setInfoRaceId(null)}
        />
      )}
    </div>
  );
}
