import { z } from "zod";
import { AppError, isAppError, type SerializedError } from "./app-error";
import { isAuthLikeError, mapAuthError } from "./auth";
import { mapPostgresError, type PostgrestLikeError } from "./postgres";

/** Resultado de una Server Action: nunca lanza hacia el cliente. */
export type Result<T> = { ok: true; data: T } | { ok: false; error: SerializedError };

export function ok<T>(data: T): Result<T> {
  return { ok: true, data };
}

export function fail(error: AppError): Result<never> {
  return { ok: false, error: error.toJSON() };
}

function isPostgrestLikeError(value: unknown): value is PostgrestLikeError {
  return (
    typeof value === "object" &&
    value !== null &&
    "code" in value &&
    typeof (value as { code: unknown }).code === "string" &&
    "message" in value
  );
}

/** Convierte cualquier valor lanzado en un AppError conocido. */
export function toAppError(error: unknown): AppError {
  if (isAppError(error)) return error;
  if (error instanceof z.ZodError) {
    const fields: Record<string, string[]> = {};
    for (const issue of error.issues) {
      const key = issue.path.join(".") || "_";
      (fields[key] ??= []).push(issue.message);
    }
    return new AppError("VALIDATION", { fields, cause: error });
  }
  // Antes que Postgres: los errores de Auth también tienen code + message.
  if (isAuthLikeError(error)) return mapAuthError(error);
  if (isPostgrestLikeError(error)) return mapPostgresError(error);
  return new AppError("INTERNAL", { cause: error });
}

/**
 * Ejecuta una operación y la envuelve en Result.
 * Los errores INTERNAL se registran en servidor (Sentry llegará en la Fase 13).
 */
export async function toResult<T>(fn: () => Promise<T>): Promise<Result<T>> {
  try {
    return ok(await fn());
  } catch (error) {
    const appError = toAppError(error);
    if (appError.code === "INTERNAL") console.error("[INTERNAL]", error);
    return fail(appError);
  }
}
