import { apiRequest, apiUploadForm } from "./apiClient";
import { getHorseAge } from "../utils/date";
import { DUPLICATE_HORSE_NAME, INVALID_BIRTH_DATE } from "../data/horseOptions";

const collapseSpaces = (text) => text.trim().replace(/\s+/g, " ");

function pick(obj, ...keys) {
  for (const key of keys) {
    if (obj != null && obj[key] !== undefined && obj[key] !== null) return obj[key];
  }
  return undefined;
}

export function extractHorseId(raw) {
  const id = pick(raw, "horseID", "horseId", "HorseID", "HorseId", "id");
  const n = Number(id);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function resolvePhotoUrl(url) {
  if (!url) return null;
  if (url.startsWith("/media/")) return url;
  return url;
}

/** Chuẩn hóa HorseDto từ API → shape FE (photo, HorseID, …). */
export function mapHorseFromApi(raw) {
  if (!raw) return null;
  return {
    HorseID: extractHorseId(raw) ?? 0,
    Ten: pick(raw, "ten", "Ten") ?? "",
    Giong: pick(raw, "giong", "Giong") ?? "",
    Tuoi: pick(raw, "tuoi", "Tuoi") ?? 0,
    CanNang: Number(pick(raw, "canNang", "CanNang") ?? 0),
    DongDoi: pick(raw, "dongDoi", "DongDoi") ?? "",
    OwnerID: pick(raw, "ownerID", "OwnerID"),
    photo: resolvePhotoUrl(pick(raw, "photoUrl", "PhotoUrl") ?? null),
    GioiTinh: pick(raw, "gioiTinh", "GioiTinh") ?? "",
    MauLong: pick(raw, "mauLong", "MauLong") ?? "",
    NgaySinh: pick(raw, "ngaySinh", "NgaySinh") ?? "",
    ChieuCao: pick(raw, "chieuCao", "ChieuCao"),
  };
}

function mapHealthFromApi(raw) {
  return {
    HorseID: extractHorseId(raw) ?? 0,
    TrangThai: pick(raw, "trangThai", "TrangThai") ?? "",
    NgayCapNhat: pick(raw, "ngayCapNhat", "NgayCapNhat") ?? "",
  };
}

function isStoredPhotoUrl(value) {
  if (!value || typeof value !== "string") return false;
  return (
    value.startsWith("https://")
    || value.startsWith("http://")
    || value.startsWith("/media/")
  );
}

/** Quyết định photoUrl gửi kèm JSON (tránh xóa ảnh Cloudinary khi sẽ upload file mới). */
export function resolvePhotoUrlForSave(form, { photoFile, originalPhotoUrl, isEdit }) {
  if (photoFile && form.photo?.startsWith("data:")) {
    return form.photo;
  }
  if (photoFile) {
    return isEdit ? originalPhotoUrl ?? null : null;
  }
  if (form.photo?.startsWith("data:")) {
    return form.photo;
  }
  if (isStoredPhotoUrl(form.photo)) {
    return form.photo;
  }
  return null;
}

function toSaveHorseBody(data, photoUrl) {
  const age = getHorseAge(data.NgaySinh);
  return {
    ten: collapseSpaces(data.Ten),
    giong: collapseSpaces(data.Giong),
    tuoi: age ?? 0,
    canNang: Number(data.CanNang),
    dongDoi: collapseSpaces(data.DongDoi),
    ownerID: Number(data.OwnerID),
    photoUrl: photoUrl ?? null,
    gioiTinh: data.GioiTinh || null,
    mauLong: data.MauLong ? collapseSpaces(data.MauLong) : null,
    ngaySinh: data.NgaySinh || null,
    chieuCao: data.ChieuCao != null && data.ChieuCao !== "" ? Number(data.ChieuCao) : null,
    trangThaiSucKhoe: data.TrangThaiSucKhoe || null,
  };
}

/** Lưu hồ sơ + upload ảnh (multipart → Cloudinary qua BE). */
export async function saveHorseWithPhoto({ horseId, form, photoFile, originalPhotoUrl }) {
  const isEdit = Boolean(horseId);
  const photoUrl = resolvePhotoUrlForSave(form, { photoFile, originalPhotoUrl, isEdit });
  const body = toSaveHorseBody(form, photoUrl);

  try {
    const saved = isEdit
      ? await apiRequest(`/manager/horses/${horseId}`, { method: "PUT", body })
      : await apiRequest("/manager/horses", { method: "POST", body });

    let result = mapHorseFromApi(saved);
    const horseIdForPhoto =
      extractHorseId(saved) ?? extractHorseId(result) ?? (isEdit ? Number(horseId) : null);

    const photoSentInJson = typeof photoUrl === "string" && photoUrl.startsWith("data:");
    if (photoFile && horseIdForPhoto && !photoSentInJson) {
      try {
        result = await uploadHorsePhoto(horseIdForPhoto, photoFile);
      } catch (uploadErr) {
        if (uploadErr.status === 404 && form.photo?.startsWith("data:")) {
          const patched = await apiRequest(`/manager/horses/${horseIdForPhoto}`, {
            method: "PUT",
            body: toSaveHorseBody(form, form.photo),
          });
          result = mapHorseFromApi(patched);
        } else {
          throw uploadErr;
        }
      }
    }
    return result;
  } catch (err) {
    if (isEdit && err.status === 404) throw new Error("Không tìm thấy ngựa");
    mapApiError(err);
  }
}

function mapApiError(err) {
  if (err?.message?.includes("tên") || err?.message?.toLowerCase().includes("trùng")) {
    throw new Error(DUPLICATE_HORSE_NAME);
  }
  if (err?.message?.includes("ngày sinh") || err?.message?.includes("NgaySinh")) {
    throw new Error(INVALID_BIRTH_DATE);
  }
  if (
    err?.message?.includes("Cloudinary")
    || err?.message?.includes("Ảnh")
    || err?.message?.includes("upload")
  ) {
    const photoErr = new Error(err.message);
    photoErr.field = "photo";
    throw photoErr;
  }
  throw err;
}

/** Upload file ảnh (multipart) — ưu tiên khi tạo/sửa có file mới. */
export async function uploadHorsePhoto(horseId, file) {
  const form = new FormData();
  form.append("file", file, file.name || "horse-photo.jpg");
  try {
    const payload = await apiUploadForm(`/manager/horses/${horseId}/photo`, form);
    return mapHorseFromApi(payload);
  } catch (err) {
    const photoErr = new Error(err.message ?? "Không upload được ảnh.");
    photoErr.field = "photo";
    photoErr.status = err.status;
    throw photoErr;
  }
}

export async function getHorses() {
  const data = await apiRequest("/horses");
  return (data ?? []).map(mapHorseFromApi);
}

export async function getHorseById(horseId) {
  try {
    const data = await apiRequest(`/horses/${horseId}`);
    return mapHorseFromApi(data);
  } catch (err) {
    if (err.status === 404) return null;
    throw err;
  }
}

export async function createHorse(data, photoUrlOverride) {
  try {
    const url = photoUrlOverride !== undefined ? photoUrlOverride : resolvePhotoUrlForSave(data, { photoFile: null, originalPhotoUrl: null, isEdit: false });
    const created = await apiRequest("/manager/horses", {
      method: "POST",
      body: toSaveHorseBody(data, url),
    });
    return mapHorseFromApi(created);
  } catch (err) {
    mapApiError(err);
  }
}

export async function updateHorse(horseId, data, photoUrlOverride) {
  try {
    const url =
      photoUrlOverride !== undefined
        ? photoUrlOverride
        : resolvePhotoUrlForSave(data, { photoFile: null, originalPhotoUrl: data.photo, isEdit: true });
    const updated = await apiRequest(`/manager/horses/${horseId}`, {
      method: "PUT",
      body: toSaveHorseBody(data, url),
    });
    return mapHorseFromApi(updated);
  } catch (err) {
    if (err.status === 404) throw new Error("Không tìm thấy ngựa");
    mapApiError(err);
  }
}

export async function deleteHorse(horseId) {
  await apiRequest(`/manager/horses/${horseId}`, { method: "DELETE" });
}

export async function getHealthStatuses() {
  const data = await apiRequest("/horses/health-statuses");
  return (data ?? []).map(mapHealthFromApi);
}

export async function getHorseOwners() {
  const data = await apiRequest("/manager/horses/owners");
  return (data ?? []).map((o) => ({
    UserID: pick(o, "userID", "UserID"),
    HoTen: pick(o, "hoTen", "HoTen") ?? "",
    Email: pick(o, "email", "Email") ?? "",
    isActive: true,
  }));
}
