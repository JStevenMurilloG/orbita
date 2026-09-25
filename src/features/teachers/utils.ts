/** Mismo criterio que el CHECK `teachers_phone_format`. */
export function isValidPhone(value: string): boolean {
  const digits = value.replace(/\D/g, "").length;
  return /^\+?[0-9 ().-]{3,30}$/.test(value) && digits >= 3 && digits <= 20;
}

/** Enlace `mailto:` para escribir al docente con un clic. */
export function mailtoHref(email: string): string {
  return `mailto:${email}`;
}

/** Enlace `tel:` (RFC 3966): solo dígitos y el "+" inicial. */
export function telHref(phone: string): string {
  const trimmed = phone.trim();
  return `tel:${trimmed.startsWith("+") ? "+" : ""}${trimmed.replace(/\D/g, "")}`;
}

/** Texto comparable para buscar docentes: minúsculas y sin tildes. */
export function normalizeForSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

/** Docentes cuyo nombre o correo contiene la búsqueda (sin distinguir tildes ni mayúsculas). */
export function filterTeachers<T extends { full_name: string; email: string | null }>(
  teachers: readonly T[],
  query: string,
): T[] {
  const needle = normalizeForSearch(query);
  if (!needle) return [...teachers];
  return teachers.filter(
    (teacher) =>
      normalizeForSearch(teacher.full_name).includes(needle) ||
      (teacher.email ? normalizeForSearch(teacher.email).includes(needle) : false),
  );
}
