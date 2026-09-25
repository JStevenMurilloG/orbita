import type { AuthUser } from "@/lib/auth";

/** Destino por defecto tras iniciar sesión. */
export const DEFAULT_AFTER_LOGIN = "/hoy";

/**
 * Normaliza el parámetro `next` para redirigir tras autenticarse.
 * Solo rutas internas: evita redirecciones abiertas (`//evil.com`, `https://…`, `/\evil`).
 */
export function safeNextPath(next: unknown, fallback: string = DEFAULT_AFTER_LOGIN): string {
  if (typeof next !== "string" || next.length === 0 || next.length > 512) return fallback;
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  // Caracteres de control (p. ej. saltos de línea) no tienen cabida en una ruta.
  if (/[\u0000-\u001f\u007f]/.test(next)) return fallback;
  try {
    const url = new URL(next, "http://orbita.local");
    if (url.origin !== "http://orbita.local") return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}

/** Métodos de las sesiones abiertas desde un enlace de correo (confirmación o recuperación). */
const EMAIL_LINK_METHODS = new Set(["otp", "magiclink", "recovery"]);
/** Vida útil de la sesión de recuperación para elegir contraseña nueva sin la actual. */
export const RECOVERY_WINDOW_MS = 60 * 60 * 1000;

/**
 * ¿La sesión se abrió hace poco con un enlace de correo? Solo entonces se permite fijar
 * una contraseña sin conocer la actual (flujo de recuperación). Una sesión iniciada con
 * contraseña debe usar el cambio de contraseña de Configuración.
 */
export function isRecentEmailLinkSession(user: AuthUser, now: Date = new Date()): boolean {
  if (!user.authMethod || !EMAIL_LINK_METHODS.has(user.authMethod.method)) return false;
  return now.getTime() - user.authMethod.at.getTime() <= RECOVERY_WINDOW_MS;
}
