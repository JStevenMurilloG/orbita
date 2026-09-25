/**
 * Paleta fija de 12 colores de clase (plan §6). En BD se guarda el token, no el hex.
 * Las variables CSS `--course-<token>` (fondo suave) y `--course-<token>-fg`
 * (texto/acento con contraste AA) están definidas en globals.css para claro y oscuro.
 */
export const COURSE_COLORS = [
  "red",
  "orange",
  "amber",
  "lime",
  "green",
  "teal",
  "cyan",
  "blue",
  "indigo",
  "violet",
  "pink",
  "slate",
] as const;

export type CourseColor = (typeof COURSE_COLORS)[number];

export const COURSE_COLOR_LABELS: Record<CourseColor, string> = {
  red: "Rojo",
  orange: "Naranja",
  amber: "Ámbar",
  lime: "Lima",
  green: "Verde",
  teal: "Verde azulado",
  cyan: "Cian",
  blue: "Azul",
  indigo: "Índigo",
  violet: "Violeta",
  pink: "Rosa",
  slate: "Gris",
};

export function isCourseColor(value: string): value is CourseColor {
  return (COURSE_COLORS as readonly string[]).includes(value);
}

/** Estilos inline para una clase: fondo suave, borde y texto del token. */
export function courseColorStyle(color: CourseColor): React.CSSProperties {
  return {
    backgroundColor: `var(--course-${color})`,
    color: `var(--course-${color}-fg)`,
    borderColor: `var(--course-${color}-fg)`,
  };
}
