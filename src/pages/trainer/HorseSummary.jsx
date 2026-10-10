import HorseIcon from "../../components/HorseIcon";

// Thông tin ngắn của 1 ngựa: ảnh, tên, giống + hàng "Tuổi | Cân nặng | Sức khỏe".
// Dùng ở chi tiết giáo án và cột ngữ cảnh của form giáo án. Mục nào chưa có dữ liệu thì ẩn, không hiện "N/A".
export default function HorseSummary({ horse, healthStatus }) {
  const facts = [
    horse.Tuoi && `${horse.Tuoi} tuổi`,
    horse.CanNang && `${horse.CanNang.toLocaleString("vi-VN")} kg`,
    healthStatus && `Sức khỏe: ${healthStatus}`,
  ].filter(Boolean);

  return (
    <div className="flex min-w-0 items-center gap-4">
      <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-stone/10 text-stone">
        {horse.photo ? (
          <img src={horse.photo} alt="" className="h-full w-full object-cover object-[center_25%]" />
        ) : (
          <HorseIcon className="h-6 w-6" />
        )}
      </span>
      <div className="min-w-0">
        <h2 className="font-serif text-xl font-semibold text-ink">{horse.Ten}</h2>
        <p className="text-sm text-stone">{horse.Giong}</p>
        {/* Mỗi mục có vạch trái; khung overflow-hidden + lề âm che vạch của mục đứng đầu mỗi dòng,
            nên khi xuống dòng trên màn hẹp không còn vạch thừa ở đầu/cuối dòng */}
        {facts.length > 0 && (
          <div className="mt-1 overflow-hidden">
            <p className="-ml-[calc(0.625rem+1px)] flex flex-wrap text-sm text-ink">
              {facts.map((fact) => (
                <span key={fact} className="border-l border-stone/25 px-2.5 whitespace-nowrap">
                  {fact}
                </span>
              ))}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
