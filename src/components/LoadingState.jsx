export default function LoadingState({ text = "Đang tải dữ liệu..." }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-sm text-[#6E6E76]">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-orange-500" />
      {text}
    </div>
  );
}
