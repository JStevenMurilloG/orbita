/**
 * Códigos de error de la aplicación (plan §28). Cada código tiene un estado HTTP
 * y un mensaje por defecto en español, comprensible para el usuario.
 */
export const ERROR_CODES = {
  UNAUTHENTICATED: { status: 401, message: "Tu sesión expiró. Inicia sesión de nuevo." },
  INVALID_CREDENTIALS: { status: 401, message: "Correo o contraseña incorrectos." },
  EMAIL_NOT_CONFIRMED: { status: 403, message: "Confirma tu correo antes de iniciar sesión." },
  NOT_FOUND: { status: 404, message: "No encontramos este elemento." },
  GONE: { status: 410, message: "Este elemento fue eliminado." },
  VALIDATION: { status: 422, message: "Revisa los datos del formulario." },
  CONFLICT: { status: 409, message: "Ya existe un elemento con esos datos." },
  VERSION_CONFLICT: {
    status: 409,
    message: "Este contenido cambió en otra pestaña o dispositivo.",
  },
  TERM_ARCHIVED: {
    status: 409,
    message: "Este trimestre está archivado. Desarchívalo para editar.",
  },
  FILE_TOO_LARGE: { status: 413, message: "El archivo supera el tamaño permitido." },
  UNSUPPORTED_FILE: { status: 415, message: "Este tipo de archivo no está permitido." },
  QUOTA_EXCEEDED: { status: 507, message: "Alcanzaste el límite de almacenamiento." },
  DRIVE_NOT_CONNECTED: { status: 409, message: "Conecta tu cuenta de Google Drive." },
  DRIVE_REAUTH_REQUIRED: { status: 401, message: "Reconecta tu cuenta de Google Drive." },
  DRIVE_UNAVAILABLE: { status: 409, message: "Este archivo ya no está disponible en Drive." },
  RATE_LIMITED: { status: 429, message: "Demasiados intentos. Espera un momento." },
  NETWORK: { status: 503, message: "Sin conexión. Reintentaremos al volver." },
  INTERNAL: { status: 500, message: "Algo salió mal. Ya lo estamos revisando." },
} as const satisfies Record<string, { status: number; message: string }>;

export type ErrorCode = keyof typeof ERROR_CODES;

/** Errores por campo, con la ruta del campo como clave (p. ej. `end_date`). */
export type FieldErrors = Record<string, string[]>;

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly httpStatus: number;
  readonly fields?: FieldErrors;

  constructor(
    code: ErrorCode,
    options: { message?: string; fields?: FieldErrors; cause?: unknown } = {},
  ) {
    super(options.message ?? ERROR_CODES[code].message, { cause: options.cause });
    this.name = "AppError";
    this.code = code;
    this.httpStatus = ERROR_CODES[code].status;
    this.fields = options.fields;
  }

  /** Forma serializable que viaja al cliente (sin `cause` ni stack). */
  toJSON(): SerializedError {
    return {
      code: this.code,
      message: this.message,
      ...(this.fields ? { fields: this.fields } : {}),
    };
  }
}

export type SerializedError = { code: ErrorCode; message: string; fields?: FieldErrors };

export function isAppError(value: unknown): value is AppError {
  return value instanceof AppError;
}
