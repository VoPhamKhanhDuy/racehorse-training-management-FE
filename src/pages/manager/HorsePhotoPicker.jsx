import { useId } from "react";
import { ImagePlus, X } from "lucide-react";
import HorseIcon from "../../components/HorseIcon";

const MAX_PHOTO_SIZE_MB = 5;

// Chọn ảnh ngựa trong HorseForm: xem trước ngay, có thể đổi hoặc bỏ ảnh.
// photo: đường dẫn ảnh có sẵn / data URL vừa chọn / null (dùng placeholder)
export default function HorsePhotoPicker({ photo, horseName, error, onChange, onError }) {
  const inputId = useId();

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // cho phép chọn lại đúng file vừa bỏ
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      onError("Vui lòng chọn file ảnh (JPG, PNG, WebP...)");
      return;
    }
    if (file.size > MAX_PHOTO_SIZE_MB * 1024 * 1024) {
      onError(`Ảnh tối đa ${MAX_PHOTO_SIZE_MB} MB`);
      return;
    }
    // TODO: thay bằng upload lên server khi BE xong — hiện đọc thành data URL, chỉ giữ trong phiên làm việc
    const reader = new FileReader();
    reader.onload = () => onChange(reader.result);
    reader.onerror = () => onError("Không đọc được file ảnh, vui lòng thử lại");
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <p className="mb-2 font-serif text-sm font-semibold text-stone">Ảnh ngựa</p>
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex aspect-video w-48 shrink-0 items-center justify-center overflow-hidden rounded-sm border border-stone/20 bg-white text-stone/40">
          {photo ? (
            <img src={photo} alt={`Ảnh xem trước ${horseName || "ngựa"}`} className="h-full w-full object-cover object-[center_25%]" />
          ) : (
            <HorseIcon className="h-10 w-10" strokeWidth={1.25} />
          )}
        </div>
        <div className="flex flex-col items-start gap-2">
          <input
            id={inputId}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="sr-only"
          />
          <label
            htmlFor={inputId}
            className="inline-flex cursor-pointer items-center gap-2 rounded-sm border border-stone/30 px-3.5 py-2 text-sm font-medium text-ink transition-colors hover:border-brass hover:bg-brass/10"
          >
            <ImagePlus className="h-4 w-4" aria-hidden="true" />
            {photo ? "Đổi ảnh" : "Chọn ảnh"}
          </label>
          {photo && (
            <button
              type="button"
              onClick={() => onChange(null)}
              className="inline-flex cursor-pointer items-center gap-1 text-sm text-stone hover:text-alert"
            >
              <X className="h-4 w-4" aria-hidden="true" />
              Bỏ ảnh
            </button>
          )}
          <p className="text-xs text-stone">JPG, PNG, WebP · tối đa {MAX_PHOTO_SIZE_MB} MB. Không chọn sẽ dùng ảnh mặc định.</p>
        </div>
      </div>
      {error && <p className="mt-1.5 text-sm text-alert">{error}</p>}
    </div>
  );
}
