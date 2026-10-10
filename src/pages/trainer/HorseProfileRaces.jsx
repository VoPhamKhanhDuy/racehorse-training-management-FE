import HorseProfileSection from "./HorseProfileSection";
import { formatDate, todayISO } from "../../utils/date";

// Mục "Thi đấu" trong hồ sơ ngựa: các giải đã đăng ký (RACEREGISTRATION nối RACE), giải gần nhất trước
// entries: [{ race, registration }]
export default function HorseProfileRaces({ entries, className }) {
  const today = todayISO();

  return (
    <HorseProfileSection title="Thi đấu" link={{ to: "/trainer/races", label: "Đăng ký thi đấu →" }} className={className}>
      {entries.length === 0 ? (
        <p className="text-sm text-stone">Chưa đăng ký giải nào.</p>
      ) : (
        <ul>
          {entries.map(({ race, registration }) => (
            <li key={race.RaceID} className="border-b border-stone/15 py-2.5 text-sm last:border-b-0">
              <p className="font-medium text-ink">{race.TenGiai}</p>
              <p className="text-stone">
                {formatDate(race.Ngay)}
                {race.Ngay < today && " (đã diễn ra)"} · {race.DiaDiem}
              </p>
              <p className="text-xs text-stone">Đăng ký ngày {formatDate(registration.NgayDangKy)}</p>
            </li>
          ))}
        </ul>
      )}
    </HorseProfileSection>
  );
}
