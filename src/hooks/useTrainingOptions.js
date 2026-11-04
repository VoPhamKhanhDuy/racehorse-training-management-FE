import { useEffect, useState } from "react";
import { TRAINING_CODE_FALLBACK } from "../data/trainingCodes";
import { getTrainingOptions } from "../services/trainingApi";

// Danh mục mã không đổi khi app đang chạy → chỉ gọi API 1 lần, các màn dùng chung kết quả
let loadedOptions = null;
let pendingRequest = null;

function loadOptions() {
  if (!pendingRequest) {
    pendingRequest = getTrainingOptions()
      .then((data) => {
        loadedOptions = data;
        return data;
      })
      .catch((err) => {
        pendingRequest = null; // lần sau thử lại
        throw err;
      });
  }
  return pendingRequest;
}

const findLabel = (options, group, code) => options?.[group]?.find((item) => item.code === code)?.label;

// Danh mục mã + nhãn tiếng Việt của luồng giáo án (GET /api/trainer/training-plans/options).
// remote = false: chỉ dùng bản tĩnh data/trainingCodes.js (role không gọi được API này, vd nhân viên chăm sóc).
// options luôn có giá trị: dùng bản tĩnh trong lúc chờ API hoặc khi API lỗi.
// label(group, code): nhãn của 1 mã, vd label("trainingTypes", "Gallop") → "Phi nước đại".
export default function useTrainingOptions({ remote = true } = {}) {
  const [options, setOptions] = useState(() => (remote && loadedOptions) || TRAINING_CODE_FALLBACK);

  useEffect(() => {
    if (!remote || loadedOptions) return undefined;
    let ignore = false;
    loadOptions()
      .then((data) => {
        if (!ignore) setOptions(data);
      })
      .catch(() => {
        // giữ bản tĩnh
      });
    return () => {
      ignore = true;
    };
  }, [remote]);

  const label = (group, code) => {
    if (!code) return "";
    return findLabel(options, group, code) ?? findLabel(TRAINING_CODE_FALLBACK, group, code) ?? code;
  };

  return { options, label };
}
