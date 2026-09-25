import type { Tables } from "@/types/database";

export type Term = Tables<"terms">;

/** Lo mínimo que necesitan el selector de trimestre y las listas. */
export type TermSummary = Pick<Term, "id" | "name" | "year" | "status">;

/** Acciones de ciclo de vida (plan §12): active ⇄ finished → archived → finished. */
export type TermTransition = "finish" | "reopen" | "archive" | "unarchive";
