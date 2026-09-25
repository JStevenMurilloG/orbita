"use client";

import { CheckIcon } from "lucide-react";
import { COURSE_COLOR_LABELS, COURSE_COLORS, type CourseColor } from "@/lib/design/course-colors";
import { cn } from "@/lib/utils";

/**
 * Paleta fija de 12 colores de clase (plan §6, §24). Grupo de radios nativo: flechas para
 * moverse, nombre del color como etiqueta accesible y marca ✓ en el elegido (no solo color).
 * Cada muestra usa el fondo suave del token con su borde/primer plano, que tienen contraste
 * AA en claro y oscuro (comprobado en `course-colors.test.ts`).
 */
export function ColorPicker({
  name,
  value,
  onChange,
  onBlur,
  legendId,
  describedBy,
  invalid,
}: {
  name: string;
  value: CourseColor;
  onChange: (color: CourseColor) => void;
  onBlur?: () => void;
  legendId: string;
  describedBy?: string;
  invalid?: boolean;
}) {
  return (
    <div
      role="radiogroup"
      aria-labelledby={legendId}
      aria-describedby={describedBy}
      aria-invalid={invalid || undefined}
      className="grid grid-cols-6 gap-2 sm:flex sm:flex-wrap"
    >
      {COURSE_COLORS.map((color) => {
        const checked = value === color;
        return (
          <label
            key={color}
            className="relative flex justify-center"
            title={COURSE_COLOR_LABELS[color]}
          >
            <input
              type="radio"
              name={name}
              value={color}
              checked={checked}
              onChange={() => onChange(color)}
              onBlur={onBlur}
              aria-label={COURSE_COLOR_LABELS[color]}
              className="peer sr-only"
            />
            <span
              aria-hidden
              data-color={color}
              style={{
                backgroundColor: `var(--course-${color})`,
                borderColor: `var(--course-${color}-fg)`,
                color: `var(--course-${color}-fg)`,
              }}
              className={cn(
                "flex size-9 cursor-pointer items-center justify-center rounded-full border-2 transition-shadow",
                "peer-focus-visible:ring-3 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background",
                checked && "ring-2 ring-foreground ring-offset-2 ring-offset-background",
              )}
            >
              {checked ? <CheckIcon className="size-4" strokeWidth={3} /> : null}
            </span>
          </label>
        );
      })}
    </div>
  );
}
