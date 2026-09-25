import "server-only";
import { cache } from "react";
import { getCurrentTerms } from "@/features/terms/queries";
import type { Term } from "@/features/terms/types";
import { getUser } from "@/lib/auth";
import { isAppError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import { uuidSchema } from "@/lib/validation/common";
import { getCourse, listCourses } from "./service";
import type { Course } from "./types";

/** Clases visibles de un trimestre del usuario (deduplicado por petición). */
export const getTermCourses = cache(async (termId: string): Promise<Course[]> => {
  const user = await getUser();
  if (!user || !uuidSchema.safeParse(termId).success) return [];
  return listCourses(await createClient(), termId);
});

/**
 * Clase propia (fuera de la papelera) con su trimestre, o `null` si no existe, es ajena o
 * el id no es válido. La comparten el layout y las pestañas del espacio de la clase.
 */
export const getCourseWithTerm = cache(
  async (courseId: string): Promise<{ course: Course; term: Term } | null> => {
    const user = await getUser();
    if (!user || !uuidSchema.safeParse(courseId).success) return null;
    try {
      const course = await getCourse(await createClient(), courseId);
      const term = (await getCurrentTerms()).find((t) => t.id === course.term_id);
      return term ? { course, term } : null;
    } catch (error) {
      if (isAppError(error) && error.code === "NOT_FOUND") return null;
      throw error;
    }
  },
);
