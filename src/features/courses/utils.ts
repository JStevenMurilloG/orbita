import { COURSE_COLORS, type CourseColor } from "@/lib/design/course-colors";
import type { CourseFormValues } from "./schemas";
import type { Course } from "./types";

const graphemes = new Intl.Segmenter("es", { granularity: "grapheme" });
const EMOJI = /^(?:\p{Extended_Pictographic}|\p{Regional_Indicator}{2}|[0-9#*]\uFE0F?\u20E3)/u;

/** ¿El texto es exactamente un emoji (incluidos modificadores, ZWJ y banderas)? */
export function isSingleEmoji(value: string): boolean {
  const segments = [...graphemes.segment(value)];
  return segments.length === 1 && EMOJI.test(value);
}

/**
 * Color para una clase nueva: el primero de la paleta que aún no usa el trimestre; si ya
 * están todos, el menos repetido. Así las clases se distinguen sin que el usuario elija.
 */
export function suggestCourseColor(usedColors: readonly string[]): CourseColor {
  const counts = new Map<CourseColor, number>(COURSE_COLORS.map((color) => [color, 0]));
  for (const color of usedColors) {
    if (counts.has(color as CourseColor))
      counts.set(color as CourseColor, counts.get(color as CourseColor)! + 1);
  }
  let best: CourseColor = COURSE_COLORS[0];
  for (const color of COURSE_COLORS) {
    if (counts.get(color)! < counts.get(best)!) best = color;
  }
  return best;
}

/**
 * Nuevo orden tras mover una clase una posición antes (-1) o después (+1).
 * Devuelve `null` si ya está en el extremo o no está en la lista.
 */
export function moveInOrder(ids: readonly string[], id: string, offset: -1 | 1): string[] | null {
  const from = ids.indexOf(id);
  const to = from + offset;
  if (from === -1 || to < 0 || to >= ids.length) return null;
  const next = [...ids];
  [next[from], next[to]] = [next[to], next[from]];
  return next;
}

/** Créditos para mostrar: "3 créditos", "4,5 créditos", "1 crédito". */
export function formatCredits(credits: number): string {
  const text = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 1 }).format(credits);
  return `${text} ${credits === 1 ? "crédito" : "créditos"}`;
}

/** Valores del formulario para editar una clase existente. */
export function courseToFormValues(course: Course): CourseFormValues {
  return {
    name: course.name,
    code: course.code ?? "",
    description: course.description ?? "",
    color: course.color,
    icon: course.icon ?? "",
    room: course.room ?? "",
    credits: course.credits === null ? "" : String(course.credits).replace(".", ","),
  };
}
