import { useState } from "react";
import RaceColumnHeader from "./RaceColumnHeader";
import RaceHorseCell from "./RaceHorseCell";
import RaceRegistrationCell from "./RaceRegistrationCell";
import { hasResult } from "../../utils/raceResult";

// Cột giải: tối thiểu 190px, chia đều để bảng giãn hết chiều rộng khung (cột ngựa cố định 208px).
// --horse-col: chiều rộng cột ngựa dính trái (điện thoại thu nhỏ còn ảnh + tên).
const MIN_RACE_COL = 190;

// Ma trận ngựa × giải (cùng ngôn ngữ lưới với Lịch tập): hàng = ngựa, cột = giải.
// Nhiều cột thì lưới tự cuộn ngang trong khung, cột ngựa dính trái. Rê chuột 1 ô: tô xám mờ cả hàng.
// totalHorses: tổng số ngựa (chưa lọc theo ô tìm) cho chân bảng "Hiển thị x / tổng con ngựa".
export default function RaceMatrix({
  races,
  horses,
  totalHorses,
  horseInfoById,
  registrationByKey,
  savingKey,
  emptyText,
  onRegister,
  onCancel,
  onOpenResult,
}) {
  const [hovered, setHovered] = useState(null); // { horseId, raceId }
  const clearHover = () => setHovered(null);

  // "Đã nhập N/M" ở tiêu đề giải đã diễn ra — đếm trên mọi ngựa đăng ký (không theo ô tìm)
  const resultCountByRace = Object.values(registrationByKey).reduce((acc, r) => {
    const count = (acc[r.RaceID] ??= { done: 0, total: 0 });
    count.total += 1;
    if (hasResult(r)) count.done += 1;
    return acc;
  }, {});

  return (
    <div className="overflow-hidden rounded border border-[#b9ab90] bg-white [--horse-col:7.5rem] sm:[--horse-col:13rem]">
      <div className="w-full overflow-x-auto">
        <table
          onMouseLeave={clearHover}
          className="w-full table-fixed border-separate border-spacing-0 text-sm"
          style={{ minWidth: `calc(var(--horse-col) + ${races.length * MIN_RACE_COL}px)` }}
        >
          <thead>
            <tr>
              {/* Ô góc: nhãn "Ngựa" căn trái, dưới là số ngựa đang hiển thị (theo ô tìm) */}
              <th
                scope="col"
                className="sticky left-0 z-10 w-[var(--horse-col)] cursor-default border-r border-b-2 border-r-[#d9cfba] border-b-[#b9ab90] bg-[#f3ede0] px-3 py-2 text-left align-bottom font-normal select-none"
              >
                <p className="text-[13px] font-semibold text-[#2b2118]">Ngựa</p>
                <p className="mt-0.5 text-[13px] text-[#6b6055] tabular-nums">{horses.length} con</p>
              </th>
              {races.map((race, index) => (
                <RaceColumnHeader
                  key={race.RaceID}
                  race={race}
                  isFirst={index === 0}
                  resultCount={resultCountByRace[race.RaceID]}
                />
              ))}
            </tr>
          </thead>
          <tbody>
            {horses.length === 0 ? (
              <tr>
                <td colSpan={races.length + 1} className="px-4 py-12 text-center text-sm text-[#6b6055]">
                  {emptyText}
                </td>
              </tr>
            ) : (
              horses.map((horse) => {
                const info = horseInfoById[horse.HorseID];
                return (
                  <tr key={horse.HorseID} className="[&:last-child>*]:border-b-0">
                    <RaceHorseCell horse={horse} info={info} highlighted={hovered?.horseId === horse.HorseID} />
                    {races.map((race, index) => {
                      const key = `${horse.HorseID}|${race.RaceID}`;
                      const registration = registrationByKey[key];
                      const enter = () => setHovered({ horseId: horse.HorseID, raceId: race.RaceID });
                      return (
                        <RaceRegistrationCell
                          key={race.RaceID}
                          horse={horse}
                          race={race}
                          registration={registration}
                          blockReason={info.blockReason}
                          locked={info.locked}
                          isPast={race.isPast}
                          isFirst={index === 0}
                          rowHighlighted={hovered?.horseId === horse.HorseID}
                          cellHovered={hovered?.horseId === horse.HorseID && hovered?.raceId === race.RaceID}
                          saving={savingKey === key}
                          onHover={enter}
                          onLeave={clearHover}
                          onRegister={() => onRegister(horse, race)}
                          onCancel={() => onCancel(horse, race, registration)}
                          onOpenResult={(anchor) => onOpenResult(horse, race, anchor)}
                        />
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <p className="border-t border-[#d9cfba] px-4 py-2.5 text-[13px] text-[#4a3f33]">
        Hiển thị <b className="font-semibold text-[#2b2118]">{horses.length}</b> /{" "}
        <b className="font-semibold text-[#2b2118]">{totalHorses ?? horses.length}</b> con ngựa
      </p>
    </div>
  );
}
