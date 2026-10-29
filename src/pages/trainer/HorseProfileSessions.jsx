import { DataCell, DataRow, DataTable } from "../../components/DataTable";
import HorseProfileSection from "./HorseProfileSection";
import { SESSION_UNITS } from "../../data/trainingSessionOptions";
import { formatDate } from "../../utils/date";

const RECENT_COUNT = 5;

const COLUMNS = [
  { key: "date", label: "Ngày" },
  { key: "heartRate", label: "Nhịp tim" },
  { key: "speed", label: "Vận tốc" },
  { key: "index", label: "Chỉ số" },
  { key: "note", label: "Nhận xét" },
];
const TEMPLATE = "110px 100px 110px 80px minmax(140px,1fr)";

// Mục "Buổi tập gần đây" trong hồ sơ ngựa: 5 buổi TRAININGSESSION mới nhất (sessions đã sắp mới → cũ)
export default function HorseProfileSessions({ horseId, sessions, className }) {
  const recent = sessions.slice(0, RECENT_COUNT);

  return (
    <HorseProfileSection
      title="Buổi tập gần đây"
      link={{ to: `/trainer/sessions?horse=${horseId}`, label: "Xem tất cả kết quả →" }}
      className={className}
    >
      {recent.length === 0 ? (
        <p className="text-sm text-[#6b6055]">Chưa có buổi tập nào được ghi nhận.</p>
      ) : (
        <DataTable columns={COLUMNS} template={TEMPLATE} minWidth={560} framed>
          {recent.map((session) => (
            <DataRow key={session.SessionID} template={TEMPLATE}>
              <DataCell className="tabular-nums text-[#2b2118]">{formatDate(session.Ngay)}</DataCell>
              <DataCell className="tabular-nums text-[#2b2118]">
                {session.NhipTim} {SESSION_UNITS.NhipTim}
              </DataCell>
              <DataCell className="tabular-nums text-[#2b2118]">
                {session.VanToc.toLocaleString("vi-VN")} {SESSION_UNITS.VanToc}
              </DataCell>
              <DataCell className="font-semibold tabular-nums text-[#2b2118]" title="Chỉ số tập (0–100)">
                {session.ChiSoTap}
              </DataCell>
              <DataCell className="text-[#6b6055]" title={session.NhanXet}>
                <span className="truncate">{session.NhanXet || "—"}</span>
              </DataCell>
            </DataRow>
          ))}
        </DataTable>
      )}
    </HorseProfileSection>
  );
}
