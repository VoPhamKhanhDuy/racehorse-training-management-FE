import HorseProfileSection from "./HorseProfileSection";
import { formatDate, todayISO } from "../../utils/date";

// Mục "Thi đấu" trong hồ sơ ngựa: các giải đã đăng ký (RACEREGISTRATION nối RACE), giải gần nhất trước
// entries: [{ race, registration }]
export default function HorseProfileRaces({ entries, className }) {
  const today = todayISO();

  return (
    <HorseProfileSection title="Thi đấu" link={{ to: "/trainer/races", label: "Đăng ký thi đấu →" }} className={className}>
      {entries.length === 0 ? (
        <p className="text-sm text-[#6b6055]">Chưa đăng ký giải nào.</p>
      ) : (
        <ul>
          {entries.map(({ race, registration }) => (
            <li key={race.RaceID} className="border-b border-[#ece5d6] py-2.5 text-sm last:border-b-0">
              <p className="font-medium text-[#2b2118]">{race.TenGiai}</p>
              <p className="text-[#6b6055]">
                {formatDate(race.Ngay)}
                {race.Ngay < today && " (đã diễn ra)"} · {race.DiaDiem}
              </p>
              <p className="text-[13px] text-[#6b6055]">Đăng ký ngày {formatDate(registration.NgayDangKy)}</p>
            </li>
          ))}
        </ul>
      )}
    </HorseProfileSection>
  );
}
