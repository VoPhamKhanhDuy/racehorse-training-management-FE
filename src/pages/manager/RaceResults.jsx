import { useCallback, useEffect, useState } from "react";
import { Search } from "lucide-react";
import LoadingState from "../../components/LoadingState";
import Toast from "../../components/Toast";
import useAuth from "../../hooks/useAuth";
import RaceInfoDialog from "../trainer/RaceInfoDialog";
import RaceListTable from "../trainer/RaceListTable";
import RaceResultDialog from "./RaceResultDialog";
import { addAuditLog } from "../../services/auditService";
import { getHorses } from "../../services/horseService";
import { ApiError } from "../../services/apiClient";
import {
  getRaceRegistrations,
  getRaces,
  setRaceRegistrationPrize,
  syncLocalRaceResults,
  updateRaceResult,
} from "../../services/raceService";
import { saveLocalResult } from "../../services/raceResultMock";
import { formatCurrency } from "../../utils/currency";
import { todayISO } from "../../utils/date";
import { formatRank } from "../../utils/raceResult";
import { toUserID } from "../../utils/userId";

// Quản lý CLB > Kết quả thi đấu: NƠI DUY NHẤT nhập / sửa thứ hạng + tiền thưởng của giải đã diễn ra (HLV chỉ xem ở /trainer/races).
// Bảng giải đã diễn ra (mới nhất trước) dùng chung RaceListTable với phía HLV; "Nhập kết quả" mở RaceResultDialog.
// Cột Kết quả "Đã nhập a/b" chỉ tính ngựa có hạng đã lưu đủ (hạng 1–3 phải kèm tiền thưởng). Mỗi lần lưu ghi nhật ký (AUDITLOG).
// Dùng API thật /api/races (updateRaceResult, setRaceRegistrationPrize).
// TODO(BE): Tạm thời, chờ BE cấp quyền cho endpoint lưu kết quả; xóa fallback khi xong. Hiện PUT .../result và .../prize trả 403 với cả Trainer lẫn Manager
// → kết quả được lưu cục bộ (services/raceResultMock.js, syncedToBE:false), coi như lưu thành công và tự thử đồng bộ lại mỗi lần mở trang.
// Lỗi khác 403 (400, 500…) vẫn báo như cũ.
export default function RaceResults() {
  const { user } = useAuth();
  const managerId = toUserID(user.id);
  const today = todayISO();
  const [races, setRaces] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [horses, setHorses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [keyword, setKeyword] = useState("");
  const [openRaceId, setOpenRaceId] = useState(null);
  const [infoRaceId, setInfoRaceId] = useState(null);
  const [toast, setToast] = useState(null);
  const closeToast = useCallback(() => setToast(null), []);

  useEffect(() => {
    let ignore = false;
    // Đồng bộ lại kết quả đã lưu cục bộ (do 403) trước khi tải
    syncLocalRaceResults()
      .catch(() => null)
      .then(() =>
        Promise.all([getRaces(), getRaceRegistrations(), getHorses()]),
      )
      .then(([raceList, regList, horseList]) => {
        if (ignore) return;
        setRaces(raceList);
        setRegistrations(regList);
        setHorses(horseList);
        setLoading(false);
      })
      .catch((err) => {
        if (ignore) return;
        setLoadError(err.message || "Không tải được danh sách giải đua.");
        setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, []);

  const horseName = (horseId) =>
    horses.find((h) => h.HorseID === horseId)?.Ten ?? `Ngựa #${horseId}`;
  const regsOfRace = (raceId) =>
    registrations.filter((r) => r.RaceID === raceId);

  const normalizedKeyword = keyword.trim().toLowerCase();
  const rows = races
    .filter((race) => race.Ngay < today)
    .sort((a, b) => b.Ngay.localeCompare(a.Ngay))
    .map((race) => ({ race, regs: regsOfRace(race.RaceID) }))
    .filter(
      ({ race, regs }) =>
        !normalizedKeyword ||
        race.TenGiai.toLowerCase().includes(normalizedKeyword) ||
        regs.some((r) =>
          horseName(r.HorseID).toLowerCase().includes(normalizedKeyword),
        ),
    );

  const openRace = races.find((r) => r.RaceID === openRaceId) ?? null;

  // Lưu kết quả 1 ngựa: hạng rồi tiền thưởng (hạng 1–3). Hạng đã lưu mà tiền thưởng lỗi → ném lỗi kèm partial để bảng cập nhật đúng thực tế.
  const saveResult = async (race, reg, rank, prize) => {
    try {
      return await saveResultToBE(race, reg, rank, prize);
    } catch (err) {
      if (!(err instanceof ApiError && err.status === 403) && !err.forbidden)
        throw err;
      saveLocalResult({
        raceId: race.RaceID,
        horseId: reg.HorseID,
        thuHang: rank,
        tienThuong: prize,
      });
      addAuditLog({
        UserID: managerId,
        HanhDong: `Lưu cục bộ kết quả thi đấu: ${race.TenGiai} – ${horseName(reg.HorseID)} ${formatRank(rank) || "chưa có kết quả"}`,
        TargetTable: "RACEREGISTRATION",
        TargetID: race.RaceID,
        targetLabel: horseName(reg.HorseID),
      });
      return { ...reg, ThuHang: rank, TienThuong: prize, localOnly: true };
    }
  };

  const saveResultToBE = async (race, reg, rank, prize) => {
    const { registration } = await updateRaceResult(
      race.RaceID,
      reg.HorseID,
      rank,
    );
    addAuditLog({
      UserID: managerId,
      HanhDong: `Cập nhật kết quả thi đấu: ${race.TenGiai} – ${horseName(reg.HorseID)} ${formatRank(rank) || "chưa có kết quả"}`,
      TargetTable: "RACEREGISTRATION",
      TargetID: race.RaceID,
      targetLabel: horseName(reg.HorseID),
    });
    if (prize === null) return registration;
    try {
      const saved = await setRaceRegistrationPrize(
        race.RaceID,
        reg.HorseID,
        prize,
      );
      addAuditLog({
        UserID: managerId,
        HanhDong: `Nhập tiền thưởng ${race.TenGiai} – ${horseName(reg.HorseID)} ${formatCurrency(prize)}`,
        TargetTable: "RACEREGISTRATION",
        TargetID: race.RaceID,
        targetLabel: horseName(reg.HorseID),
      });
      return saved;
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        const forbidden = new Error(err.message);
        forbidden.forbidden = true;
        throw forbidden;
      }
      const failure = new Error(
        `Đã lưu hạng của ${horseName(reg.HorseID)} nhưng chưa lưu được tiền thưởng: ${err.message || "lỗi không rõ"}. Bấm Lưu để thử lại.`,
      );
      failure.partial = registration;
      throw failure;
    }
  };

  const handleSaved = (updated, text) => {
    setRegistrations((prev) =>
      prev.map(
        (r) =>
          updated.find(
            (u) => u.RaceID === r.RaceID && u.HorseID === r.HorseID,
          ) ?? r,
      ),
    );
    if (text) {
      setOpenRaceId(null);
      setToast({ text });
    }
  };

  return (
    <div className="mx-auto max-w-[1400px]">
      <h1 className="font-serif text-[28px] leading-tight font-semibold tracking-tight text-[#2b2118]">
        Kết quả thi đấu
      </h1>
      <p className="mt-1 mb-4 text-sm text-[#6b6055]">
        Nhập thứ hạng và tiền thưởng cho các giải đã diễn ra. Huấn luyện viên và
        chủ ngựa xem được kết quả.
      </p>

      {loading ? (
        <LoadingState />
      ) : loadError ? (
        <p className="border-l-2 border-[#c0262d] bg-[#c0262d]/5 px-4 py-3 text-sm text-[#c0262d]">
          {loadError}
        </p>
      ) : (
        <>
          <div className="flex justify-end">
            <div className="relative w-full sm:w-[300px]">
              <label htmlFor="resultKeyword" className="sr-only">
                Tìm theo tên ngựa hoặc tên giải
              </label>
              <Search
                className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#6b6b6b]"
                aria-hidden="true"
              />
              <input
                id="resultKeyword"
                type="search"
                placeholder="Tìm theo tên ngựa hoặc tên giải"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="h-9 w-full rounded-[4px] border border-[#E3E3E3] bg-white pr-3 pl-9 text-sm text-[#1f1f1f] outline-none transition-colors placeholder:text-[#6b6b6b]/70 focus:border-[#c2570c]"
              />
            </div>
          </div>
          <div className="mt-4">
            <RaceListTable
              rows={rows}
              tab="past"
              horseName={horseName}
              canEnterResult
              onOpen={setOpenRaceId}
              onOpenInfo={setInfoRaceId}
              emptyText={
                normalizedKeyword
                  ? "Không tìm thấy giải nào khớp."
                  : "Chưa có giải đua nào đã diễn ra."
              }
            />
          </div>
        </>
      )}

      {openRace && (
        <RaceResultDialog
          key={openRace.RaceID}
          race={openRace}
          regs={regsOfRace(openRace.RaceID)}
          horseName={horseName}
          saveResult={saveResult}
          onClose={() => setOpenRaceId(null)}
          onSaved={handleSaved}
        />
      )}
      {infoRaceId != null && races.find((r) => r.RaceID === infoRaceId) && (
        <RaceInfoDialog
          race={races.find((r) => r.RaceID === infoRaceId)}
          horseCount={regsOfRace(infoRaceId).length}
          onClose={() => setInfoRaceId(null)}
        />
      )}
      <Toast toast={toast} onClose={closeToast} />
    </div>
  );
}
