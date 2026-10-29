import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import LoadingState from "../../components/LoadingState";
import TabFilter from "../../components/TabFilter";
import HorseProfileRow from "./HorseProfileRow";
import PlanPagination from "./PlanPagination";
import { isInjuryHealth, isReadyHealth } from "../../utils/healthGroups";
import { getActiveTrainingLocks, getHealthStatuses, getHorses, getUsers } from "../../services/trainerService";

// Tab lọc: 3 trạng thái HEALTHSTATUS + ngựa đang khóa tập (TRAININGLOCK chưa gỡ)
const LOCKED_FILTER = "locked";
const FILTERS = [
  { code: "", label: "Tất cả" },
  { code: "Đủ điều kiện", label: "Đủ điều kiện" },
  { code: "Cần theo dõi", label: "Cần theo dõi" },
  { code: "Chấn thương", label: "Chấn thương" },
  { code: "Cách ly", label: "Cách ly" },
  { code: LOCKED_FILTER, label: "Đang khóa tập" },
];

// Hồ sơ ngựa của HLV trưởng — CHỈ XEM: lưới thẻ ảnh (mỗi ngựa 1 thẻ), bấm 1 thẻ để mở hồ sơ
export default function HorseProfiles() {
  const [horses, setHorses] = useState([]);
  const [healthByHorse, setHealthByHorse] = useState({});
  const [lockedHorseIds, setLockedHorseIds] = useState(new Set());
  const [ownerNames, setOwnerNames] = useState({});
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(1); // phân trang phía FE trên mảng đã lọc
  const [pageSize, setPageSize] = useState(10);

  // TODO: thay bằng gọi API thật khi BE xong (hiện đọc từ mock trainerService)
  useEffect(() => {
    let ignore = false;
    Promise.all([getHorses(), getHealthStatuses(), getActiveTrainingLocks(), getUsers()]).then(
      ([horseList, healthList, lockList, userList]) => {
        if (ignore) return;
        setHorses([...horseList].sort((a, b) => a.Ten.localeCompare(b.Ten, "vi")));
        setHealthByHorse(Object.fromEntries(healthList.map((h) => [h.HorseID, h.TrangThai])));
        setLockedHorseIds(new Set(lockList.map((l) => l.HorseID)));
        setOwnerNames(Object.fromEntries(userList.map((u) => [u.UserID, u.HoTen])));
        setLoading(false);
      }
    );
    return () => {
      ignore = true;
    };
  }, []);

  // Tìm theo tên + lọc tab, kết hợp AND
  const normalizedKeyword = keyword.trim().toLowerCase();
  const matchesFilter = (horse, code) => {
    if (!code) return true;
    if (code === LOCKED_FILTER) return lockedHorseIds.has(horse.HorseID);
    const status = healthByHorse[horse.HorseID];
    if (code === "Đủ điều kiện") return isReadyHealth(status);
    if (code === "Chấn thương") return isInjuryHealth(status);
    return status === code;
  };
  const visibleHorses = horses.filter((h) => h.Ten.toLowerCase().includes(normalizedKeyword) && matchesFilter(h, filter));

  // Số lượng nhỏ sau nhãn tab (đếm trên toàn bộ ngựa, không phụ thuộc ô tìm kiếm)
  const tabOptions = FILTERS.map((option) => ({
    ...option,
    label: (
      <>
        {option.label} <span className="text-xs font-normal text-[#6b6055]">{horses.filter((h) => matchesFilter(h, option.code)).length}</span>
      </>
    ),
  }));

  // Phân trang: trang hiện tại luôn nằm trong [1, tổng trang]
  const totalPages = Math.max(1, Math.ceil(visibleHorses.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedHorses = visibleHorses.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="mx-auto max-w-[1200px]">
      <div className="mb-5 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <h1 className="font-serif text-[32px] leading-tight font-semibold tracking-tight text-[#2b2118]">Hồ sơ ngựa</h1>
      </div>

      {loading ? (
        <LoadingState />
      ) : (
        <>
          {/* 1 hàng: tab tình trạng bên trái, tìm kiếm bên phải; đường kẻ chạy hết chiều rộng bên dưới cả hàng */}
          <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2 border-b border-[#d9cfba]">
            {/* Đường kẻ dưới tab cùng màu #d9cfba để không đổi tông sau tab cuối; màn hẹp: tab cuộn ngang */}
            <div className="max-w-full overflow-x-auto max-sm:[&>div]:flex-nowrap max-sm:[&>div]:whitespace-nowrap [&>div]:border-[#d9cfba]">
              <TabFilter
                ariaLabel="Lọc theo tình trạng"
                options={tabOptions}
                value={filter}
                onChange={(code) => {
                  setFilter(code);
                  setPage(1);
                }}
              />
            </div>

            <div className="relative w-full pb-2 sm:w-[260px]">
              <label htmlFor="horseProfileKeyword" className="sr-only">
                Tìm theo tên ngựa
              </label>
              <Search className="pointer-events-none absolute top-[18px] left-3 h-4 w-4 -translate-y-1/2 text-[#6b6055]" />
              <input
                id="horseProfileKeyword"
                type="search"
                placeholder="Tìm theo tên ngựa"
                value={keyword}
                onChange={(e) => {
                  setKeyword(e.target.value);
                  setPage(1);
                }}
                className="h-9 w-full rounded border border-[#cfc4ad] bg-white pr-3 pl-9 text-sm text-[#2b2118] outline-none transition-colors placeholder:text-[#6b6055]/60 focus:border-[#c2570c]"
              />
            </div>
          </div>

          {visibleHorses.length === 0 ? (
            <p className="mt-6 py-10 text-center text-sm text-[#6b6055]">Không tìm thấy ngựa nào khớp.</p>
          ) : (
            <div className="mt-6 grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-5">
              {pagedHorses.map((horse) => (
                <HorseProfileRow
                  key={horse.HorseID}
                  horse={horse}
                  healthStatus={healthByHorse[horse.HorseID]}
                  ownerName={ownerNames[horse.OwnerID]}
                  locked={lockedHorseIds.has(horse.HorseID)}
                />
              ))}
            </div>
          )}

          {/* Chân trang: phân trang dùng chung (trái "Hiển thị x–y trong N con ngựa") */}
          <div className="mt-6 overflow-hidden rounded border border-[#d9cfba]">
            <PlanPagination
              total={visibleHorses.length}
              page={currentPage}
              pageSize={pageSize}
              unit="con ngựa"
              prefix="Hiển thị "
              onPageChange={setPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setPage(1);
              }}
            />
          </div>
        </>
      )}
    </div>
  );
}
