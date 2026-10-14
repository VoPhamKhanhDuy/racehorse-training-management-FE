import { Fragment } from "react";
import HorseAvatar from "../../components/HorseAvatar";

// Số thứ tự trong chuồng: "A12" → 12 (để A2 đứng trước A10)
const stableIndex = (soChuong) => Number(soChuong.replace(/^\D+/, "")) || 0;

const WALL = "border-[#b9a58a]"; // nâu đậm nhạt: viền tòa nhà + vách ngăn
const AISLE_BG = "bg-[#efe4d0]";
const COLUMNS = 3; // mỗi dãy 3 cột, quá 3 chuồng thì xuống hàng

// Dòng trạng thái việc hôm nay (chỉ ngựa nhân viên phụ trách): "Còn 2 việc · tiếp theo 17:00" / "Đã xong hôm nay" / trống.
// status: { pending, nextTime, late } hoặc undefined (ngựa người khác phụ trách).
function TaskStatusLine({ status }) {
  if (!status) return null;
  if (status.pending === 0) return <span className="block truncate text-xs text-stone">Đã xong hôm nay</span>;
  return (
    <span className="block truncate text-xs text-stone">
      Còn {status.pending} việc
      {status.nextTime && (
        <>
          {" · "}
          <span className={status.late ? "font-semibold text-brass-deep" : ""}>tiếp theo {status.nextTime}</span>
        </>
      )}
    </span>
  );
}

// 1 ô chuồng cao 120px: số chuồng (serif lớn) + ảnh tròn 40px, tên ngựa, dòng việc hôm nay.
// Phụ trách: vạch cam 3px mép trái + "Bạn phụ trách". Đang chọn: nền be + viền cam 2px bên trong.
function StableCell({ stable, horse, status, mine, selected, bordered, onSelect }) {
  const name = horse?.Ten ?? `Ngựa #${stable.HorseID}`;

  return (
    <button
      type="button"
      onClick={() => onSelect(stable.StableID)}
      aria-pressed={selected}
      aria-label={`Chuồng ${stable.SoChuong}, ${name}${mine ? ", bạn phụ trách" : ""}`}
      className={`relative flex h-[120px] w-full cursor-pointer flex-col px-2.5 py-2 text-left outline-none transition-colors min-[900px]:px-3 ${WALL} ${
        bordered.left ? "border-l" : ""
      } ${bordered.top ? "border-t" : ""} ${
        selected ? "bg-[#eee3cc]" : "bg-[#fffdf8] hover:bg-[#f9f3e6] focus-visible:bg-[#f9f3e6]"
      }`}
    >
      {mine && <span aria-hidden="true" className="absolute inset-y-0 left-0 w-[3px] bg-brass" />}
      {selected && <span aria-hidden="true" className="pointer-events-none absolute inset-0 border-2 border-brass" />}

      <span className="flex items-start justify-between gap-1.5">
        <span className="min-w-0">
          <span className="block font-serif text-2xl leading-none font-semibold text-[#5a3d22]">{stable.SoChuong}</span>
          {mine && <span className="mt-1 hidden text-[11px] leading-tight font-medium text-brass-deep min-[900px]:block">Bạn phụ trách</span>}
        </span>
        <HorseAvatar horse={horse} size={40} />
      </span>

      <span className="mt-auto block truncate font-serif text-base leading-snug font-semibold text-ink">{name}</span>
      <span className="hidden h-4 min-[900px]:block">
        <TaskStatusLine status={mine ? status : undefined} />
      </span>
    </button>
  );
}

// Mặt bằng chuồng ngựa trong 1 khung "tòa nhà": mỗi dãy (chữ cái đầu của SoChuong) là 1 hàng ô chuồng 3 cột ngăn bằng vách;
// giữa 2 dãy là LỐI ĐI (dải ~44px nền be đậm, đường nét đứt mảnh ở giữa, chữ "LỐI ĐI" đè lên đường kẻ).
// assignments: STABLEASSIGNMENT; myHorseIds: ngựa nhân viên phụ trách; statusByHorse: { [HorseID]: { pending, nextTime, late } }.
export default function StableFloorPlan({ assignments, horseById, myHorseIds, statusByHorse, selectedId, onSelect }) {
  const rows = Object.values(
    assignments.reduce((acc, a) => {
      const key = a.SoChuong.charAt(0).toUpperCase();
      (acc[key] ??= { key, stables: [] }).stables.push(a);
      return acc;
    }, {})
  )
    .sort((a, b) => a.key.localeCompare(b.key))
    .map((row) => ({ ...row, stables: row.stables.sort((a, b) => stableIndex(a.SoChuong) - stableIndex(b.SoChuong)) }));

  return (
    <div className={`overflow-hidden rounded-[6px] border-[1.5px] bg-[#faf7f1] ${WALL}`}>
      {rows.map((row, rowIndex) => (
        <Fragment key={row.key}>
          {/* Lối đi giữa 2 dãy: kéo sát mép khung như hành lang chạy hết chiều ngang tòa nhà */}
          {rowIndex > 0 && (
            <div aria-hidden="true" className={`relative flex h-11 items-center justify-center ${AISLE_BG}`}>
              <span className="absolute inset-x-0 top-1/2 border-t border-dashed border-stone/50" />
              <span className={`relative px-3 text-[11px] font-medium tracking-[0.3em] text-stone uppercase ${AISLE_BG}`}>Lối đi</span>
            </div>
          )}

          <div role="group" aria-label={`Dãy ${row.key}`} className="px-3 py-2.5">
            <p className="mb-1.5 text-[11px] font-medium tracking-wide text-stone uppercase">Dãy {row.key}</p>
            <div className={`grid overflow-hidden border ${WALL}`} style={{ gridTemplateColumns: `repeat(${COLUMNS}, minmax(0, 1fr))` }}>
              {row.stables.map((stable, index) => (
                <StableCell
                  key={stable.StableID}
                  stable={stable}
                  horse={horseById[stable.HorseID]}
                  status={statusByHorse[stable.HorseID]}
                  mine={myHorseIds.has(stable.HorseID)}
                  selected={stable.StableID === selectedId}
                  bordered={{ left: index % COLUMNS !== 0, top: index >= COLUMNS }}
                  onSelect={onSelect}
                />
              ))}
            </div>
          </div>
        </Fragment>
      ))}
    </div>
  );
}
