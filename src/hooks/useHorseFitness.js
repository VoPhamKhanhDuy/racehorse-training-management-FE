import { getFitnessAssessment } from "../services/trainingApi";
import useApiResource from "./useApiResource";

// Thể trạng hiện tại của 1 ngựa (GET /api/trainer/horses/{id}/fitness-assessment).
// horseId trống → không gọi API. reload(): đánh giá lại (vd sau khi bác sĩ thú y vừa khóa huấn luyện).
export default function useHorseFitness(horseId) {
  const { data, error, loading, reload } = useApiResource(() => getFitnessAssessment(horseId), horseId ? String(horseId) : null);
  return { fitness: data ?? null, error, loading, reload };
}
