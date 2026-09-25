"use client";

import { useOptimistic, useTransition } from "react";
import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { reorderCoursesAction } from "../actions";
import type { Course } from "../types";
import { moveInOrder } from "../utils";
import { CourseCard } from "./course-card";

/**
 * Clases de un trimestre en su orden manual (plan §24 `CourseGrid`). El orden se cambia con
 * "Mover antes/después" (accesible con teclado); el arrastre llegará con las mejoras de UX.
 */
export function CourseGrid({
  termId,
  courses,
  teacherNames,
  readOnly,
}: {
  termId: string;
  courses: Course[];
  /** Nombre del docente principal por id de clase. */
  teacherNames: Record<string, string>;
  readOnly: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [ordered, setOrdered] = useOptimistic(courses);

  const move = (courseId: string, offset: -1 | 1) => {
    const ids = moveInOrder(
      ordered.map((course) => course.id),
      courseId,
      offset,
    );
    if (!ids) return;
    startTransition(async () => {
      const byId = new Map(ordered.map((course) => [course.id, course]));
      setOrdered(ids.map((id) => byId.get(id)!));
      const result = await reorderCoursesAction({ term_id: termId, course_ids: ids });
      if (!result.ok) toast.error(result.error.message);
    });
  };

  return (
    <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-busy={pending || undefined}>
      {ordered.map((course, index) => (
        <li key={course.id}>
          <CourseCard
            course={course}
            teacherName={teacherNames[course.id] ?? null}
            actions={
              readOnly || ordered.length < 2 ? null : (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={index === 0 || pending}
                    aria-label={`Mover ${course.name} antes`}
                    onClick={() => move(course.id, -1)}
                  >
                    <ArrowLeftIcon aria-hidden />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={index === ordered.length - 1 || pending}
                    aria-label={`Mover ${course.name} después`}
                    onClick={() => move(course.id, 1)}
                  >
                    <ArrowRightIcon aria-hidden />
                  </Button>
                </>
              )
            }
          />
        </li>
      ))}
    </ul>
  );
}
