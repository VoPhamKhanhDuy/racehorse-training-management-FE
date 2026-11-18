import { Lock, Search } from "lucide-react";

// Ghép các phần có giá trị bằng " · ", không có gì thì "—": ["5 tuổi", "410 kg"] → "5 tuổi · 410 kg"
const joinInfo = (parts) => parts.filter(Boolean).join(" · ") || "—";

// Dòng dõi chỉ hiện khi khác tên giống (so sánh không phân biệt hoa thường)
const showLineage = (horse) =>
  Boolean(horse.DongDoi) && horse.DongDoi.trim().toLowerCase() !== (horse.Giong ?? "").trim().toLowerCase();

// Bảng ngựa của trang Tổng quan (quản lý / bác sĩ / HLV trưởng): bấm cả dòng gọi onOpen(horse).
// renderActions (tùy chọn): có thì thêm cột "Thao tác"; bấm vào cột này không kích hoạt onOpen.
// showLockReason: hiện thêm lý do khóa tập (cắt ... nếu dài) ở cột Huấn luyện.
export default function DashboardHorseTable({
  tabs,
  filterKey,
  onFilter,
  keyword,
  onKeyword,
  horses,
  isTreating,
  onOpen,
  renderActions,
  showLockReason = false,
}) {
  return (
    <div className="rounded-lg border border-[#e2d9c8] bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e2d9c8] p-4">
        <div className="flex flex-wrap items-center gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => onFilter(tab.key)}
              className={`cursor-pointer rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                filterKey === tab.key
                  ? "bg-[#2b2118] text-white"
                  : "bg-[#f4efe6] text-[#6b6055] hover:bg-[#e8dfd1] hover:text-[#2b2118]"
              }`}
            >
              {tab.label} {tab.count}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#8a7f6e]" />
          <input
            type="text"
            value={keyword}
            onChange={(e) => onKeyword(e.target.value)}
            placeholder="Tìm tên ngựa, giống, trạng thái..."
            className="h-9 w-full rounded border border-[#d9cfba] bg-white pr-3 pl-9 text-xs text-[#2b2118] placeholder:text-[#8a7f6e] focus:border-[#c2570c] focus:outline-none"
          />
        </div>
      </div>

      {horses.length === 0 ? (
        <div className="py-12 text-center text-sm text-[#6b6055]">Không có ngựa nào trong nhóm này.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[#e2d9c8] bg-[#faf7f2] text-xs font-semibold text-[#6b6055]">
                <th className="px-5 py-3">Ngựa</th>
                <th className="px-4 py-3">Giống</th>
                <th className="px-4 py-3">Tuổi · Cân nặng</th>
                <th className="px-4 py-3">Sức khỏe</th>
                <th className="px-4 py-3">Huấn luyện</th>
                {renderActions && <th className="px-5 py-3 text-right">Thao tác</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eee7da]">
              {horses.map((horse) => (
                <tr
                  key={horse.HorseID}
                  onClick={() => onOpen(horse)}
                  className="cursor-pointer transition-colors hover:bg-[#faf7f2]/70"
                >
                  <td className="px-5 py-2.5">
                    <div className="flex items-center gap-3">
                      {horse.photo ? (
                        <img src={horse.photo} alt={horse.Ten} className="h-10 w-10 shrink-0 rounded-md object-cover" />
                      ) : (
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[#ede5d8] font-serif text-sm font-bold text-[#2b2118]">
                          {horse.Ten?.charAt(0) || "H"}
                        </span>
                      )}
                      <div className="min-w-0">
                        <p className="font-serif text-base font-semibold text-[#2b2118]">{horse.Ten}</p>
                        {showLineage(horse) && (
                          <p className="max-w-[200px] truncate text-xs text-[#6b6055]" title={horse.DongDoi}>
                            {horse.DongDoi}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap text-[#2b2118]">{horse.Giong || "—"}</td>
                  <td className="px-4 py-2.5 whitespace-nowrap text-[#2b2118]">
                    {joinInfo([
                      horse.age != null && `${horse.age} tuổi`,
                      horse.CanNang && `${horse.CanNang.toLocaleString("vi-VN")} kg`,
                    ])}
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${horse.meta.badgeBg} ${horse.meta.badgeText}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${horse.meta.dotColor}`} />
                      {horse.statusText}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    {horse.lock ? (
                      <div>
                        <span
                          className="inline-flex items-center gap-1 text-xs font-semibold text-[#b3473f]"
                          title={horse.lock.LyDo || undefined}
                        >
                          <Lock className="h-3.5 w-3.5" /> Đang khóa tập
                        </span>
                        {showLockReason && horse.lock.LyDo && (
                          <p className="max-w-[200px] truncate text-xs text-[#6b6055]" title={horse.lock.LyDo}>
                            {horse.lock.LyDo}
                          </p>
                        )}
                      </div>
                    ) : isTreating(horse) ? (
                      <span className="text-xs font-medium text-[#b3473f]">Hạn chế tập nặng</span>
                    ) : (
                      <span className="text-xs font-medium text-[#4d6b2a]">Sẵn sàng</span>
                    )}
                  </td>
                  {renderActions && (
                    <td className="px-5 py-2.5 text-right" onClick={(e) => e.stopPropagation()}>
                      {renderActions(horse)}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
