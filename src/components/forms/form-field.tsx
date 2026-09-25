import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";

/** ids de ayuda y error de un campo, para `aria-describedby`. */
export function fieldDescribedBy(id: string, opts: { error?: unknown; description?: unknown }) {
  const ids = [opts.description ? `${id}-description` : null, opts.error ? `${id}-error` : null];
  return ids.filter(Boolean).join(" ") || undefined;
}

/**
 * Etiqueta + control + ayuda + error. El control debe llevar `id`, `aria-invalid`
 * y `aria-describedby={fieldDescribedBy(id, …)}`.
 */
export function FormField({
  id,
  label,
  description,
  error,
  action,
  children,
}: {
  id: string;
  label: React.ReactNode;
  description?: React.ReactNode;
  error?: string;
  /** Enlace o botón junto a la etiqueta (p. ej. "¿Olvidaste tu contraseña?"). */
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Field data-invalid={error ? true : undefined}>
      <div className="flex items-center justify-between gap-2">
        <FieldLabel htmlFor={id}>{label}</FieldLabel>
        {action}
      </div>
      {children}
      {description ? (
        <FieldDescription id={`${id}-description`}>{description}</FieldDescription>
      ) : null}
      {error ? <FieldError id={`${id}-error`}>{error}</FieldError> : null}
    </Field>
  );
}
