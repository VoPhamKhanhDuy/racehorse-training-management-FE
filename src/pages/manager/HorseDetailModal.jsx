import { Link } from "react-router-dom";
import { Pencil, Trash2 } from "lucide-react";
import HealthStatusBadge from "../../components/HealthStatusBadge";
import Modal from "../../components/Modal";
import { formatDate } from "../../utils/date";

// Một dòng thông tin trong modal: nhãn trên, giá trị dưới
function DetailItem({ label, children, wide = false }) {
  return (
    <div className={wide ? "sm:col-span-2" : ""}>
      <dt className="text-sm text-stone">{label}</dt>
      <dd className="mt-0.5 text-ink">{children}</dd>
    </div>
  );
}

// Modal chi tiết hồ sơ ngựa, có nút Sửa (sang trang sửa) và Xóa (trang cha mở ConfirmDialog)
export default function HorseDetailModal({ horse, owner, healthRecord, onClose, onDelete }) {
  return (
    <Modal open={Boolean(horse)} title={horse ? `Hồ sơ ngựa ${horse.Ten}` : ""} onClose={onClose}>
      {horse && (
        <>
          {horse.photo && (
            <img
              src={horse.photo}
              alt={`Ảnh ngựa ${horse.Ten}`}
              className="mb-5 aspect-video w-full rounded-sm object-cover object-[center_25%]"
            />
          )}
          <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
            <DetailItem label="Tên ngựa">
              <span className="font-serif text-base font-semibold">{horse.Ten}</span>
            </DetailItem>
            <DetailItem label="Giống">{horse.Giong || "—"}</DetailItem>
            <DetailItem label="Tuổi">{horse.Tuoi} tuổi</DetailItem>
            <DetailItem label="Cân nặng">{horse.CanNang.toLocaleString("vi-VN")} kg</DetailItem>
            <DetailItem label="Dòng dõi" wide>
              {horse.DongDoi || "—"}
            </DetailItem>
            <DetailItem label="Trạng thái sức khỏe" wide>
              <HealthStatusBadge status={healthRecord?.TrangThai} />
              {healthRecord?.NgayCapNhat && (
                <span className="ml-2 text-sm text-stone">(cập nhật {formatDate(healthRecord.NgayCapNhat)})</span>
              )}
            </DetailItem>
            <DetailItem label="Chủ sở hữu" wide>
              {owner ? (
                <>
                  {owner.HoTen}
                  {owner.Email && <span className="block text-sm text-stone">{owner.Email}</span>}
                </>
              ) : (
                "Chưa rõ"
              )}
            </DetailItem>
          </dl>

          <div className="mt-8 flex flex-wrap justify-end gap-3 border-t border-stone/15 pt-5">
            <button
              type="button"
              onClick={() => onDelete(horse)}
              className="inline-flex cursor-pointer items-center gap-2 rounded-sm border border-alert/40 px-4 py-2 text-sm font-semibold text-alert transition-colors hover:bg-alert/5"
            >
              <Trash2 className="h-4 w-4" />
              Xóa hồ sơ
            </button>
            <Link
              to={`/manager/horses/${horse.HorseID}/edit`}
              className="inline-flex items-center gap-2 rounded-sm bg-brass px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-brass/85"
            >
              <Pencil className="h-4 w-4" />
              Sửa hồ sơ
            </Link>
          </div>
        </>
      )}
    </Modal>
  );
}
