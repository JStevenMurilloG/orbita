import type { CourseColor } from "@/lib/design/course-colors";
import type { Tables } from "@/types/database";

/** Clase con el color tipado como token de la paleta (la BD lo garantiza con un CHECK). */
export type Course = Omit<Tables<"courses">, "color"> & { color: CourseColor };
