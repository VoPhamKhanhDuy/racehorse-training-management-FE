import Modal from "./Modal";

// Hộp xác nhận dùng chung (xóa, hủy, ...). Đang xử lý (loading) thì khóa 2 nút và không cho đóng.
export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Xóa",
  cancelLabel = "Hủy",
  danger = true,
  loading = false,
  onConfirm,
  onCancel,
}) {
  const handleClose = () => {
    if (!loading) onCancel();
  };

  return (
    <Modal open={open} title={title} onClose={handleClose} size="sm">
      <p className="text-[#6E6E76]">{message}</p>
      <div className="mt-8 flex justify-end gap-3">
        <button
          type="button"
          onClick={handleClose}
          disabled={loading}
          className="cursor-pointer rounded-xl border border-gray-200 px-5 py-2.5 font-semibold transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className={`cursor-pointer rounded-xl px-5 py-2.5 font-semibold text-white shadow-md transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
            danger ? "bg-alert hover:bg-alert/90" : "bg-orange-500 hover:bg-orange-600"
          }`}
        >
          {loading ? "Đang xử lý..." : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
