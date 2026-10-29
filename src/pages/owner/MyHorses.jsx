import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import HorseCard from "../../components/HorseCard";
import LoadingState from "../../components/LoadingState";
import useAuth from "../../hooks/useAuth";
import { getHealthStatuses, getLockedHorseIds, getOwnerHorses, getStableNumbers } from "../../services/ownerService";
import { toUserID } from "../../utils/userId";

// "Ngựa của tôi" của Chủ ngựa — CHỈ XEM (thêm/sửa/xóa hồ sơ ngựa là việc của Quản lý CLB).
// Cùng lưới thẻ ngựa với trang Quản lý hồ sơ ngựa (components/HorseCard), chỉ ngựa có HORSE.OwnerID = người đang đăng nhập.
// Thẻ: "Chuồng …" thay cho dòng chủ ngựa; ngựa đang khóa tập thêm "Đang tạm ngưng huấn luyện" (không hiện lý do).
// Bấm thẻ → /owner/horses/:id. Chưa có ngựa nào: trạng thái rỗng, không nút.
export default function MyHorses() {
  const { user } = useAuth();
  const ownerId = toUserID(user.id);
  const navigate = useNavigate();

  const [horses, setHorses] = useState([]);
  const [healthByHorse, setHealthByHorse] = useState({});
  const [lockedIds, setLockedIds] = useState(new Set());
  const [stables, setStables] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    Promise.all([getOwnerHorses(ownerId), getHealthStatuses(), getLockedHorseIds(), getStableNumbers()]).then(
      ([horseList, healthList, locked, stableMap]) => {
        if (ignore) return;
        setHorses(horseList);
        setHealthByHorse(Object.fromEntries(healthList.map((h) => [h.HorseID, h.TrangThai])));
        setLockedIds(locked);
        setStables(stableMap);
        setLoading(false);
      }
    );
    return () => {
      ignore = true;
    };
  }, [ownerId]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-serif text-2xl font-semibold tracking-tight text-ink sm:text-[1.75rem]">Ngựa của tôi</h1>
        <p className="mt-1 text-stone">Danh sách ngựa của bạn tại câu lạc bộ.</p>
      </div>

      {loading ? (
        <LoadingState />
      ) : horses.length === 0 ? (
        <div className="border-y border-stone/20 py-16 text-center">
          <p className="font-serif text-lg font-semibold text-ink">Chưa có ngựa nào gắn với tài khoản của bạn</p>
          <p className="mt-1.5 text-sm text-stone">Liên hệ Quản lý CLB để được thêm ngựa vào hồ sơ.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {horses.map((horse) => (
            <HorseCard
              key={horse.HorseID}
              horse={horse}
              healthStatus={healthByHorse[horse.HorseID]}
              meta={stables[horse.HorseID] ? `Chuồng ${stables[horse.HorseID]}` : "Chưa phân chuồng"}
              note={lockedIds.has(horse.HorseID) ? "Đang tạm ngưng huấn luyện" : undefined}
              onClick={(h) => navigate(`/owner/horses/${h.HorseID}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
