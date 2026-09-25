import type { Metadata } from "next";
import { ArchiveIcon } from "lucide-react";
import { notFound } from "next/navigation";
import { EmptyState } from "@/components/feedback/empty-state";
import { Separator } from "@/components/ui/separator";
import { CourseForm } from "@/features/courses/components/course-form";
import { DeleteCourseDialog } from "@/features/courses/components/delete-course-dialog";
import { getCourseWithTerm } from "@/features/courses/queries";
import { courseToFormValues } from "@/features/courses/utils";

export const metadata: Metadata = { title: "Editar clase" };

/** Editar o eliminar una clase. En un trimestre archivado es de solo lectura. */
export default async function EditCoursePage({ params }: PageProps<"/clases/[courseId]/editar">) {
  const found = await getCourseWithTerm((await params).courseId);
  if (!found) notFound();
  const { course, term } = found;

  if (term.status === "archived") {
    return (
      <EmptyState
        icon={ArchiveIcon}
        title="Esta clase es de solo lectura"
        description="Su trimestre está archivado. Desarchívalo para editar la clase."
      />
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <section aria-labelledby="editar-titulo" className="flex flex-col gap-4">
        <h2 id="editar-titulo" className="text-lg font-semibold">
          Datos de la clase
        </h2>
        <CourseForm
          key={course.updated_at}
          mode="edit"
          courseId={course.id}
          submitLabel="Guardar cambios"
          defaultValues={courseToFormValues(course)}
        />
      </section>

      <Separator />

      <section aria-labelledby="eliminar-titulo" className="flex flex-col gap-4">
        <div>
          <h2 id="eliminar-titulo" className="text-lg font-semibold">
            Eliminar clase
          </h2>
          <p className="text-sm text-muted-foreground">
            La clase dejará de mostrarse en el trimestre.
          </p>
        </div>
        <div>
          <DeleteCourseDialog courseId={course.id} courseName={course.name} termId={term.id} />
        </div>
      </section>
    </div>
  );
}
