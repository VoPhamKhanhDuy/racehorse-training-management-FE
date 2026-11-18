// Lấy giá trị đầu tiên khác null/undefined theo danh sách khóa (DTO của BE có thể là camelCase hoặc PascalCase)
export function pick(obj, ...keys) {
  for (const key of keys) {
    if (obj != null && obj[key] !== undefined && obj[key] !== null) return obj[key];
  }
  return undefined;
}
