import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import LoadingState from "../../components/LoadingState";
import Toast from "../../components/Toast";
import RaceRegistrationDialog from "../../components/RaceRegistrationDialog";
import RaceDetailDialog from "./RaceDetailDialog";
import RaceInfoDialog from "./RaceInfoDialog";
import RaceListTable from "./RaceListTable";
import {
  cancelRaceRegistration,
  getActiveTrainingLocks,
  getHealthStatuses,
  getHorses,
  getRaceRegistrations,
  getRaces,
} from "../../services/trainerService";
import { buildDirectRegistration, listRaceRegistrations, subscribeRaceRegistrations, syncPendingRegistrations } from "../../services/raceRegistrationMock";
import { formatDayMonth, todayISO } from "../../utils/date";
import { RR_STATUS } from "../../utils/raceRegistration";
import { isResultComplete } from "../../utils/raceResult";
import useAuth from "../../hooks/useAuth";

const TABS = [
  { code: "upcoming", label: "Sắp tới" },
  { code: "past", label: "Đã diễn ra" },
];

// Kết quả thi đấu (/trainer/races): bảng theo giải — xem ngựa nào đã đăng ký giải nào và nhập kết quả sau giải.
// KHÔNG đăng ký trực tiếp ở đây: đăng ký thực hiện ở /trainer/race-registrations (luồng Chủ ngựa → Quản lý duyệt).
// Tab Sắp tới: bấm "Xem" → khung danh sách ngựa của giải, vẫn cho hủy đăng ký (không cần duyệt — cần khi ngựa bị khóa tập).
// Tab Đã diễn ra: bấm "Xem kết quả" → khung thứ hạng + tiền thưởng (CHỈ ĐỌC — kết quả do Quản lý CLB nhập ở /manager/race-results).
// Cảnh báo khóa tập: ngựa đang khóa mà còn đăng ký giải sắp tới → dải cảnh báo, "Xử lý" mở khung của giải đó.
export default function Races() {
  const today = todayISO();
  const [races, setRaces] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [horses, setHorses] = useState([]);
  const [locks, setLocks] = useState([]);
  const [healthByHorse, setHealthByHorse] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [tab, setTab] = useState("upcoming");
  const [keyword, setKeyword] = useState(new URLSearchParams(window.location.search).get("q") ?? "");
  const [openRaceId, setOpenRaceId] = useState(null);
  const [infoRaceId, setInfoRaceId] = useState(null); // khung "Thông tin giải"
  const navigate = useNavigate();
  const [allFlowRegs, setAllFlowRegs] = useState([]); // mọi bản ghi trong luồng duyệt của Trainer (MOCK) — để dựng chi tiết đăng ký của từng ngựa
  const [horseView, setHorseView] = useState(null); // { raceId, horseId, fromRace } — đang xem chi tiết đăng ký của 1 ngựa; fromRace: mở từ trong khung giải
  const { user } = useAuth();
  const [pendingRegs, setPendingRegs] = useState([]); // đăng ký của Trainer chưa Approved (Nháp / chờ chủ ngựa / chờ quản lý) — MOCK, chỉ để biết
  const [toast, setToast] = useState(null); // { text, error }
  const closeToast = useCallback(() => setToast(null), []);

  useEffect(() => {
    let ignore = false;
    // Trước hết đồng bộ các đăng ký đã duyệt mà chưa có đăng ký thật (chạy bằng quyền Trainer), rồi mới tải danh sách giải
    syncPendingRegistrations()
      .catch(() => ({ synced: 0, failed: 0 }))
      .then((sync) =>
        Promise.all([getRaces(), getRaceRegistrations(), getHorses(), getActiveTrainingLocks(), getHealthStatuses()]).then((data) => [data, sync])
      )
      .then(([[raceList, regList, horseList, lockList, healthList], sync]) => {
        if (ignore) return;
        if (sync.synced > 0) setToast({ text: `Đã đồng bộ ${sync.synced} đăng ký` });
        setRaces(raceList);
        setRegistrations(regList);
        setHorses(horseList);
        setLocks(lockList);
        setHealthByHorse(Object.fromEntries(healthList.map((h) => [h.HorseID, h.TrangThai])));
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

  // Đăng ký đang trong luồng duyệt: không tính vào danh sách ngựa / "Số ngựa" của giải, chỉ nhắc để Trainer không tưởng bị mất
  useEffect(() => {
    const loadPending = async () => {
      const list = await listRaceRegistrations("head_trainer");
      setAllFlowRegs(list);
      setPendingRegs(list.filter((r) => [RR_STATUS.DRAFT, RR_STATUS.PENDING_OWNER, RR_STATUS.PENDING_MANAGER].includes(r.status)));
    };
    loadPending();
    return subscribeRaceRegistrations(loadPending);
  }, []);
  const pendingOfRace = (raceId) => pendingRegs.filter((r) => Number(r.raceId) === Number(raceId));

  const horseName = (horseId) => horses.find((h) => h.HorseID === horseId)?.Ten ?? `Ngựa #${horseId}`;
  const lockedHorseIds = new Set(locks.map((l) => l.HorseID));
  const regsOfRace = (raceId) => registrations.filter((r) => r.RaceID === raceId);

  // Sắp tới: ngày tăng dần; đã diễn ra: mới nhất trước. Tìm theo tên giải hoặc tên ngựa đã đăng ký.
  const normalizedKeyword = keyword.trim().toLowerCase();
  const rows = races
    .filter((race) => (tab === "upcoming" ? race.Ngay >= today : race.Ngay < today))
    .sort((a, b) => (tab === "upcoming" ? a.Ngay.localeCompare(b.Ngay) : b.Ngay.localeCompare(a.Ngay)))
    .map((race) => ({ race, regs: regsOfRace(race.RaceID), pendingCount: pendingOfRace(race.RaceID).length }))
    .filter(
      ({ race, regs }) =>
        !normalizedKeyword ||
        race.TenGiai.toLowerCase().includes(normalizedKeyword) ||
        regs.some((r) => horseName(r.HorseID).toLowerCase().includes(normalizedKeyword))
    );

  // Ngựa đang khóa tập nhưng còn đăng ký giải sắp tới → nhắc xử lý (hệ thống không tự rút)
  const lockConflicts = registrations
    .filter((r) => lockedHorseIds.has(r.HorseID))
    .map((r) => ({ reg: r, race: races.find((race) => race.RaceID === r.RaceID) }))
    .filter(({ race }) => race && race.Ngay >= today)
    .sort((a, b) => a.race.Ngay.localeCompare(b.race.Ngay));

  const openRace = races.find((r) => r.RaceID === openRaceId) ?? null;

  // Chi tiết đăng ký của 1 ngựa: dùng bản ghi trong luồng duyệt nếu có (đã Approved), không thì dựng từ đăng ký thật (đăng ký cũ)
  const horseViewRace = horseView ? races.find((r) => r.RaceID === horseView.raceId) : null;
  const horseViewReg = horseView ? registrations.find((r) => r.RaceID === horseView.raceId && r.HorseID === horseView.horseId) : null;
  const horseViewRecord =
    horseViewRace && horseViewReg
      ? (allFlowRegs.find(
          (r) => Number(r.raceId) === horseView.raceId && Number(r.horseId) === horseView.horseId && r.status === RR_STATUS.APPROVED
        ) ?? buildDirectRegistration(horseViewRace, horseViewReg, horseName(horseView.horseId)))
      : null;
  const openHorse = (raceId, horseId, fromRace) => {
    setOpenRaceId(null);
    setHorseView({ raceId, horseId, fromRace });
  };
  // "Quay lại giải": đóng khung ngựa, mở lại khung giải
  const backToRace = () => {
    setOpenRaceId(horseView.raceId);
    setHorseView(null);
  };

  const handleCancelRegistration = async (reg) => {
    try {
      await cancelRaceRegistration(reg.RaceID, reg.HorseID);
      setRegistrations((prev) => prev.filter((r) => !(r.RaceID === reg.RaceID && r.HorseID === reg.HorseID)));
      setToast({ text: "Đã hủy đăng ký" });
    } catch (err) {
      setToast({ text: err.message, error: true });
    }
  };

  return (
    <div className="mx-auto max-w-[1400px]">
      <h1 className="font-serif text-[28px] leading-tight font-semibold tracking-tight text-[#2b2118]">Kết quả thi đấu</h1>
      <p className="mt-1 text-sm text-[#6b6055]">Theo dõi kết quả thi đấu của ngựa do bạn huấn luyện.</p>
      <p className="mt-0.5 mb-4 text-[13px] text-[#6b6055]">
        Đăng ký thi đấu thực hiện tại mục{" "}
        <Link to="/trainer/race-registrations" className="font-semibold text-[#c2570c] hover:underline">
          Đăng ký thi đấu
        </Link>
        .
      </p>

      {loading ? (
        <LoadingState />
      ) : loadError ? (
        <p className="border-l-2 border-[#c0262d] bg-[#c0262d]/5 px-4 py-3 text-sm text-[#c0262d]">{loadError}</p>
      ) : (
        <>
          {/* Tab bên trái (gạch chân cam, chữ #1f1f1f), ô tìm kiếm bên phải */}
          <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 border-b border-[#E3E3E3]">
            <div role="tablist" aria-label="Thời điểm giải đua" className="flex gap-6">
              {TABS.map((item) => (
                <button
                  key={item.code}
                  type="button"
                  role="tab"
                  aria-selected={tab === item.code}
                  onClick={() => setTab(item.code)}
                  className={`-mb-px cursor-pointer border-b-2 pb-2.5 text-sm text-[#1f1f1f] transition-colors ${
                    tab === item.code ? "border-[#c2570c] font-semibold" : "border-transparent font-medium hover:border-[#E3E3E3]"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div className="relative w-full pb-2.5 sm:w-[300px]">
              <label htmlFor="raceKeyword" className="sr-only">
                Tìm theo tên ngựa hoặc tên giải
              </label>
              <Search className="pointer-events-none absolute top-[18px] left-3 h-4 w-4 -translate-y-1/2 text-[#6b6b6b]" aria-hidden="true" />
              <input
                id="raceKeyword"
                type="search"
                placeholder="Tìm theo tên ngựa hoặc tên giải"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="h-9 w-full rounded-[4px] border border-[#E3E3E3] bg-white pr-3 pl-9 text-sm text-[#1f1f1f] outline-none transition-colors placeholder:text-[#6b6b6b]/70 focus:border-[#c2570c]"
              />
            </div>
          </div>

          {tab === "upcoming" && lockConflicts.length > 0 && (
            <ul className="mt-4 space-y-2">
              {lockConflicts.map(({ reg, race }) => (
                <li
                  key={`${reg.HorseID}|${reg.RaceID}`}
                  className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-[4px] border border-[#E3E3E3] border-l-[3px] border-l-[#9e5954] bg-white px-4 py-2.5 text-sm text-[#1f1f1f]"
                >
                  <span>
                    <b className="font-semibold">{horseName(reg.HorseID)}</b> đang khóa tập, đã đăng ký {race.TenGiai} ({formatDayMonth(race.Ngay)})
                  </span>
                  <button type="button" onClick={() => setOpenRaceId(race.RaceID)} className="cursor-pointer font-semibold text-[#c2570c] hover:underline">
                    Xử lý
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-4">
            <RaceListTable
              key={tab}
              rows={rows}
              tab={tab}
              horseName={horseName}
              lockedHorseIds={lockedHorseIds}
              onOpen={setOpenRaceId}
              onOpenInfo={setInfoRaceId}
              onOpenHorse={(raceId, horseId) => openHorse(raceId, horseId, false)}
              emptyText={
                normalizedKeyword ? "Không tìm thấy giải nào khớp." : tab === "upcoming" ? "Chưa có giải đua sắp tới." : "Chưa có giải đua nào đã diễn ra."
              }
            />
          </div>
        </>
      )}

      {openRace && (
        <RaceDetailDialog
          key={openRace.RaceID}
          race={openRace}
          regs={regsOfRace(openRace.RaceID)}
          pendingRegs={pendingOfRace(openRace.RaceID)}
          horseName={horseName}
          lockedHorseIds={lockedHorseIds}
          healthByHorse={healthByHorse}
          onClose={() => setOpenRaceId(null)}
          onOpenHorse={(raceId, horseId) => openHorse(raceId, horseId, true)}
          onOpenInfo={(raceId) => {
            setOpenRaceId(null);
            setInfoRaceId(raceId);
          }}
          onCancelRegistration={handleCancelRegistration}
        />
      )}
      {infoRaceId != null && races.find((r) => r.RaceID === infoRaceId) && (
        <RaceInfoDialog
          race={races.find((r) => r.RaceID === infoRaceId)}
          horseCount={regsOfRace(infoRaceId).length}
          onRegister={(raceId) => navigate(`/trainer/race-registrations?race=${raceId}`)}
          onClose={() => setInfoRaceId(null)}
        />
      )}

      {horseViewRecord && (
        <RaceRegistrationDialog
          key={`${horseView.raceId}-${horseView.horseId}`}
          record={horseViewRecord}
          role="head_trainer"
          userName={user.fullName}
          readOnly
          result={horseViewRace.Ngay < today ? { hasResult: isResultComplete(horseViewReg), thuHang: horseViewReg.ThuHang, tienThuong: horseViewReg.TienThuong } : null}
          onBack={horseView.fromRace ? backToRace : undefined}
          onClose={() => setHorseView(null)}
          onChanged={() => setHorseView(null)}
        />
      )}
      <Toast toast={toast} onClose={closeToast} />
    </div>
  );
}
