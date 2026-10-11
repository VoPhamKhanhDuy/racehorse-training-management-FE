import { useRef } from "react";
import { INCIDENT_IMAGE } from "../../data/incidentOptions";

// Khu chọn ảnh sự cố (không bắt buộc): chưa có ảnh → ô viền nét đứt bấm để chọn; có ảnh → xem trước + "Đổi ảnh" / "Bỏ ảnh".
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
      <span className="mb-1.5 block font-serif text-sm font-semibold text-stone">Hình ảnh</span>
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
          <img src={value} alt="Ảnh sự cố đã chọn" className="h-40 w-56 rounded-[4px] border border-stone/20 object-cover" />
          <div className="flex gap-3 text-sm">
            <button type="button" onClick={openPicker} className="cursor-pointer font-semibold text-brass-deep underline-offset-2 hover:underline">
              Đổi ảnh
            </button>
            <button type="button" onClick={() => onChange("")} className="cursor-pointer text-stone underline-offset-2 hover:text-ink hover:underline">
              Bỏ ảnh
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={openPicker}
          className={`flex h-28 w-full cursor-pointer flex-col items-center justify-center rounded-[4px] border border-dashed bg-[#faf7f1] px-4 text-center transition-colors hover:bg-[#f7f1e5] sm:max-w-md ${
            error ? "border-rust" : "border-stone/40"
          }`}
        >
          <span className="text-sm font-medium text-ink">Bấm để chọn ảnh</span>
          <span className="mt-1 text-xs text-stone">JPG hoặc PNG, tối đa {INCIDENT_IMAGE.maxLabel} · không bắt buộc</span>
        </button>
      )}
      {error && <p className="mt-1.5 text-sm text-rust">{error}</p>}
    </div>
  );
}
