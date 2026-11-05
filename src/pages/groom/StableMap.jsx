import { useEffect, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import LoadingState from "../../components/LoadingState";
import StableDetailDialog from "./StableDetailDialog";
import StableGroupTable from "./StableGroupTable";
import { getFeedingPlans, getHorses, getStableAssignments } from "../../services/careService";
import { getHealthStatuses } from "../../services/horseService";
import { getActiveTrainingLocks } from "../../services/vetService";

// Tên loại dãy (phần sau dấu "-") → tiếng Việt; loại khác giữ nguyên
const GROUP_TYPE_VI = { racing: "Thi đấu", recovery: "Hồi phục", "young horses": "Ngựa non" };

// "Stable A - Racing" → { letter: "A", label: "Dãy A — Thi đấu" }; tên không đúng dạng giữ nguyên làm nhãn
function parseGroup(name) {
  const match = (name ?? "").match(/^Stable\s+([A-Za-z0-9]+)\s*-\s*(.+)$/i);
  if (!match) return { letter: "", label: name || "Chuồng khác" };
  const type = match[2].trim();
  return { letter: match[1].toUpperCase(), label: `Dãy ${match[1].toUpperCase()} — ${GROUP_TYPE_VI[type.toLowerCase()] ?? type}` };
}

// "Chuồng trại" của nhân viên chăm sóc (chỉ xem): bảng theo dãy, mỗi dãy một bảng (Chuồng | Ngựa | Khẩu phần mỗi ngày | Tình trạng | Thao tác).
// "Xem" mở modal chi tiết chuồng (ghi chú chuồng, khẩu phần theo bữa, việc chăm sóc hôm nay). Dữ liệu: GET /groom/stables, /groom/feeding.
// BE chưa có mã chuồng riêng (SoChuong = tên dãy, trùng cho cả dãy) nên FE tự đánh số A1, A2, B1… theo dãy và thứ tự chuồng.
// Tình trạng chỉ ở mức "Đủ điều kiện / Đang khóa tập / Cần theo dõi" — không hiển thị chẩn đoán.
export default function StableMap() {
  const [assignments, setAssignments] = useState([]);
  const [horses, setHorses] = useState([]);
  const [feeding, setFeeding] = useState([]);
  const [lockedIds, setLockedIds] = useState(new Set());
  const [healthByHorse, setHealthByHorse] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [keyword, setKeyword] = useState("");
  const [groupFilter, setGroupFilter] = useState("");
  const [openId, setOpenId] = useState(null); // AssignmentID đang xem chi tiết

  useEffect(() => {
    let ignore = false;
    Promise.all([getStableAssignments(), getHorses(), getFeedingPlans(), getActiveTrainingLocks().catch(() => []), getHealthStatuses().catch(() => [])])
      .then(([stableList, horseList, feedList, lockList, healthList]) => {
        if (ignore) return;
        setAssignments(stableList);
        setHorses(horseList);
        setFeeding(feedList);
        setLockedIds(new Set(lockList.map((l) => Number(l.HorseID))));
        setHealthByHorse(Object.fromEntries(healthList.map((h) => [Number(h.HorseID), h.TrangThai])));
        setLoading(false);
      })
      .catch((err) => {
        if (ignore) return;
        setLoadError(err.message || "Không tải được chuồng.");
        setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, []);

  const horseById = Object.fromEntries(horses.map((h) => [h.HorseID, h]));

  // Nhóm theo dãy (SoChuong), dãy sắp theo tên; trong dãy theo AssignmentID → mã chuồng A1, A2…
  const groupMap = new Map();
  [...assignments]
    .sort((a, b) => a.SoChuong.localeCompare(b.SoChuong, "vi", { numeric: true }) || a.AssignmentID - b.AssignmentID)
    .forEach((stable) => {
      if (!groupMap.has(stable.SoChuong)) groupMap.set(stable.SoChuong, []);
      groupMap.get(stable.SoChuong).push(stable);
    });
  const groups = [...groupMap.entries()].map(([name, stables]) => {
    const { letter, label } = parseGroup(name);
    return {
      key: name,
      label,
      rows: stables.map((stable, index) => ({
        stable,
        code: letter ? `${letter}${index + 1}` : String(index + 1),
        horse: horseById[stable.HorseID],
        feeding: feeding.filter((f) => f.HorseID === stable.HorseID),
        condition: { locked: lockedIds.has(stable.HorseID), health: healthByHorse[stable.HorseID] ?? "" },
      })),
    };
  });

  const normalizedKeyword = keyword.trim().toLowerCase();
  const visibleGroups = groups
    .filter((g) => !groupFilter || g.key === groupFilter)
    .map((g) => ({ ...g, shown: g.rows.filter((r) => !normalizedKeyword || (r.horse?.Ten ?? "").toLowerCase().includes(normalizedKeyword)) }))
    .filter((g) => g.shown.length > 0);

  const openRow = groups.flatMap((g) => g.rows.map((r) => ({ ...r, groupLabel: g.label }))).find((r) => r.stable.AssignmentID === openId) ?? null;

  return (
    <div className="max-w-[1100px]">
      <h1 className="font-serif text-[30px] leading-tight font-semibold tracking-tight text-[#2b2118]">Chuồng trại</h1>
      <p className="mt-1 text-sm text-[#4a3f33]">Các chuồng và ngựa bạn chăm sóc.</p>

      {loading ? (
        <LoadingState />
      ) : loadError ? (
        <p className="mt-6 border-l-2 border-rust bg-rust/5 px-4 py-3 text-sm text-rust">{loadError}</p>
      ) : assignments.length === 0 ? (
        <p className="mt-6 border-t border-stone/20 py-10 text-center text-sm text-stone">Chưa có chuồng nào được phân.</p>
      ) : (
        <>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <div className="relative w-full sm:w-80">
              <label htmlFor="stableKeyword" className="sr-only">
                Tìm theo tên ngựa
              </label>
              <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-stone" aria-hidden="true" />
              <input
                id="stableKeyword"
                type="search"
                placeholder="Tìm theo tên ngựa"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="w-full rounded-[4px] border border-[#E3E3E3] bg-white py-2 pr-4 pl-10 text-sm text-[#1f1f1f] outline-none transition-colors placeholder:text-stone/60 focus:border-[#c2570c]"
              />
            </div>
            <div className="relative w-full sm:w-56">
              <label htmlFor="stableGroup" className="sr-only">
                Lọc theo dãy
              </label>
              <select
                id="stableGroup"
                value={groupFilter}
                onChange={(e) => setGroupFilter(e.target.value)}
                className="w-full cursor-pointer appearance-none rounded-[4px] border border-[#E3E3E3] bg-white py-2 pr-9 pl-3.5 text-sm text-[#1f1f1f] outline-none transition-colors focus:border-[#c2570c]"
              >
                <option value="">Tất cả dãy</option>
                {groups.map((g) => (
                  <option key={g.key} value={g.key}>
                    {g.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-stone" aria-hidden="true" />
            </div>
          </div>

          {visibleGroups.length === 0 ? (
            <p className="mt-6 rounded-[4px] border border-[#E3E3E3] bg-white py-12 text-center text-sm text-[#6b6b6b]">Không tìm thấy ngựa nào khớp.</p>
          ) : (
            <div className="mt-6 space-y-8">
              {visibleGroups.map((group) => (
                <section key={group.key} aria-label={group.label}>
                  <h2 className="mb-3 font-serif text-lg font-semibold text-[#2b2118]">
                    {group.label} <span className="font-sans text-sm font-normal text-[#6b6b6b]">· {group.rows.length} chuồng</span>
                  </h2>
                  <StableGroupTable rows={group.shown} onOpen={setOpenId} />
                </section>
              ))}
            </div>
          )}
        </>
      )}

      {openRow && (
        <StableDetailDialog
          stable={openRow.stable}
          code={openRow.code}
          groupLabel={openRow.groupLabel}
          horse={openRow.horse}
          feeding={openRow.feeding}
          onClose={() => setOpenId(null)}
        />
      )}
    </div>
  );
}
