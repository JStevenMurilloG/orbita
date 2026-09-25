import { AppError, ERROR_CODES, type ErrorCode } from "./app-error";

/** Forma mínima de un error de PostgREST / supabase-js. */
export type PostgrestLikeError = {
  code?: string;
  message?: string;
  details?: string | null;
  hint?: string | null;
};

/**
 * Mapeo central Postgres → AppError (plan §28).
 * - 23505 unique_violation → CONFLICT
 * - 23503 foreign_key_violation → NOT_FOUND (padre inexistente o ajeno: no revelar existencia)
 * - 23514 check_violation / 22xxx datos inválidos → VALIDATION
 * - 42501 insufficient_privilege (RLS) → NOT_FOUND
 * - PGRST116 (0 filas en .single()) → NOT_FOUND
 * - P0001 raise_exception con un código propio en el mensaje (p. ej. TERM_ARCHIVED) → ese código
 */
export function mapPostgresError(error: PostgrestLikeError): AppError {
  const code = error.code ?? "";

  if (code === "P0001") {
    const custom = (error.message ?? "").trim();
    if (custom in ERROR_CODES) return new AppError(custom as ErrorCode, { cause: error });
    return new AppError("VALIDATION", { cause: error });
  }

  switch (code) {
    case "23505":
      return new AppError("CONFLICT", { cause: error });
    case "23503":
    case "42501":
    case "PGRST116":
      return new AppError("NOT_FOUND", { cause: error });
    case "23514":
    case "23502":
      return new AppError("VALIDATION", { cause: error });
  }

  // Clase 22: excepciones de datos (formato de fecha, valor fuera de rango, texto inválido…).
  if (code.startsWith("22")) return new AppError("VALIDATION", { cause: error });

  return new AppError("INTERNAL", { cause: error });
}
