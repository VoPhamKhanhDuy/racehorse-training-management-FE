// TODO: thay bằng gọi API thật khi BE xong (BE kiểm tra khóa ngoại trước khi xóa HORSE)
// Kiểm tra 1 ngựa đã có dữ liệu liên quan chưa — có rồi thì KHÔNG cho xóa hồ sơ (tránh mất lịch sử huấn luyện/sức khỏe).
// Tách riêng khỏi horseService để không import vòng (trainerService đã import horseService).
import { deleteHorse, getHealthStatuses } from "./horseService";
import { getHorseIdsWithLocks, getHorseIdsWithRecords, getHorseIdsWithVaccinations } from "./vetService";
import { getRaceRegistrations, getSchedules, getTrainingPlans, getTrainingSessions } from "./trainerService";

// Tập HorseID đã có dữ liệu ở bất kỳ bảng liên quan nào:
// TRAININGPLAN, TRAININGSCHEDULE, TRAININGSESSION, RACEREGISTRATION, TRAININGLOCK, VACCINATIONSCHEDULE, MEDICALRECORD, HEALTHSTATUS.
// (Tạo ngựa mới không sinh bản ghi HEALTHSTATUS mặc định, nên mọi bản ghi sức khỏe đều tính là dữ liệu thật.)
export async function getHorseIdsWithRelatedData() {
  const [plans, schedules, sessions, registrations, healthList] = await Promise.all([
    getTrainingPlans(),
    getSchedules(),
    getTrainingSessions(),
    getRaceRegistrations(),
    getHealthStatuses(),
  ]);
  return new Set(
    [plans, schedules, sessions, registrations, healthList]
      .flat()
      .map((record) => record.HorseID)
      .concat([...getHorseIdsWithRecords(), ...getHorseIdsWithLocks(), ...getHorseIdsWithVaccinations()])
  );
}

// Xóa hồ sơ ngựa — kiểm tra lại ngay trước khi xóa (dữ liệu có thể vừa được thêm từ màn khác)
export async function deleteHorseIfUnused(horseId) {
  const usedIds = await getHorseIdsWithRelatedData();
  if (usedIds.has(Number(horseId))) {
    throw new Error("Ngựa đã có dữ liệu huấn luyện/sức khỏe nên không thể xóa.");
  }
  await deleteHorse(horseId);
}
