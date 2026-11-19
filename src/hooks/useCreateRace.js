import { useState } from "react";
import { createRace } from "../services/raceService";
import { toRaceRequest } from "../utils/raceForm";

// Gửi form "Tạo giải": trạng thái đang lưu + lỗi từ BE. submit(form) trả true khi tạo xong (đã gọi onCreated(race)).
export default function useCreateRace({ onCreated }) {
  const [busy, setBusy] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const submit = async (form) => {
    setBusy(true);
    setSubmitError("");
    try {
      onCreated(await createRace(toRaceRequest(form)));
      return true;
    } catch (err) {
      setSubmitError(err.message || "Không tạo được giải, vui lòng thử lại.");
      setBusy(false);
      return false;
    }
  };

  return { busy, submitError, submit };
}
