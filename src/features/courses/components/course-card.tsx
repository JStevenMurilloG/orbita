import Link from "next/link";
import { MapPinIcon, UserIcon } from "lucide-react";
import { courseColorStyle } from "@/lib/design/course-colors";
import type { Course } from "../types";
import { formatCredits } from "../utils";
import { CourseIcon } from "./course-icon";

/** Tarjeta de una clase en la lista del trimestre (plan §24 `CourseCard`): 1 clic a su espacio. */
export function CourseCard({
  course,
  teacherName,
  actions,
}: {
  course: Course;
  teacherName?: string | null;
  /** Controles fuera del enlace (p. ej. reordenar). */
  actions?: React.ReactNode;
}) {
  return (
    <article
      className="relative flex h-full flex-col gap-3 overflow-hidden rounded-xl border bg-card p-4 pl-5 transition-colors focus-within:ring-3 focus-within:ring-ring/50 hover:bg-muted/40"
      aria-labelledby={`course-${course.id}-name`}
    >
      {/* Franja con el color de la clase. */}
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-1.5"
        style={{ backgroundColor: `var(--course-${course.color}-fg)` }}
      />
      <div className="flex items-start gap-3">
        <CourseIcon icon={course.icon} name={course.name} color={course.color} />
        <div className="min-w-0 flex-1">
          <h3 id={`course-${course.id}-name`} className="leading-snug font-medium">
            <Link
              href={`/clases/${course.id}`}
              className="outline-none after:absolute after:inset-0 after:content-['']"
            >
              {course.name}
            </Link>
          </h3>
          {course.code ? (
            <span
              className="mt-1 inline-flex rounded-md border px-1.5 py-0.5 font-mono text-xs"
              style={courseColorStyle(course.color)}
            >
              {course.code}
            </span>
          ) : null}
        </div>
      </div>
      <dl className="flex flex-col gap-1 text-sm text-muted-foreground">
        {teacherName ? (
          <div>
            <dt className="sr-only">Docente</dt>
            <dd className="flex min-w-0 items-center gap-1.5">
              <UserIcon className="size-3.5 shrink-0" aria-hidden />
              <span className="truncate">{teacherName}</span>
            </dd>
          </div>
        ) : null}
        {course.room ? (
          <div>
            <dt className="sr-only">Aula</dt>
            <dd className="flex min-w-0 items-center gap-1.5">
              <MapPinIcon className="size-3.5 shrink-0" aria-hidden />
              <span className="truncate">{course.room}</span>
            </dd>
          </div>
        ) : null}
        {course.credits !== null ? (
          <div>
            <dt className="sr-only">Créditos</dt>
            <dd>{formatCredits(course.credits)}</dd>
          </div>
        ) : null}
      </dl>
      {actions ? (
        <div className="relative z-10 mt-auto flex justify-end gap-1">{actions}</div>
      ) : null}
    </article>
  );
}
