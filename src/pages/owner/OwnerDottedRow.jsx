import styles from "./OwnerHorseCard.module.css";

// 1 dòng "bảng đường chấm" ở trang chi tiết ngựa của chủ ngựa: nhãn · đường chấm · giá trị.
// value rỗng → "Chưa có" chữ nhạt. stacked: giá trị dài (lịch sinh hoạt, khẩu phần) xuống dòng dưới nhãn, canh trái.
export default function OwnerDottedRow({ label, value, stacked = false }) {
  const empty = value === undefined || value === null || value === "";
  const valueNode = empty ? <span className={styles.muted}>Chưa có</span> : value;

  if (stacked) {
    return (
      <div className={styles.stackRow}>
        <dt className={styles.specLabel}>{label}</dt>
        <dd className={styles.stackValue}>{valueNode}</dd>
      </div>
    );
  }
  return (
    <div className={styles.specRow}>
      <dt className={styles.specLabel}>{label}</dt>
      <span aria-hidden="true" className={styles.leader} />
      <dd className={styles.specValue}>{valueNode}</dd>
    </div>
  );
}
