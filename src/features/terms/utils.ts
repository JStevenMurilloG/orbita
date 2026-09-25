import { getToday } from "@/lib/dates/zone";
import type { TermFormValues, TermStatus } from "./schemas";
import type { Term, TermTransition } from "./types";

/** Estado de origen permitido y estado de destino de cada transición (plan §12). */
const TRANSITIONS: Record<TermTransition, { from: TermStatus[]; to: TermStatus }> = {
  finish: { from: ["active"], to: "finished" },
  reopen: { from: ["finished"], to: "active" },
  archive: { from: ["active", "finished"], to: "archived" },
  unarchive: { from: ["archived"], to: "finished" },
};

/** Estado resultante de aplicar la transición, o `null` si no se permite desde `current`. */
export function nextTermStatus(current: TermStatus, transition: TermTransition): TermStatus | null {
  const rule = TRANSITIONS[transition];
  return rule.from.includes(current) ? rule.to : null;
}

/** Transiciones disponibles para un estado, en el orden en que se ofrecen en la UI. */
export function availableTransitions(current: TermStatus): TermTransition[] {
  return (Object.keys(TRANSITIONS) as TermTransition[]).filter(
    (transition) => nextTermStatus(current, transition) !== null,
  );
}

/** ¿Dónde cae `today` (fecha civil) respecto del rango del trimestre? */
export function termPeriod(
  term: Pick<Term, "start_date" | "end_date">,
  today: string,
): "upcoming" | "current" | "past" {
  if (today < term.start_date) return "upcoming";
  if (today > term.end_date) return "past";
  return "current";
}

/** Confirmación de borrado: el nombre escrito debe coincidir (sin espacios de más). */
export function confirmNameMatches(termName: string, typed: string): boolean {
  return typed.trim() === termName.trim();
}

/** Valores iniciales del formulario de un trimestre nuevo: empieza "hoy" en la zona dada. */
export function newTermDefaults(timeZone: string, now: Date = new Date()): TermFormValues {
  const today = getToday(timeZone, now);
  return {
    name: "",
    year: Number(today.slice(0, 4)),
    start_date: today,
    end_date: "",
    timezone: timeZone,
    description: "",
  };
}
