export const MAX_LENGTH = {
  firstName: 80,
  lastName: 80,
  email: 254,
  phone: 30,
  workshop: 200,
  consent: 5,
} as const;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/;

export const FIELD_NAMES = [
  "firstName",
  "lastName",
  "email",
  "phone",
  "workshop",
  "consent",
] as const;

export type FieldName = (typeof FIELD_NAMES)[number];

export function validateField(name: FieldName, raw: string): string | null {
  const value = raw.trim();

  if (value.length === 0) {
    return name === "consent"
      ? "Bez zgody nie możemy przyjąć zgłoszenia."
      : "To pole jest wymagane.";
  }

  if (value.length > MAX_LENGTH[name]) {
    return `Maksymalnie ${MAX_LENGTH[name]} znaków.`;
  }

  if (name === "firstName" || name === "lastName") {
    if (value.length < 2) return "Podaj co najmniej 2 znaki.";
    return null;
  }

  if (name === "email") {
    if (!EMAIL_PATTERN.test(value)) return "Podaj poprawny adres e-mail.";
    return null;
  }

  if (name === "workshop") return null;

  /* Zgoda przychodzi jako "true" albo pusty łańcuch. Pusty wyłapuje warunek
     wyżej, a serwer nie może przyjąć żadnej innej wartości niż "true"
     (np. "false" wysłane ręcznie do API). */
  if (name === "consent") {
    return value === "true" ? null : "Bez zgody nie możemy przyjąć zgłoszenia.";
  }

  const compact = value.replace(/[\s\-().]/g, "");
  const national = compact.startsWith("+48")
    ? compact.slice(3)
    : compact.startsWith("0048")
      ? compact.slice(4)
      : compact;

  if (!/^\d{9}$/.test(national)) {
    return "Podaj numer w formacie 123 456 789 lub +48 123 456 789.";
  }

  return null;
}
