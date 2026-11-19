import { useState } from "react";
import { cancelRace } from "../services/raceService";

// Gửi yêu cầu hủy giải: trạng thái đang gửi + lỗi từ BE. submit(reason) trả true khi hủy xong (đã gọi onCancelled(race)).
export default function useCancelRace({ onCancelled }) {
  const [busy, setBusy] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const submit = async (raceId, reason) => {
    setBusy(true);
    setSubmitError("");
    try {
      onCancelled(await cancelRace(raceId, reason));
      return true;
    } catch (err) {
      setSubmitError(err.message || "Không hủy được giải, vui lòng thử lại.");
      setBusy(false);
      return false;
    }
  };

  return { busy, submitError, submit };
}
