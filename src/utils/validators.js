export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export const MIN_PASSWORD_LENGTH = 6;

export function isValidPassword(password) {
  return password.length >= MIN_PASSWORD_LENGTH;
}
