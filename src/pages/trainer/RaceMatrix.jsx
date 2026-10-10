import { useState } from "react";
import RaceColumnHeader from "./RaceColumnHeader";
import RaceHorseCell from "./RaceHorseCell";
import RaceRegistrationCell from "./RaceRegistrationCell";

// Cột giải: tối thiểu 170px (ít cột thì giãn tối đa 280px rồi khung dừng lại, không kéo dãn hết trang).
// --horse-col: chiều rộng cột ngựa dính trái (điện thoại thu nhỏ còn ảnh + tên).
const MIN_RACE_COL = 170;
const MAX_RACE_COL = 280;

// Ma trận ngựa × giải (cùng ngôn ngữ lưới với Lịch tập): hàng = ngựa, cột = giải.
// Nhiều cột thì lưới tự cuộn ngang trong khung, cột ngựa dính trái. Rê chuột/focus 1 ô: tô be rất nhạt cả hàng, viền ô đó đậm hơn.
export default function RaceMatrix({
  races,
  horses,
  horseInfoById,
  registrationByKey,
  savingKey,
  emptyText,
  onRegister,
  onCancel,
}) {
  const [hovered, setHovered] = useState(null); // { horseId, raceId }
  const clearHover = () => setHovered(null);

  return (
    <div
      className="w-full overflow-x-auto rounded-lg border border-gridline bg-white [--horse-col:7.5rem] sm:[--horse-col:15rem]"
      style={{ maxWidth: `calc(var(--horse-col) + ${races.length * MAX_RACE_COL}px + 2px)` }}
    >
      <table
        onMouseLeave={clearHover}
        className="w-full table-fixed border-separate border-spacing-0 text-sm"
        style={{ minWidth: `calc(var(--horse-col) + ${races.length * MIN_RACE_COL}px)` }}
      >
        <thead>
          <tr>
            {/* Ô góc: nhãn "Ngựa" căn giữa ô, dưới là số ngựa đang hiển thị (theo ô tìm) */}
            <th
              scope="col"
              className="sticky left-0 z-10 w-[var(--horse-col)] cursor-default border-r border-b border-stone/15 bg-white p-3 text-center align-middle font-normal select-none"
            >
              <p className="font-serif text-[17px] font-semibold text-ink">Ngựa</p>
              <p className="mt-0.5 text-xs text-stone tabular-nums">{horses.length} con</p>
            </th>
            {races.map((race, index) => (
              <RaceColumnHeader
                key={race.RaceID}
                race={race}
                isFirst={index === 0}
              />
            ))}
          </tr>
        </thead>
        <tbody>
          {horses.length === 0 ? (
            <tr>
              <td colSpan={races.length + 1} className="px-4 py-12 text-center text-sm text-stone">
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
                        isPast={race.isPast}
                        isFirst={index === 0}
                        rowHighlighted={hovered?.horseId === horse.HorseID}
                        cellHovered={hovered?.horseId === horse.HorseID && hovered?.raceId === race.RaceID}
                        saving={savingKey === key}
                        onHover={enter}
                        onLeave={clearHover}
                        onRegister={() => onRegister(horse, race)}
                        onCancel={() => onCancel(horse, race, registration)}
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
  );
}
