import { useRef } from "react";
import { INCIDENT_IMAGE } from "../../data/incidentOptions";

// Khu chọn ảnh sự cố (không bắt buộc): chưa có ảnh → ô viền nét đứt bấm để chọn; có ảnh → xem trước + "Đổi ảnh" / "Xóa ảnh".
// value: data URL của ảnh đã chọn ("" = chưa có). onChange(dataUrl); onError(thông báo) khi sai định dạng/quá dung lượng.
// Mock: đọc ảnh thành base64 để lưu tạm vào dữ liệu mẫu — thực tế sẽ upload file lên server và lưu URL trả về.
export default function IncidentImageField({ value, error, onChange, onError }) {
  const inputRef = useRef(null);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // chọn lại cùng 1 file vẫn kích hoạt onChange
    if (!file) return;
    if (!INCIDENT_IMAGE.types.includes(file.type)) {
      onError("Chỉ nhận ảnh định dạng JPG hoặc PNG.");
      return;
    }
    if (file.size > INCIDENT_IMAGE.maxBytes) {
      onError(`Ảnh vượt quá ${INCIDENT_IMAGE.maxLabel}, vui lòng chọn ảnh nhỏ hơn.`);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => onChange(String(reader.result));
    reader.onerror = () => onError("Không đọc được ảnh, vui lòng thử lại.");
    reader.readAsDataURL(file);
  };

  const openPicker = () => inputRef.current?.click();

  return (
    <div>
      <span className="mb-1.5 block text-[13px] font-semibold text-[#4a3f33]">Hình ảnh</span>
      <input
        ref={inputRef}
        id="HinhAnh"
        type="file"
        accept={INCIDENT_IMAGE.accept}
        onChange={handleFile}
        aria-label="Chọn ảnh sự cố"
        className="sr-only"
      />

      {value ? (
        <div className="flex flex-wrap items-end gap-4">
          <img src={value} alt="Ảnh sự cố đã chọn" className="h-40 w-56 rounded-[4px] border border-[#d9cfba] object-cover" />
          <div className="flex gap-4 text-sm">
            <button
              type="button"
              onClick={openPicker}
              className="cursor-pointer font-semibold text-[#c2570c] underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c2570c]"
            >
              Đổi ảnh
            </button>
            <button
              type="button"
              onClick={() => onChange("")}
              className="cursor-pointer font-semibold text-[#b3473f] underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c2570c]"
            >
              Xóa ảnh
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={openPicker}
          className={`flex h-[120px] w-full cursor-pointer flex-col items-center justify-center rounded-[4px] border border-dashed bg-[#faf8f4] px-4 text-center transition-colors hover:bg-[#f0efec] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c2570c] ${
            error ? "border-[#c0262d]" : "border-[#b9ab90]"
          }`}
        >
          <span className="text-sm font-semibold text-[#2b2118]">Bấm để chọn ảnh</span>
          <span className="mt-1 text-[13px] text-[#6b6055]">JPG hoặc PNG, tối đa {INCIDENT_IMAGE.maxLabel}, không bắt buộc</span>
        </button>
      )}
      {error && <p className="mt-1.5 text-sm text-[#c0262d]">{error}</p>}
    </div>
  );
}
