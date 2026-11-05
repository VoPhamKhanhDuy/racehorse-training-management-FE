import { useEffect, useState } from "react";
import TablePager from "../../components/TablePager";
import RaceInfoDialog from "./RaceInfoDialog";
import { getRaceRegistrations } from "../../services/raceService";
import { getRaceOptions } from "../../services/raceRegistrationMock";
import { formatCurrency } from "../../utils/currency";
import { formatDate, todayISO } from "../../utils/date";

const PAGE_SIZE = 10;
const TH = "border-r border-[#E3E3E3] px-[14px] text-[13px] font-semibold text-[#1f1f1f] last:border-r-0";
const TD = "border-r border-b border-[#E3E3E3] px-[14px] py-3 align-middle text-sm text-[#1f1f1f] last:border-r-0";

// Tab "Giải đang mở" của trang Đăng ký thi đấu (Trainer): các giải còn hạn đăng ký. Tên giải là link mở "Thông tin giải";
// "Đăng ký ngựa" mở khung Tạo đăng ký với giải đã chọn sẵn (onRegister).
export default function OpenRaceTable({ onRegister }) {
  const [races, setRaces] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [infoRaceId, setInfoRaceId] = useState(null);

  useEffect(() => {
    let ignore = false;
    Promise.all([getRaceOptions(), getRaceRegistrations().catch(() => [])])
      .then(([raceList, regList]) => {
        if (ignore) return;
        setRaces(raceList.filter((r) => r.registrationDeadline >= todayISO() && r.Ngay >= todayISO()).sort((a, b) => a.Ngay.localeCompare(b.Ngay)));
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
    return <div className="rounded-[4px] border border-[#E3E3E3] bg-white py-12 text-center text-sm text-[#6b6b6b]">Hiện không có giải nào đang mở đăng ký.</div>;
  }

  const pageCount = Math.max(1, Math.ceil(races.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const offset = (currentPage - 1) * PAGE_SIZE;
  const infoRace = races.find((r) => r.RaceID === infoRaceId) ?? null;

  return (
    <div className="overflow-hidden rounded-[4px] border border-[#E3E3E3] bg-white">
      <table className="w-full table-fixed border-collapse text-left">
        <colgroup>
          <col style={{ width: "6%" }} className="max-[899px]:hidden" />
          <col style={{ width: "30%" }} />
          <col style={{ width: "14%" }} />
          <col style={{ width: "16%" }} />
          <col style={{ width: "16%" }} />
          <col style={{ width: "18%" }} />
        </colgroup>
        <thead>
          <tr className="h-11 border-b border-[#E3E3E3] bg-[#F5F5F5]">
            <th className={`${TH} text-center max-[899px]:hidden`}>STT</th>
            <th className={TH}>Giải đấu</th>
            <th className={TH}>Ngày</th>
            <th className={TH}>Hạn đăng ký</th>
            <th className={TH}>Lệ phí</th>
            <th className={`${TH} text-center`}>Thao tác</th>
          </tr>
        </thead>
        <tbody className="[&>tr:last-child>td]:border-b-0">
          {races.slice(offset, offset + PAGE_SIZE).map((race, index) => (
            <tr key={race.RaceID} className="h-14 bg-white">
              <td className={`${TD} text-center text-[#6b6b6b] tabular-nums max-[899px]:hidden`}>{offset + index + 1}</td>
              <td className={TD}>
                <button
                  type="button"
                  onClick={() => setInfoRaceId(race.RaceID)}
                  title={race.TenGiai}
                  className="block max-w-full cursor-pointer truncate text-left font-semibold text-[#1f1f1f] hover:underline"
                >
                  {race.TenGiai}
                </button>
                <span className="block truncate text-xs text-[#6b6b6b]" title={race.DiaDiem}>
                  {race.DiaDiem}
                </span>
              </td>
              <td className={`${TD} whitespace-nowrap tabular-nums`}>{formatDate(race.Ngay)}</td>
              <td className={`${TD} whitespace-nowrap tabular-nums`}>{formatDate(race.registrationDeadline)}</td>
              <td className={`${TD} whitespace-nowrap tabular-nums`}>{race.entryFee != null ? formatCurrency(race.entryFee) : "Chưa cập nhật"}</td>
              <td className={`${TD} text-center`}>
                <button
                  type="button"
                  onClick={() => onRegister(race.RaceID)}
                  className="cursor-pointer text-sm font-semibold whitespace-nowrap text-[#c2570c] hover:underline"
                >
                  Đăng ký ngựa
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <TablePager page={currentPage} pageCount={pageCount} total={races.length} pageSize={PAGE_SIZE} unit="giải" onPage={setPage} />

      {infoRace && (
        <RaceInfoDialog
          race={infoRace}
          horseCount={registrations.filter((r) => r.RaceID === infoRace.RaceID).length}
          onRegister={(raceId) => {
            setInfoRaceId(null);
            onRegister(raceId);
          }}
          onClose={() => setInfoRaceId(null)}
        />
      )}
    </div>
  );
}
