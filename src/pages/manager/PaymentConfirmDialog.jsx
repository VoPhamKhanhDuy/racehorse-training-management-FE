import { useState } from "react";
import Modal from "../../components/Modal";
import { todayISO } from "../../utils/date";

const NOTE_MAX = 120;
const FIELD =
  "w-full rounded-[4px] border border-[#cfc4ad] bg-white px-3 text-[15px] text-[#2b2118] outline-none focus:border-[#c2570c]";

// Hộp xác nhận đã nhận tiền (chi phí) / đã chi trả (tiền thưởng) của 1 kỳ: câu hỏi xác nhận + ô ngày (mặc định hôm nay) + ô ghi chú tùy chọn.
// message: câu hỏi; dateLabel: nhãn ô ngày ("Ngày nhận" / "Ngày chi trả"); onConfirm({ date, note }); gắn bằng `key` để mỗi lần mở có state sạch.
export default function PaymentConfirmDialog({ title, message, dateLabel, onConfirm, onClose }) {
  const [date, setDate] = useState(todayISO());
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!date) return setError("Vui lòng chọn ngày.");
    if (date > todayISO()) return setError("Ngày không được ở tương lai.");
    if (note.trim().length > NOTE_MAX) return setError(`Ghi chú tối đa ${NOTE_MAX} ký tự.`);
    onConfirm({ date, note });
  };

  return (
    <Modal open title={title} onClose={onClose} size="sm">
      <form onSubmit={handleSubmit} noValidate>
        <p className="text-[15px] text-[#2b2118]">{message}</p>
        <div className="mt-5 space-y-4">
          <div>
            <label htmlFor="paymentDate" className="mb-1.5 block text-[13px] font-semibold text-[#4a3f33]">
              {dateLabel}
            </label>
            <input
              id="paymentDate"
              type="date"
              max={todayISO()}
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setError("");
              }}
              className={`${FIELD} h-10 sm:w-[220px]`}
            />
          </div>
          <div>
            <label htmlFor="paymentNote" className="mb-1.5 block text-[13px] font-semibold text-[#4a3f33]">
              Ghi chú (tùy chọn)
            </label>
            <textarea
              id="paymentNote"
              rows={2}
              value={note}
              onChange={(e) => {
                setNote(e.target.value);
                setError("");
              }}
              className={`${FIELD} resize-none py-2`}
            />
            <p className={`mt-1 text-right text-[13px] tabular-nums ${note.trim().length > NOTE_MAX ? "text-[#c0262d]" : "text-[#6b6055]"}`}>
              {note.trim().length}/{NOTE_MAX}
            </p>
          </div>
          {error && <p className="text-sm text-[#c0262d]">{error}</p>}
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="h-10 cursor-pointer rounded-[4px] border border-[#cfc4ad] bg-white px-5 text-sm font-semibold text-[#2b2118] transition-colors hover:bg-[#f0efec]"
          >
            Hủy
          </button>
          <button
            type="submit"
            className="h-10 cursor-pointer rounded-[4px] bg-[#c2570c] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#a8480a]"
          >
            Xác nhận
          </button>
        </div>
      </form>
    </Modal>
  );
}
