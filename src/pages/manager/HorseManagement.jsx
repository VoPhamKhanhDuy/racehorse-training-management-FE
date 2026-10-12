import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { SearchX } from "lucide-react";
import ConfirmDialog from "../../components/ConfirmDialog";
import LoadingState from "../../components/LoadingState";
import Pagination from "../../components/Pagination";
import HorseCard from "../../components/HorseCard";
import HorseDetailModal from "./HorseDetailModal";
import HorseFilters from "./HorseFilters";
import useAuth from "../../hooks/useAuth";
import { getHealthStatuses, getHorseOwners, getHorses } from "../../services/horseService";
import { deleteHorseIfUnused, getHorseIdsWithRelatedData } from "../../services/horseUsageService";
import { getRaceRegistrations, getRaces } from "../../services/trainerService";
import { getHorseAchievements } from "../../utils/horseAchievements";
import { addAuditLog } from "../../services/auditService";
import { toUserID } from "../../utils/userId";
import { getHorseAge } from "../../utils/date";

// 8 thẻ/trang = 2 hàng khi lưới 4 cột (màn rộng)
const PAGE_SIZE = 8;
const initialFilters = { keyword: "", breed: "", ownerId: "" };

export default function HorseManagement() {
  // Thông báo do HorseForm gửi sang sau khi lưu thành công
  const { state } = useLocation();
  const { user } = useAuth();
  const [horses, setHorses] = useState([]);
  const [owners, setOwners] = useState([]);
  const [healthStatuses, setHealthStatuses] = useState([]);
  const [usedHorseIds, setUsedHorseIds] = useState(new Set()); // ngựa đã có dữ liệu liên quan → không cho xóa
  const [races, setRaces] = useState([]);
  const [registrations, setRegistrations] = useState([]); // RACEREGISTRATION — cho khối "Thành tích thi đấu"
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState(initialFilters);
  const [sort, setSort] = useState({ key: "Ten", direction: "asc" });
  const [page, setPage] = useState(1);
  const [selectedHorse, setSelectedHorse] = useState(null); // ngựa đang xem trong modal chi tiết
  const [horseToDelete, setHorseToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState(state?.message ?? "");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let ignore = false;
    Promise.all([getHorses(), getHorseOwners(), getHealthStatuses(), getHorseIdsWithRelatedData(), getRaces(), getRaceRegistrations()]).then(
      ([horseList, ownerList, healthList, usedIds, raceList, registrationList]) => {
        if (ignore) return;
        setHorses(horseList);
        setOwners(ownerList);
        setHealthStatuses(healthList);
        setUsedHorseIds(usedIds);
        setRaces(raceList);
        setRegistrations(registrationList);
        setLoading(false);
      }
    );
    return () => {
      ignore = true;
    };
  }, []);

  const ownerById = Object.fromEntries(owners.map((o) => [o.UserID, o]));
  const healthByHorse = Object.fromEntries(healthStatuses.map((h) => [h.HorseID, h]));
  // Thành tích thi đấu của ngựa đang xem (util dùng chung với trang Ngựa của tôi)
  const selectedAchievements = selectedHorse ? getHorseAchievements(selectedHorse.HorseID, races, registrations) : null;
  const breeds = [...new Set(horses.map((h) => h.Giong).filter(Boolean))].sort((a, b) => a.localeCompare(b, "vi"));

  // Số liệu tổng quan — tính trên toàn bộ danh sách, không phụ thuộc bộ lọc
  // Tuổi trung bình tính từ NgaySinh (bỏ qua ngựa chưa có ngày sinh)
  const ages = horses.map((h) => getHorseAge(h.NgaySinh)).filter((age) => age !== null);
  const averageAge = ages.length ? ages.reduce((sum, age) => sum + age, 0) / ages.length : 0;
  const stats = [
    { label: "Tổng số ngựa", value: horses.length },
    { label: "Số giống khác nhau", value: breeds.length },
    { label: "Tuổi trung bình", value: averageAge.toLocaleString("vi-VN", { maximumFractionDigits: 1 }) },
  ];

  // Lọc (AND) → sắp xếp → cắt trang
  const keyword = filters.keyword.trim().toLowerCase();
  const filteredHorses = horses.filter(
    (h) =>
      h.Ten.toLowerCase().includes(keyword) &&
      (!filters.breed || h.Giong === filters.breed) &&
      (!filters.ownerId || h.OwnerID === Number(filters.ownerId))
  );
  const sortedHorses = [...filteredHorses].sort((a, b) => {
    const result =
      sort.key === "Ten"
        ? a.Ten.localeCompare(b.Ten, "vi")
        : sort.key === "NgaySinh"
          ? (b.NgaySinh ?? "").localeCompare(a.NgaySinh ?? "") // "Tuổi tăng dần" = ngày sinh muộn (trẻ) trước
          : a[sort.key] - b[sort.key];
    return sort.direction === "asc" ? result : -result;
  });
  const totalPages = Math.max(1, Math.ceil(sortedHorses.length / PAGE_SIZE));
  // Sau khi xóa, trang hiện tại có thể vượt quá số trang còn lại
  const currentPage = Math.min(page, totalPages);
  const pageHorses = sortedHorses.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
    setPage(1);
  };

  // Pill "Sắp xếp theo": mỗi lựa chọn là 1 cột, luôn tăng dần (Tên A-Z, Tuổi/Cân nặng tăng dần)
  const handleSortChange = (key) => {
    setSort({ key, direction: "asc" });
    setPage(1);
  };

  // Từ modal chi tiết bấm Xóa: đóng modal chi tiết rồi mở hộp xác nhận
  const handleRequestDelete = (horse) => {
    setSelectedHorse(null);
    setHorseToDelete(horse);
  };

  const handleConfirmDelete = async () => {
    const horse = horseToDelete;
    setDeleting(true);
    try {
      // Service kiểm tra lại dữ liệu liên quan ngay trước khi xóa
      await deleteHorseIfUnused(horse.HorseID);
      addAuditLog({
        UserID: toUserID(user.id),
        HanhDong: "Xóa hồ sơ ngựa",
        TargetTable: "HORSE",
        TargetID: horse.HorseID,
        targetLabel: horse.Ten,
      });
      setHorses((prev) => prev.filter((h) => h.HorseID !== horse.HorseID));
      setMessage(`Đã xóa hồ sơ ngựa "${horse.Ten}".`);
    } catch (err) {
      // Vừa phát sinh dữ liệu liên quan từ màn khác → khóa nút Xóa của ngựa này
      setUsedHorseIds((prev) => new Set(prev).add(horse.HorseID));
      setErrorMessage(err.message);
    } finally {
      setDeleting(false);
      setHorseToDelete(null);
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-semibold tracking-tight text-ink sm:text-[1.75rem]">Quản lý hồ sơ ngựa</h1>
          <p className="mt-1 text-stone">Danh sách ngựa của câu lạc bộ và chủ ngựa.</p>
        </div>
        <Link
          to="/manager/horses/new"
          className="btn-primary"
        >
          + Thêm ngựa mới
        </Link>
      </div>

      {message && (
        <div className="mb-4 flex items-center justify-between gap-4 rounded-sm border-l-2 border-green-700 bg-white/60 px-4 py-3 text-sm text-green-800">
          {message}
          <button
            type="button"
            onClick={() => setMessage("")}
            className="cursor-pointer font-semibold text-green-700 hover:underline"
          >
            Đóng
          </button>
        </div>
      )}

      {errorMessage && (
        <div role="alert" className="mb-4 flex items-center justify-between gap-4 rounded-sm border-l-2 border-rust bg-white/60 px-4 py-3 text-sm text-rust">
          {errorMessage}
          <button type="button" onClick={() => setErrorMessage("")} className="cursor-pointer font-semibold hover:underline">
            Đóng
          </button>
        </div>
      )}

      {loading ? (
        <LoadingState />
      ) : (
        <div className="space-y-5">
          {/* Dải số liệu: không bo góc, không shadow, chỉ có vạch dọc ngăn cách */}
          <div className="grid grid-cols-3 divide-x divide-stone/20 bg-white">
            {stats.map((stat) => (
              <div key={stat.label} className="px-4 py-3 sm:px-5">
                <p className="text-xs font-medium text-stone sm:text-sm">{stat.label}</p>
                <p className="mt-0.5 font-serif text-[1.75rem] leading-tight font-semibold text-ink">{stat.value}</p>
              </div>
            ))}
          </div>

          <HorseFilters
            filters={filters}
            breeds={breeds}
            owners={owners}
            sortKey={sort.key}
            onChange={handleFiltersChange}
            onSortChange={handleSortChange}
          />

          {pageHorses.length === 0 ? (
            <div className="border-y border-stone/20 py-16 text-center text-stone">
              <SearchX className="mx-auto mb-3 h-10 w-10 text-stone/40" />
              Không tìm thấy ngựa nào phù hợp
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {pageHorses.map((horse) => (
                <HorseCard
                  key={horse.HorseID}
                  horse={horse}
                  meta={`Chủ ngựa: ${ownerById[horse.OwnerID]?.HoTen ?? "Chưa rõ"}`}
                  healthStatus={healthByHorse[horse.HorseID]?.TrangThai}
                  onClick={setSelectedHorse}
                />
              ))}
            </div>
          )}

          <Pagination
            currentPage={currentPage}
            pageSize={PAGE_SIZE}
            totalItems={sortedHorses.length}
            onPageChange={setPage}
            itemLabel="ngựa"
          />
        </div>
      )}

      <HorseDetailModal
        horse={selectedHorse}
        owner={selectedHorse ? ownerById[selectedHorse.OwnerID] : null}
        healthRecord={selectedHorse ? healthByHorse[selectedHorse.HorseID] : null}
        achievements={selectedAchievements}
        canDelete={selectedHorse ? !usedHorseIds.has(selectedHorse.HorseID) : false}
        onClose={() => setSelectedHorse(null)}
        onDelete={handleRequestDelete}
      />

      <ConfirmDialog
        open={Boolean(horseToDelete)}
        title="Xóa hồ sơ ngựa"
        message={`Xóa hồ sơ ${horseToDelete?.Ten ?? ""}? Hành động này không thể hoàn tác.`}
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setHorseToDelete(null)}
      />
    </div>
  );
}
