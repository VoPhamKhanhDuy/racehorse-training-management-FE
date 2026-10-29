import HorseIcon from "./HorseIcon";

// Ảnh ngựa tròn cỡ nhỏ (chip lọc, dòng danh sách). size: số px. Không có ảnh thì hiện icon ngựa.
export default function HorseAvatar({ horse, size = 28, square = false }) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center overflow-hidden bg-stone/10 text-stone ${square ? "rounded-[4px]" : "rounded-full"}`}
      style={{ width: size, height: size }}
    >
      {horse?.photo ? (
        <img
          src={horse.photo}
          alt=""
          className="h-full w-full object-cover"
          style={{ objectPosition: horse.photoPosition ?? "center 30%" }}
        />
      ) : (
        <HorseIcon className="h-1/2 w-1/2" />
      )}
    </span>
  );
}
