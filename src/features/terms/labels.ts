import type { TermStatus } from "./schemas";
import type { TermSummary } from "./types";

/**
 * Etiquetas del ciclo de vida. El estado `active` se muestra como "En curso" para no
 * confundirlo con el trimestre activo (la selección del usuario, plan §12).
 */
export const TERM_STATUS_LABELS: Record<TermStatus, string> = {
  active: "En curso",
  finished: "Finalizado",
  archived: "Archivado",
};

/** "Segundo trimestre · 2026" (plan §22). */
export function termLabel(term: Pick<TermSummary, "name" | "year">): string {
  return `${term.name} · ${term.year}`;
}
