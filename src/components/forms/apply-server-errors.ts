import type { FieldValues, Path, UseFormReturn } from "react-hook-form";
import type { SerializedError } from "@/lib/errors";

/**
 * Lleva el error de una Server Action al formulario (plan §6, §28):
 * errores por campo → `setError` en cada campo (foco en el primero);
 * el resto → `root.server`, que muestra `FormAlert`.
 */
export function applyServerErrors<T extends FieldValues>(
  form: UseFormReturn<T>,
  error: SerializedError,
): void {
  const known = new Set(Object.keys(form.getValues()));
  let focused = false;
  let assigned = false;

  for (const [field, messages] of Object.entries(error.fields ?? {})) {
    if (!known.has(field) || messages.length === 0) continue;
    form.setError(field as Path<T>, { message: messages[0] }, { shouldFocus: !focused });
    focused = true;
    assigned = true;
  }

  if (!assigned) form.setError("root.server", { message: error.message });
}
